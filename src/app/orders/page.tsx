'use client';

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {RefreshCw} from 'lucide-react';
import {AdminShell} from '@/components/AdminShell';
import {AdminOrder, getOrders} from '@/lib/api';
import {money, parseBookingSchedule} from '@/lib/adminUi';

export default function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

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

  const serviceSummary = (order: AdminOrder) =>
    order.items
      .map(item => item.serviceType || item.title || 'Standard Visit')
      .join(', ');

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

      <section className="panel">
        <div className="panelHead">
          <div>
            <p className="eyebrow">Live from mobile app</p>
            <h3>Bookings & Customer Details</h3>
          </div>
          <span className="countPill">{orders.length} orders</span>
        </div>

        {loading ? (
          <div className="empty">Loading orders...</div>
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
                      <span>Total</span>
                      <strong>{money(order.total)}</strong>
                    </div>
                    <Link
                      className="secondaryButton"
                      href={`/orders/${order.id}`}
                    >
                      View details
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
