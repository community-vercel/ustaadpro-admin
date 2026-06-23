import type {ReactNode} from 'react';
import {RequireAdminAuth} from '@/components/RequireAdminAuth';

export default function ResourcesLayout({children}: {children: ReactNode}) {
  return <RequireAdminAuth nextPath="/resources">{children}</RequireAdminAuth>;
}

