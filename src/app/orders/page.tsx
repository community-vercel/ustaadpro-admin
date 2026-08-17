'use client';

import {useCallback, useEffect, useState} from 'react';
import Link from 'next/link';
import {RefreshCw} from 'lucide-react';
import {AdminShell} from '@/components/AdminShell';
import {AdminOrder, getOrdersPage} from '@/lib/api';
import {money, parseBookingSchedule} from '@/lib/adminUi';

type FilterKey = 'all' | 'active' | 'completed' | 'cancelled';

const ACTIVE_STATUSES = ['checking_receipt', 'confirmed', 'assigned', 'in_progress'];

export default function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<15 | 20>(20);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [counts, setCounts] = useState<Record<FilterKey, number>>({all: 0, active: 0, completed: 0, cancelled: 0});

  const loadData = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const result = await getOrdersPage({page, limit: pageSize, filter});
      setOrders(result.orders);
      setTotal(result.total);
      setPages(result.pages);
      setCounts(result.counts);
      if (page > result.pages) setPage(result.pages);
    } catch {
      setMessage('Could not load orders. Check that the API is running.');
    } finally {
      setLoading(false);
    }
  }, [filter, page, pageSize]);

  useEffect(() => { void loadData(); }, [loadData]);
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
        <button className="ghostButton" onClick={() => void loadData()} disabled={loading}>
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
            onClick={() => { setFilter(key); setPage(1); }}
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
          <span className="countPill">{total} orders</span>
        </div>

        {loading ? (
          <div className="empty">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="empty">No {filter === 'all' ? '' : filter} orders found.</div>
        ) : (
          <div className="ordersList">
            {orders.map(order => {
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
                      <span>{Number(order.walletUsed || 0) > 0 ? 'Original / Payable' : 'Total'}</span>
                      <strong>{money(order.originalTotal ?? order.total)}</strong>
                      {Number(order.walletUsed || 0) > 0 && (
                        <small>Wallet -{money(order.walletUsed || 0)} · Due {money(order.total)}</small>
                      )}
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
                    <div className="orderRowActions">
                      <Link
                        className="ghostButton compactButton"
                        href={`/payment-receipts?orderId=${encodeURIComponent(order.id)}`}
                      >
                        Payment details
                      </Link>
                      <Link
                        className="secondaryButton"
                        href={`/orders/${order.id}`}
                      >
                        View details
                      </Link>
                    </div>
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
        {!loading && total > 0 ? (
          <div className="paginationBar">
            <label>
              Orders per page{' '}
              <select value={pageSize} onChange={event => { setPageSize(Number(event.target.value) as 15 | 20); setPage(1); }}>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
            </label>
            <div className="paginationActions">
              <button className="ghostButton" disabled={page <= 1} onClick={() => setPage(1)}>First</button>
              <button className="ghostButton" disabled={page <= 1} onClick={() => setPage(value => Math.max(1, value - 1))}>Previous</button>
              <strong>Page {page} of {pages}</strong>
              <button className="ghostButton" disabled={page >= pages} onClick={() => setPage(value => Math.min(pages, value + 1))}>Next</button>
              <button className="ghostButton" disabled={page >= pages} onClick={() => setPage(pages)}>Last</button>
            </div>
          </div>
        ) : null}
      </section>
    </AdminShell>
  );
}
