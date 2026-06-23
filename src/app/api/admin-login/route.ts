import {NextRequest, NextResponse} from 'next/server';
import {
  ADMIN_AUTH_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSessionToken,
  isValidAdminSessionToken,
} from '@/lib/adminSession';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.ustaadpro.pk/api';

export async function GET(request: NextRequest) {
  const isAuthenticated = await isValidAdminSessionToken(
    request.cookies.get(ADMIN_AUTH_COOKIE)?.value,
  );

  if (!isAuthenticated) {
    return NextResponse.json({authenticated: false}, {status: 401});
  }

  return NextResponse.json({authenticated: true});
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  let backendResponse: Response;

  try {
    backendResponse = await fetch(`${API_BASE_URL}/admin/auth/login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email, password}),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      {message: 'Backend server is not reachable.'},
      {status: 503},
    );
  }

  if (!backendResponse.ok) {
    const data = await backendResponse.json().catch(() => ({}));
    return NextResponse.json(
      {message: data.message || 'Invalid email or password.'},
      {status: backendResponse.status},
    );
  }

  const response = NextResponse.json({message: 'Logged in.'});
  const sessionToken = await createAdminSessionToken();

  response.cookies.set({
    name: ADMIN_AUTH_COOKIE,
    value: sessionToken,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({message: 'Logged out.'});
  response.cookies.set({
    name: ADMIN_AUTH_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });

  return response;
}
