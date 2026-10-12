// Server-only application configuration from the process environment.
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDotEnvFiles } from './envfile';

loadDotEnvFiles();

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

export const OWNER_EMAIL = 'drvivek.gupta@gmail.com';
export const APP_ORIGIN = (process.env.APP_ORIGIN || 'http://localhost:3000').replace(/\/$/, '');

function readGoogleCredential(name: 'GOOGLE_CLIENT_ID' | 'GOOGLE_CLIENT_SECRET'): string | undefined {
  const direct = process.env[name];
  if (direct) return direct;
  // Fall back to a local .env.local file so the app runs without exporting
  // secrets in the shell.
  try {
    const text = readFileSync(join(projectRoot, '.env.local'), 'utf8');
    for (const line of text.split('\n')) {
      const match = line.match(new RegExp('^\\s*' + name + '\\s*=\\s*"?([^"\\n]*)"?:?\\s*$'));
      if (match) return match[1].trim();
    }
  } catch { /* no .env.local */ }
  return undefined;
}

export const GOOGLE_CLIENT_ID = readGoogleCredential('GOOGLE_CLIENT_ID');
export const GOOGLE_CLIENT_SECRET = readGoogleCredential('GOOGLE_CLIENT_SECRET');

// Session signing secret: prefer SESSION_SECRET; otherwise generate and persist
// one under data/ so sessions survive restarts without manual setup.
function loadSessionSecret(): string {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const dataDir = process.env.DATA_DIR || join(projectRoot, 'data');
  const secretFile = join(dataDir, 'session-secret');
  if (existsSync(secretFile)) return readFileSync(secretFile, 'utf8').trim();
  const secret = randomBytes(32).toString('hex');
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(secretFile, secret, { mode: 0o600 });
  return secret;
}

export const SESSION_SECRET = createHash('sha256').update(loadSessionSecret()).digest();
