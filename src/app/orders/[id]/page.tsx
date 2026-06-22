'use client';

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {useParams} from 'next/navigation';
import {ArrowLeft, RefreshCw} from 'lucide-react';
import {AdminShell} from '@/components/AdminShell';
import {AdminOrder, getOrder, updateOrderStatus} from '@/lib/api';
import {money, parseBookingSchedule} from '@/lib/adminUi';

export default function OrderDetailPage() {
  const params = useParams<{id: string}>();
  const orderId = params.id;
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    const nextOrder = await getOrder(orderId);
    setOrder(nextOrder);
    setLoading(false);
  };

  useEffect(() => {
    loadData().catch(() => {
      setMessage(
        'Could not load order details. Check that the API is running.',
      );
      setLoading(false);
    });
  }, [orderId]);

  const handleStatus = async (status: AdminOrder['status']) => {
    if (!order) return;
    await updateOrderStatus(order.id, status);
    await loadData();
    setMessage(`Order ${order.id} updated.`);
  };

  const schedule = order ? parseBookingSchedule(order.bookedFor) : null;
  const savedServicesSubtotal = order
    ? Math.max(0, order.total - order.inspectionFee - order.tax)
    : 0;
  const baseServicesSubtotal = order
    ? order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    : 0;

  return (
    <AdminShell
      eyebrow="Order Details"
      title={order?.id || 'Order'}
      action={
        <div className="topbarActions">
          <Link className="ghostButton" href="/orders">
            <ArrowLeft size={17} />
            Orders
          </Link>
          <button className="ghostButton" onClick={() => loadData()}>
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>
      }
    >
      {message && <div className="notice">{message}</div>}

      {loading || !order ? (
        <section className="panel">
          <div className="empty">Loading order details...</div>
        </section>
      ) : (
        <section className="panel orderDetailPage">
          <div className="orderTop">
            <div>
              <p className="eyebrow">Booking summary</p>
              <h3>{order.id}</h3>
              <p>{schedule?.label || order.bookedFor}</p>
              {schedule?.isRecurring && (
                <small>{schedule.occurrences} recurring days</small>
              )}
            </div>
            <select
              value={order.status}
              onChange={event =>
                handleStatus(event.target.value as AdminOrder['status'])
              }
            >
              <option value="confirmed">Confirmed</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="detailGrid">
            <DetailBlock label="Customer" value={order.customerName} />
            <DetailBlock label="Phone" value={order.customerPhone} />
            <DetailBlock label="Email" value={order.customerEmail} />
            <DetailBlock label="Payment" value={order.paymentMethod} />
            <DetailBlock
              label={schedule?.isRecurring ? 'Recurring From' : 'Booking Date'}
              value={schedule?.start || order.bookedFor}
            />
            {schedule?.isRecurring && (
              <DetailBlock label="Recurring To" value={schedule.end} />
            )}
            {schedule?.time && <DetailBlock label="Time" value={schedule.time} />}
            {schedule?.isRecurring && (
              <DetailBlock
                label="Recurring Days"
                value={`${schedule.occurrences} days`}
              />
            )}
          </div>

          <div className="detailBlockWide">
            <span>Service Location / Address</span>
            <strong>{order.address}</strong>
          </div>

          <div className="orderedServices">
            {order.items.map(item => (
              <div className="orderedService" key={item.serviceId}>
                {item.imageUrl && <img src={item.imageUrl} alt="" />}
                <div>
                  <strong>
                    {item.quantity}x {item.title}
                  </strong>
                  <p>{item.description}</p>
                  <small>
                    {item.serviceType || 'Standard Visit'} - {item.duration} -{' '}
                    {item.categoryId}
                  </small>
                </div>
                <b>
                  {money(
                    item.price *
                      item.quantity *
                      (schedule?.isRecurring ? schedule.occurrences : 1),
                  )}
                </b>
              </div>
            ))}
          </div>

          {order.specialInstructions ? (
            <div className="instructions">
              <strong>Special Instructions</strong>
              <p>{order.specialInstructions}</p>
            </div>
          ) : (
            <div className="mutedBox">No special instructions added.</div>
          )}

          <div className="invoiceGrid">
            <DetailBlock
              label="Services subtotal"
              value={money(savedServicesSubtotal)}
            />
            {schedule?.isRecurring && (
              <DetailBlock
                label="Base x recurring days"
                value={`${money(baseServicesSubtotal)} x ${
                  schedule.occurrences
                }`}
              />
            )}
            <DetailBlock
              label="Inspection fee"
              value={money(order.inspectionFee)}
            />
            <DetailBlock label="Platform charges" value={money(order.tax)} />
            <DetailBlock label="Total" value={money(order.total)} />
          </div>
        </section>
      )}
    </AdminShell>
  );
}

function DetailBlock({label, value}: {label: string; value: string}) {
  return (
    <div className="detailBlock">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
