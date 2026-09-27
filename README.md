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
| `SYNC_SERVER_URL` | Your deployed `khorocboi-server` URL. Defaults to `https://khorocboi-server.vercel.app`. |
| `GROQ_API_KEY` | Optional. Enables AI translation of unknown words. Kept on the server, never sent to browsers. |

## Deploy to Vercel

1. Push this folder to GitHub and import it at https://vercel.com/new
   (set **Root Directory** to `webapp` if the repo also holds the Flutter app).
2. Add `SYNC_SERVER_URL` and `GROQ_API_KEY` under Environment Variables.
3. Deploy.

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
