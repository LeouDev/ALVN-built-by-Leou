import type { ProjectInput } from "@/lib/client-projects";
import { sql } from "@/lib/db";

export type ClientProject = ProjectInput & { id: number; created_at: Date; updated_at: Date };

// Dates come back as "YYYY-MM-DD" text, so forms and labels never shift a day across time zones.
export async function listProjects() {
  return sql<ClientProject[]>`
    select id, name, client_name, client_email, company, type, stage, budget, paid,
           start_date::text, due_date::text, live_url, repo_url, notes, message_id, created_at, updated_at
    from alvn.projects
    order by due_date nulls last, created_at desc`;
}

export async function getProject(id: number) {
  const [project] = await sql<ClientProject[]>`
    select id, name, client_name, client_email, company, type, stage, budget, paid,
           start_date::text, due_date::text, live_url, repo_url, notes, message_id, created_at, updated_at
    from alvn.projects where id = ${id}`;
  return project ?? null;
}

export async function projectForMessage(messageId: number) {
  const [row] = await sql<{ id: number }[]>`select id from alvn.projects where message_id = ${messageId} order by id limit 1`;
  return row?.id ?? null;
}

export async function createProject(p: ProjectInput) {
  const [row] = await sql<{ id: number }[]>`
    insert into alvn.projects (name, client_name, client_email, company, type, stage, budget, paid,
                               start_date, due_date, live_url, repo_url, notes, message_id)
    values (${p.name}, ${p.client_name}, ${p.client_email}, ${p.company}, ${p.type}, ${p.stage}, ${p.budget}, ${p.paid},
            ${p.start_date}, ${p.due_date}, ${p.live_url}, ${p.repo_url}, ${p.notes}, ${p.message_id})
    returning id`;
  return row.id;
}

export async function updateProject(id: number, p: ProjectInput) {
  await sql`
    update alvn.projects set
      name = ${p.name}, client_name = ${p.client_name}, client_email = ${p.client_email}, company = ${p.company},
      type = ${p.type}, stage = ${p.stage}, budget = ${p.budget}, paid = ${p.paid},
      start_date = ${p.start_date}, due_date = ${p.due_date}, live_url = ${p.live_url}, repo_url = ${p.repo_url},
      notes = ${p.notes}, updated_at = now()
    where id = ${id}`;
}

export async function deleteProject(id: number) {
  await sql`delete from alvn.projects where id = ${id}`;
}
