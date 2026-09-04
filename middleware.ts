// middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { i18n, isLocale, type Locale } from '@/i18n/config';
import { refreshSupabaseSession } from '@/lib/supabase/middleware';

const LOCALE_COOKIE = 'NEXT_LOCALE';
const PUBLIC_FILE = /\.(.*)$/;

function resolveLocale(request: NextRequest): Locale {
  // 1. Explicit user choice wins.
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale && isLocale(cookieLocale)) return cookieLocale;

  // 2. Accept-Language negotiation.
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const languages = new Negotiator({ headers }).languages();
  try {
    return matchLocale(languages, i18n.locales as unknown as string[], i18n.defaultLocale) as Locale;
  } catch {
    return i18n.defaultLocale;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Skip infrastructure paths.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/monitoring') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/favicon.ico' ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split('/');
  const maybeLocale = segments[1];
  const hasLocale = isLocale(maybeLocale);

  // ---- Redirect: inject locale prefix -------------------------------------
  if (!hasLocale) {
    const locale = resolveLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
    url.search = search;

    const redirect = NextResponse.redirect(url);
    redirect.cookies.set(LOCALE_COOKIE, locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
    return redirect;
  }

  const locale = maybeLocale as Locale;

  // ---- Continue: refresh Supabase session cookies --------------------------
  const response = NextResponse.next({ request: { headers: request.headers } });
  response.headers.set('x-locale', locale);
  response.headers.set('x-pathname', pathname);

  if (request.cookies.get(LOCALE_COOKIE)?.value !== locale) {
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
  }

  const { user } = await refreshSupabaseSession(request, response);

  // ---- Edge guard: /{lang}/admin and /{lang}/b2b require a session ---------
  const rest = `/${segments.slice(2).join('/')}`;
  const isProtected = rest.startsWith('/admin') || rest.startsWith('/b2b/licensing');

  if (isProtected && !user) {
    const login = request.nextUrl.clone();
    login.pathname = `/${locale}/login`;
    login.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|mp4|webm|woff2?)$).*)'],
};
