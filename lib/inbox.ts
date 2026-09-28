import { sql } from "@/lib/db";

// The admin inbox keeps a copy of every inquiry and every call booked on the site.
export type MessageKind = "inquiry" | "booking";

export type Message = {
  id: number;
  kind: MessageKind;
  name: string;
  email: string;
  subject: string;
  body: string;
  details: Record<string, string>;
  created_at: Date;
  read_at: Date | null;
  archived_at: Date | null;
};

export type Reply = { id: number; body: string; sent_at: Date };

type NewMessage = Pick<Message, "kind" | "name" | "email" | "subject" | "body" | "details">;

/** Saves a copy for the inbox. Never fails the visitor's request: the email still goes out.
 *  (details goes in as an object: the driver JSON-encodes it, so a pre-stringified value would be encoded twice.) */
export async function saveMessage(m: NewMessage) {
  if (!process.env.DATABASE_URL) return;
  try {
    await sql`insert into alvn.messages (kind, name, email, subject, body, details)
              values (${m.kind}, ${m.name}, ${m.email}, ${m.subject}, ${m.body}, ${m.details as never}::jsonb)`;
  } catch (err) {
    console.error("[inbox] couldn't save message:", err);
  }
}

export async function listMessages({ archived, kind }: { archived: boolean; kind?: MessageKind }) {
  return await sql<Message[]>`
    select id, kind, name, email, subject, left(body, 200) as body, details, created_at, read_at, archived_at
    from alvn.messages
    where (archived_at is not null) = ${archived} and (${kind ?? null}::text is null or kind = ${kind ?? null})
    order by created_at desc
    limit 200`;
}

export async function unreadCount() {
  const [row] = await sql<{ n: number }[]>`select count(*)::int as n from alvn.messages where read_at is null and archived_at is null`;
  return row.n;
}

/** Opens a message (marking it read) with its replies. */
export async function openMessage(id: number) {
  const [message] = await sql<Message[]>`update alvn.messages set read_at = coalesce(read_at, now()) where id = ${id} returning *`;
  if (!message) return null;
  const replies = await sql<Reply[]>`select id, body, sent_at from alvn.replies where message_id = ${id} order by sent_at`;
  return { message, replies };
}

export async function getMessage(id: number) {
  const [message] = await sql<Message[]>`select * from alvn.messages where id = ${id}`;
  return message ?? null;
}

export async function setArchived(id: number, archived: boolean) {
  await sql`update alvn.messages set archived_at = ${archived ? new Date().toISOString() : null} where id = ${id}`;
}

export async function addReply(id: number, body: string) {
  await sql`insert into alvn.replies (message_id, body) values (${id}, ${body})`;
}

/** The email that goes out when Leou replies: his text, a signature, and their original message quoted. */
export function replyEmail(m: Pick<Message, "kind" | "name" | "body" | "created_at">, reply: string, siteUrl: string) {
  const subject = m.kind === "booking" ? "Re: Our 30-min intro call" : "Re: Your project inquiry";
  const when = new Date(m.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" });
  const quoted = m.body.trim() ? `\n\nOn ${when}, ${m.name} wrote:\n${m.body.trim().replace(/^/gm, "> ")}` : "";
  return { subject, text: `${reply.trim()}\n\n— Leou\nALVN — Built by Leou · ${siteUrl}${quoted}` };
}
