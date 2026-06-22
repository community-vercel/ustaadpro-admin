import Link from 'next/link';
import type {ReactNode} from 'react';
import {
  ClipboardList,
  LayoutDashboard,
  Settings,
  Users,
  Wrench,
  Package,
  ShoppingBag,
  ShoppingCart,
  Send,
  UserCheck,
} from 'lucide-react';

const navItems = [
  {href: '/', label: 'Overview', Icon: LayoutDashboard},
  {href: '/orders', label: 'Orders', Icon: ClipboardList},
  {href: '/services', label: 'Services', Icon: Wrench},
  {href: '/subscriptions', label: 'Subscriptions', Icon: Package},
  {href: '/shop-products', label: 'Shop Products', Icon: ShoppingBag},
  {href: '/shop-orders', label: 'Shop Orders', Icon: ShoppingCart},
  {href: '/broadcast', label: 'Broadcast', Icon: Send},
  {href: '/app-control', label: 'App Control', Icon: Settings},
  {href: '/resources', label: 'Our Resources', Icon: UserCheck},
  {href: '/users', label: 'Users', Icon: Users},
];

export function AdminShell({
  children,
  eyebrow,
  title,
  action,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brandMark">UP</div>
        <div>
          <h1>UstaadPro Admin</h1>
          <p>Bookings, services, customers, and operations.</p>
        </div>
        <nav>
          {navItems.map(item => (
            <Link href={item.href} key={item.href}>
              <item.Icon size={17} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2>{title}</h2>
          </div>
          {action}
        </header>
        {children}
      </section>
    </main>
  );
}
