'use client';

import { AdminShell } from '@/components/AdminShell';
import {
  getBotStats,
  getBotServices,
  saveBotService,
  deleteBotService,
  getBotBookings,
  updateBotBookingStatus,
  deleteBotBooking,
  getBotSessions,
  BotStat,
  BotService,
  BotBooking,
  BotSession,
  getBotConnectionStatus,
  startBot,
  stopBot,
  BotConnectionStatus,
} from '@/lib/api';
import {
  MessageSquare,
  Activity,
  CheckCircle,
  Clock,
  Trash,
  Edit,
  Plus,
  X,
  Server,
  Users,
  Calendar,
} from 'lucide-react';
import { useEffect, useState } from 'react';

type Tab = 'dashboard' | 'services' | 'bookings' | 'sessions';

export default function WhatsAppBotClient() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const formatPhoneNumber = (userId: string) => {
    if (!userId) return '';

    let raw = String(userId).replace(/@(c\.us|lid)$/, '').replace(/[\s-]/g, '');

    if (raw.startsWith('+92')) raw = raw.slice(1);

    // Handle standard 12-digit PK number (e.g., 923357808793)
    if (raw.startsWith('92') && raw.length === 12) {
      return `+92 ${raw.slice(2, 5)} ${raw.slice(5)}`;
    }

    // Handle 03xx format (e.g., 03001234567)
    if (raw.startsWith('03') && raw.length === 11) {
      return `+92 ${raw.slice(1, 4)} ${raw.slice(4)}`;
    }

    // Display whatever the raw string is without the @lid / @c.us suffix
    return userId;
  };

  // States
  const [stats, setStats] = useState<BotStat | null>(null);
  const [services, setServices] = useState<BotService[]>([]);
  const [bookings, setBookings] = useState<BotBooking[]>([]);
  const [sessions, setSessions] = useState<BotSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Service Modal state
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);

  // Booking Filter
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3000);
  };

  // Connection State
  const [connectionStatus, setConnectionStatus] = useState<BotConnectionStatus | null>(null);
  const [connectionLoading, setConnectionLoading] = useState(false);
  const [qrRefreshing, setQrRefreshing] = useState(false);
  // Track if polling should be suppressed (e.g. right after stopBot)
  const [pollPaused, setPollPaused] = useState(false);

  const loadConnectionStatus = async (silent = true) => {
    try {
      if (!silent) setConnectionLoading(true);
      const data = await getBotConnectionStatus();
      setConnectionStatus(prev => {
        let qr = data.qr;
        // Preserve QR if polling returns null but we are still starting/connecting
        if (!qr && prev?.qr && (data.status === 'starting' || data.status === 'connecting')) {
          qr = prev.qr;
        }
        return { ...data, qr };
      });
      return data;
    } catch (err: any) {
      console.error('Failed to get bot status', err);
      return null;
    } finally {
      if (!silent) setConnectionLoading(false);
    }
  };

  // Poll only while bot is NOT online — stop as soon as it connects
  useEffect(() => {
    // Initial fetch (non-silent so spinner shows)
    loadConnectionStatus(false);

    const interval = setInterval(async () => {
      // Don't poll if paused (e.g. right after stopBot)
      if (pollPaused) return;
      // Don't poll if already online — no need to keep hammering the server
      if (connectionStatus?.status === 'online') return;
      await loadConnectionStatus(true);
    }, 5000);

    return () => clearInterval(interval);
  // Re-run when pollPaused changes or when status flips to/from 'online'
  }, [pollPaused, connectionStatus?.status]);

  const handleStartBot = async () => {
    try {
      setQrRefreshing(true);
      console.log('Sending startBot request...');
      const data = await startBot();
      console.log('StartBot Response:', data);

      setConnectionStatus(prev => ({
        ...prev,
        status: data.status as any,
        qr: data.qr,
        phone: data.phone
      }));
    } catch (err: any) {
      console.error('startBot Error:', err);
      alert(err.message || 'Failed to start bot');
    } finally {
      setQrRefreshing(false);
    }
  };

  const handleStopBot = async () => {
    if (!confirm('Are you sure you want to disconnect the bot?')) return;
    try {
      setConnectionLoading(true);
      // Pause polling so it doesn't overwrite our offline state immediately
      setPollPaused(true);
      await stopBot();
      // Fully reset connection state: status offline, no QR, no phone
      setConnectionStatus({ status: 'offline', qr: null, phone: null });
      showNotice('Bot disconnected');
      // Resume polling after 4 seconds (server needs time to settle)
      setTimeout(() => setPollPaused(false), 4000);
    } catch (err: any) {
      setPollPaused(false);
      alert(err.message || 'Failed to stop bot');
    } finally {
      setConnectionLoading(false);
    }
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await getBotStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await getBotServices();
      setServices(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await getBotBookings();
      setBookings(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await getBotSessions();
      setSessions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setError('');
    if (activeTab === 'dashboard') loadDashboard();
    if (activeTab === 'services') loadServices();
    if (activeTab === 'bookings') loadBookings();
    if (activeTab === 'sessions') loadSessions();
  }, [activeTab]);

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    if (!editingService.optionsArray || editingService.optionsArray.length === 0) {
      alert('At least one service option is required.');
      return;
    }

    try {
      const payload = { ...editingService };
      if (payload.optionsArray) {
        payload.options = {};
        payload.optionsArray.forEach((opt: any) => {
          if (opt.key) payload.options[opt.key] = opt.label;
        });
        delete payload.optionsArray;
      }
      delete payload.msgManuallyEdited;
      await saveBotService(payload);
      setServiceModalOpen(false);
      setEditingService(null);
      showNotice('Service saved successfully');
      loadServices();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      await deleteBotService(id);
      showNotice('Service deleted');
      loadServices();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateBookingStatus = async (id: string, status: BotBooking['status']) => {
    try {
      await updateBotBookingStatus(id, status);
      showNotice('Booking updated');
      loadBookings();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    try {
      await deleteBotBooking(id);
      showNotice('Booking deleted');
      loadBookings();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <AdminShell eyebrow="Settings" title="WhatsApp Bot">
      {notice && <div className="notice">{notice}</div>}
      {error && <div className="cancelReasonBox"><p>{error}</p></div>}

      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panelHead" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h3>WhatsApp Connection Status</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.05)' }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                backgroundColor: connectionStatus?.status === 'online' ? '#22c55e' :
                  connectionStatus?.status === 'connecting' || connectionStatus?.status === 'starting' ? '#eab308' : '#ef4444',
                boxShadow: (connectionStatus?.status === 'starting') ? '0 0 0 3px rgba(234,179,8,0.3)' : 'none',
                animation: connectionStatus?.status === 'starting' ? 'pulse 1.5s ease-in-out infinite' : 'none'
              }} />
              <span style={{ textTransform: 'capitalize' }}>
                {connectionStatus?.status || 'Loading...'}
              </span>
            </div>
          </div>
          {connectionStatus?.status === 'online' && connectionStatus?.phone && (
            <div style={{ fontSize: 14, color: 'var(--muted)' }}>
              Connected Number: <strong>{connectionStatus.phone}</strong>
            </div>
          )}
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>

          {/* Starting spinner */}
          {connectionStatus?.status === 'starting' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '16px 32px', borderRadius: 12, background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
              <div style={{ width: 36, height: 36, border: '3px solid rgba(234,179,8,0.3)', borderTop: '3px solid #eab308', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <div style={{ color: '#eab308', fontWeight: 600, fontSize: 14 }}>Starting bot — Puppeteer is launching, please wait…</div>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>This can take 30–60 seconds on first start</div>
            </div>
          )}

          {/* QR code */}
          {connectionStatus?.qr && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, background: '#fff', padding: 16, borderRadius: 12 }}>
              <img
                src={connectionStatus.qr.startsWith('data:') ? connectionStatus.qr : `data:image/png;base64,${connectionStatus.qr}`}
                alt="WhatsApp QR Code"
                style={{ width: 300, height: 300, objectFit: 'contain' }}
              />
              <div style={{ color: '#000', fontWeight: 600, fontSize: 16 }}>Scan with WhatsApp to connect</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            {/* Show QR button — only when offline and not starting */}
            {!connectionStatus?.qr && connectionStatus?.status !== 'online' && connectionStatus?.status !== 'starting' && (
              <button className="primaryButton" onClick={handleStartBot} disabled={qrRefreshing}>
                {qrRefreshing ? 'Loading...' : 'Show QR Code'}
              </button>
            )}

            {/* Refresh QR button */}
            {connectionStatus?.qr && connectionStatus?.status !== 'online' && (
              <button className="secondaryButton" onClick={handleStartBot} disabled={qrRefreshing}>
                {qrRefreshing ? 'Refreshing...' : 'Refresh QR'}
              </button>
            )}

            {/* Disconnect — also shown while starting so user can cancel */}
            {(connectionStatus?.status === 'online' || connectionStatus?.status === 'connecting' || connectionStatus?.status === 'starting') && (
              <button className="primaryButton" style={{ background: '#ef4444', borderColor: '#ef4444', color: '#fff' }} onClick={handleStopBot} disabled={connectionLoading}>
                {connectionLoading ? 'Disconnecting...' : 'Disconnect Bot'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="orderFilterBar" style={{ marginBottom: 24 }}>
        {(['dashboard', 'services', 'bookings', 'sessions'] as Tab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`orderFilterPill ${activeTab === tab ? 'orderFilterPillActive' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {loading && <div className="empty">Loading...</div>}

      {!loading && activeTab === 'dashboard' && stats && (
        <div className="statsGrid">
          <div className="statCard">
            <div className="statIcon"><Calendar size={20} /></div>
            <span>Total Bookings</span>
            <strong>{stats.totalBookings}</strong>
          </div>
          <div className="statCard">
            <div className="statIcon"><Clock size={20} /></div>
            <span>Pending Bookings</span>
            <strong>{stats.pendingBookings}</strong>
          </div>
          <div className="statCard">
            <div className="statIcon"><CheckCircle size={20} /></div>
            <span>Completed Bookings</span>
            <strong>{stats.completedBookings}</strong>
          </div>
          <div className="statCard">
            <div className="statIcon"><Activity size={20} /></div>
            <span>Today's Bookings</span>
            <strong>{stats.todayBookings}</strong>
          </div>
          <div className="statCard">
            <div className="statIcon"><Server size={20} /></div>
            <span>Active Services</span>
            <strong>{stats.activeServices}</strong>
          </div>
          <div className="statCard">
            <div className="statIcon"><Users size={20} /></div>
            <span>Active Sessions</span>
            <strong>{stats.activeSessions}</strong>
          </div>
        </div>
      )}

      {!loading && activeTab === 'services' && (
        <div className="panel">
          <div className="panelHead">
            <h3>Bot Services</h3>
            <button
              className="primaryButton"
              onClick={() => {
                setEditingService({
                  category: '',
                  name: '',
                  msg: '',
                  optionsArray: [],
                  active: true,
                  msgManuallyEdited: false
                });
                setServiceModalOpen(true);
              }}
            >
              Add New Service
            </button>
          </div>
          <div className="userTable">
            <div className="userRow" style={{ gridTemplateColumns: '1fr 1fr 2fr 1fr auto' }}>
              <strong>Category</strong>
              <strong>Service Name</strong>
              <strong>Message Outline</strong>
              <strong>Status</strong>
              <strong>Actions</strong>
            </div>
            {services.map((s, i) => (
              <div key={(s.id || s._id || 'service') + '-' + i} className="userRow" style={{ gridTemplateColumns: '1fr 1fr 2fr 1fr auto' }}>
                <span>{s.category}</span>
                <span>{s.name}</span>
                <span className="mutedLine" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.msg}
                </span>
                <span>{s.active ? 'Active' : 'Inactive'}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="secondaryButton" onClick={() => {
                    const optsArr = Object.entries(s.options || {}).map(([key, label]) => ({ key, label }));
                    setEditingService({ ...s, optionsArray: optsArr, msgManuallyEdited: true });
                    setServiceModalOpen(true);
                  }}>
                    <Edit size={14} />
                  </button>
                  <button className="secondaryButton" style={{ color: '#991b1b', background: '#fef2f2' }} onClick={() => handleDeleteService(s.id || s._id || '')}>
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            ))}
            {services.length === 0 && <div className="empty">No services configured.</div>}
          </div>
        </div>
      )}

      {!loading && activeTab === 'bookings' && (
        <div className="panel">
          <div className="panelHead">
            <h3>Bot Bookings</h3>
            <select
              style={{ width: 'auto' }}
              value={bookingFilter}
              onChange={e => setBookingFilter(e.target.value as any)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="userTable">
            <div className="userRow" style={{ gridTemplateColumns: '1.1fr 1fr 1.4fr 0.9fr 1.6fr 1.1fr auto' }}>
              <strong>Date</strong>
              <strong>User</strong>
              <strong>Service</strong>
              <strong>Visit</strong>
              <strong>Address</strong>
              <strong>Status</strong>
              <strong>Actions</strong>
            </div>
            {bookings
              .filter(b => bookingFilter === 'all' || b.status === bookingFilter)
              .map((b, i) => (
                <div key={(b.id || b._id || 'booking') + '-' + i} className="userRow" style={{ gridTemplateColumns: '1.1fr 1fr 1.4fr 0.9fr 1.6fr 1.1fr auto' }}>
                  <span>{new Date(b.createdAt || '').toLocaleString()}</span>
                  <span>{formatPhoneNumber(b.customer_phone || b.customerPhone || b.userId)}</span>
                  <span>{b.mainCategory} - {b.serviceType}<br /><small>{b.subService}</small></span>
                  <span>{b.date} <br /><small>{b.time}</small></span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {b.address ? (
                      <>
                        <span
                          title={b.address}
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            fontSize: 13,
                            lineHeight: '1.4',
                          }}
                        >
                          {b.address}
                        </span>
                        {b.addressType && b.addressType !== 'text' && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: 'var(--accent)',
                            opacity: 0.8,
                          }}>
                            {b.addressType}
                          </span>
                        )}
                      </>
                    ) : (
                      <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>
                    )}
                  </span>
                  <select
                    value={b.status}
                    onChange={e => handleUpdateBookingStatus(b.id || b._id || '', e.target.value as any)}
                    className={b.status === 'cancelled' ? 'statusSelectCancelled' : ''}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="secondaryButton" style={{ color: '#991b1b', background: '#fef2f2' }} onClick={() => handleDeleteBooking(b.id || b._id || '')}>
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
              ))}
            {bookings.length === 0 && <div className="empty">No bookings found.</div>}
          </div>
        </div>
      )}

      {!loading && activeTab === 'sessions' && (
        <div className="panel">
          <div className="panelHead">
            <h3>Active Bot Sessions</h3>
          </div>
          <div className="userTable">
            <div className="userRow" style={{ gridTemplateColumns: '1fr 2fr 1fr' }}>
              <strong>User Phone</strong>
              <strong>Current Step</strong>
              <strong>Last Updated</strong>
            </div>
            {sessions.map((s, i) => {
              const uId = s.user_id || s.userId || 'session';
              const phone = s.order_details?.customerPhone || s.order_details?.customer_phone || uId;
              const dateStr = s.updatedAt || s.updated_at || '';
              return (
                <div key={uId + '-' + i} className="userRow" style={{ gridTemplateColumns: '1fr 2fr 1fr' }}>
                  <span>{formatPhoneNumber(phone)}</span>
                  <span>{s.step}</span>
                  <span>{dateStr ? new Date(dateStr).toLocaleString() : ''}</span>
                </div>
              );
            })}
            {sessions.length === 0 && <div className="empty">No active sessions.</div>}
          </div>
        </div>
      )}

      {serviceModalOpen && editingService && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(11,28,48,0.4)',
          display: 'grid', placeItems: 'center', zIndex: 100, padding: 20
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', margin: 0 }}>
            <div className="panelHead">
              <h3>{editingService.id || editingService._id ? 'Edit Service' : 'New Service'}</h3>
              <button className="secondaryButton" onClick={() => setServiceModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveService} className="formGrid">
              <div className="field fieldWide" style={{ gridColumn: 'span 1' }}>
                <span>Category</span>
                <input
                  required
                  list="category-options"
                  value={editingService.category || ''}
                  onChange={e => setEditingService({ ...editingService, category: e.target.value })}
                  placeholder="e.g. Beauty"
                />
                <datalist id="category-options">
                  {Array.from(new Set(services.map(s => s.category))).map(cat => (
                    <option key={cat as string} value={cat as string} />
                  ))}
                </datalist>
              </div>
              <div className="field fieldWide" style={{ gridColumn: 'span 2' }}>
                <span>Service Name</span>
                <input
                  required
                  value={editingService.name || ''}
                  onChange={e => {
                    const newName = e.target.value;
                    let newMsg = editingService.msg;
                    if (!editingService.msgManuallyEdited) {
                      newMsg = `*${newName || 'Service'} Services*\n\n` + (editingService.optionsArray || []).map((o: any, idx: number) => `${o.key || (idx + 1)}. ${o.label}`).join('\n');
                    }
                    setEditingService({ ...editingService, name: newName, msg: newMsg });
                  }}
                  placeholder="e.g. Hair Cut"
                />
              </div>
              <div className="field fieldWide">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span>WhatsApp Message Context (Sent to user)</span>
                  <button
                    type="button"
                    className="ghostButton"
                    style={{ padding: '2px 8px', fontSize: 11, height: 'auto', minHeight: 24 }}
                    onClick={() => {
                      const generatedMsg = `*${editingService.name || 'Service'} Services*\n\n` + (editingService.optionsArray || []).map((o: any, idx: number) => `${o.key || (idx + 1)}. ${o.label}`).join('\n');
                      setEditingService({ ...editingService, msg: generatedMsg, msgManuallyEdited: false });
                    }}
                  >
                    Regenerate Message
                  </button>
                </div>
                <textarea
                  required
                  value={editingService.msg || ''}
                  onChange={e => setEditingService({ ...editingService, msg: e.target.value, msgManuallyEdited: true })}
                  placeholder="*Hair Cut Services*&#10;&#10;1. Pushpaa Cut Rs.1400&#10;2. Buzz Cut Rs.800"
                  rows={5}
                />
              </div>

              <div className="fieldWide">
                <span style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 800, marginBottom: 8, display: 'block' }}>Service Options (User can select)</span>
                <div style={{ display: 'grid', gap: 10 }}>
                  {editingService.optionsArray?.map((opt: any, i: number) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 10 }}>
                      <input
                        required
                        placeholder="Key (e.g. 1)"
                        value={opt.key}
                        onChange={e => {
                          const newOpts = [...(editingService.optionsArray || [])];
                          newOpts[i].key = e.target.value;
                          let newMsg = editingService.msg;
                          if (!editingService.msgManuallyEdited) {
                            newMsg = `*${editingService.name || 'Service'} Services*\n\n` + newOpts.map((o: any, idx: number) => `${o.key || (idx + 1)}. ${o.label}`).join('\n');
                          }
                          setEditingService({ ...editingService, optionsArray: newOpts, msg: newMsg });
                        }}
                      />
                      <input
                        required
                        placeholder="Label (e.g. Pushpaa Cut Rs.1400)"
                        value={opt.label}
                        onChange={e => {
                          const newOpts = [...(editingService.optionsArray || [])];
                          newOpts[i].label = e.target.value;
                          let newMsg = editingService.msg;
                          if (!editingService.msgManuallyEdited) {
                            newMsg = `*${editingService.name || 'Service'} Services*\n\n` + newOpts.map((o: any, idx: number) => `${o.key || (idx + 1)}. ${o.label}`).join('\n');
                          }
                          setEditingService({ ...editingService, optionsArray: newOpts, msg: newMsg });
                        }}
                      />
                      <button
                        type="button"
                        className="secondaryButton"
                        style={{ color: '#991b1b', background: '#fef2f2' }}
                        onClick={() => {
                          const newOpts = [...(editingService.optionsArray || [])];
                          newOpts.splice(i, 1);
                          let newMsg = editingService.msg;
                          if (!editingService.msgManuallyEdited) {
                            newMsg = `*${editingService.name || 'Service'} Services*\n\n` + newOpts.map((o: any, idx: number) => `${o.key || (idx + 1)}. ${o.label}`).join('\n');
                          }
                          setEditingService({ ...editingService, optionsArray: newOpts, msg: newMsg });
                        }}
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="ghostButton"
                    style={{ width: 'max-content' }}
                    onClick={() => {
                      const newOpts = [...(editingService.optionsArray || []), { key: String((editingService.optionsArray?.length || 0) + 1), label: '' }];
                      let newMsg = editingService.msg;
                      if (!editingService.msgManuallyEdited) {
                        newMsg = `*${editingService.name || 'Service'} Services*\n\n` + newOpts.map((o: any, idx: number) => `${o.key || (idx + 1)}. ${o.label}`).join('\n');
                      }
                      setEditingService({
                        ...editingService,
                        optionsArray: newOpts,
                        msg: newMsg
                      });
                    }}
                  >
                    <Plus size={16} /> Add Option
                  </button>
                </div>
              </div>

              <div className="field fieldWide" style={{ marginTop: 14 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 800 }}>
                  <input
                    type="checkbox"
                    style={{ width: 'auto' }}
                    checked={editingService.active ?? true}
                    onChange={e => setEditingService({ ...editingService, active: e.target.checked })}
                  />
                  Service is Active
                </label>
              </div>

              <div className="fieldWide" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button type="button" className="ghostButton" onClick={() => setServiceModalOpen(false)}>Cancel</button>
                <button type="submit" className="primaryButton" style={{ marginTop: 0 }}>Save Service</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AdminShell>
  );
}
