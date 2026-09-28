// Client projects tracked in the admin (not the portfolio projects in data/projects.ts).
// Keep this file free of imports so `npm test` can load it directly with Node.

export const STAGES = ["lead", "proposal", "contract", "in_progress", "review", "done", "on_hold"] as const;
export type Stage = (typeof STAGES)[number];

export const stageLabels: Record<Stage, string> = {
  lead: "Lead",
  proposal: "Proposal",
  contract: "Contract",
  in_progress: "In progress",
  review: "Review",
  done: "Done",
  on_hold: "On hold",
};

/** Stages that still count toward the open pipeline. */
export const isOpen = (stage: Stage) => stage !== "done" && stage !== "on_hold";

export type ProjectInput = {
  name: string;
  client_name: string;
  client_email: string;
  company: string;
  type: string;
  stage: Stage;
  budget: number | null;
  paid: number;
  start_date: string | null;
  due_date: string | null;
  live_url: string;
  repo_url: string;
  notes: string;
  message_id: number | null;
};

export const NOTES_MAX = 10_000;

export function parseProject(form: FormData): ProjectInput | { error: string } {
  const get = (key: string) => {
    const value = form.get(key);
    return typeof value === "string" ? value.trim() : "";
  };
  // "₱50,000", "50000" or blank; whole pesos only.
  const pesos = (key: string) => {
    const value = get(key).replace(/[₱,\s]/g, "");
    return value === "" ? null : /^\d{1,9}$/.test(value) ? Number(value) : NaN;
  };
  const date = (key: string) => {
    const value = get(key);
    if (!value) return null;
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) ? value : undefined;
  };
  const link = (key: string) => {
    const value = get(key);
    return !value || /^https?:\/\/\S+$/.test(value) ? value : undefined;
  };

  const stage = get("stage") as Stage;
  const budget = pesos("budget");
  const paid = pesos("paid");
  const start_date = date("start_date");
  const due_date = date("due_date");
  const live_url = link("live_url");
  const repo_url = link("repo_url");
  const messageId = get("message_id");

  const p = {
    name: get("name").replace(/\s+/g, " "),
    client_name: get("client_name").replace(/\s+/g, " "),
    client_email: get("client_email"),
    company: get("company").replace(/\s+/g, " "),
    type: get("type"),
    notes: get("notes"),
  };

  if (!p.name || p.name.length > 160) return { error: "Please give the project a name." };
  if (!p.client_name || p.client_name.length > 120) return { error: "Please enter the client’s name." };
  if (p.client_email && (p.client_email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.client_email)))
    return { error: "Please enter a valid client email, or leave it blank." };
  if (p.company.length > 160 || p.type.length > 80) return { error: "Please shorten the company or type." };
  if (!STAGES.includes(stage)) return { error: "Please choose a stage." };
  if (Number.isNaN(budget) || Number.isNaN(paid)) return { error: "Budget and paid need to be whole peso amounts." };
  if (start_date === undefined || due_date === undefined) return { error: "Please use valid dates." };
  if (start_date && due_date && due_date < start_date) return { error: "The due date can’t be before the start date." };
  if (live_url === undefined || repo_url === undefined) return { error: "Links need to start with https://" };
  if (p.notes.length > NOTES_MAX) return { error: `Please keep notes under ${NOTES_MAX.toLocaleString("en-US")} characters.` };

  return {
    ...p,
    stage,
    budget,
    paid: paid ?? 0,
    start_date,
    due_date,
    live_url,
    repo_url,
    message_id: /^\d+$/.test(messageId) ? Number(messageId) : null,
  };
}

export const peso = (amount: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(amount);
