// Loads KEY=VALUE pairs from .env and .env.local into process.env (once).
// Existing process.env values always win. Also normalizes TURSO_TOKEN to the
// conventional TURSO_AUTH_TOKEN name. Paths resolve relative to this file so
// the production server finds them regardless of its working directory.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

const g = globalThis as typeof globalThis & { __classroomEnvLoaded?: boolean };

export function loadDotEnvFiles(): void {
  if (g.__classroomEnvLoaded) return;
  g.__classroomEnvLoaded = true;
  for (const name of ['.env', '.env.local']) {
    const file = join(projectRoot, name);
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const key = match[1];
      const value = match[2].replace(/^"(.*)"$/, '$1').trim();
      if (key === 'TURSO_TOKEN') {
        if (!process.env.TURSO_AUTH_TOKEN) process.env.TURSO_AUTH_TOKEN = value;
      } else if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  }
}

loadDotEnvFiles();
