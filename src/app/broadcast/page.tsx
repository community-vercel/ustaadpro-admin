'use client';

import {useState} from 'react';
import {BellRing, Send} from 'lucide-react';
import {AdminShell} from '@/components/AdminShell';
import {Field} from '@/components/AdminFields';
import {sendBroadcastNotification} from '@/lib/api';

export default function BroadcastPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');

  const handleSend = async () => {
    setNotice('');
    setSending(true);
    try {
      const result = await sendBroadcastNotification({title, message});
      setNotice(
        `${result.message} Targets: ${result.targetCount}. Failed: ${result.failedCount}.`,
      );
      setTitle('');
      setMessage('');
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : 'Could not send broadcast notification.',
      );
    } finally {
      setSending(false);
    }
  };

  const canSend = title.trim().length > 0 && message.trim().length > 0 && !sending;

  return (
    <AdminShell eyebrow="Push notifications" title="Broadcast Notification">
      {notice && <div className="notice">{notice}</div>}

      <section className="panel">
        <div className="panelHead">
          <div>
            <p className="eyebrow">Send to all mobile users</p>
            <h3>New Broadcast</h3>
          </div>
          <BellRing size={23} />
        </div>

        <div className="serviceEditor">
          <div className="formGrid">
            <div className="fieldWide">
              <Field label="Notification Title" value={title} onChange={setTitle} />
            </div>
            <label className="field fieldWide">
              <span>Notification Message</span>
              <textarea
                value={message}
                maxLength={220}
                placeholder="Write the message users will receive on their phones."
                onChange={event => setMessage(event.target.value)}
              />
            </label>
          </div>

          <div className="mobilePreview">
            <p className="eyebrow">Mobile preview</p>
            <div className="appServiceCard">
              <div className="appServiceBody">
                <small>Ustaad Pro</small>
                <strong>{title || 'Notification title'}</strong>
                <p>
                  {message ||
                    'Your broadcast message will appear here for every user.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <button className="primaryButton" disabled={!canSend} onClick={handleSend}>
          <Send size={17} />
          {sending ? 'Sending...' : 'Send Broadcast'}
        </button>
      </section>
    </AdminShell>
  );
}
