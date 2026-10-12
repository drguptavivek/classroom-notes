// Google sign-in session handling: signed, expiring cookie verified with HMAC.
import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { SESSION_SECRET } from './config';
import { loadDotEnvFiles } from './envfile';

loadDotEnvFiles();

export interface SessionUser {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
}

const COOKIE_NAME = 'cn_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export function signSession(user: SessionUser, issuedAtSeconds: number): string {
  const payload = Buffer.from(JSON.stringify({ u: user, iat: issuedAtSeconds })).toString('base64url');
  const signature = createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return payload + '.' + signature;
}

export function verifySession(cookieValue: string | undefined): SessionUser | null {
  if (!cookieValue) return null;
  const dot = cookieValue.lastIndexOf('.');
  if (dot <= 0) return null;
  const payload = cookieValue.slice(0, dot);
  const expected = createHmac('sha256', SESSION_SECRET).update(payload).digest();
  let actual: Buffer;
  try { actual = Buffer.from(cookieValue.slice(dot + 1), 'base64url'); } catch { return null; }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  let parsed: { u?: Partial<SessionUser>; iat?: number };
  try { parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch { return null; }
  if (!parsed || typeof parsed.iat !== 'number' || !parsed.u
    || typeof parsed.u.email !== 'string' || typeof parsed.u.userId !== 'string') return null;
  if (parsed.iat + SESSION_TTL_SECONDS < Math.floor(Date.now() / 1000)) return null;
  return {
    userId: parsed.u.userId,
    email: parsed.u.email,
    displayName: typeof parsed.u.displayName === 'string' ? parsed.u.displayName : parsed.u.email,
    fullName: typeof parsed.u.fullName === 'string' ? parsed.u.fullName : null,
  };
}

export async function getUser(): Promise<SessionUser | null> {
  return verifySession((await cookies()).get(COOKIE_NAME)?.value);
}

export function sessionCookie(user: SessionUser): string {
  const value = signSession(user, Math.floor(Date.now() / 1000));
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
