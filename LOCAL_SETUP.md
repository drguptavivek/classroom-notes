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
- nginx runs on a separate reverse-proxy VM

## Setup on the servers (two-VM layout)

**App VM** — runs the Node server (nginx runs on a separate RP VM):

```sh
git clone https://github.com/drguptavivek/classroom-notes.git /opt/classroom-notes
cd /opt/classroom-notes && pnpm install --frozen-lockfile
cp .env.example .env   # fill in Turso + Google credentials + APP_ORIGIN=https://classroom.aiims.app
npm run init:db        # once
npm run build
sudo cp deploy/classroom-notes.service /etc/systemd/system/
sudo systemctl enable --now classroom-notes
```

The server listens on `0.0.0.0:3000`. Restrict port 3000 to the RP VM's IP
(`ufw allow from <RP_VM_IP> to any port 3000`) — all public traffic goes
through nginx.

**Reverse-proxy VM** — TLS + proxy (see `deploy/nginx-rp.conf`):

```sh
sudo cp deploy/nginx-rp.conf /etc/nginx/sites-available/classroom-notes
sudo sed -i 's/APP_VM_IP/<app VM IP>/' /etc/nginx/sites-available/classroom-notes
sudo ln -s /etc/nginx/sites-available/classroom-notes /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot certonly --nginx -d classroom.aiims.app   # then reload
sudo certbot renew --dry-run
```

Google OAuth redirect URI: `https://classroom.aiims.app/api/auth/callback`.

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
