'use client';

import {useEffect, useState} from 'react';
import {Package, RefreshCw, Trash2} from 'lucide-react';
import {AdminShell} from '@/components/AdminShell';
import {Field} from '@/components/AdminFields';
import {
  AdminSubscription,
  deleteSubscription,
  getSubscriptions,
  saveSubscription,
} from '@/lib/api';
import {money} from '@/lib/adminUi';

const emptySubscription: Partial<AdminSubscription> = {
  title: '',
  duration: '1 month',
  price: 0,
  originalPrice: 0,
  perks: [],
};

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [form, setForm] = useState<Partial<AdminSubscription>>(emptySubscription);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    try {
      const data = await getSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      setMessage('Could not load subscriptions. Check that the API is running.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    try {
      if (!form.title || !form.price || !form.duration) {
        throw new Error('Please fill out the title, duration, and price.');
      }
      const perks = (form.perks || []).filter(Boolean);
      await saveSubscription({...form, perks});
      setForm(emptySubscription);
      await loadData();
      setMessage('Subscription saved successfully.');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not save subscription.',
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscription?')) return;
    try {
      await deleteSubscription(id);
      if (form.id === id) setForm(emptySubscription);
      await loadData();
      setMessage('Subscription deleted.');
    } catch (error) {
      setMessage('Failed to delete subscription.');
    }
  };

  const editItem = (sub: AdminSubscription) => {
    setForm(sub);
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  return (
    <AdminShell
      eyebrow="Recurring packages"
      title="Subscriptions"
      action={
        <button className="ghostButton" onClick={() => loadData()}>
          <RefreshCw size={17} />
          Refresh
        </button>
      }
    >
      {message && <div className="notice">{message}</div>}

      <section className="panel">
        <div className="panelHead">
          <div>
            <p className="eyebrow">Subscription packages</p>
            <h3>{form.id ? 'Edit Subscription' : 'Add Subscription'}</h3>
          </div>
          <Package size={22} />
        </div>

        <div className="serviceEditor">
          <div className="formGrid">
            <Field
              label="Title (e.g. Essential Care)"
              value={form.title || ''}
              onChange={title => setForm({...form, title})}
            />
            <Field
              label="Duration (e.g. 1 month, 3 months)"
              value={form.duration || ''}
              onChange={duration => setForm({...form, duration})}
            />
            <Field
              label="Price (PKR)"
              type="number"
              value={String(form.price || '')}
              onChange={price => setForm({...form, price: Number(price)})}
            />
            <Field
              label="Original Price (PKR)"
              type="number"
              value={String(form.originalPrice || '')}
              onChange={originalPrice =>
                setForm({...form, originalPrice: Number(originalPrice)})
              }
            />
            <Field
              label="Perks, comma separated (e.g. 1 AC checkup, 2 Cleanings)"
              value={(form.perks || []).join(', ')}
              onChange={value =>
                setForm({
                  ...form,
                  perks: value.split(',').map(item => item.trim()),
                })
              }
            />
          </div>

          <div className="mobilePreview">
            <p className="eyebrow">App preview</p>
            <div className="appServiceCard" style={{padding: 16, backgroundColor: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0'}}>
              <h4 style={{fontWeight: 'bold', fontSize: 18, color: '#0f172a', marginBottom: 4}}>
                {form.title || 'Package Title'}
              </h4>
              <p style={{color: '#64748b', fontSize: 14, marginBottom: 12}}>
                {form.duration || 'Duration'}
              </p>
              
              <div style={{display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16}}>
                <span style={{fontSize: 24, fontWeight: 'bold', color: '#0f172a'}}>
                  {money(Number(form.price || 0))}
                </span>
                {Number(form.originalPrice) > Number(form.price) && (
                  <span style={{textDecoration: 'line-through', color: '#94a3b8'}}>
                    {money(Number(form.originalPrice))}
                  </span>
                )}
              </div>

              <ul style={{paddingLeft: 16, color: '#475569', fontSize: 14}}>
                {(form.perks || []).map((perk, i) => (
                  <li key={i} style={{marginBottom: 6}}>{perk}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        <div style={{display: 'flex', gap: 12, marginTop: 16}}>
          <button className="primaryButton" onClick={handleSave}>
            Save Subscription
          </button>
          {form.id && (
            <button className="ghostButton" onClick={() => setForm(emptySubscription)}>
              Cancel Edit
            </button>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panelHead">
          <div>
            <p className="eyebrow">Existing</p>
            <h3>Subscriptions</h3>
          </div>
          <span className="countPill">{subscriptions.length} packages</span>
        </div>
        <div className="serviceGrid">
          {subscriptions.map(sub => (
            <div className="serviceTile" key={sub.id} style={{position: 'relative'}}>
              <button 
                style={{textAlign: 'left', width: '100%', background: 'transparent', border: 'none'}} 
                onClick={() => editItem(sub)}
              >
                <span>{sub.duration}</span>
                <strong>{sub.title}</strong>
                <small>
                  {money(sub.price)}
                </small>
              </button>
              <button 
                onClick={() => handleDelete(sub.id)}
                style={{
                  position: 'absolute', 
                  top: 12, 
                  right: 12, 
                  color: '#ef4444',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
