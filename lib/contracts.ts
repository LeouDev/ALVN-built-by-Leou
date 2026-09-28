// Contracts: the template, payment plans, and the text format both the web page and the PDF render.
// Keep this file free of imports: the terms form uses it in the browser, and `npm test` loads it with Node.

/** "PHP 50,000.00": Manrope has no ₱ glyph for the PDF, and this is the usual form in contracts. */
export const php = (amount: number) => `PHP ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Splits a price by percentages in whole pesos; the last part takes the rounding, so parts always add up. */
export function split(price: number, percents: number[]) {
  const parts = percents.slice(0, -1).map((p) => Math.round((price * p) / 100));
  return [...parts, price - parts.reduce((a, b) => a + b, 0)];
}

export const PAYMENT_PLANS = [
  {
    id: "50-50",
    label: "50% upfront, 50% on launch",
    text: (price: number) => {
      const [a, b] = split(price, [50, 50]);
      return `50% (${php(a)}) is due on signing, before work begins. The remaining 50% (${php(b)}) is due on launch, before the project goes live and the files are handed over.`;
    },
  },
  {
    id: "30-40-30",
    label: "30% upfront, 40% at design approval, 30% on launch",
    text: (price: number) => {
      const [a, b, c] = split(price, [30, 40, 30]);
      return `30% (${php(a)}) is due on signing, before work begins; 40% (${php(b)}) when the Client approves the design; and the final 30% (${php(c)}) on launch.`;
    },
  },
  {
    id: "40-30-30",
    label: "40% upfront, 30% at staging, 30% on launch",
    text: (price: number) => {
      const [a, b, c] = split(price, [40, 30, 30]);
      return `40% (${php(a)}) is due on signing, before work begins; 30% (${php(b)}) when a working version is ready for review on a staging (test) site; and the final 30% (${php(c)}) on launch.`;
    },
  },
  {
    id: "100-upfront",
    label: "100% upfront",
    text: (price: number) => `The full fee (${php(price)}) is due on signing, before work begins.`,
  },
  {
    id: "20-installments",
    label: "20% upfront, balance in 3 monthly installments",
    text: (price: number) => {
      const [a, ...rest] = split(price, [20, 26.67, 26.67, 26.66]);
      return `20% (${php(a)}) is due on signing, before work begins. The balance of ${php(price - a)} is paid in 3 monthly installments of ${rest.map(php).join(", ")}, due on the same day of each of the following 3 months.`;
    },
  },
  {
    id: "milestones",
    label: "Milestone-based",
    text: () =>
      "Payment is split across the milestones listed in the project scope above. Each milestone’s payment is due when that milestone is delivered, and work on the next milestone starts once it’s paid.",
  },
  {
    id: "retainer",
    label: "Monthly retainer",
    text: (price: number) =>
      `The fee is ${php(price)} per month, billed in advance on the first day of each month and covering the work described in the scope above. Either party may end the retainer with 30 days’ written notice.`,
  },
  { id: "custom", label: "Custom (write your own)", text: () => "" },
] as const;

export type PaymentPlanId = (typeof PAYMENT_PLANS)[number]["id"];

export type Provider = { name: string; business: string; businessNo: string; address: string };

export type ContractTerms = {
  title: string;
  client_name: string;
  client_email: string;
  client_company: string;
  scope: string;
  price: number;
  plan: PaymentPlanId;
  custom_terms: string;
  start_date: string | null;
  due_date: string | null;
  revisions: number;
  warranty_days: number;
  /** Optional: when Leou pays for the domain's first year himself and bills it with the first payment. */
  domain_name?: string;
  domain_price?: number | null;
};

/** The domain sentence for "Fees and payment", or "" when there's no domain cost. */
export function domainTerms(t: Pick<ContractTerms, "plan" | "price" | "domain_name" | "domain_price">) {
  if (!t.domain_price) return "";
  const domain = t.domain_name ? `the domain ${t.domain_name}` : "the project’s domain";
  const total = t.plan === "retainer" ? "" : `, bringing the total to ${php(t.price + t.domain_price)}`;
  return `The Provider will also register ${domain} for its first year on the Client’s behalf, for ${php(t.domain_price)}, due with the first payment${total}. The domain is registered in the Client’s name, and renewing it after the first year is the Client’s responsibility.`;
}

const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

/** The agreement text. "## " lines are headings, "- " lines bullets, **x** bold; blank lines separate paragraphs. */
export function contractBody(t: ContractTerms, provider: Provider, today: string) {
  const plan = PAYMENT_PLANS.find((p) => p.id === t.plan)!;
  const retainer = t.plan === "retainer";
  const payment = t.plan === "custom" ? t.custom_terms.trim() : plan.text(t.price);
  const client = [t.client_name, t.client_company && `representing ${t.client_company}`, t.client_email].filter(Boolean).join(", ");

  return `This Agreement is made on ${longDate(today)} between:

**Provider:** ${provider.name}, doing business under the registered name ${provider.business} (DTI Business Name No. ${provider.businessNo}), ${provider.address} (the "Provider"); and

**Client:** ${client} (the "Client").

## 1. The project
The Provider will design and build the following for the Client:

${t.scope.trim()}

## 2. Timeline
Work starts on ${t.start_date ? longDate(t.start_date) : "the day the first payment is received"} and is expected to be completed by ${t.due_date ? longDate(t.due_date) : "a date the parties agree in writing"}. The timeline depends on the Client providing content, access, and feedback on time; delays on the Client’s side move the completion date by the same amount.

## 3. Fees and payment
${retainer ? "" : `The total fee for the project is ${php(t.price)}. `}${payment}
${domainTerms(t) ? `\n${domainTerms(t)}\n` : ""}
Payments are made by bank transfer or GCash to the account the Provider specifies, within 7 days of each invoice. Work may pause while a payment is overdue.

## 4. Revisions and changes
The fee includes ${t.revisions} ${t.revisions === 1 ? "round" : "rounds"} of revisions at each review stage. Further changes, and any features outside the scope above, are quoted separately and only done once the Client approves the quote.

## 5. The Client’s part
The Client will provide the content (such as text, images, and logos), accounts, and access the project needs; give feedback within 5 working days of each review request; and make sure everything they provide can legally be used.

## 6. Ownership
Once the Client has paid in full, the Client owns the final deliverables made for this project. The Provider keeps ownership of its pre-existing tools, code, and know-how, and gives the Client a permanent licence to use them as part of the deliverables. Open-source and third-party components remain under their own licences. The Provider may show the finished work in its portfolio unless the Client asks otherwise in writing.

## 7. Confidentiality
Both parties will keep each other’s non-public business information confidential, during and after this Agreement.

## 8. Hosting and third-party costs
${t.domain_price ? "Apart from the domain’s first year (see section 3), domains" : "Domains"}, hosting, paid plugins, app store accounts, and other third-party services are paid for by the Client and held in the Client’s name, unless agreed otherwise in writing.

## 9. Warranty and liability
For ${t.warranty_days} days after launch, the Provider will fix bugs in the work as delivered at no extra cost. This doesn’t cover changes made by others, new requests, or problems caused by third-party services. The Provider’s total liability under this Agreement is limited to the fees the Client has paid.

## 10. Ending the agreement
Either party may end this Agreement by written notice (email is fine) if the other doesn’t fix a serious breach within 14 days of being told about it. If the project ends early, the Client pays for the work done up to that point, and the Provider hands over that work once it’s paid for. Payments for completed stages aren’t refundable.

## 11. General
This Agreement is the whole agreement between the parties about this project and replaces any earlier discussions. Changes must be agreed in writing (email is fine). It is governed by the laws of the Republic of the Philippines. The parties will first try to settle any dispute in good faith; if they can’t, it will be brought before the proper courts of Mandaue City, Cebu.

## 12. Electronic signatures
The parties agree to sign this Agreement electronically. Under the Electronic Commerce Act of 2000 (Republic Act No. 8792), electronic signatures have the same legal effect as handwritten ones.`;
}

export type Block = { type: "heading" | "paragraph" | "bullets"; lines: string[] };

/** Parses contract text into blocks, for the web page and the PDF alike. */
export function blocks(body: string): Block[] {
  return body
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .flatMap((chunk): Block[] => {
      const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
      if (!lines.length) return [];
      const out: Block[] = [];
      for (const line of lines) {
        const last = out.at(-1);
        if (line.startsWith("## ")) out.push({ type: "heading", lines: [line.slice(3)] });
        else if (line.startsWith("- ")) last?.type === "bullets" ? last.lines.push(line.slice(2)) : out.push({ type: "bullets", lines: [line.slice(2)] });
        else last?.type === "paragraph" ? last.lines.push(line) : out.push({ type: "paragraph", lines: [line] });
      }
      return out;
    });
}

/** Splits "**bold** and plain" into runs. */
export const runs = (text: string) => text.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((part) => (part.startsWith("**") ? { bold: true, text: part.slice(2, -2) } : { bold: false, text: part }));

export function parseTerms(form: FormData): ContractTerms | { error: string } {
  const get = (key: string) => {
    const value = form.get(key);
    return typeof value === "string" ? value.trim() : "";
  };
  const whole = (key: string, fallback: number) => {
    const value = get(key).replace(/[₱,\s]|PHP/gi, "");
    return value === "" ? fallback : /^\d{1,9}$/.test(value) ? Number(value) : NaN;
  };
  const date = (key: string) => {
    const value = get(key);
    if (!value) return null;
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) ? value : undefined;
  };
  const plan = get("plan") as PaymentPlanId;
  const t = {
    title: get("title").replace(/\s+/g, " "),
    client_name: get("client_name").replace(/\s+/g, " "),
    client_email: get("client_email"),
    client_company: get("client_company").replace(/\s+/g, " "),
    scope: get("scope"),
    price: whole("price", NaN),
    plan,
    custom_terms: get("custom_terms"),
    start_date: date("start_date"),
    due_date: date("due_date"),
    revisions: whole("revisions", 2),
    warranty_days: whole("warranty_days", 30),
    domain_name: get("domain_name").toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, ""),
    domain_price: get("domain_price") ? whole("domain_price", NaN) : null,
  };

  if (!t.title || t.title.length > 120) return { error: "Please give the contract a title." };
  if (!t.client_name || t.client_name.length > 120) return { error: "Please enter the client’s name." };
  if (t.client_email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.client_email))
    return { error: "Please enter the client’s email: the signing link goes there." };
  if (t.client_company.length > 160) return { error: "Please shorten the company name." };
  if (!t.scope || t.scope.length > 10_000) return { error: "Please describe the project scope." };
  if (Number.isNaN(t.price) || t.price < 1) return { error: "Please enter the price in whole pesos." };
  if (!PAYMENT_PLANS.some((p) => p.id === plan)) return { error: "Please choose payment terms." };
  if (plan === "custom" && !t.custom_terms) return { error: "Please write the custom payment terms." };
  if (t.start_date === undefined || t.due_date === undefined) return { error: "Please use valid dates." };
  if (t.start_date && t.due_date && t.due_date < t.start_date) return { error: "The completion date can’t be before the start date." };
  if (Number.isNaN(t.revisions) || t.revisions > 20) return { error: "Revisions must be a whole number up to 20." };
  if (Number.isNaN(t.warranty_days) || t.warranty_days > 365) return { error: "The bug-fix period must be up to 365 days." };
  if (t.domain_name && !/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(t.domain_name)) return { error: "Please enter the domain like mayasbakery.com, or leave it blank." };
  if (Number.isNaN(t.domain_price)) return { error: "The domain cost needs to be a whole peso amount." };
  if (t.domain_name && !t.domain_price) return { error: "Add the domain’s first-year cost, or clear the domain name." };
  return t as ContractTerms;
}

/** A signature from the signing form: full name, the drawn or typed signature as a PNG, and consent. */
export function parseSignature(form: FormData): { name: string; image: string } | { error: string } {
  const name = String(form.get("signer_name") ?? "").replace(/\s+/g, " ").trim();
  const image = String(form.get("signature") ?? "");
  if (!name || name.length > 120) return { error: "Please type your full name." };
  if (!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(image) || image.length > 400_000) return { error: "Please add your signature." };
  if (form.get("consent") !== "on") return { error: "Please confirm you agree to sign electronically." };
  return { name, image };
}

/** The contract's payment schedule as invoice lines ("From the contract" shortcuts on a new invoice). */
export function installments(t: Pick<ContractTerms, "title" | "plan" | "price" | "domain_name" | "domain_price">) {
  const schedule: Partial<Record<PaymentPlanId, [string[], number[]]>> = {
    "50-50": [["50% on signing", "50% on launch"], [50, 50]],
    "30-40-30": [["30% on signing", "40% at design approval", "30% on launch"], [30, 40, 30]],
    "40-30-30": [["40% on signing", "30% at staging review", "30% on launch"], [40, 30, 30]],
    "100-upfront": [["Full payment on signing"], [100]],
    "20-installments": [["20% on signing", "Installment 1 of 3", "Installment 2 of 3", "Installment 3 of 3"], [20, 26.67, 26.67, 26.66]],
    retainer: [["Monthly retainer"], [100]],
  };
  const [labels, percents] = schedule[t.plan] ?? [[], []];
  const amounts = split(t.price, percents);
  const lines = labels.map((label, i) => ({ description: `${t.title}: ${label}`, amount: amounts[i] }));
  if (t.domain_price) lines.push({ description: `Domain registration, first year${t.domain_name ? ` (${t.domain_name})` : ""}`, amount: t.domain_price });
  return lines;
}
