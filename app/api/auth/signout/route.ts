import { clearSessionCookie } from '../../../auth';

export async function GET(req: Request) {
  const requested = new URL(req.url).searchParams.get('return_to');
  let target = requested && requested.startsWith('/') && !requested.startsWith('//') ? requested : '/';
  if (target.startsWith('/api/auth/')) target = '/';
  return new Response(null, {
    status: 302,
    headers: { Location: target, 'Set-Cookie': clearSessionCookie(), 'Cache-Control': 'no-store' },
  });
}
