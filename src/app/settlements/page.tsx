'use client';

import {useCallback, useEffect, useState} from 'react';
import Link from 'next/link';
import {Banknote, RefreshCw, Search} from 'lucide-react';
import {AdminShell} from '@/components/AdminShell';
import {
  AdminWithdrawal,
  getWithdrawals,
  updateWithdrawalStatus,
} from '@/lib/api';

const PAGE_SIZE = 50;

const methodLabels: Record<AdminWithdrawal['method'], string> = {
  easypaisa: 'Easypaisa',
  jazzcash: 'JazzCash',
  bank: 'Bank Transfer',
};

const statusStyles: Record<AdminWithdrawal['status'], string> = {
  pending: 'statusPill status-confirmed',
  approved: 'statusPill status-completed',
  rejected: 'statusPill status-cancelled',
};

export default function SettlementsPage() {
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [summary, setSummary] = useState({pendingCount: 0, pendingAmount: 0, approvedAmount: 0});
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(
    async (offset = 0, status = statusFilter) => {
      if (offset === 0) setLoading(true);
      else setLoadingMore(true);
      setError('');
      try {
        const data = await getWithdrawals({
          status: status || undefined,
          limit: PAGE_SIZE,
          offset,
        });
        setWithdrawals(current =>
          offset === 0 ? data.withdrawals : [...current, ...data.withdrawals],
        );
        setSummary(data.summary);
        setTotal(data.total);
        setHasMore(data.hasMore);
      } catch {
        setError('Could not load withdrawal requests.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [statusFilter],
  );

  useEffect(() => {
    void load(0, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const decide = async (withdrawal: AdminWithdrawal, status: 'approved' | 'rejected') => {
    const actionLabel = status === 'approved' ? 'approve' : 'reject';
    const defaultNote =
      status === 'rejected'
        ? window.prompt(`Reason for rejecting this withdrawal? (sent to the customer)`, '') ?? ''
        : '';
    if (status === 'rejected' && !defaultNote.trim()) {
      setMessage('A rejection note is required so the customer knows why.');
      return;
    }
    if (!window.confirm(`Are you sure you want to ${actionLabel} the withdrawal of Rs. ${Number(withdrawal.amount).toLocaleString()} to ${withdrawal.userName || 'customer'} (${methodLabels[withdrawal.method]})?`)) {
      return;
    }

    setBusyId(withdrawal.id);
    setMessage('');
    setError('');
    try {
      await updateWithdrawalStatus(withdrawal.id, status, defaultNote.trim() || undefined);
      setMessage(
        status === 'approved'
          ? `Withdrawal #${withdrawal.id} approved. Mark it as settled once you have transferred the amount via ${methodLabels[withdrawal.method]}.`
          : `Withdrawal #${withdrawal.id} rejected. Rs. ${Number(withdrawal.amount).toLocaleString()} has been refunded to the customer wallet.`,
      );
      await load(0, statusFilter);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update the withdrawal.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminShell eyebrow="Customer wallet withdrawals" title="Settlements">
      {message && <div className="notice">{message}</div>}
      {error && <div className="notice">{error}</div>}

      <section className="panel">
        <div className="panelHead">
          <div>
            <p className="eyebrow">Withdrawal requests</p>
            <h3>Customer settlements</h3>
          </div>
          <div className="topbarActions">
            <button className="ghostButton" disabled={loading} onClick={() => void load(0, statusFilter)}>
              <RefreshCw size={17} /> Refresh
            </button>
            <span className="countPill">{withdrawals.length} of {total} requests</span>
          </div>
        </div>

        <div className="settlementSummaryRow">
          <div className="settlementStatCard">
            <span>Pending requests</span>
            <strong>{summary.pendingCount}</strong>
            <small>Rs. {summary.pendingAmount.toLocaleString()} on hold</small>
          </div>
          <div className="settlementStatCard">
            <span>Approved payouts</span>
            <strong>Rs. {summary.approvedAmount.toLocaleString()}</strong>
            <small>Total settled to customers</small>
          </div>
        </div>

        <div className="receiptToolbar">
          <label className="field">
            <span>Filter by status</span>
            <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
              <option value="">All requests</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
        </div>

        {loading ? (
          <div className="empty">Loading withdrawal requests...</div>
        ) : !withdrawals.length ? (
          <div className="empty">No withdrawal requests found.</div>
        ) : (
          <div className="ordersList">
            {withdrawals.map(withdrawal => (
              <div className="orderCard" key={withdrawal.id}>
                <div className="orderCardHead">
                  <div>
                    <p className="eyebrow">Request #{withdrawal.id} · {new Date(withdrawal.createdAt).toLocaleString()}</p>
                    <h3>{withdrawal.userName || 'Customer'}</h3>
                    <p>{withdrawal.userPhone || '-'} / {withdrawal.userEmail || 'No email'}</p>
                  </div>
                  <div className="receiptCardActions">
                    <span className={statusStyles[withdrawal.status]}>
                      {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                    </span>
                    <strong className="settlementAmount">Rs. {Number(withdrawal.amount).toLocaleString()}</strong>
                  </div>
                </div>

                <div className="receiptSummaryLine">
                  <span>Method</span>
                  <strong>{methodLabels[withdrawal.method]}</strong>
                  {withdrawal.method === 'bank' ? (
                    <>
                      <span>Bank</span>
                      <strong>{withdrawal.bankName || '-'}</strong>
                    </>
                  ) : null}
                  <span>{withdrawal.method === 'bank' ? 'Account (IBAN)' : 'Account number'}</span>
                  <strong>{withdrawal.accountNumber}</strong>
                  {withdrawal.accountName ? (
                    <>
                      <span>Account holder</span>
                      <strong>{withdrawal.accountName}</strong>
                    </>
                  ) : null}
                  {withdrawal.processedAt ? (
                    <>
                      <span>Processed</span>
                      <strong>{new Date(withdrawal.processedAt).toLocaleString()}</strong>
                    </>
                  ) : null}
                </div>

                {withdrawal.adminNote ? (
                  <p className="mutedLine">Note: {withdrawal.adminNote}</p>
                ) : null}

                {withdrawal.status === 'pending' ? (
                  <div className="receiptCardActions settlementActions">
                    <button
                      className="primaryButton"
                      disabled={busyId === withdrawal.id}
                      onClick={() => void decide(withdrawal, 'approved')}>
                      <Banknote size={16} /> Approve &amp; settle
                    </button>
                    <button
                      className="ghostButton"
                      disabled={busyId === withdrawal.id}
                      onClick={() => void decide(withdrawal, 'rejected')}>
                      Reject &amp; refund wallet
                    </button>
                    <Link className="ghostButton compactButton" href={`/users`}>
                      <Search size={14} /> Customer
                    </Link>
                  </div>
                ) : null}
              </div>
            ))}
            {hasMore ? (
              <button
                className="ghostButton"
                disabled={loadingMore}
                onClick={() => void load(withdrawals.length, statusFilter)}>
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            ) : null}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
