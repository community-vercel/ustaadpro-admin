'use client';

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useSearchParams} from 'next/navigation';
import Link from 'next/link';
import {RefreshCw} from 'lucide-react';
import {AdminShell} from '@/components/AdminShell';
import {AdminPaymentReceipt, getPaymentReceipts, updatePaymentReceiptStatus} from '@/lib/api';

const PAGE_SIZE = 15;
const stageLabel = (stage?: AdminPaymentReceipt['paymentStage']) =>
  stage === 'advance' ? 'Advance payment' : stage === 'remaining' ? 'Remaining payment' : 'Full payment';

export default function PaymentReceiptsPage() {
  const selectedOrderId = useSearchParams().get('orderId')?.trim() || '';
  const [receipts, setReceipts] = useState<AdminPaymentReceipt[]>([]);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [message, setMessage] = useState('');
  const sentinel = useRef<HTMLDivElement | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadFirst = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setMessage('');
    try {
      const data = await getPaymentReceipts({limit: PAGE_SIZE, offset: 0, search: query, orderId: selectedOrderId});
      if (id !== requestId.current) return;
      setReceipts(data.receipts);
      setTotal(data.total);
      setHasMore(data.hasMore);
    } catch {
      if (id === requestId.current) setMessage('Could not load payment receipts.');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [query, selectedOrderId]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const offset = new Set(receipts.map(item => item.orderId)).size;
      const data = await getPaymentReceipts({limit: PAGE_SIZE, offset, search: query, orderId: selectedOrderId});
      setReceipts(current => {
        const ids = new Set(current.map(item => item.id));
        return [...current, ...data.receipts.filter(item => !ids.has(item.id))];
      });
      setTotal(data.total);
      setHasMore(data.hasMore);
    } catch {
      setMessage('Could not load more payment receipts.');
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loading, loadingMore, query, receipts, selectedOrderId]);

  useEffect(() => { void loadFirst(); }, [loadFirst]);
  useEffect(() => {
    const target = sentinel.current;
    if (!target || !hasMore) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) void loadMore();
    }, {rootMargin: '300px 0px'});
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const orders = useMemo(() => {
    const grouped = new Map<string, AdminPaymentReceipt[]>();
    receipts.forEach(receipt => grouped.set(receipt.orderId, [...(grouped.get(receipt.orderId) || []), receipt]));
    return Array.from(grouped.values()).map(items => {
      const sorted = [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const latest = sorted[0];
      const paid = sorted.filter(item => item.status !== 'rejected').reduce((sum, item) => sum + Number(item.amount || 0), 0);
      return {latest, receipts: sorted, paid, balance: Math.max(0, Number(latest.orderTotal || 0) - paid)};
    });
  }, [receipts]);

  const changeStatus = async (id: number, status: 'submitted' | 'verified' | 'rejected') => {
    await updatePaymentReceiptStatus(id, status);
    await loadFirst();
  };

  return (
    <AdminShell eyebrow="EasyPaisa proof of payment" title="Payment Receipts" action={<button className="ghostButton" disabled={loading} onClick={() => void loadFirst()}><RefreshCw size={17} />Refresh</button>}>
      {message && <div className="notice">{message}</div>}
      <section className="panel">
        <div className="panelHead">
          <div><p className="eyebrow">{selectedOrderId ? `Payment details for ${selectedOrderId}` : 'Bookings with payments'}</p><h3>{selectedOrderId ? 'Order payment details' : 'Payment orders'}</h3></div>
          <div className="topbarActions">{selectedOrderId && <Link className="ghostButton compactButton" href="/payment-receipts">All payments</Link>}<span className="countPill">{orders.length} of {total} orders</span></div>
        </div>
        <div className="receiptToolbar">
          <label className="field"><span>Search user, phone, email, order, or service</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Anis, +9234, email, USTAADPRO, AC Gas..." /></label>
          <div className="receiptPageSizeNote">Loads 15 bookings at a time</div>
        </div>
        {loading ? <div className="empty">Loading payment receipts...</div> : !orders.length ? <div className="empty">{selectedOrderId ? 'No payment receipt has been uploaded for this order yet.' : 'No payment orders match your search.'}</div> : (
          <div className="ordersList">
            {orders.map(({latest, receipts: orderReceipts, paid, balance}) => {
              const services = latest.items.map(item => item.serviceWorkTitle || item.title).filter(Boolean).join(', ') || 'Service not available';
              return <div className="orderCard" key={latest.orderId}>
                <div className="orderCardHead">
                  <div><p className="eyebrow">{latest.orderId}</p><h3>{latest.customerName || 'Customer'}</h3><p>{latest.customerPhone} / {latest.customerEmail || 'No email'}</p></div>
                  <div className="receiptCardActions">
                    <select value={latest.status} onChange={event => void changeStatus(latest.id, event.target.value as 'submitted' | 'verified' | 'rejected')}><option value="submitted">Submitted</option><option value="verified">Verified</option><option value="rejected">Rejected</option></select>
                    <Link className="ghostButton compactButton" href={`/payment-receipts/${latest.id}`}>View details</Link>
                  </div>
                </div>
                <div className="receiptPreviewRow receiptSummaryOnly"><div><strong>{orderReceipts.length} payment receipt{orderReceipts.length === 1 ? '' : 's'}</strong><p className="mutedLine">{orderReceipts.map(item => `${stageLabel(item.paymentStage)}: Rs. ${Number(item.amount || 0).toLocaleString()}`).join(' / ')}</p></div></div>
                <div className="receiptSummaryLine"><span>Service booked</span><strong>{services}</strong><span>Payment summary</span><strong>Paid: Rs. {paid.toLocaleString()} / Remaining: Rs. {balance.toLocaleString()}</strong></div>
              </div>;
            })}
            <div ref={sentinel} className="receiptPageSizeNote">{loadingMore ? 'Loading 15 more bookings...' : hasMore ? 'Scroll to load more' : `All ${total} bookings loaded`}</div>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
