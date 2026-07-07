'use client';

import {useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import {RefreshCw} from 'lucide-react';
import {AdminShell} from '@/components/AdminShell';
import {AdminPaymentReceipt, getPaymentReceipts} from '@/lib/api';

const receiptsPerPage = 20;

function getReceiptSearchText(receipt: AdminPaymentReceipt) {
  return [
    receipt.orderId,
    receipt.customerName,
    receipt.customerPhone,
    receipt.customerEmail,
    receipt.paymentMethod,
    receipt.status,
    receipt.orderStatus,
    receipt.bookedFor,
    receipt.address,
    ...receipt.items.flatMap(item => [
      item.title,
      item.serviceWorkTitle,
      item.serviceType,
      item.categoryId,
    ]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function getReceiptServices(receipt: AdminPaymentReceipt) {
  return (
    receipt.items
      .map(item => item.serviceWorkTitle || item.title)
      .filter(Boolean)
      .join(', ') || 'Service not available'
  );
}

export default function PaymentReceiptsPage() {
  const [receipts, setReceipts] = useState<AdminPaymentReceipt[]>([]);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = async () => {
    const data = await getPaymentReceipts();
    setReceipts(data);
  };

  useEffect(() => {
    loadData().catch(() => setMessage('Could not load payment receipts.'));
  }, []);

  const filteredReceipts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return receipts;
    return receipts.filter(receipt => getReceiptSearchText(receipt).includes(query));
  }, [receipts, search]);

  const totalPages = Math.max(1, Math.ceil(filteredReceipts.length / receiptsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const firstVisible = filteredReceipts.length
    ? (safeCurrentPage - 1) * receiptsPerPage + 1
    : 0;
  const lastVisible = Math.min(safeCurrentPage * receiptsPerPage, filteredReceipts.length);
  const visibleReceipts = useMemo(() => {
    const start = (safeCurrentPage - 1) * receiptsPerPage;
    return filteredReceipts.slice(start, start + receiptsPerPage);
  }, [filteredReceipts, safeCurrentPage]);

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
          <span className="countPill">
            {filteredReceipts.length
              ? `${firstVisible}-${lastVisible} of ${filteredReceipts.length} receipts`
              : `${filteredReceipts.length} receipts`}
          </span>
        </div>

        <div className="receiptToolbar">
          <label className="field">
            <span>Search user, phone, email, order, or service</span>
            <input
              value={search}
              onChange={event => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Anis, +9234, email, USTAADPRO, AC Gas..."
            />
          </label>
          <div className="receiptPageSizeNote">20 receipts per page</div>
        </div>

        {!receipts.length ? (
          <div className="empty">No payment receipts uploaded yet.</div>
        ) : !filteredReceipts.length ? (
          <div className="empty">No receipts match your search.</div>
        ) : (
          <div className="ordersList">
            {visibleReceipts.map(receipt => (
              <div className="orderCard" key={receipt.id}>
                <div className="orderCardHead">
                  <div>
                    <p className="eyebrow">{receipt.orderId}</p>
                    <h3>{receipt.customerName || 'Customer'}</h3>
                    <p>{receipt.customerPhone} • {receipt.customerEmail || 'No email'}</p>
                  </div>
                  <div className="receiptCardActions">
                    <div className="statusTextCompleted">{receipt.status}</div>
                    <Link className="ghostButton compactButton" href={`/payment-receipts/${receipt.id}`}>
                      View details
                    </Link>
                  </div>
                </div>

                <div className="receiptSummaryLine">
                  <span>Service booked</span>
                  <strong>{getReceiptServices(receipt)}</strong>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredReceipts.length > 0 && (
          <div className="paginationBar">
            <span>
              Showing {firstVisible}-{lastVisible} of {filteredReceipts.length}{' '}
              matching receipts
            </span>
            <div className="paginationActions">
              <button
                className="ghostButton"
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage(1)}
              >
                First
              </button>
              <button
                className="ghostButton"
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
              >
                Previous
              </button>
              <strong>
                Page {safeCurrentPage} of {totalPages}
              </strong>
              <button
                className="ghostButton"
                disabled={safeCurrentPage === totalPages}
                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
              >
                Next
              </button>
              <button
                className="ghostButton"
                disabled={safeCurrentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
              >
                Last
              </button>
            </div>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
