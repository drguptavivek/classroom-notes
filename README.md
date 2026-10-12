# Classroom Notes

Classroom exercise app: a teacher creates question sets, students join with a
code (no sign-in), and the teacher reviews, reveals and analyses responses.

- **Stack**: Vinext (Next.js-style React on Vite), React 19, Tailwind 4,
  SQLite (`node:sqlite`) or Turso/libsql when `TURSO_DATABASE_URL` is set,
  filesystem image storage.
- **Auth**: Google OAuth sign-in for teachers; every signed-in teacher sees and
  manages only their own exercises. Students are anonymous (join by code).

See [LOCAL_SETUP.md](LOCAL_SETUP.md) for setup, Google OAuth configuration,
nginx/systemd deployment, and data layout.

## Commands

```sh
pnpm install --frozen-lockfile
npm run init:db   # first run only; creates data/classroom.db from drizzle/ migrations
npm run dev       # development on http://localhost:5173
npm run build
npm run start     # production server on http://localhost:3000 (nginx proxies to this)
```

## Verify changes

```sh
node node_modules/typescript/bin/tsc --noEmit
node tests/server.test.cjs
npm run build
```

## Code map

- `app/page.tsx` — dashboard, student entry, exercise management, QR view
- `app/components/Builder.tsx` / `Answers.tsx` / `Results.tsx` / `Analysis.tsx`
- `app/model.ts` — question/answer types and validation
- `app/auth.ts`, `app/config.ts` — Google session auth and owner configuration
- `app/runtime.ts` — local SQLite database (D1-compatible API) and image bucket
- `app/api/` — route handlers; `app/api/auth/` — OAuth flow
- `db/schema.ts`, `drizzle/` — schema and ordered migrations
  (`npm run db:generate` after schema edits; apply new SQL to existing
  databases manually)
