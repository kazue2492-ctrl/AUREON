# WalletHub

Next.js 16 + MySQL + Gemini AI personal/family finance app with JWT auth and Google Sign-In.

## Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Database**: MySQL 8 (via `mysql2/promise`)
- **Auth**: JWT (email/password) + Google Sign-In
- **AI**: Google Gemini (chatbot, receipt OCR)
- **Styling**: Tailwind CSS

## Local development

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local — fill in DB_PASSWORD, JWT_SECRET, GEMINI_API_KEY,
# GOOGLE_CLIENT_ID, NEXT_PUBLIC_GOOGLE_CLIENT_ID.

# 3. Initialize the database
mysql -u root -p < db/schema.sql

# 4. Run dev server
npm run dev
```

App runs at http://localhost:3000.

## Production build

```bash
npm run build
npm start
```

`npm run build` requires every variable from `.env.example` to be set; in production, `JWT_SECRET` must be at least 32 characters and DB credentials cannot fall back to defaults.

## Deployment

This app needs:

- A Node.js runtime (Next.js standalone server) — works on Render, Railway, Fly.io, Coolify, a plain VPS, etc.
- A reachable MySQL 8 instance.
- Persistent disk OR object storage if you want receipt uploads to survive restarts (see *Receipt uploads* below).

### 1. Provision MySQL

Create the database and user, then load the schema:

```bash
mysql -h <host> -u root -p < db/schema.sql
```

The schema is idempotent — running it again on an existing DB is safe.

### 2. Set environment variables

On your host, set every variable from [.env.example](.env.example). Generate `JWT_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

If your managed MySQL requires TLS, set `DB_SSL=true`.

### 3. Configure Google Sign-In

In [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → your OAuth 2.0 Client ID, add your production origin (e.g. `https://wallethub.example.com`) to *Authorized JavaScript origins*. Set both `GOOGLE_CLIENT_ID` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to the same value.

### 4. Build & start

```bash
npm ci
npm run build
npm start          # serves on $PORT (default 3000)
```

Run behind nginx/Caddy with TLS terminated at the proxy.

### Receipt uploads

The `/api/upload-receipt` route writes to `public/uploads/{userId}/`. This works on any host with a persistent filesystem. **Vercel, Netlify, and other read-only-fs serverless platforms will fail at runtime** — switch to object storage (S3, R2, GCS) before deploying there.

### Vercel notes

If you do deploy to Vercel:
- Use a managed MySQL (PlanetScale, Aiven, RDS) reachable from Vercel's edge.
- Replace the local-disk write in [src/app/api/upload-receipt/route.ts](src/app/api/upload-receipt/route.ts) with an S3-compatible upload.
- Set all env vars in the Vercel project settings; do not commit `.env`.

## Project layout

```
src/
  app/              Next.js App Router (pages + /api routes)
  components/       Shared React components
  lib/              auth, db, gemini, i18n, themes
  views/            Page-level components
  types/            Shared TypeScript types
db/
  schema.sql        MySQL schema (idempotent)
public/
  uploads/          Runtime-written receipt images (gitignored)
```
