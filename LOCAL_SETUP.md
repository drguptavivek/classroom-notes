# Classroom Notes — local SQLite + nginx deployment

Self-hosted Node deployment. Cloudflare Workers (D1/R2) and the ChatGPT-gateway
sign-in have been replaced by local SQLite (`node:sqlite`), filesystem image
storage, and Google OAuth sign-in for the owner account.

## Architecture

| Concern | Was | Now |
|---|---|---|
| Runtime | Cloudflare Worker (workerd) | Node server (`vinext start`, port 3000) |
| Database | Cloudflare D1 | SQLite file `data/classroom.db` (`app/runtime.ts`, D1-compatible API) |
| Image storage | Cloudflare R2 | Files under `data/images/` |
| Teacher sign-in | Gateway headers (`oai-authenticated-user-*`) | Google OAuth (`/api/auth/google`), session cookie signed with HMAC |
| Owner | `vgupta@aiims.edu` | `drvivek.gupta@gmail.com` (`app/config.ts:OWNER_EMAIL`) |
| Front of app | Cloudflare edge | nginx reverse proxy |

## Requirements

- Node.js 22.13+ (uses built-in `node:sqlite`; tested on Node 24)
- pnpm 11.25.0
- nginx

## Setup on a server

```sh
# 1. Code + dependencies
git clone <this repo> /opt/classroom-notes && cd /opt/classroom-notes
pnpm install --frozen-lockfile

# 2. Google OAuth credentials
cp .env.example .env.local   # fill in GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
# In Google Cloud Console → APIs & Services → Credentials, create a
# "Web application" OAuth client with redirect URI:
#   https://YOUR-DOMAIN/api/auth/callback

# 3. Origin and database
export APP_ORIGIN=https://YOUR-DOMAIN        # must match the redirect URI above
npm run init:db                              # creates data/classroom.db once

# 4. Build and run as a service
npm run build
sudo cp deploy/classroom-notes.service /etc/systemd/system/
sudo systemctl edit --full classroom-notes   # set WorkingDirectory/APP_ORIGIN paths
sudo systemctl enable --now classroom-notes

# 5. nginx
sudo cp deploy/nginx.conf /etc/nginx/sites-available/classroom-notes
# edit server_name, then:
sudo ln -s /etc/nginx/sites-available/classroom-notes /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

For HTTPS use certbot (`sudo certbot --nginx`) after nginx is serving.

## Local development

```sh
pnpm install
npm run init:db   # first run only
npm run dev       # http://localhost:5173
```

Dev sign-in uses the same Google OAuth flow; for localhost testing create a
second OAuth client with redirect URI `http://localhost:5173/api/auth/callback`
and set `APP_ORIGIN=http://localhost:5173` (e.g. in `.env.local` — note
`.env.local` only covers the Google credentials; APP_ORIGIN is read from the
process environment).

## Owner sign-in

Only `drvivek.gupta@gmail.com` can sign in (`app/config.ts`). Other Google
accounts are rejected at the callback. Students never sign in; exercises are
joined by code. Sessions are HttpOnly cookies signed with `SESSION_SECRET`
(or an auto-generated `data/session-secret` — back this file up with `data/`).

## Data layout (back up `data/`)

- `data/classroom.db` (+ `-wal`/`-shm`): exercises, responses, settings
- `data/images/question-images/`: uploaded question images
- `data/session-secret`: session signing key (auto-generated)

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | yes (teacher sign-in) | OAuth client; also read from `.env.local` |
| `APP_ORIGIN` | yes in production | Public origin; builds OAuth redirect URI |
| `SESSION_SECRET` | no | Session signing key; else generated at `data/session-secret` |
| `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | no | Use a Turso (libsql) database instead of the local SQLite file; run `npm run init:db` once with these set to apply migrations |
| `DB_PATH` / `DATA_DIR` | no | Override SQLite file / data directory (file mode only) |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | no | Embedded AI analysis; ChatGPT handoff works without |

## Verify

```sh
node node_modules/typescript/bin/tsc --noEmit
node tests/server.test.cjs
npm run build && npm run start   # then open http://localhost:3000
```
