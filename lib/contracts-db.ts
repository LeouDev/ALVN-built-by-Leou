import type { ContractTerms, Provider } from "@/lib/contracts";
import { sql } from "@/lib/db";

export type ContractStatus = "draft" | "sent" | "signed" | "void";

export type Contract = {
  id: number;
  project_id: number | null;
  title: string;
  client_name: string;
  client_email: string;
  client_company: string;
  terms: ContractTerms;
  body: string;
  status: ContractStatus;
  token_hash: string | null;
  body_hash: string | null;
  provider_name: string | null;
  provider_signature: string | null;
  provider_signed_at: Date | null;
  provider_ip: string | null;
  provider_ua: string | null;
  sent_at: Date | null;
  viewed_at: Date | null;
  viewed_ip: string | null;
  client_signer_name: string | null;
  client_signature: string | null;
  client_signed_at: Date | null;
  client_ip: string | null;
  client_ua: string | null;
  created_at: Date;
  updated_at: Date;
};

export type Signature = { name: string; image: string; ip: string; ua: string };

/** Leou's legal details for contracts. Kept in env vars, not the public repo. */
export function provider(): Provider {
  return {
    name: process.env.CONTRACT_PROVIDER_NAME ?? "",
    business: process.env.CONTRACT_BUSINESS_NAME ?? "",
    businessNo: process.env.CONTRACT_BUSINESS_NO ?? "",
    address: process.env.CONTRACT_PROVIDER_ADDRESS ?? "",
  };
}

export async function listContracts(projectId?: number) {
  return sql<(Pick<Contract, "id" | "project_id" | "title" | "client_name" | "status" | "sent_at" | "viewed_at" | "client_signed_at" | "created_at"> & {
    project_name: string | null;
  })[]>`
    select c.id, c.project_id, c.title, c.client_name, c.status, c.sent_at, c.viewed_at, c.client_signed_at, c.created_at, p.name as project_name
    from alvn.contracts c left join alvn.projects p on p.id = c.project_id
    where ${projectId ?? null}::bigint is null or c.project_id = ${projectId ?? null}
    order by c.created_at desc`;
}

export async function getContract(id: number) {
  const [c] = await sql<Contract[]>`select * from alvn.contracts where id = ${id}`;
  return c ?? null;
}

export async function getContractByToken(tokenHash: string) {
  const [c] = await sql<Contract[]>`select * from alvn.contracts where token_hash = ${tokenHash}`;
  return c ?? null;
}

export async function createContract(projectId: number | null, t: ContractTerms, body: string) {
  const [row] = await sql<{ id: number }[]>`
    insert into alvn.contracts (project_id, title, client_name, client_email, client_company, terms, body)
    values (${projectId}, ${t.title}, ${t.client_name}, ${t.client_email}, ${t.client_company}, ${t as never}::jsonb, ${body})
    returning id`;
  return row.id;
}

/** Drafts only: once sent, the text is frozen. */
export async function updateDraft(id: number, t: ContractTerms, body: string) {
  await sql`
    update alvn.contracts set title = ${t.title}, client_name = ${t.client_name}, client_email = ${t.client_email},
      client_company = ${t.client_company}, terms = ${t as never}::jsonb, body = ${body}, updated_at = now()
    where id = ${id} and status = 'draft'`;
}

export async function updateDraftBody(id: number, body: string) {
  await sql`update alvn.contracts set body = ${body}, updated_at = now() where id = ${id} and status = 'draft'`;
}

/** Leou signs and the contract goes out: records his signature, freezes the text, stores the link's hash. */
export async function markSent(id: number, s: Signature, tokenHash: string, bodyHash: string) {
  const [row] = await sql<{ id: number }[]>`
    update alvn.contracts set status = 'sent', provider_name = ${s.name}, provider_signature = ${s.image},
      provider_signed_at = now(), provider_ip = ${s.ip}, provider_ua = ${s.ua}, sent_at = now(),
      token_hash = ${tokenHash}, body_hash = ${bodyHash}, updated_at = now()
    where id = ${id} and status = 'draft' returning id`;
  return Boolean(row);
}

/** A fresh signing link (the old one stops working). */
export async function replaceToken(id: number, tokenHash: string) {
  const [row] = await sql<{ id: number }[]>`
    update alvn.contracts set token_hash = ${tokenHash}, updated_at = now() where id = ${id} and status = 'sent' returning id`;
  return Boolean(row);
}

export async function markViewed(id: number, ip: string) {
  await sql`update alvn.contracts set viewed_at = now(), viewed_ip = ${ip} where id = ${id} and viewed_at is null`;
}

export async function markSigned(id: number, s: Signature) {
  const [row] = await sql<Contract[]>`
    update alvn.contracts set status = 'signed', client_signer_name = ${s.name}, client_signature = ${s.image},
      client_signed_at = now(), client_ip = ${s.ip}, client_ua = ${s.ua}, updated_at = now()
    where id = ${id} and status = 'sent' returning *`;
  return row ?? null;
}

export async function voidContract(id: number) {
  await sql`update alvn.contracts set status = 'void', token_hash = null, updated_at = now() where id = ${id} and status in ('draft', 'sent')`;
}

export async function deleteDraft(id: number) {
  await sql`delete from alvn.contracts where id = ${id} and status = 'draft'`;
}

export async function savePdf(id: number, pdf: Buffer) {
  await sql`insert into alvn.contract_pdfs (contract_id, pdf) values (${id}, ${pdf}) on conflict (contract_id) do update set pdf = excluded.pdf`;
}

export async function getPdf(id: number) {
  const [row] = await sql<{ pdf: Buffer }[]>`select pdf from alvn.contract_pdfs where contract_id = ${id}`;
  return row?.pdf ?? null;
}

/** Terms of a project's most relevant contract (signed first, then newest), for invoice shortcuts. */
export async function latestContractTerms(projectId: number) {
  const [row] = await sql<{ terms: Contract["terms"] }[]>`
    select terms from alvn.contracts where project_id = ${projectId} and status <> 'void'
    order by (status = 'signed') desc, created_at desc limit 1`;
  return row?.terms ?? null;
}
