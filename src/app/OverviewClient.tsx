'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Activity,
  BadgeCheck,
  CalendarClock,
  ClipboardList,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
  XCircle,
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

const COLORS = ['#006c49', '#0ea5e9', '#f59e0b', '#ef4444', '#7c3aed'];
const ACTIVE_SERVICE_STATUSES = ['confirmed', 'assigned', 'in_progress'];
const ACTIVE_SHOP_STATUSES = ['placed', 'processing', 'shipped'];

type ActivityItem = {
  id: string;
  type: 'Service' | 'Shop';
  customerName: string;
  customerPhone: string;
  status: string;
  total: number;
  createdAt: string;
  detail: string;
};

function isToday(dateValue: string) {
  const date = new Date(dateValue);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function statusLabel(status: string) {
  return status.replace(/_/g, ' ');
}

export function OverviewClient() {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [shopOrders, setShopOrders] = useState<AdminShopOrder[]>([]);
  const [message, setMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const metrics = useMemo(() => {
    const serviceRevenue = orders
      .filter(order => order.status !== 'cancelled')
      .reduce((sum, order) => sum + Number(order.total || 0), 0);
    const shopRevenue = shopOrders
      .filter(order => order.status !== 'cancelled')
      .reduce((sum, order) => sum + Number(order.total || 0), 0);
    const totalRevenue = serviceRevenue + shopRevenue;
    const allOrderCount = orders.length + shopOrders.length;
    const activeServiceOrders = orders.filter(order =>
      ACTIVE_SERVICE_STATUSES.includes(order.status),
    ).length;
    const activeShopOrders = shopOrders.filter(order =>
      ACTIVE_SHOP_STATUSES.includes(order.status),
    ).length;
    const completedServices = orders.filter(order => order.status === 'completed').length;
    const deliveredShopOrders = shopOrders.filter(order => order.status === 'delivered').length;
    const cancelledOrders =
      orders.filter(order => order.status === 'cancelled').length +
      shopOrders.filter(order => order.status === 'cancelled').length;
    const todayServiceOrders = orders.filter(order => isToday(order.createdAt));
    const todayShopOrders = shopOrders.filter(order => isToday(order.createdAt));
    const todayRevenue = [...todayServiceOrders, ...todayShopOrders]
      .filter(order => order.status !== 'cancelled')
      .reduce((sum, order) => sum + Number(order.total || 0), 0);
    const averageOrderValue = allOrderCount > 0 ? totalRevenue / allOrderCount : 0;
    const uniqueCustomers = new Set(
      [...orders, ...shopOrders]
        .map(order => order.customerPhone || order.customerEmail)
        .filter(Boolean),
    ).size;

    return {
      serviceRevenue,
      shopRevenue,
      totalRevenue,
      allOrderCount,
      activeOrders: activeServiceOrders + activeShopOrders,
      completedOrders: completedServices + deliveredShopOrders,
      cancelledOrders,
      todayOrders: todayServiceOrders.length + todayShopOrders.length,
      todayRevenue,
      averageOrderValue,
      uniqueCustomers,
      activeServiceOrders,
      activeShopOrders,
      completedServices,
      deliveredShopOrders,
    };
  }, [orders, shopOrders]);

  const serviceOrderStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(order => {
      counts[statusLabel(order.status)] = (counts[statusLabel(order.status)] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const shopOrderStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    shopOrders.forEach(order => {
      counts[statusLabel(order.status)] = (counts[statusLabel(order.status)] || 0) + 1;
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

    orders.forEach(order => {
      if (order.status === 'cancelled') return;
      const d = new Date(order.createdAt);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      const day = last7Days.find(item => item.date === label);
      if (day) day.service += order.total;
    });

    shopOrders.forEach(order => {
      if (order.status === 'cancelled') return;
      const d = new Date(order.createdAt);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      const day = last7Days.find(item => item.date === label);
      if (day) day.shop += order.total;
    });

    return last7Days;
  }, [orders, shopOrders]);

  const latestActivity = useMemo<ActivityItem[]>(() => {
    const serviceItems: ActivityItem[] = orders.map(order => {
      const schedule = parseBookingSchedule(order.bookedFor);
      return {
        id: order.id,
        type: 'Service',
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
        detail: schedule.label,
      };
    });
    const shopItems: ActivityItem[] = shopOrders.map(order => ({
      id: order.id,
      type: 'Shop',
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt,
      detail: `${order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)`,
    }));

    return [...serviceItems, ...shopItems]
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 8);
  }, [orders, shopOrders]);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [nextSummary, nextOrders, nextShopOrders] = await Promise.all([
        getSummary(),
        getOrders(),
        getShopOrders(),
      ]);
      setSummary(nextSummary);
      setOrders(nextOrders);
      setShopOrders(nextShopOrders);
      setMessage('');
    } finally {
      setIsRefreshing(false);
    }
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
        <button className="ghostButton" disabled={isRefreshing} onClick={() => loadData()}>
          <RefreshCw size={17} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      }
    >
      {message && <div className="notice">{message}</div>}

      <section className="overviewHero">
        <div>
          <p className="eyebrow">Live Operations</p>
          <h3>{money(metrics.totalRevenue || summary?.revenue || 0)}</h3>
          <p>Combined service and shop revenue from all non-cancelled orders.</p>
        </div>
        <div className="overviewHeroStats">
          <MiniMetric label="Today" value={money(metrics.todayRevenue)} />
          <MiniMetric label="Orders" value={metrics.allOrderCount} />
          <MiniMetric label="Avg order" value={money(metrics.averageOrderValue)} />
        </div>
      </section>

      <section className="statsGrid overviewStatsGrid">
        <StatCard icon={<ClipboardList />} label="Total Orders" value={metrics.allOrderCount || summary?.totalOrders || 0} hint="Service + shop" />
        <StatCard icon={<Activity />} label="Active Orders" value={metrics.activeOrders || summary?.activeOrders || 0} hint="Needs attention" />
        <StatCard icon={<CalendarClock />} label="Today Orders" value={metrics.todayOrders} hint={money(metrics.todayRevenue)} />
        <StatCard icon={<BadgeCheck />} label="Completed" value={metrics.completedOrders} hint="Services + deliveries" />
        <StatCard icon={<Users />} label="Customers" value={summary?.totalCustomers || metrics.uniqueCustomers || 0} hint="Known customers" />
        <StatCard icon={<Wrench />} label="Services" value={summary?.totalServices || 0} hint="Active catalog" />
        <StatCard icon={<Wallet />} label="Avg Order" value={money(metrics.averageOrderValue)} hint="Across all orders" />
        <StatCard icon={<XCircle />} label="Cancelled" value={metrics.cancelledOrders} hint="Service + shop" />
      </section>

      <section className="operationsGrid">
        <div className="panel operationsPanel">
          <div className="panelHead">
            <div>
              <p className="eyebrow">Pipeline</p>
              <h3>Operational Health</h3>
            </div>
          </div>
          <div className="opsRows">
            <OpsRow label="Active service orders" value={metrics.activeServiceOrders} total={Math.max(orders.length, 1)} />
            <OpsRow label="Active shop orders" value={metrics.activeShopOrders} total={Math.max(shopOrders.length, 1)} />
            <OpsRow label="Completed services" value={metrics.completedServices} total={Math.max(orders.length, 1)} />
            <OpsRow label="Delivered shop orders" value={metrics.deliveredShopOrders} total={Math.max(shopOrders.length, 1)} />
          </div>
        </div>

        <div className="panel revenueSplitPanel">
          <div className="panelHead">
            <div>
              <p className="eyebrow">Revenue Mix</p>
              <h3>Service vs Shop</h3>
            </div>
          </div>
          <div className="revenueSplitCards">
            <RevenueSplitCard icon={<Wrench />} label="Service Revenue" value={metrics.serviceRevenue} total={metrics.totalRevenue} />
            <RevenueSplitCard icon={<ShoppingBag />} label="Shop Revenue" value={metrics.shopRevenue} total={metrics.totalRevenue} />
          </div>
        </div>
      </section>

      <section className="dashboardCharts">
        <div className="panel chartPanel">
          <div className="panelHead">
            <h3>Service Orders</h3>
            <span className="panelCount">{orders.length}</span>
          </div>
          <StatusLegend data={serviceOrderStatusData} />
          <div className="chartContainer">
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={serviceOrderStatusData} cx="50%" cy="50%" innerRadius={58} outerRadius={82} paddingAngle={4} dataKey="value">
                  {serviceOrderStatusData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel chartPanel">
          <div className="panelHead">
            <h3>Shop Orders</h3>
            <span className="panelCount">{shopOrders.length}</span>
          </div>
          <StatusLegend data={shopOrderStatusData} />
          <div className="chartContainer">
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={shopOrderStatusData} cx="50%" cy="50%" innerRadius={58} outerRadius={82} paddingAngle={4} dataKey="value">
                  {shopOrderStatusData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel chartPanel wideChart">
          <div className="panelHead">
            <div>
              <p className="eyebrow">Last 7 Days</p>
              <h3>Revenue Timeline</h3>
            </div>
            <TrendingUp color="#006c49" size={22} />
          </div>
          <div className="chartContainer">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueTimelineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(val) => `Rs${val}`} />
                <Tooltip formatter={(value) => money(typeof value === 'number' ? value : Number(value || 0))} />
                <Legend />
                <Bar dataKey="service" name="Service Revenue" stackId="a" fill="#0ea5e9" radius={[0, 0, 6, 6]} />
                <Bar dataKey="shop" name="Shop Revenue" stackId="a" fill="#006c49" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panelHead">
          <div>
            <p className="eyebrow">Latest activity</p>
            <h3>Recent Orders</h3>
          </div>
          <span className="panelCount">{latestActivity.length}</span>
        </div>
        <div className="overviewActivityList">
          {latestActivity.map(item => (
            <article className="overviewActivityCard" key={`${item.type}-${item.id}`}>
              <div className="activityTypeIcon">{item.type === 'Shop' ? <PackageCheck size={18} /> : <Wrench size={18} />}</div>
              <div className="activityMain">
                <div className="activityTopLine">
                  <strong>{item.id}</strong>
                  <span className={`statusPill status-${item.status}`}>{statusLabel(item.status)}</span>
                </div>
                <p>{item.detail}</p>
                <div className="activityMeta">
                  <span>{item.type}</span>
                  <span>{item.customerName}</span>
                  <span>{item.customerPhone}</span>
                </div>
              </div>
              <strong className="activityAmount">{money(item.total)}</strong>
            </article>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="statCard enhancedStatCard">
      <div className="statIcon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      {hint ? <small>{hint}</small> : null}
    </div>
  );
}

function MiniMetric({label, value}: {label: string; value: string | number}) {
  return (
    <div className="miniMetric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function OpsRow({label, value, total}: {label: string; value: number; total: number}) {
  const percent = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="opsRow">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="opsTrack"><span style={{width: `${percent}%`}} /></div>
    </div>
  );
}

function RevenueSplitCard({
  icon,
  label,
  value,
  total,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  total: number;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="revenueSplitCard">
      <div className="revenueSplitIcon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{money(value)}</strong>
        <small>{percent}% of revenue</small>
      </div>
    </div>
  );
}

function StatusLegend({data}: {data: Array<{name: string; value: number}>}) {
  return (
    <div className="statusLegendGrid">
      {data.map((item, index) => (
        <div className="statusLegendItem" key={item.name}>
          <span style={{backgroundColor: COLORS[index % COLORS.length]}} />
          <strong>{item.value}</strong>
          <small>{item.name}</small>
        </div>
      ))}
    </div>
  );
}
