import { Metadata } from 'next';
import WhatsAppBotClient from './WhatsAppBotClient';

export const metadata: Metadata = {
  title: 'WhatsApp Bot Management',
  description: 'Manage WhatsApp bot services, bookings, and sessions.',
};

export default function WhatsAppBotPage() {
  return <WhatsAppBotClient />;
}
