import type {ReactNode} from 'react';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {ADMIN_AUTH_COOKIE, isValidAdminSessionToken} from '@/lib/adminSession';

export async function RequireAdminAuth({
  children,
  nextPath,
}: {
  children: ReactNode;
  nextPath: string;
}) {
  const cookieStore = await cookies();
  const isAuthenticated = await isValidAdminSessionToken(
    cookieStore.get(ADMIN_AUTH_COOKIE)?.value,
  );

  if (!isAuthenticated) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return <>{children}</>;
}

