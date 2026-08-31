'use client';

import {useCallback, useEffect, useState} from 'react';
import {RefreshCw, UserPlus} from 'lucide-react';
import {AdminShell} from '@/components/AdminShell';
import {AdminProvider, deleteProvider, getProviders, saveProvider} from '@/lib/api';

const emptyForm = {name: '', email: '', phone: '', password: '', trade: '', commissionPercent: 80, isAvailable: true, isActive: true};

export default function ProvidersPage() {
  const [providers, setProviders] = useState<AdminProvider[]>([]);
  const [form, setForm] = useState({...emptyForm});
  const [editingId, setEditingId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setProviders(await getProviders()); } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not load providers.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setMessage('');
    try {
      await saveProvider({...form, id: editingId});
      setForm({...emptyForm}); setEditingId(undefined); setMessage(editingId ? 'Provider updated.' : 'Provider account created.'); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save provider.'); }
    finally { setSaving(false); }
  };

  const edit = (provider: AdminProvider) => {
    setEditingId(provider.id);
    setForm({name: provider.name, email: provider.email, phone: provider.phone, password: '', trade: provider.trade,
      commissionPercent: provider.commissionPercent, isAvailable: provider.isAvailable, isActive: provider.isActive});
  };

  return <AdminShell eyebrow="Workforce" title="Provider Accounts" action={<button className="ghostButton" onClick={() => void load()}><RefreshCw size={17}/>Refresh</button>}>
    {message && <div className="notice">{message}</div>}
    <section className="panel">
      <div className="panelHead"><div><p className="eyebrow">Account access</p><h3>{editingId ? 'Edit provider' : 'Create provider'}</h3></div><UserPlus size={22}/></div>
      <form className="providerForm" onSubmit={submit}>
        <label>Name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
        <label>Email<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
        <label>Phone<input required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
        <label>Password<input required={!editingId} type="password" placeholder={editingId ? 'Leave blank to keep current password' : ''} value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label>
        <label>Trade / service category<input required value={form.trade} onChange={e=>setForm({...form,trade:e.target.value})}/></label>
        <label>Provider earning %<input required type="number" min="0" max="100" value={form.commissionPercent} onChange={e=>setForm({...form,commissionPercent:Number(e.target.value)})}/></label>
        <label className="checkLabel"><input type="checkbox" checked={form.isAvailable} onChange={e=>setForm({...form,isAvailable:e.target.checked})}/>Available for assignment</label>
        <label className="checkLabel"><input type="checkbox" checked={form.isActive} onChange={e=>setForm({...form,isActive:e.target.checked})}/>Account active</label>
        <div className="providerFormActions"><button className="primaryButton" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update provider' : 'Create account'}</button>{editingId && <button type="button" className="ghostButton" onClick={()=>{setEditingId(undefined);setForm({...emptyForm});}}>Cancel</button>}</div>
      </form>
    </section>
    <section className="panel">
      <div className="panelHead"><div><p className="eyebrow">Registered workforce</p><h3>Providers</h3></div><span className="countPill">{providers.length} accounts</span></div>
      {loading ? <div className="empty">Loading providers...</div> : providers.length===0 ? <div className="empty">No provider accounts yet.</div> : <div className="ordersList">{providers.map(provider=><article className="orderCard" key={provider.id}><div className="orderSummaryRow">
        <div><span>Name</span><strong>{provider.name}</strong></div><div><span>Login</span><strong>{provider.email}</strong><small>{provider.phone}</small></div><div><span>Trade</span><strong>{provider.trade}</strong></div><div><span>Earning</span><strong>{provider.commissionPercent}%</strong></div><div><span>Status</span><strong>{provider.isActive ? provider.isAvailable ? 'Available' : 'Unavailable' : 'Inactive'}</strong></div>
        <div className="orderRowActions"><button className="ghostButton" onClick={()=>edit(provider)}>Edit</button><button className="ghostButton" onClick={async()=>{if(confirm(`Delete ${provider.name}? Existing orders will become unassigned.`)){await deleteProvider(provider.id);await load();}}}>Delete</button></div>
      </div></article>)}</div>}
    </section>
  </AdminShell>;
}
