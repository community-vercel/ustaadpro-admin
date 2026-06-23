import type {ReactNode} from 'react';
import {RequireAdminAuth} from '@/components/RequireAdminAuth';

export default function ServicesLayout({children}: {children: ReactNode}) {
  return <RequireAdminAuth nextPath="/services">{children}</RequireAdminAuth>;
}

