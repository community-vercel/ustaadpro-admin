import type {ReactNode} from 'react';
import {RequireAdminAuth} from '@/components/RequireAdminAuth';

export default function ShopOrdersLayout({children}: {children: ReactNode}) {
  return <RequireAdminAuth nextPath="/shop-orders">{children}</RequireAdminAuth>;
}

