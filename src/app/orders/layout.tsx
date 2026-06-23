import type {ReactNode} from 'react';
import {RequireAdminAuth} from '@/components/RequireAdminAuth';

export default function OrdersLayout({children}: {children: ReactNode}) {
  return <RequireAdminAuth nextPath="/orders">{children}</RequireAdminAuth>;
}

