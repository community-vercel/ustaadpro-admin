import type {Metadata} from 'next';
import './styles.css';

export const metadata: Metadata = {
  title: 'UstaadPro Admin',
  description: 'Operations dashboard for UstaadPro bookings and services',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
