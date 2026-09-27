# ALVN — Built by Leou

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

## Brand assets

- `public/brand/alvn-logo.webp`: the official logo, untouched
- `public/brand/alvn-wordmark.png`, `alvn-emblem.png`, `alvn-lockup.png`: transparent crops of the original artwork
- `app/icon.png`, `app/apple-icon.png`, `app/opengraph-image.png`: generated from the original
