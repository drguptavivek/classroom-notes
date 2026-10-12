// Application database runtime: Turso (libsql) when TURSO_DATABASE_URL is set,
// otherwise a local SQLite file via node:sqlite. Both expose the D1-compatible
// API the route handlers already use. Image storage stays on the filesystem.
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@libsql/client';
import { loadDotEnvFiles } from './envfile';

loadDotEnvFiles();

const dataDir = process.env.DATA_DIR || join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const dbPath = process.env.DB_PATH || join(dataDir, 'classroom.db');
const imagesDir = join(dataDir, 'images');

export type D1Value = string | number | null;
export interface D1Result {
  meta: { changes: number };
  success: boolean;
}
export interface D1Row {
  [key: string]: string | number | null;
}
export interface D1Statement {
  readonly sql: string;
  readonly args: D1Value[];
  bind(...values: D1Value[]): D1Statement;
  run(): Promise<D1Result>;
  first(): Promise<D1Row | null>;
  all(): Promise<{ results: D1Row[] }>;
}
export interface D1Database {
  prepare(sql: string): D1Statement;
  batch(statements: D1Statement[]): Promise<D1Result[]>;
}

export interface StoredObject {
  body: Uint8Array;
  httpMetadata: { contentType?: string };
}
export interface Bucket {
  put(key: string, bytes: Uint8Array, options?: { httpMetadata?: { contentType?: string } }): Promise<void>;
  get(key: string): Promise<StoredObject | null>;
}

function fileStatement(db: DatabaseSync, sql: string, args: D1Value[] = []): D1Statement {
  return {
    sql,
    args,
    bind(...values: D1Value[]) { return fileStatement(db, sql, values); },
    async run() {
      const result = db.prepare(sql).run(...(args as string[]));
      return { meta: { changes: Number(result.changes) }, success: true };
    },
    async first() { return ((db.prepare(sql).get(...(args as string[])) ?? null) as D1Row | null); },
    async all() { return { results: db.prepare(sql).all(...(args as string[])) as D1Row[] }; },
  };
}

function createFileDb(): D1Database {
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode=WAL;');
  return {
    prepare: (sql: string) => fileStatement(db, sql),
    async batch(statements) {
      db.exec('BEGIN');
      try {
        const result: D1Result[] = [];
        for (const s of statements) result.push(await s.run());
        db.exec('COMMIT');
        return result;
      } catch (e) { db.exec('ROLLBACK'); throw e; }
    },
  };
}

function toRow(columns: string[], row: unknown): D1Row {
  const out: D1Row = {};
  const values = row as D1Value[];
  for (let i = 0; i < columns.length; i++) out[columns[i]] = values[i] ?? null;
  return out;
}

function createTursoDb(): D1Database {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error('TURSO_DATABASE_URL is not set.');
  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  return {
    prepare: (sql: string) => ({
      sql,
      args: [],
      bind(...values: D1Value[]) { return clientStatement(client, sql, values); },
      run: () => { throw new Error('bind() before run()'); },
      first: () => { throw new Error('bind() before first()'); },
      all: () => { throw new Error('bind() before all()'); },
    }),
    async batch(statements) {
      const results = await client.batch(statements.map((s) => ({ sql: s.sql, args: s.args })));
      return results.map((r) => ({ meta: { changes: Number(r.rowsAffected) }, success: true }));
    },
  };
}

function clientStatement(client: ReturnType<typeof createClient>, sql: string, args: D1Value[]): D1Statement {
  return {
    sql,
    args,
    bind(...values: D1Value[]) { return clientStatement(client, sql, values); },
    async run() {
      const r = await client.execute({ sql, args });
      return { meta: { changes: Number(r.rowsAffected) }, success: true };
    },
    async first() {
      const r = await client.execute({ sql, args });
      return r.rows.length ? toRow(r.columns, r.rows[0]) : null;
    },
    async all() {
      const r = await client.execute({ sql, args });
      return { results: r.rows.map((row) => toRow(r.columns, row)) };
    },
  };
}

// Singleton survives module reloads during development.
const g = globalThis as typeof globalThis & { __classroomDb?: D1Database };

const DB: D1Database = g.__classroomDb ||= process.env.TURSO_DATABASE_URL ? createTursoDb() : createFileDb();

// R2-compatible bucket backed by the filesystem. Content types are stored in
// sibling `<key>.meta` files because the objects are plain files.
const BUCKET: Bucket = {
  async put(key, bytes, options) {
    const file = join(imagesDir, key);
    if (!file.startsWith(imagesDir)) throw new Error('Invalid object key.');
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, bytes);
    writeFileSync(file + '.meta', options?.httpMetadata?.contentType || 'image/png');
  },
  async get(key) {
    const file = join(imagesDir, key);
    if (!file.startsWith(imagesDir) || !existsSync(file)) return null;
    const metaFile = file + '.meta';
    return {
      body: new Uint8Array(readFileSync(file)),
      httpMetadata: { contentType: existsSync(metaFile) ? readFileSync(metaFile, 'utf8') : 'image/png' },
    };
  },
};

export const env: { DB: D1Database; BUCKET: Bucket } = { DB, BUCKET };
