// Starts the Google OAuth sign-in flow. Requires GOOGLE_CLIENT_ID (see
// app/config.ts); the redirect URI registered in Google Cloud Console must be
// APP_ORIGIN + /api/auth/callback.
import { randomBytes } from 'node:crypto';
import { APP_ORIGIN, GOOGLE_CLIENT_ID } from '../../../config';

function safeRelativeReturnPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  if (value.startsWith('/api/auth/')) return '/';
  return value;
}

export async function GET(req: Request) {
  const returnTo = safeRelativeReturnPath(new URL(req.url).searchParams.get('return_to'));
  if (!GOOGLE_CLIENT_ID) return new Response('Google sign-in is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (see README).', { status: 500 });
  const state = randomBytes(16).toString('base64url');
  const auth = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  auth.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  auth.searchParams.set('redirect_uri', APP_ORIGIN + '/api/auth/callback');
  auth.searchParams.set('response_type', 'code');
  auth.searchParams.set('scope', 'openid email profile');
  auth.searchParams.set('state', state);
  auth.searchParams.set('prompt', 'select_account');
  const headers = new Headers({ Location: auth.toString(), 'Cache-Control': 'no-store' });
  headers.append('Set-Cookie', `cn_oauth_state=${state}; Path=/api/auth/; HttpOnly; SameSite=Lax; Max-Age=600`);
  headers.append('Set-Cookie', `cn_oauth_return=${encodeURIComponent(returnTo)}; Path=/api/auth/; HttpOnly; SameSite=Lax; Max-Age=600`);
  return new Response(null, { status: 302, headers });
}
