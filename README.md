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
| `EMAIL_PROVIDER` | `resend`                                                               |
| `RESEND_API_KEY` | from resend.com (or the Resend integration on the Vercel Marketplace) |
| `INQUIRY_EMAIL`  | where inquiries are delivered                                          |
| `EMAIL_FROM`     | a sender on a Resend-verified domain, e.g. `ALVN <hello@yourdomain.com>` |

To add another provider, add a function to `providers` in `lib/email.ts`.

## Brand assets

- `public/brand/alvn-logo.webp`: the official logo, untouched
- `public/brand/alvn-wordmark.png`, `alvn-emblem.png`, `alvn-lockup.png`: transparent crops of the original artwork
- `app/icon.png`, `app/apple-icon.png`, `app/opengraph-image.png`: generated from the original
