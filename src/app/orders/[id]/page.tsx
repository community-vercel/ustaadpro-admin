'use client';

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {useParams} from 'next/navigation';
import {ArrowLeft, RefreshCw} from 'lucide-react';
import {AdminShell} from '@/components/AdminShell';
import {AdminOrder, AdminProvider, assignOrderProvider, getOrder, getProviders, updateOrderStatus, resolveAssetUrl} from '@/lib/api';
import {money, parseBookingSchedule} from '@/lib/adminUi';

export default function OrderDetailPage() {
  const params = useParams<{id: string}>();
  const orderId = params.id;
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [providers, setProviders] = useState<AdminProvider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [nextOrder, nextProviders] = await Promise.all([getOrder(orderId), getProviders()]);
    setOrder(nextOrder);
    setProviders(nextProviders.filter(provider => provider.isActive));
    setSelectedProviderId(nextOrder.providerId ? String(nextOrder.providerId) : '');
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

    if (status === 'assigned' && !order.providerId) {
      setMessage('Select and assign a provider first.');
      return;
    }

    let cancelReason: string | null = null;
    if (status === 'cancelled') {
      const reason = prompt('Please enter a cancellation reason:');
      if (reason === null) {
        // User cancelled the prompt dialog, do not change status
        return;
      }
      cancelReason = reason.trim() || 'Cancelled by administrator';
    }

    await updateOrderStatus(order.id, status, cancelReason);
    await loadData();
    setMessage(`Order ${order.id} updated.`);
  };

  const handleAssignment = async () => {
    if (!selectedProviderId) { setMessage('Select a provider first.'); return; }
    setAssigning(true);
    try {
      await assignOrderProvider(orderId, selectedProviderId);
      await loadData();
      setMessage('Provider assigned and order moved to Assigned.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not assign provider.');
    } finally { setAssigning(false); }
  };

  const schedule = order ? parseBookingSchedule(order.bookedFor) : null;
  const savedServicesSubtotal = order
    ? Math.max(0, (order.originalTotal ?? order.total) - order.inspectionFee - order.tax)
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
              className={order.status === 'cancelled' ? 'statusSelectCancelled' : ''}
              value={order.status}
              onChange={event =>
                handleStatus(event.target.value as AdminOrder['status'])
              }
            >
              <option value="checking_receipt">Checking receipt</option>
              <option value="confirmed">Confirmed</option>
              <option value="assigned" disabled={!order.providerId}>Assigned</option>
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
            {Number(order.walletUsed || 0) > 0 && (
              <DetailBlock label="Wallet applied" value={`-${money(order.walletUsed || 0)}`} />
            )}
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
            <span>Assigned Provider</span>
            <div className="providerAssignmentRow">
              <select value={selectedProviderId} onChange={event => setSelectedProviderId(event.target.value)}>
                <option value="">Select provider...</option>
                {providers.map(provider => (
                  <option key={provider.id} value={provider.id} disabled={!provider.isAvailable}>
                    {provider.name} — {provider.trade}{provider.isAvailable ? '' : ' (Unavailable)'}
                  </option>
                ))}
              </select>
              <button className="primaryButton" disabled={assigning || !selectedProviderId} onClick={() => void handleAssignment()}>
                {assigning ? 'Assigning...' : order.providerId ? 'Reassign Provider' : 'Assign Provider'}
              </button>
            </div>
            {order.providerName && <small>Currently assigned to {order.providerName}</small>}
          </div>

          <div className="detailBlockWide">
            <span>Service Location / Address</span>
            <strong>{order.address}</strong>
          </div>

          <div className="orderedServices">
            {order.items.map(item => (
              <div className="orderedService" key={item.serviceId}>
                {item.imageUrl && <img src={resolveAssetUrl(item.imageUrl)} alt="" />}
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

          {order.status === 'cancelled' ? (
            <div className="cancelReasonBox">
              <strong>Cancellation Reason</strong>
              <p>{order.cancelReason || 'No cancellation reason was saved for this order.'}</p>
            </div>
          ) : null}

          <div className="invoiceGrid">
            <DetailBlock
              label="Services subtotal"
              value={money(savedServicesSubtotal)}
            />
            {Number(order.rewardDiscount || 0) > 0 && (
              <DetailBlock
                label={`Reward discount (${order.rewardPointsRedeemed || 0} pts)`}
                value={`-${money(order.rewardDiscount || 0)}`}
              />
            )}
            {Number(order.rewardPointsEarned || 0) > 0 && (
              <DetailBlock
                label="Reward points earned"
                value={`${order.rewardPointsEarned || 0} points`}
              />
            )}
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
            <DetailBlock label="Original total" value={money(order.originalTotal ?? order.total)} />
            {Number(order.walletUsed || 0) > 0 && (
              <DetailBlock label="Wallet adjustment" value={`-${money(order.walletUsed || 0)}`} />
            )}
            <DetailBlock label="Amount payable" value={money(order.total)} />
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
