import {NextRequest, NextResponse} from 'next/server';
import {ADMIN_AUTH_COOKIE, isValidAdminSessionToken} from './src/lib/adminSession';

const publicPaths = ['/login', '/api/admin-login'];

export async function proxy(request: NextRequest) {
  const {pathname} = request.nextUrl;
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  const isAuthenticated = await isValidAdminSessionToken(
    request.cookies.get(ADMIN_AUTH_COOKIE)?.value,
  );

  if (!isAuthenticated && !isPublicPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && pathname === '/login') {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = '/';
    dashboardUrl.search = '';
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};

