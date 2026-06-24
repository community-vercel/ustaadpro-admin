'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Activity,
  ClipboardList,
  RefreshCw,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';
import { AdminShell } from '@/components/AdminShell';
import {
  AdminOrder,
  AdminShopOrder,
  AdminSummary,
  getOrders,
  getShopOrders,
  getSummary,
} from '@/lib/api';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { money, parseBookingSchedule } from '@/lib/adminUi';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function OverviewClient() {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [shopOrders, setShopOrders] = useState<AdminShopOrder[]>([]);
  const [message, setMessage] = useState('');

  const activeOrders = useMemo(
    () => orders.filter(order => order.status !== 'completed'),
    [orders],
  );

  const serviceOrderStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const shopOrderStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    shopOrders.forEach(o => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [shopOrders]);

  const revenueTimelineData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      return { date: label, service: 0, shop: 0 };
    });

    orders.forEach(o => {
      if (o.status === 'cancelled') return;
      const d = new Date(o.createdAt);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      const day = last7Days.find(x => x.date === label);
      if (day) day.service += o.total;
    });

    shopOrders.forEach(o => {
      if (o.status === 'cancelled') return;
      const d = new Date(o.createdAt);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      const day = last7Days.find(x => x.date === label);
      if (day) day.shop += o.total;
    });

    return last7Days;
  }, [orders, shopOrders]);

  const loadData = async () => {
    const [nextSummary, nextOrders, nextShopOrders] = await Promise.all([
      getSummary(),
      getOrders(),
      getShopOrders(),
    ]);
    setSummary(nextSummary);
    setOrders(nextOrders);
    setShopOrders(nextShopOrders);
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
          icon={<Wallet />}
          label="Revenue"
          value={money(summary?.revenue || 0)}
        />
      </section>

      <section className="dashboardCharts">
        <div className="panel chartPanel">
          <div className="panelHead">
            <h3>Service Orders</h3>
          </div>
          <div className="chartContainer">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={serviceOrderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {serviceOrderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel chartPanel">
          <div className="panelHead">
            <h3>Shop Orders</h3>
          </div>
          <div className="chartContainer">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={shopOrderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {shopOrderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel chartPanel wideChart">
          <div className="panelHead">
            <h3>Revenue Timeline (Last 7 Days)</h3>
          </div>
          <div className="chartContainer">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueTimelineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(val) => `Rs${val}`} />
                <Tooltip
                  formatter={(value) => {
                    const amount = typeof value === 'number' ? value : Number(value || 0);
                    return money(amount);
                  }}
                />                <Legend />
                <Bar dataKey="service" name="Service Revenue" stackId="a" fill="#0ea5e9" radius={[0, 0, 4, 4]} />
                <Bar dataKey="shop" name="Shop Revenue" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
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

