'use client';

import {useEffect, useMemo, useState} from 'react';
import type {ReactNode} from 'react';
import {
  Activity,
  ClipboardList,
  IndianRupee,
  RefreshCw,
  Users,
  Wrench,
} from 'lucide-react';
import {AdminShell} from '@/components/AdminShell';
import {AdminOrder, AdminSummary, getOrders, getSummary} from '@/lib/api';
import {money, parseBookingSchedule} from '@/lib/adminUi';

export default function OverviewPage() {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [message, setMessage] = useState('');

  const activeOrders = useMemo(
    () => orders.filter(order => order.status !== 'completed'),
    [orders],
  );

  const loadData = async () => {
    const [nextSummary, nextOrders] = await Promise.all([
      getSummary(),
      getOrders(),
    ]);
    setSummary(nextSummary);
    setOrders(nextOrders);
  };

  useEffect(() => {
    loadData().catch(() =>
      setMessage('Could not load admin data. Check that the API is running.'),
    );
  }, []);

  return (
    <AdminShell
      eyebrow="Operations Console"
      title="Overview"
      action={
        <button className="ghostButton" onClick={() => loadData()}>
          <RefreshCw size={17} />
          Refresh
        </button>
      }
    >
      {message && <div className="notice">{message}</div>}

      <section className="statsGrid">
        <StatCard
          icon={<ClipboardList />}
          label="Total Orders"
          value={summary?.totalOrders || 0}
        />
        <StatCard
          icon={<Activity />}
          label="Active Orders"
          value={summary?.activeOrders || activeOrders.length}
        />
        <StatCard
          icon={<Users />}
          label="Customers"
          value={summary?.totalCustomers || 0}
        />
        <StatCard
          icon={<Wrench />}
          label="Services"
          value={summary?.totalServices || 0}
        />
        <StatCard
          icon={<IndianRupee />}
          label="Revenue"
          value={money(summary?.revenue || 0)}
        />
      </section>

      <section className="panel">
        <div className="panelHead">
          <div>
            <p className="eyebrow">Latest bookings</p>
            <h3>Recent Orders</h3>
          </div>
        </div>
        <div className="ordersList">
          {orders.slice(0, 5).map(order => {
            const schedule = parseBookingSchedule(order.bookedFor);

            return (
              <article className="orderCard" key={order.id}>
                <div className="orderTop">
                  <div>
                    <strong>{order.id}</strong>
                    <p>{schedule.label}</p>
                    {schedule.isRecurring && (
                      <small>{schedule.occurrences} recurring days</small>
                    )}
                  </div>
                  <strong>{money(order.total)}</strong>
                </div>
                <div className="orderMeta">
                  <span>{order.customerName}</span>
                  <span>{order.customerPhone}</span>
                  <span>{order.status}</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </AdminShell>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="statCard">
      <div className="statIcon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
