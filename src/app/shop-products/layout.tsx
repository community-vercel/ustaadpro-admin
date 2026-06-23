import type {ReactNode} from 'react';
import {RequireAdminAuth} from '@/components/RequireAdminAuth';

export default function ShopProductsLayout({children}: {children: ReactNode}) {
  return (
    <RequireAdminAuth nextPath="/shop-products">{children}</RequireAdminAuth>
  );
}

