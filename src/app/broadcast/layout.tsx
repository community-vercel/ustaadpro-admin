import type {ReactNode} from 'react';
import {RequireAdminAuth} from '@/components/RequireAdminAuth';

export default function BroadcastLayout({children}: {children: ReactNode}) {
  return <RequireAdminAuth nextPath="/broadcast">{children}</RequireAdminAuth>;
}

