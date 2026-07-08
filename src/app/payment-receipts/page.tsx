'use client';

import {useEffect, useState} from 'react';
import {RefreshCw, ReceiptText} from 'lucide-react';
import {AdminShell} from '@/components/AdminShell';
import {AdminPaymentReceipt, getPaymentReceipts, resolveAssetUrl} from '@/lib/api';
import {money} from '@/lib/adminUi';

export default function PaymentReceiptsPage() {
  const [receipts, setReceipts] = useState<AdminPaymentReceipt[]>([]);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    const data = await getPaymentReceipts();
    setReceipts(data);
  };

  useEffect(() => {
    loadData().catch(() => setMessage('Could not load payment receipts.'));
  }, []);

  return (
    <AdminShell
      eyebrow="EasyPaisa proof of payment"
      title="Payment Receipts"
      action={
        <button className="ghostButton" onClick={() => void loadData()}>
          <RefreshCw size={17} />
          Refresh
        </button>
      }
    >
      {message && <div className="notice">{message}</div>}
      <section className="panel">
        <div className="panelHead">
          <div>
            <p className="eyebrow">Submitted receipts</p>
            <h3>Receipts</h3>
          </div>
          <span className="countPill">{receipts.length} receipts</span>
        </div>
        {!receipts.length ? (
          <div className="empty">No payment receipts uploaded yet.</div>
        ) : (
          <div className="ordersList">
            {receipts.map(receipt => (
              <div className="orderCard" key={receipt.id}>
                <div className="orderCardHead">
                  <div>
                    <p className="eyebrow">{receipt.orderId}</p>
                    <h3>{receipt.customerName || 'Customer'}</h3>
                    <p>{receipt.customerPhone} • {receipt.customerEmail || 'No email'}</p>
                  </div>
                  <div className="statusTextCompleted">{receipt.status}</div>
                </div>

                <div className="orderMetaGrid">
                  <span>Amount: <strong>{money(receipt.amount || receipt.orderTotal)}</strong></span>
                  <span>Account: <strong>{receipt.accountTitle}</strong></span>
                  <span>Number: <strong>{receipt.accountNumber}</strong></span>
                  <span>Booked: <strong>{receipt.bookedFor}</strong></span>
                  <span>Status: <strong>{receipt.orderStatus}</strong></span>
                  <span>Payment: <strong>{receipt.paymentMethod}</strong></span>
                </div>

                <div className="receiptLayout">
                  <a href={resolveAssetUrl(receipt.receiptUrl)} target="_blank" rel="noreferrer">
                    <img className="receiptImage" src={resolveAssetUrl(receipt.receiptUrl)} alt="Payment receipt" />
                  </a>
                  <div className="receiptDetails">
                    <strong>Work details</strong>
                    {receipt.items.map(item => (
                      <p key={`${receipt.id}-${item.serviceId}-${item.serviceWorkPriceId || item.title}`}>
                        {item.serviceWorkTitle || item.title} · {item.quantity}x {money(item.price)}
                      </p>
                    ))}
                    <small>{receipt.address}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
