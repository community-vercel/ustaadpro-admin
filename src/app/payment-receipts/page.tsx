'use client';

import {useEffect, useMemo, useState} from 'react';
import {useSearchParams} from 'next/navigation';
import Link from 'next/link';
import {RefreshCw} from 'lucide-react';
import {AdminShell} from '@/components/AdminShell';
import {AdminPaymentReceipt, getPaymentReceipts, updatePaymentReceiptStatus} from '@/lib/api';

const ordersPerPage = 20;

function getReceiptSearchText(receipt: AdminPaymentReceipt) {
  return [receipt.orderId, receipt.customerName, receipt.customerPhone, receipt.customerEmail, receipt.paymentMethod, receipt.status, receipt.orderStatus, receipt.bookedFor, receipt.address, ...receipt.items.flatMap(item => [item.title, item.serviceWorkTitle, item.serviceType, item.categoryId])]
    .filter(Boolean).join(' ').toLowerCase();
}

function receiptStageLabel(stage?: AdminPaymentReceipt['paymentStage']) {
  if (stage === 'advance') return 'Advance payment';
  if (stage === 'remaining') return 'Remaining payment';
  return 'Full payment';
}

function getReceiptServices(receipt: AdminPaymentReceipt) {
  return receipt.items.map(item => item.serviceWorkTitle || item.title).filter(Boolean).join(', ') || 'Service not available';
}

export default function PaymentReceiptsPage() {
  const searchParams = useSearchParams();
  const selectedOrderId = searchParams.get('orderId')?.trim() || '';
  const [receipts, setReceipts] = useState<AdminPaymentReceipt[]>([]);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = async () => setReceipts(await getPaymentReceipts());
  const updateReceiptStatus = async (id: number, status: 'submitted' | 'verified' | 'rejected') => {
    await updatePaymentReceiptStatus(id, status);
    await loadData();
  };
  useEffect(() => { loadData().catch(() => setMessage('Could not load payment receipts.')); }, []);

  const paymentOrders = useMemo(() => {
    const byOrder = new Map<string, AdminPaymentReceipt[]>();
    receipts.forEach(receipt => {
      const current = byOrder.get(receipt.orderId) || [];
      current.push(receipt);
      byOrder.set(receipt.orderId, current);
    });
    return Array.from(byOrder.values()).map(orderReceipts => {
      const sorted = [...orderReceipts].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
      const latest = sorted[0];
      const paid = sorted.filter(item => item.status !== 'rejected').reduce((sum, item) => sum + Number(item.amount || 0), 0);
      return {latest, receipts: sorted, paid, balance: Math.max(0, Number(latest.orderTotal || 0) - paid)};
    });
  }, [receipts]);
  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return paymentOrders.filter(order => {
      if (selectedOrderId && order.latest.orderId !== selectedOrderId) return false;
      return !query || order.receipts.some(receipt => getReceiptSearchText(receipt).includes(query));
    });
  }, [paymentOrders, search, selectedOrderId]);
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ordersPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const firstVisible = filteredOrders.length ? (safeCurrentPage - 1) * ordersPerPage + 1 : 0;
  const lastVisible = Math.min(safeCurrentPage * ordersPerPage, filteredOrders.length);
  const visibleOrders = useMemo(() => filteredOrders.slice((safeCurrentPage - 1) * ordersPerPage, safeCurrentPage * ordersPerPage), [filteredOrders, safeCurrentPage]);

  return (
    <AdminShell eyebrow="EasyPaisa proof of payment" title="Payment Receipts" action={<button className="ghostButton" onClick={() => void loadData()}><RefreshCw size={17} />Refresh</button>}>
      {message && <div className="notice">{message}</div>}
      <section className="panel">
        <div className="panelHead"><div><p className="eyebrow">{selectedOrderId ? `Payment details for ${selectedOrderId}` : 'Bookings with payments'}</p><h3>{selectedOrderId ? 'Order payment details' : 'Payment orders'}</h3></div><div className="topbarActions">{selectedOrderId ? <Link className="ghostButton compactButton" href="/payment-receipts">All payments</Link> : null}<span className="countPill">{filteredOrders.length ? `${firstVisible}-${lastVisible} of ${filteredOrders.length} orders` : '0 orders'}</span></div></div>
        <div className="receiptToolbar">
          <label className="field"><span>Search user, phone, email, order, or service</span><input value={search} onChange={event => { setSearch(event.target.value); setCurrentPage(1); }} placeholder="Anis, +9234, email, USTAADPRO, AC Gas..." /></label>
          <div className="receiptPageSizeNote">One card per booking</div>
        </div>
        {!receipts.length ? <div className="empty">No payment receipts uploaded yet.</div> : !filteredOrders.length ? <div className="empty">{selectedOrderId ? 'No payment receipt has been uploaded for this order yet.' : 'No payment orders match your search.'}</div> : (
          <div className="ordersList">
            {visibleOrders.map(({latest, receipts: orderReceipts, paid, balance}) => (
              <div className="orderCard" key={latest.orderId}>
                <div className="orderCardHead">
                  <div><p className="eyebrow">{latest.orderId}</p><h3>{latest.customerName || 'Customer'}</h3><p>{latest.customerPhone} • {latest.customerEmail || 'No email'}</p></div>
                  <div className="receiptCardActions">
                    <select value={latest.status} onChange={event => void updateReceiptStatus(latest.id, event.target.value as 'submitted' | 'verified' | 'rejected')}><option value="submitted">Submitted</option><option value="verified">Verified</option><option value="rejected">Rejected</option></select>
                    <Link className="ghostButton compactButton" href={`/payment-receipts/${latest.id}`}>View details</Link>
                  </div>
                </div>
                <div className="receiptPreviewRow receiptSummaryOnly">
                  <div><strong>{orderReceipts.length} payment receipt{orderReceipts.length === 1 ? '' : 's'}</strong><p className="mutedLine">{orderReceipts.map(item => `${receiptStageLabel(item.paymentStage)}: Rs. ${Number(item.amount || 0).toLocaleString()}`).join(' • ')}</p></div>
                </div>
                <div className="receiptSummaryLine"><span>Service booked</span><strong>{getReceiptServices(latest)}</strong><span>Payment summary</span><strong>Paid: Rs. {paid.toLocaleString()} • Remaining: Rs. {balance.toLocaleString()}</strong></div>
              </div>
            ))}
          </div>
        )}
        {filteredOrders.length > 0 && <div className="paginationBar"><span>Showing {firstVisible}-{lastVisible} of {filteredOrders.length} matching orders</span><div className="paginationActions"><button className="ghostButton" disabled={safeCurrentPage === 1} onClick={() => setCurrentPage(1)}>First</button><button className="ghostButton" disabled={safeCurrentPage === 1} onClick={() => setCurrentPage(page => Math.max(1, page - 1))}>Previous</button><strong>Page {safeCurrentPage} of {totalPages}</strong><button className="ghostButton" disabled={safeCurrentPage === totalPages} onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}>Next</button><button className="ghostButton" disabled={safeCurrentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>Last</button></div></div>}
      </section>
    </AdminShell>
  );
}