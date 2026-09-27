# KhorocBoi Web

The web version of KhorocBoi, the Bangla/English/Banglish expense tracker. It works on
phones (and can be added to the iPhone home screen), tablets and desktops. It uses the
same Cloud Sync account (email + passcode) as the Android app, so data moves between them.

## Features

- Daily tabs with free-form notes: `bus vara 20 tk`, `banana 20 tk apple 30 tk`
- Instant parsing with the built-in dictionary, then AI translation of unknown words
- Several tabs per day, unique tab titles, and archive folders by month and year
- Analytics: this month, last 3 or 6 months, custom range or hand-picked days
- Recycle bin (90 days) with restore and permanent delete
- Cloud Sync with the same `khorocboi-server` backend as the mobile app
- Light and dark themes

## Run locally

```bash
cp .env.example .env.local   # then fill in the values
npm install
npm run dev
```

Open http://localhost:3000.

## Environment variables

| Name | Purpose |
| --- | --- |
| `SYNC_SERVER_URL` | Your deployed `khorocboi-server` URL (must be https). Defaults to `https://khorocboi-server.vercel.app`. |
| `GROQ_API_KEY` | Optional. Enables AI translation of unknown words. Kept on the server, never sent to browsers. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Optional. Shares rate limits across all Vercel instances (the server's Upstash database works). |

None of these may be prefixed with `NEXT_PUBLIC_`. `.env.local` is git-ignored; never commit real keys.

## Deploy to Vercel

1. Push the repo to GitHub and import it at https://vercel.com/new.
2. Set **Root Directory** to `webapp`. The framework preset is detected as Next.js.
3. Under **Environment Variables**, add the variables above for Production (and Preview if you use it).
4. Deploy. After changing a variable, redeploy so it takes effect.

## Security

- **Secrets stay on the server.** The Groq key is only read in `src/app/api/_lib/*`, which import
  `server-only`, so a build fails if that code is ever pulled into the browser bundle.
- **All API routes** (`/api/sync`, `/api/restore`, `/api/translate`) reject cross-site requests,
  require `application/json`, cap the body size, and rate-limit per IP.
- **Input is validated** (email format, passcode digits, backup shape) before anything is sent to
  the backup server; upstream errors are not leaked.
- **Headers:** strict Content-Security-Policy, HSTS, `X-Frame-Options: DENY`, `nosniff`,
  Referrer-Policy and Permissions-Policy; `X-Powered-By` is removed; API responses are `no-store`.
- **Transport:** the backup server URL must be https in production.
- The sync email and passcode are kept in this browser's `localStorage` (like the app keeps them
  on the phone). Use **Disconnect** on shared computers.

## Install on iPhone

Open the site in Safari → Share → **Add to Home Screen**. It opens full-screen like an app.

## How it's organized

```
src/
  app/                 routes and API route handlers (sync/restore proxy, translate)
  features/
    tabs/              tab model, local store, editor, dashboard, archive
    parser/            Bangla/Banglish expense parser + dictionary
    analytics/         range selection, totals, chart, category breakdown
    cloud-sync/        email + passcode backup (same data format as the app)
    recycle-bin/       deleted tabs view
    shell/             sidebar, mobile drawer, page header
  shared/              UI primitives (modal, toasts, theme) and date/money helpers
```

Data lives in the browser's `localStorage`. Backups use exactly the same JSON format as
the Flutter app (local wall-clock timestamps without a timezone suffix).
