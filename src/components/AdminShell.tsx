'use client';

import Link from 'next/link';
import {usePathname, useRouter} from 'next/navigation';
import type {ReactNode} from 'react';
import {useEffect, useState} from 'react';
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
import {LogoutButton} from './LogoutButton';

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

let cachedAuthStatus = false;

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
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(cachedAuthStatus);
  const [isCheckingAuth, setIsCheckingAuth] = useState(!cachedAuthStatus);

  useEffect(() => {
    let isMounted = true;

    async function verifySession() {
      try {
        const response = await fetch('/api/admin-login', {
          cache: 'no-store',
          credentials: 'include',
        });

        if (!response.ok) {
          cachedAuthStatus = false;
          const nextPath = encodeURIComponent(pathname || '/');
          router.replace(`/login?next=${nextPath}`);
          return;
        }

        cachedAuthStatus = true;
        if (isMounted) {
          setIsAuthenticated(true);
        }
      } catch {
        cachedAuthStatus = false;
        const nextPath = encodeURIComponent(pathname || '/');
        router.replace(`/login?next=${nextPath}`);
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    }

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  if (isCheckingAuth || !isAuthenticated) {
    return (
      <main className="authCheckPage">
        <div className="brandMark">UP</div>
      </main>
    );
  }

  return (
    <main className="shell">
      <aside 
        className="sidebar"
        onScroll={(e) => {
          sessionStorage.setItem('adminSidebarScroll', e.currentTarget.scrollTop.toString());
        }}
        ref={(el) => {
          if (el && !el.dataset.scrolled) {
            const saved = sessionStorage.getItem('adminSidebarScroll');
            if (saved) el.scrollTop = parseInt(saved, 10);
            el.dataset.scrolled = 'true';
          }
        }}
      >
        <div className="brandMark">UP</div>
        <div>
          <h1>UstaadPro Admin</h1>
          <p>Bookings, services, customers, and operations.</p>
        </div>
        <nav>
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link href={item.href} key={item.href} className={isActive ? 'active' : ''}>
                <item.Icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2>{title}</h2>
          </div>
          <div className="topbarActions">
            {action}
            <LogoutButton />
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}
