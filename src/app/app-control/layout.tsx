import type {ReactNode} from 'react';
import {RequireAdminAuth} from '@/components/RequireAdminAuth';

export default function AppControlLayout({children}: {children: ReactNode}) {
  return <RequireAdminAuth nextPath="/app-control">{children}</RequireAdminAuth>;
}

