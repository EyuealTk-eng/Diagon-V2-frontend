# DIAGON. — website (frontend only)

**The marketplace built for your campus.** Find what you need. Sell what you don't.

This repository is the Diagon website on its own. It runs **without a backend**: a built-in
demo mode answers every request inside the browser, with sample listings from Addis Ababa
University campuses. Everything works — browsing, search and filters, sign-up and log-in,
creating listings with photos, saving, reporting, My listings and the moderation page —
in English and Amharic.

In demo mode, data is kept in each visitor's own browser (localStorage). Nothing is shared
between people, and **Reset demo** in the top banner restores the sample data.

The full project with the Django backend and Telegram bot lives in
[`Diagon-V2`](https://github.com/EyuealTk-eng/Diagon-V2).

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Seller | `demo.seller@aau.edu.et` | `demo-pass-123` |
| Moderator | `admin@aau.edu.et` | `admin-pass-123` |

The login page has one-click buttons for both. You can also register a new account; email
verification shows the code on screen because no email is sent in the demo.

## Run it on your computer

Requires [Node.js](https://nodejs.org) (LTS).

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Put it online with Vercel

1. Sign in at https://vercel.com with GitHub.
2. **Add New… → Project** → import this repository.
3. Leave every setting as it is (Vercel detects Vite) and click **Deploy**.

No environment variables are needed for the demo.

## Connect it to the real backend later

Set `VITE_API_BASE_URL` to the backend's address (for example `https://api.diagon.et`) in
`.env` or in your host's environment settings, then rebuild. Demo mode switches off
automatically and the same pages talk to the real API — no page code changes.
Optionally set `VITE_TELEGRAM_BOT_USERNAME` to enable linking accounts to the Telegram bot.

## Project layout

```
src/
  app/          app shell, routes, language (EN/AM), auth state, reference data
  components/   shared UI: layout, listing cards, buttons, form fields, icons
  features/     listing-specific pieces (report dialog, Telegram links)
  pages/        one file per page
  services/     API client; demo/ holds the in-browser demo server and sample data
  styles/       Tailwind design tokens (warm cream, soft white, clay, charcoal)
  types/        API data types
```

## Checks

```bash
npm run build      # type-check + production build
```

Amharic text is a first draft and should be reviewed by a native speaker
(`src/app/messages.ts`, `src/services/demo/seed.ts`).
