import {RequireAdminAuth} from '@/components/RequireAdminAuth';

export default function PaymentReceiptsLayout({children}: {children: React.ReactNode}) {
  return <RequireAdminAuth nextPath="/payment-receipts">{children}</RequireAdminAuth>;
}
