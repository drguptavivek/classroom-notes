// Creates the local SQLite database from the ordered Drizzle migrations.
// Refuses to run twice so existing data is never overwritten or re-migrated.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// Minimal .env / .env.local loader; existing environment variables win.
for (const name of ['.env', '.env.local']) {
  const file = path.join(root, name);
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    if (match[1] === 'TURSO_TOKEN') {
      if (!process.env.TURSO_AUTH_TOKEN) process.env.TURSO_AUTH_TOKEN = match[2].trim();
    } else if (!(match[1] in process.env)) {
      process.env[match[1]] = match[2].replace(/^"(.*)"$/, '$1').trim();
    }
  }
}

const tursoUrl = process.env.TURSO_DATABASE_URL;
const dataDir = process.env.DATA_DIR || path.join(root, 'data');
const dbPath = process.env.DB_PATH || path.join(dataDir, 'classroom.db');
const marker = tursoUrl ? null : dbPath + '.migrated';

if (marker && existsSync(marker)) {
  console.log('Local database already initialised; leaving it untouched.');
  process.exit(0);
}

async function main() {
  let exec;
  let done = () => {};
  if (tursoUrl) {
    const { createClient } = await import('@libsql/client');
    const client = createClient({ url: tursoUrl, authToken: process.env.TURSO_AUTH_TOKEN });
    exec = (sql) => client.execute(sql);
    done = () => console.log('Turso database ready at', tursoUrl);
  } else {
    const { DatabaseSync } = await import('node:sqlite');
    mkdirSync(path.dirname(dbPath), { recursive: true });
    const db = new DatabaseSync(dbPath);
    db.exec('PRAGMA journal_mode=WAL;');
    exec = (sql) => db.exec(sql);
    done = () => {
      writeFileSync(marker, new Date().toISOString());
      console.log('Local database ready at', dbPath);
    };
  }
  const migrations = readdirSync(path.join(root, 'drizzle')).filter((f) => f.endsWith('.sql')).sort();
  for (const name of migrations) {
    const sql = readFileSync(path.join(root, 'drizzle', name), 'utf8');
    // libsql rejects multi-statement strings; run each statement separately.
    for (const statement of sql.split(';').map((s) => s.trim()).filter(Boolean)) {
      await exec(statement);
    }
    console.log('Applied', name);
  }
  done();
}
await main();
