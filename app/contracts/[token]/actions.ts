"use server";

import { redirect } from "next/navigation";
import { requestMeta } from "@/lib/admin";
import { parseSignature } from "@/lib/contracts";
import { getContractByToken, markSigned } from "@/lib/contracts-db";
import { finishSigning } from "@/lib/contract-signing";
import { hashToken, sha256 } from "@/lib/session";

/** The client signs through their one-time link. */
export async function signAsClient(token: string, _state: { error: string } | null, form: FormData) {
  const signature = parseSignature(form);
  if ("error" in signature) return signature;
  const c = await getContractByToken(hashToken(token));
  if (!c || c.status !== "sent") redirect(`/contracts/${token}`);
  if (sha256(c.body) !== c.body_hash) return { error: "This agreement changed after it was sent, so it can’t be signed. Please ask Leou for a new link." };
  const signed = await markSigned(c.id, { ...signature, ...(await requestMeta()) });
  if (signed) await finishSigning(signed);
  redirect(`/contracts/${token}`);
}
