"use client";

import { useRef, useState } from "react";
import { FingerprintPattern, ScanFace } from "lucide-react";
import { dismissPasskeyPrompt, newPasskeyChallenge, passkeySignIn, savePasskey } from "@/app/admin/actions";

// WebAuthn deals in bytes; server actions take base64url strings.
const enc = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const utf8 = (text: string) => new TextEncoder().encode(text);

const cancelled = (e: unknown) => e instanceof DOMException && e.name === "NotAllowedError"; // closed the prompt, or it timed out
const iconFor = (name: string) => (name === "Face ID" ? ScanFace : FingerprintPattern);
const alert = "text-sm font-semibold text-[#b42318]";

// The page arrives with a challenge so a tap goes straight to Face ID: Safari wants WebAuthn called right from
// the tap, with no network wait first. Challenges last 15 minutes; past 10, a fresh one is fetched first.
function useChallenge(initial: string) {
  const current = useRef({ value: initial, at: Date.now() });
  return () => {
    if (Date.now() - current.current.at < 10 * 60e3) return current.current.value;
    return newPasskeyChallenge().then((value) => ((current.current = { value, at: Date.now() }), value));
  };
}

/** "Sign in with Face ID" under the email form, once a passkey has been saved. */
export function PasskeySignIn({ name, challenge, rpId }: { name: string; challenge: string; rpId: string }) {
  const nextChallenge = useChallenge(challenge);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const Icon = iconFor(name);

  async function signIn() {
    setBusy(true);
    setError("");
    try {
      const value = nextChallenge();
      const credential = (await navigator.credentials.get({
        publicKey: { challenge: utf8(typeof value === "string" ? value : await value), rpId, userVerification: "required", timeout: 120_000 },
      })) as PublicKeyCredential;
      const response = credential.response as AuthenticatorAssertionResponse;
      const result = await passkeySignIn({
        id: credential.id,
        clientDataJSON: enc(response.clientDataJSON),
        authenticatorData: enc(response.authenticatorData),
        signature: enc(response.signature),
      });
      if (!result.error) return window.location.assign("/admin");
      setError(result.error);
    } catch (e) {
      if (!cancelled(e)) setError("That passkey didn’t work. Try again, or use the email link.");
    }
    setBusy(false);
  }

  return (
    <div className="mt-6">
      <p className="flex items-center gap-4 text-xs font-semibold tracking-[0.2em] text-muted uppercase before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
        or
      </p>
      <button
        type="button"
        onClick={signIn}
        disabled={busy}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-navy/15 bg-white/40 px-7 py-4 font-semibold text-navy transition-colors hover:border-navy/40 hover:bg-white/80 disabled:opacity-60"
      >
        <Icon aria-hidden className="size-5" /> Sign in with {name}
      </button>
      {error && <p role="alert" className={`mt-4 ${alert}`}>{error}</p>}
    </div>
  );
}

/** The inbox's one-time offer to save a passkey on this device, until one is saved or it's waved off. */
export function PasskeySetup({ name, challenge, rpId, algorithms }: { name: string; challenge: string; rpId: string; algorithms: number[] }) {
  const nextChallenge = useChallenge(challenge);
  const [status, setStatus] = useState<"offer" | "busy" | "done" | "hidden">("offer");
  const [error, setError] = useState("");
  const Icon = iconFor(name);

  async function setUp() {
    setStatus("busy");
    setError("");
    try {
      const value = nextChallenge();
      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge: utf8(typeof value === "string" ? value : await value),
          rp: { id: rpId, name: "build admin" },
          // the id stays "alvn-admin": a new one would orphan passkeys already saved
          user: { id: utf8("alvn-admin"), name: "build admin", displayName: "build admin" },
          pubKeyCredParams: algorithms.map((alg) => ({ type: "public-key" as const, alg })),
          authenticatorSelection: { residentKey: "required", userVerification: "required" },
          attestation: "none",
          timeout: 120_000,
        },
      })) as PublicKeyCredential;
      const response = credential.response as AuthenticatorAttestationResponse;
      const publicKey = response.getPublicKey();
      if (!publicKey) throw new Error("No public key");
      const result = await savePasskey({
        id: credential.id,
        clientDataJSON: enc(response.clientDataJSON),
        authenticatorData: enc(response.getAuthenticatorData()),
        publicKey: enc(publicKey),
        algorithm: response.getPublicKeyAlgorithm(),
      });
      if (!result.error) return setStatus("done");
      setError(result.error);
    } catch (e) {
      if (!cancelled(e)) setError("That didn’t work. Try again.");
    }
    setStatus("offer");
  }

  if (status === "hidden") return null;
  const quiet = "rounded-full px-4 py-2.5 text-sm font-semibold text-navy/65 ring-1 ring-line transition-colors hover:text-navy";
  return (
    <div className="mb-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 rounded-[28px] border border-line bg-white/60 px-6 py-5 sm:px-7">
      <p className="flex items-center gap-3 font-semibold" role={status === "done" ? "status" : undefined}>
        <Icon aria-hidden className="size-5 shrink-0 text-accent" />
        {status !== "done"
          ? `Sign in with ${name} next time`
          : `${name === "Face ID" ? "Face ID is" : "Your passkey is"} set up. Next time, tap “Sign in with ${name}” on the sign-in page.`}
      </p>
      {status === "done" ? (
        <button type="button" onClick={() => setStatus("hidden")} className={quiet}>
          Done
        </button>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={setUp}
            disabled={status === "busy"}
            className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-navy-soft disabled:opacity-60"
          >
            Set up {name}
          </button>
          <button
            type="button"
            onClick={() => {
              setStatus("hidden");
              dismissPasskeyPrompt();
            }}
            className={quiet}
          >
            Not now
          </button>
        </div>
      )}
      {error && <p role="alert" className={`w-full ${alert}`}>{error}</p>}
    </div>
  );
}
