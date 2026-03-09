import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/signup', '/auth/callback', '/_next', '/favicon'];
const ADMIN_PATHS = ['/admin'];
const OPS_PATHS = ['/ops'];
const CLIENT_PATHS = ['/client'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        }
      }
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based routing
  if (ADMIN_PATHS.some((p) => pathname.startsWith(p)) ||
      OPS_PATHS.some((p) => pathname.startsWith(p)) ||
      CLIENT_PATHS.some((p) => pathname.startsWith(p))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const role = profile.role;

    if (ADMIN_PATHS.some((p) => pathname.startsWith(p)) && role !== 'admin') {
      return NextResponse.redirect(new URL(role === 'client' ? '/client' : '/ops', request.url));
    }
    if (OPS_PATHS.some((p) => pathname.startsWith(p)) && role === 'client') {
      return NextResponse.redirect(new URL('/client', request.url));
    }
    if (CLIENT_PATHS.some((p) => pathname.startsWith(p)) && role !== 'client' && role !== 'admin') {
      return NextResponse.redirect(new URL('/ops', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
