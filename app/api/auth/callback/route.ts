// OAuth callback: exchanges the code and admits any verified Google account.
// Exercises are private per signed-in user (see app/api/exercise/route.ts).
import { APP_ORIGIN, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '../../../config';
import { sessionCookie } from '../../../auth';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const fail = (message: string) => new Response(message, { status: 403, headers: { 'Cache-Control': 'no-store' } });
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieState = req.headers.get('cookie')?.match(/(?:^|;\s*)cn_oauth_state=([^;]*)/)?.[1];
  if (!code || !state || !cookieState || state !== cookieState) return fail('Sign-in could not be verified. Try again.');

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID || '',
      client_secret: GOOGLE_CLIENT_SECRET || '',
      redirect_uri: APP_ORIGIN + '/api/auth/callback',
      grant_type: 'authorization_code',
    }),
  });
  if (!tokenRes.ok) return fail('Google sign-in failed. Try again.');
  const tokens: { access_token?: string } = await tokenRes.json();
  if (!tokens.access_token) return fail('Google sign-in failed. Try again.');

  const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: 'Bearer ' + tokens.access_token },
  });
  if (!infoRes.ok) return fail('Google sign-in failed. Try again.');
  const info: { sub?: string; email?: string; email_verified?: boolean; name?: string } = await infoRes.json();
  if (!info.sub || !info.email || info.email_verified !== true) return fail('Your Google account has no verified e-mail address.');

  const returnTo = req.headers.get('cookie')?.match(/(?:^|;\s*)cn_oauth_return=([^;]*)/)?.[1];
  let target = '/';
  try { target = decodeURIComponent(returnTo || '/') || '/'; } catch { target = '/'; }
  if (!target.startsWith('/') || target.startsWith('//') || target.startsWith('/api/auth/')) target = '/';

  const headers = new Headers({ Location: target, 'Cache-Control': 'no-store' });
  headers.append('Set-Cookie', sessionCookie({ userId: 'google:' + info.sub, email: info.email, displayName: info.name || info.email, fullName: info.name || null }));
  headers.append('Set-Cookie', 'cn_oauth_state=; Path=/api/auth/; HttpOnly; Max-Age=0');
  headers.append('Set-Cookie', 'cn_oauth_return=; Path=/api/auth/; HttpOnly; Max-Age=0');
  return new Response(null, { status: 302, headers });
}
