'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import {
  getComplaints,
  updateComplaintStatus,
  AdminComplaint,
  resolveApiAssetUrl,
} from '@/lib/api';
import {
  RefreshCw,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  MessageSquareWarning,
  User,
  Phone,
  Mail,
  Wrench,
  FileText,
  ImageIcon,
  ChevronDown,
} from 'lucide-react';

const STATUS_META: Record<
  AdminComplaint['status'],
  { label: string; color: string; bg: string; Icon: any }
> = {
  pending:   { label: 'Pending',   color: '#b45309', bg: '#fef9c3', Icon: Clock },
  'in-review': { label: 'In Review', color: '#1d4ed8', bg: '#eff6ff', Icon: Eye },
  resolved:  { label: 'Resolved',  color: '#15803d', bg: '#dcfce7', Icon: CheckCircle2 },
  rejected:  { label: 'Rejected',  color: '#dc2626', bg: '#fee2e2', Icon: XCircle },
};

function StatusBadge({ status }: { status: AdminComplaint['status'] }) {
  const meta = STATUS_META[status] ?? STATUS_META.pending;
  const { Icon } = meta;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '4px 10px', borderRadius: '999px',
      fontSize: '12px', fontWeight: 700,
      color: meta.color, background: meta.bg,
    }}>
      <Icon size={11} />
      {meta.label}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%',
      background: 'linear-gradient(135deg, #006c49 0%, #10b981 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: '13px', fontWeight: 800, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

type FilterStatus = 'all' | AdminComplaint['status'];

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<AdminComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [selectedComplaint, setSelectedComplaint] = useState<AdminComplaint | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getComplaints();
      setComplaints(data.complaints || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleStatusChange = async (id: number, newStatus: string) => {
    setIsUpdating(true);
    try {
      await updateComplaintStatus(id, newStatus);
      setComplaints(prev =>
        prev.map(c => c.id === id ? { ...c, status: newStatus as AdminComplaint['status'] } : c)
      );
      if (selectedComplaint?.id === id) {
        setSelectedComplaint(prev => prev ? { ...prev, status: newStatus as AdminComplaint['status'] } : null);
      }
    } catch {
      alert('Failed to update status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const counts = {
    all:       complaints.length,
    pending:   complaints.filter(c => c.status === 'pending').length,
    'in-review': complaints.filter(c => c.status === 'in-review').length,
    resolved:  complaints.filter(c => c.status === 'resolved').length,
    rejected:  complaints.filter(c => c.status === 'rejected').length,
  };

  const filtered = filter === 'all' ? complaints : complaints.filter(c => c.status === filter);

  const FILTER_PILLS: { key: FilterStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'in-review', label: 'In Review' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <AdminShell
      eyebrow="Customer Support"
      title="Complaints"
      action={
        <button className="ghostButton" onClick={loadData} disabled={loading}>
          <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : undefined }} />
          Refresh
        </button>
      }
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        .filterPill { padding: 7px 16px; border-radius: 999px; font-size: 13px; font-weight: 700; cursor: pointer; border: 1.5px solid var(--line); background: #fff; color: var(--muted); transition: all 0.15s; }
        .filterPill:hover { border-color: #006c49; color: #006c49; }
        .filterPill.active { background: #006c49; color: #fff; border-color: #006c49; }
        .complaintRow { display: grid; grid-template-columns: 48px 1fr 180px 120px 100px 120px; align-items: center; gap: 16px; padding: 14px 20px; border-bottom: 1px solid var(--line); transition: background 0.15s; cursor: pointer; }
        .complaintRow:last-child { border-bottom: none; }
        .complaintRow:hover { background: #f8faff; }
        .detailsBtn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 8px; border: 1.5px solid var(--line); background: #fff; color: var(--ink); font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.15s; }
        .detailsBtn:hover { border-color: #006c49; color: #006c49; background: #f0fdf8; }
        .statusSelect { padding: 9px 14px; border-radius: 8px; border: 1.5px solid var(--line); background: #fff; font-size: 13px; font-weight: 600; cursor: pointer; appearance: none; padding-right: 32px; }
        .statusSelect:focus { outline: 2px solid #006c49; border-color: #006c49; }
        .modalOverlay { position: fixed; inset: 0; background: rgba(11,28,48,0.55); z-index: 200; display: flex; align-items: flex-start; justify-content: flex-end; animation: fadeIn 0.2s; }
        .modalPanel { width: 100%; max-width: 520px; height: 100vh; overflow-y: auto; background: var(--panel); display: flex; flex-direction: column; animation: slideIn 0.25s cubic-bezier(.4,0,.2,1); box-shadow: -20px 0 60px rgba(0,0,0,0.12); }
        .detailRow { display: flex; flex-direction: column; gap: 4px; }
        .detailLabel { font-size: 11px; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: 0.07em; }
        .detailValue { font-size: 14px; font-weight: 600; color: var(--ink); }
        .imageThumb { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1.5px solid var(--line); cursor: pointer; transition: transform 0.15s; }
        .imageThumb:hover { transform: scale(1.05); }
        .emptyState { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; gap: 12px; color: var(--muted); }
      `}</style>

      {error && (
        <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c', padding: '12px 16px', borderRadius: 10, marginBottom: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total',     value: counts.all,         color: '#006c49', bg: '#effcf6' },
          { label: 'Pending',   value: counts.pending,     color: '#b45309', bg: '#fef9c3' },
          { label: 'In Review', value: counts['in-review'],color: '#1d4ed8', bg: '#eff6ff' },
          { label: 'Resolved',  value: counts.resolved,    color: '#15803d', bg: '#dcfce7' },
        ].map(s => (
          <div key={s.label} className="statCard" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MessageSquareWarning size={20} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Panel */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Panel Header */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>User Issues</p>
            <h3 style={{ margin: '4px 0 0', fontSize: 16 }}>Customer Complaints</h3>
          </div>
          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FILTER_PILLS.map(p => (
              <button
                key={p.key}
                className={`filterPill ${filter === p.key ? 'active' : ''}`}
                onClick={() => setFilter(p.key)}
              >
                {p.label}
                {counts[p.key] > 0 && (
                  <span style={{ marginLeft: 6, background: filter === p.key ? 'rgba(255,255,255,0.25)' : '#f0f4ff', color: filter === p.key ? '#fff' : 'var(--muted)', borderRadius: 999, padding: '1px 7px', fontSize: 11 }}>
                    {counts[p.key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Table Header */}
        {!loading && filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 180px 120px 100px 120px', gap: 16, padding: '10px 20px', background: '#f8faff', borderBottom: '1px solid var(--line)' }}>
            {['', 'Customer', 'Service', 'Status', 'Date', 'Action'].map(h => (
              <div key={h} style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
            ))}
          </div>
        )}

        {/* Rows */}
        {loading ? (
          <div className="emptyState">
            <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', color: '#006c49' }} />
            <span style={{ fontWeight: 600 }}>Loading complaints...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="emptyState">
            <MessageSquareWarning size={36} strokeWidth={1.5} />
            <span style={{ fontWeight: 600 }}>No complaints found</span>
            <span style={{ fontSize: 13 }}>
              {filter !== 'all' ? `No ${filter} complaints` : 'All clear!'}
            </span>
          </div>
        ) : (
          filtered.map(c => (
            <div key={c.id} className="complaintRow" onClick={() => setSelectedComplaint(c)}>
              <Avatar name={c.name} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{c.phone}</div>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{c.service}</div>
                {c.sub_service && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{c.sub_service}</div>}
              </div>
              <div><StatusBadge status={c.status} /></div>
              <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>
                {new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
              <div onClick={e => { e.stopPropagation(); setSelectedComplaint(c); }}>
                <button className="detailsBtn">
                  <Eye size={13} /> View
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Slide-in Panel */}
      {selectedComplaint && (
        <div className="modalOverlay" onClick={() => setSelectedComplaint(null)}>
          <div className="modalPanel" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--panel)', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={18} color="#dc2626" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>Complaint #{selectedComplaint.id}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {new Date(selectedComplaint.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedComplaint(null)} style={{ background: '#f5f7fb', border: 'none', borderRadius: 8, padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} color="var(--muted)" />
              </button>
            </div>

            <div style={{ padding: '24px', flex: 1 }}>
              {/* Customer Info */}
              <div style={{ background: '#f8faff', borderRadius: 12, padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
                <Avatar name={selectedComplaint.name} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{selectedComplaint.name}</div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--muted)' }}>
                      <Phone size={11} /> {selectedComplaint.phone}
                    </span>
                    {selectedComplaint.email && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--muted)' }}>
                        <Mail size={11} /> {selectedComplaint.email}
                      </span>
                    )}
                  </div>
                </div>
                <StatusBadge status={selectedComplaint.status} />
              </div>

              {/* Service */}
              <div style={{ marginBottom: 20, padding: 16, borderRadius: 12, border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Wrench size={14} color="#006c49" />
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Service</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{selectedComplaint.service}</div>
                {selectedComplaint.sub_service && (
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{selectedComplaint.sub_service}</div>
                )}
              </div>

              {/* Description */}
              {selectedComplaint.description && (
                <div style={{ marginBottom: 20, padding: 16, borderRadius: 12, border: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <FileText size={14} color="#006c49" />
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Description</span>
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>
                    {selectedComplaint.description}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {selectedComplaint.images && selectedComplaint.images.length > 0 && (
                <div style={{ marginBottom: 20, padding: 16, borderRadius: 12, border: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <ImageIcon size={14} color="#006c49" />
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      Attachments ({selectedComplaint.images.length})
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {selectedComplaint.images.map((img, i) => (
                      <a key={i} href={resolveApiAssetUrl(img)} target="_blank" rel="noreferrer">
                        <img
                          src={resolveApiAssetUrl(img)}
                          alt={`Attachment ${i + 1}`}
                          className="imageThumb"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Update Status Footer */}
            <div style={{ padding: '20px 24px', borderTop: '1px solid var(--line)', background: '#f8faff', position: 'sticky', bottom: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                Update Status
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(Object.keys(STATUS_META) as AdminComplaint['status'][]).map(s => {
                  const meta = STATUS_META[s];
                  const isActive = selectedComplaint.status === s;
                  return (
                    <button
                      key={s}
                      disabled={isUpdating || isActive}
                      onClick={() => handleStatusChange(selectedComplaint.id, s)}
                      style={{
                        padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${isActive ? meta.color : 'var(--line)'}`,
                        background: isActive ? meta.bg : '#fff',
                        color: isActive ? meta.color : 'var(--muted)',
                        fontWeight: 700, fontSize: 13, cursor: isActive ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6,
                        opacity: isUpdating && !isActive ? 0.5 : 1,
                        transition: 'all 0.15s',
                      }}
                    >
                      <meta.Icon size={13} />
                      {meta.label}
                      {isActive && <span style={{ marginLeft: 'auto', fontSize: 10 }}>● Active</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
