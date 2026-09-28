"use server";

import { redirect } from "next/navigation";
import { requestMeta, requireAdmin, todayInManila } from "@/lib/admin";
import { signRequestEmail } from "@/lib/contract-email";
import { contractBody, parseSignature, parseTerms } from "@/lib/contracts";
import { createContract, deleteDraft, getContract, markSent, provider, replaceToken, updateDraft, updateDraftBody, voidContract } from "@/lib/contracts-db";
import { callScript } from "@/lib/script";
import { hashToken, newLoginToken, sha256 } from "@/lib/session";
import { site } from "@/lib/site";

type FormState = { error: string; values?: Record<string, string> } | null;

// The contract page shows a pop-up for each notice; `t` makes a repeat of the same notice pop up again.
const notice = (id: number, kind: "saved" | "sent" | "resent" | "failed") => `/admin/contracts/${id}?notice=${kind}&t=${Date.now()}`;

/** Creates (id = null) or updates a draft from the terms form, regenerating its text. */
export async function saveContract(projectId: number | null, id: number | null, _state: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const values = Object.fromEntries(form) as Record<string, string>;
  if (!provider().name) return { error: "Your contract details (the CONTRACT_* settings) aren’t set up yet.", values };
  const terms = parseTerms(form);
  if ("error" in terms) return { error: terms.error, values };
  const body = contractBody(terms, provider(), todayInManila());
  if (id) await updateDraft(id, terms, body);
  redirect(notice(id ?? (await createContract(projectId, terms, body)), "saved"));
}

/** Hand edits to a draft's wording. */
export async function saveContractText(id: number, _state: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const body = String(form.get("body") ?? "").trim();
  if (!body || body.length > 50_000) return { error: "The contract text can’t be empty." };
  await updateDraftBody(id, body);
  redirect(notice(id, "saved"));
}

async function emailSigningLink(id: number, token: string) {
  const c = await getContract(id);
  if (!c) return false;
  const email = signRequestEmail(c, `${site.url}/contracts/${token}`, site.url);
  const sent = await callScript<{ ok?: boolean }>({ action: "send", to: c.client_email, ...email }).catch((err) => {
    console.error("[contracts] couldn't email the signing link:", err);
    return null;
  });
  return Boolean(sent?.ok);
}

/** Leou signs; the text is frozen and the client gets a one-time signing link. */
export async function signAndSend(id: number, _state: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const signature = parseSignature(form);
  if ("error" in signature) return signature;
  const c = await getContract(id);
  if (!c || c.status !== "draft") redirect(`/admin/contracts/${id}`);
  const token = newLoginToken();
  if (!(await markSent(id, { ...signature, ...(await requestMeta()) }, hashToken(token), sha256(c.body)))) redirect(`/admin/contracts/${id}`);
  redirect(notice(id, (await emailSigningLink(id, token)) ? "sent" : "failed"));
}

/** A new link (the old one stops working), e.g. if the client lost the email. */
export async function resendLink(id: number) {
  await requireAdmin();
  const c = await getContract(id);
  const token = newLoginToken();
  if (!c?.token_hash || !(await replaceToken(id, hashToken(token)))) redirect(`/admin/contracts/${id}`);
  if (await emailSigningLink(id, token)) redirect(notice(id, "resent"));
  // The new link never reached them, so keep the one they already have working.
  await replaceToken(id, c.token_hash);
  redirect(notice(id, "failed"));
}

export async function voidAction(id: number) {
  await requireAdmin();
  await voidContract(id);
  redirect(`/admin/contracts/${id}`);
}

export async function deleteDraftAction(id: number) {
  await requireAdmin();
  const c = await getContract(id);
  await deleteDraft(id);
  redirect(c?.project_id ? `/admin/projects/${c.project_id}` : "/admin/contracts");
}
