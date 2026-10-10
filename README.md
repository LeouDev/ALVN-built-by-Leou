# build — Built by Leou

Digital Products & Experiences. Leou's portfolio of websites, apps, experiments, and digital products.

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4

## Develop

```bash
npm install
cp .env.example .env.local   # EMAIL_PROVIDER=console prints inquiries instead of sending them
npm run dev
npm test                     # inquiry validation + email escaping check
npm run build
```

## Add a project

1. Add an entry to `data/projects.ts`.
2. Put its assets in `public/projects/<slug>/` (covers 16:10, phone screens 9:19.5).

Home, `/projects`, `/projects/<slug>`, `/apps`, the tech section, and the sitemap update on their own.
Only fill in links that exist. Empty ones are never rendered.

The covers in `public/projects/*/cover.svg` are illustrative placeholders. Replace them with real screenshots
when you have them. For Prior Authorization EMR, only ever use sanitized visuals.

## Inquiry email

`/contact` posts to `/api/inquiry`, which validates on the server and sends through `lib/email.ts`.
Set these in Vercel → Project → Settings → Environment Variables:

| Variable         | Value                                                                  |
| ---------------- | ---------------------------------------------------------------------- |
| `EMAIL_PROVIDER` | `brevo`                                                                |
| `BREVO_API_KEY`  | Brevo → SMTP & API → API Keys (v3 key)                                 |
| `INQUIRY_EMAIL`  | where inquiries are delivered                                          |
| `EMAIL_FROM`     | a sender verified in Brevo, e.g. `ALVN <hello@yourdomain.com>`         |

To add another provider, add a function to `providers` in `lib/email.ts`.

## Call bookings

The Contact page's "Book a 30-min call" calendar (`components/BookingCalendar.tsx`) is the site's own. `/api/booking` passes requests to a Google Apps Script web app in Leou's Google account ([`apps-script/Code.gs`](apps-script/Code.gs)). The script lists open 30-minute times from the calendar's free/busy info and creates the event with a Google Meet link (Google emails the invite). It also emails Leou about each booking and sends the booker a branded confirmation. Setup steps are at the top of that file.

| Variable | Value |
| --- | --- |
| `BOOKING_URL` | The Apps Script web app URL (ends in `/exec`) |
| `BOOKING_SECRET` | A long random string, also saved as the script's `BOOKING_SECRET` property |

Without `BOOKING_URL`, the Contact page shows only the inquiry form.

## Admin

`/admin` is Leou's private area: an **Inbox** of every inquiry and booked call (reply from there; replies go out from his Gmail through the Apps Script) and a **Calendar** of booked calls read from Google Calendar. Sign-in is a one-time link emailed to `ADMIN_EMAIL`; locally, set `EMAIL_PROVIDER=console` and the link prints in the dev server log.

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Supabase Postgres, "Transaction pooler" connection string (port 6543) |
| `ADMIN_EMAIL` | The only address that can receive a sign-in link |
| `ADMIN_SECRET` | 32+ random characters; signs the session cookie |

**Projects** tracks each client project (stage, budget and payments, dates, links), and can be started from any inbox message. **Contracts** are generated from a project with a choice of payment terms (`lib/contracts.ts`). Leou signs, the text's SHA-256 is frozen, and the client signs through a one-time link at `/contracts/[token]`. The signed PDF (`lib/contract-pdf.tsx`, with a signature certificate page) is stored in the database and emailed to both sides from his Gmail. The `CONTRACT_*` variables hold his legal details.

Create the tables once: paste `db/schema.sql` into Supabase's SQL Editor, or run `node --env-file=.env.local scripts/db-setup.mjs`. They live in a private `alvn` schema that Supabase's public API doesn't serve.

## Brand assets

- `components/Logo.tsx`: the build wordmark as SVG (from the "build logo" design handoff)
- `public/brand/build-icon.svg`: the "b" icon on paper, used by the Contact page emblem
- `public/brand/alvn-wordmark.png`: the wordmark for emails and PDFs (old name kept so sent emails and Apps Script still load it)
- `app/icon.png`, `app/apple-icon.png`, `app/opengraph-image.png`, `public/admin/icon-*.png`: rendered from the design's SVGs
