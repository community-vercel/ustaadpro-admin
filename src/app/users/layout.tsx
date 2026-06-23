import type {ReactNode} from 'react';
import {RequireAdminAuth} from '@/components/RequireAdminAuth';

export default function UsersLayout({children}: {children: ReactNode}) {
  return <RequireAdminAuth nextPath="/users">{children}</RequireAdminAuth>;
}

