import { signedCopyEmail, signedNoticeEmail } from "@/lib/contract-email";
import { renderContractPdf } from "@/lib/contract-pdf";
import { type Contract, getPdf, savePdf } from "@/lib/contracts-db";
import { sql } from "@/lib/db";
import { callScript } from "@/lib/script";
import { site } from "@/lib/site";

/** The signed PDF, made (and kept) the first time it's needed. */
export async function signedPdf(c: Contract) {
  const saved = await getPdf(c.id);
  if (saved) return saved;
  const pdf = await renderContractPdf(c, site.url);
  await savePdf(c.id, pdf);
  return pdf;
}

export const pdfName = (c: Pick<Contract, "id" | "title">) => `${c.title.replace(/[^\w\s-]/g, "").trim()} (#${c.id}).pdf`;

/** After the client signs: keep the PDF, email it to both sides, and move the project along.
 *  Each step is logged on failure; the signature itself is already recorded. */
export async function finishSigning(c: Contract) {
  try {
    const pdf = await signedPdf(c);
    const attachments = [{ name: pdfName(c), base64: pdf.toString("base64") }];
    await callScript({ action: "send", to: c.client_email, ...signedCopyEmail(c, site.url), attachments });
    if (process.env.ADMIN_EMAIL)
      await callScript({ action: "send", to: process.env.ADMIN_EMAIL, ...signedNoticeEmail(c, `${site.url}/admin/contracts/${c.id}`), attachments });
  } catch (err) {
    console.error(`[contracts] finishing contract #${c.id} failed:`, err);
  }
  if (c.project_id) await sql`update alvn.projects set stage = 'contract', updated_at = now() where id = ${c.project_id} and stage in ('lead', 'proposal')`;
}
