'use client';

import {useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import {useParams} from 'next/navigation';
import {ArrowLeft, ExternalLink, ReceiptText} from 'lucide-react';
import {AdminShell} from '@/components/AdminShell';
import {AdminPaymentReceipt, getPaymentReceipts, resolveAssetUrl} from '@/lib/api';
import {money} from '@/lib/adminUi';

function formatDate(value?: string) {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function receiptStageLabel(stage?: AdminPaymentReceipt['paymentStage']) {
  if (stage === 'advance') return 'Advance payment';
  if (stage === 'remaining') return 'Remaining payment';
  return 'Full payment';
}

export default function PaymentReceiptDetailsPage() {
  const params = useParams<{id: string}>();
  const [receipts, setReceipts] = useState<AdminPaymentReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getPaymentReceipts()
      .then(data => setReceipts(data))
      .catch(() => setMessage('Could not load payment receipt details.'))
      .finally(() => setLoading(false));
  }, []);

  const receipt = useMemo(
    () => receipts.find(item => String(item.id) === String(params.id)),
    [params.id, receipts],
  );
  const relatedReceipts = useMemo(() => {
    if (!receipt) return [];
    return receipts
      .filter(item => item.orderId === receipt.orderId)
      .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
  }, [receipt, receipts]);
  const paidTotal = relatedReceipts
    .filter(item => item.status !== 'rejected')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const remainingBalance = Math.max(0, Number(receipt?.orderTotal || 0) - paidTotal);

  return (
    <AdminShell
      eyebrow="EasyPaisa proof of payment"
      title="Payment Receipt Details"
      action={<Link className="ghostButton" href="/payment-receipts"><ArrowLeft size={17} />Back</Link>}
    >
      {message && <div className="notice">{message}</div>}
      {loading ? <div className="empty">Loading payment receipt...</div> : !receipt ? <div className="empty">Payment receipt not found.</div> : (
        <div className="receiptDetailPage">
          <section className="panel receiptDetailHero">
            <div>
              <p className="eyebrow">{receipt.orderId}</p>
              <h3>{receipt.customerName || 'Customer'}</h3>
              <p>{receipt.customerPhone} • {receipt.customerEmail || 'No email'}</p>
            </div>
            <div className="receiptHeroAmount">
              <span>{receipt.orderStatus}</span>
              <strong>{money(receipt.orderTotal)}</strong>
            </div>
          </section>

          <section className="panel detailBlock">
            <div className="panelHead">
              <div>
                <p className="eyebrow">Payment history</p>
                <h3>All receipts for this booking</h3>
              </div>
              <strong>{money(paidTotal)} paid</strong>
            </div>
            <p className="mutedLine">Remaining balance: {money(remainingBalance)}. Every receipt is stored separately and is never replaced.</p>
            <div className="receiptItemsList">
              {relatedReceipts.map(paymentReceipt => {
                const image = resolveAssetUrl(paymentReceipt.receiptUrl);
                return (
                  <article className="paymentReceiptProofCard" key={paymentReceipt.id}>
  <div className="paymentReceiptProofMeta">
    <div><p className="eyebrow">Payment receipt</p><h4>{receiptStageLabel(paymentReceipt.paymentStage)}</h4></div>
    <strong>{money(paymentReceipt.amount)}</strong>
  </div>
  {image ? <a className="paymentReceiptProofImageLink" href={image} target="_blank" rel="noreferrer"><img className="paymentReceiptProofImage" src={image} alt={`${receiptStageLabel(paymentReceipt.paymentStage)} receipt`} /></a> : <div className="empty">No receipt image available.</div>}
  <div className="paymentReceiptProofFooter"><span>Status: <strong>{paymentReceipt.status}</strong></span><span>Submitted {formatDate(paymentReceipt.createdAt)}</span>{image ? <a className="ghostButton compactButton" href={image} target="_blank" rel="noreferrer"><ExternalLink size={15} />Open image</a> : null}</div>
</article>
                );
              })}
            </div>
          </section>

          <section className="receiptDetailGrid">
            <div className="receiptDetailStack">
              <div className="panel detailBlock">
                <h3>Latest payment</h3>
                <dl className="detailList">
                  <div><dt>Method</dt><dd>{receipt.paymentMethod}</dd></div>
                  <div><dt>Latest amount</dt><dd>{money(receipt.amount)}</dd></div>
                  <div><dt>Account title</dt><dd>{receipt.accountTitle}</dd></div>
                  <div><dt>Account number</dt><dd>{receipt.accountNumber}</dd></div>
                  <div><dt>Submitted</dt><dd>{formatDate(receipt.createdAt)}</dd></div>
                </dl>
              </div>
              <div className="panel detailBlock">
                <h3>Customer</h3>
                <dl className="detailList">
                  <div><dt>Name</dt><dd>{receipt.customerName || 'Customer'}</dd></div>
                  <div><dt>Phone</dt><dd>{receipt.customerPhone}</dd></div>
                  <div><dt>Email</dt><dd>{receipt.customerEmail || 'No email'}</dd></div>
                  <div><dt>User ID</dt><dd>{receipt.userId}</dd></div>
                </dl>
              </div>
              <div className="panel detailBlock">
                <h3>Booking</h3>
                <dl className="detailList">
                  <div><dt>Order ID</dt><dd>{receipt.orderId}</dd></div>
                  <div><dt>Order status</dt><dd>{receipt.orderStatus}</dd></div>
                  <div><dt>Booked for</dt><dd>{receipt.bookedFor || 'Not set'}</dd></div>
                  <div><dt>Total</dt><dd>{money(receipt.orderTotal)}</dd></div>
                  <div className="wideDetail"><dt>Address</dt><dd>{receipt.address || 'No address'}</dd></div>
                </dl>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panelHead"><div><p className="eyebrow">Service work</p><h3>Booked items</h3></div><ReceiptText size={21} /></div>
            <div className="receiptItemsList">
              {receipt.items.map(item => (
                <div className="receiptItemRow" key={`${receipt.id}-${item.serviceId}-${item.serviceWorkPriceId || item.title}`}>
                  {item.imageUrl ? <img src={resolveAssetUrl(item.imageUrl)} alt="" /> : <div className="receiptItemIcon"><ReceiptText size={20} /></div>}
                  <div><strong>{item.serviceWorkTitle || item.title}</strong><p>{item.serviceType || item.categoryId}</p>{item.detailDescription ? <small>{item.detailDescription}</small> : null}</div>
                  <span>{item.quantity}x {money(item.price)}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </AdminShell>
  );
}