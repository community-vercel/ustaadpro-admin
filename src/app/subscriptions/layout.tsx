import type {ReactNode} from 'react';
import {RequireAdminAuth} from '@/components/RequireAdminAuth';

export default function SubscriptionsLayout({children}: {children: ReactNode}) {
  return (
    <RequireAdminAuth nextPath="/subscriptions">{children}</RequireAdminAuth>
  );
}

