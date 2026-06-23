import {RequireAdminAuth} from '@/components/RequireAdminAuth';
import {OverviewClient} from './OverviewClient';

export default function OverviewPage() {
  return (
    <RequireAdminAuth nextPath="/">
      <OverviewClient />
    </RequireAdminAuth>
  );
}

