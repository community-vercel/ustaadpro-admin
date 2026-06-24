'use client';

import {useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import {RefreshCw} from 'lucide-react';
import {AdminShell} from '@/components/AdminShell';
import {AdminOrder, getOrders} from '@/lib/api';
import {money, parseBookingSchedule} from '@/lib/adminUi';

type FilterKey = 'all' | 'active' | 'completed' | 'cancelled';

const ACTIVE_STATUSES = ['confirmed', 'assigned', 'in_progress'];

export default function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const loadData = async () => {
    setLoading(true);
    const nextOrders = await getOrders();
    setOrders(nextOrders);
    setLoading(false);
  };

  useEffect(() => {
    loadData().catch(() => {
      setMessage('Could not load orders. Check that the API is running.');
      setLoading(false);
    });
  }, []);

  const counts = useMemo(() => ({
    all: orders.length,
    active: orders.filter(o => ACTIVE_STATUSES.includes(o.status)).length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  }), [orders]);

  const filtered = useMemo(() => {
    if (filter === 'active') return orders.filter(o => ACTIVE_STATUSES.includes(o.status));
    if (filter === 'completed') return orders.filter(o => o.status === 'completed');
    if (filter === 'cancelled') return orders.filter(o => o.status === 'cancelled');
    return orders;
  }, [orders, filter]);

  const serviceSummary = (order: AdminOrder) =>
    order.items
      .map(item => item.serviceType || item.title || 'Standard Visit')
      .join(', ');

  const filterButtons: {key: FilterKey; label: string; accent?: string}[] = [
    {key: 'all',       label: 'Total'},
    {key: 'active',    label: 'Active',    accent: '#0ea5e9'},
    {key: 'completed', label: 'Completed', accent: '#16a34a'},
    {key: 'cancelled', label: 'Cancelled', accent: '#dc2626'},
  ];

  return (
    <AdminShell
      eyebrow="Bookings"
      title="Orders"
      action={
        <button className="ghostButton" onClick={() => loadData()}>
          <RefreshCw size={17} />
          Refresh
        </button>
      }
    >
      {message && <div className="notice">{message}</div>}

      {/* ── Clickable stat pills ── */}
      <div className="orderFilterBar">
        {filterButtons.map(({key, label, accent}) => (
          <button
            key={key}
            className={`orderFilterPill${filter === key ? ' orderFilterPillActive' : ''}`}
            style={filter === key && accent ? {borderColor: accent, color: accent} : undefined}
            onClick={() => setFilter(key)}
          >
            <span className="orderFilterCount">{counts[key]}</span>
            {label}
          </button>
        ))}
      </div>

      <section className="panel">
        <div className="panelHead">
          <div>
            <p className="eyebrow">Live from mobile app</p>
            <h3>Bookings &amp; Customer Details</h3>
          </div>
          <span className="countPill">{filtered.length} orders</span>
        </div>

        {loading ? (
          <div className="empty">Loading orders...</div>
        ) : filtered.length === 0 ? (
          <div className="empty">No {filter === 'all' ? '' : filter} orders found.</div>
        ) : (
          <div className="ordersList">
            {filtered.map(order => {
              const schedule = parseBookingSchedule(order.bookedFor);

              return (
                <article className="orderCard" key={order.id}>
                  <div className="orderSummaryRow">
                    <div>
                      <span>Order ID</span>
                      <strong>{order.id}</strong>
                    </div>
                    <div>
                      <span>Name</span>
                      <strong>{order.customerName}</strong>
                    </div>
                    <div>
                      <span>Schedule</span>
                      <strong>
                        {schedule.isRecurring
                          ? `${schedule.start} to ${schedule.end}`
                          : schedule.start}
                      </strong>
                      {schedule.isRecurring && (
                        <small>{schedule.occurrences} recurring days</small>
                      )}
                    </div>
                    <div>
                      <span>Service Type</span>
                      <strong>{serviceSummary(order)}</strong>
                    </div>
                    <div>
                      <span>Total</span>
                      <strong>{money(order.total)}</strong>
                    </div>
                    <div>
                      <span>Status</span>
                      <strong
                        className={
                          order.status === 'cancelled' ? 'statusTextCancelled' :
                          order.status === 'completed' ? 'statusTextCompleted' :
                          ACTIVE_STATUSES.includes(order.status) ? 'statusTextActive' : ''
                        }
                      >
                        {order.status.replace('_', ' ')}
                      </strong>
                    </div>
                    <Link
                      className="secondaryButton"
                      href={`/orders/${order.id}`}
                    >
                      View details
                    </Link>
                  </div>
                  {order.status === 'cancelled' ? (
                    <div className="cancelReasonBox">
                      <span>Cancellation reason</span>
                      <p>
                        {order.cancelReason ||
                          'No cancellation reason was saved for this order.'}
                      </p>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
