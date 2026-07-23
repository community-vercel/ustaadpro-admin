'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { getComplaints, updateComplaintStatus, AdminComplaint, resolveApiAssetUrl } from '@/lib/api';
import { RefreshCw, X, AlertTriangle } from 'lucide-react';

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<AdminComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal State
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

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (id: number, newStatus: string) => {
    setIsUpdating(true);
    try {
      await updateComplaintStatus(id, newStatus);
      setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: newStatus as any } : c));
      if (selectedComplaint?.id === id) {
        setSelectedComplaint(prev => prev ? { ...prev, status: newStatus as any } : null);
      }
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AdminShell
      eyebrow="Customer Support"
      title="Complaints"
      action={
        <button className="ghostButton" onClick={loadData}>
          <RefreshCw size={17} />
          Refresh
        </button>
      }
    >
      {error && <div className="notice">{error}</div>}

      <section className="panel">
        <div className="panelHead">
          <div>
            <p className="eyebrow">User Issues</p>
            <h3>Customer Complaints</h3>
          </div>
          <span className="countPill">{complaints.length} tickets</span>
        </div>

        {loading ? (
          <div className="empty">Loading complaints...</div>
        ) : complaints.length === 0 ? (
          <div className="empty">No complaints found.</div>
        ) : (
          <div className="table-responsive">
            <table className="dataTable">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map(c => (
                  <tr key={c.id}>
                    <td>#{c.id}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{c.phone}</div>
                    </td>
                    <td>
                      <div>{c.service}</div>
                      {c.sub_service && <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{c.sub_service}</div>}
                    </td>
                    <td>
                      <span className={`statusBadge ${c.status}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td>
                      <button 
                        className="actionButton"
                        onClick={() => setSelectedComplaint(c)}
                        style={{ padding: '6px 12px', fontSize: '13px', background: 'var(--ink)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        See Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Details Modal */}
      {selectedComplaint && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', 
          zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'var(--panel)', width: '100%', maxWidth: '600px', 
            borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} color="#dc2626" />
                Complaint #{selectedComplaint.id}
              </h3>
              <button onClick={() => setSelectedComplaint(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={24} color="var(--muted)" />
              </button>
            </div>
            
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>Customer Name</div>
                  <div style={{ fontWeight: 500 }}>{selectedComplaint.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>Phone</div>
                  <div style={{ fontWeight: 500 }}>{selectedComplaint.phone}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>Email</div>
                  <div style={{ fontWeight: 500 }}>{selectedComplaint.email || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>Service</div>
                  <div style={{ fontWeight: 500 }}>{selectedComplaint.service} {selectedComplaint.sub_service ? `(${selectedComplaint.sub_service})` : ''}</div>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px' }}>Description</div>
                <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '8px', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {selectedComplaint.description || 'No description provided.'}
                </div>
              </div>

              {selectedComplaint.images && selectedComplaint.images.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px' }}>Attachments</div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {selectedComplaint.images.map((img, i) => (
                      <a key={i} href={resolveApiAssetUrl(img)} target="_blank" rel="noreferrer">
                        <img 
                          src={resolveApiAssetUrl(img)} 
                          alt={`Attachment ${i+1}`} 
                          style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--line)' }} 
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '20px', borderTop: '1px solid var(--line)', background: 'var(--bg)', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontWeight: 600 }}>Update Status:</div>
              <select 
                value={selectedComplaint.status}
                onChange={(e) => handleStatusChange(selectedComplaint.id, e.target.value)}
                disabled={isUpdating}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--line)' }}
              >
                <option value="pending">Pending</option>
                <option value="in-review">In Review</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
