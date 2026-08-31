'use client';

import {useCallback, useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import {useParams} from 'next/navigation';
import {ArrowLeft, RefreshCw} from 'lucide-react';
import {AdminShell} from '@/components/AdminShell';
import {AdminUserOrderHistory, getUserOrders, resolveAssetUrl} from '@/lib/api';
import {money} from '@/lib/adminUi';

export default function UserOrdersPage() {
  const params = useParams<{id: string}>();
  const [history, setHistory] = useState<AdminUserOrderHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setMessage('');
    try { setHistory(await getUserOrders(params.id)); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not load customer orders.'); }
    finally { setLoading(false); }
  }, [params.id]);
  useEffect(() => { void load(); }, [load]);

  const totals = useMemo(() => ({
    service: history?.orders.filter(order => order.type === 'service').length || 0,
    shop: history?.orders.filter(order => order.type === 'shop').length || 0,
  }), [history]);

  return <AdminShell eyebrow="Customer Orders" title={history?.user.name || 'Order History'} action={<div className="topbarActions">
    <Link className="ghostButton" href="/users"><ArrowLeft size={17}/>Users</Link>
    <button className="ghostButton" onClick={() => void load()}><RefreshCw size={17}/>Refresh</button>
  </div>}>
    {message && <div className="notice">{message}</div>}
    {history && <section className="panel userOrderCustomer"><div><span>Customer</span><strong>{history.user.name}</strong></div><div><span>Phone</span><strong>{history.user.phone}</strong></div><div><span>Email</span><strong>{history.user.email}</strong></div><div><span>Orders</span><strong>{history.orders.length} total · {totals.service} services · {totals.shop} shop</strong></div></section>}
    <section className="panel">
      <div className="panelHead"><div><p className="eyebrow">Purchased items</p><h3>Complete Order History</h3></div><span className="countPill">{history?.orders.length || 0} orders</span></div>
      {loading ? <div className="empty">Loading orders...</div> : !history?.orders.length ? <div className="empty">This customer has not placed any orders.</div> : <div className="ordersList">
        {history.orders.map(order => <article className="orderCard userHistoryCard" key={`${order.type}-${order.id}`}>
          <div className="userHistoryHead"><div><span>{order.type === 'shop' ? 'Shop order' : 'Service booking'}</span><strong>{order.id}</strong></div><div><span>Status</span><strong>{order.status.replaceAll('_', ' ')}</strong></div><div><span>Total</span><strong>{money(order.total)}</strong></div><div><span>Created</span><strong>{new Date(order.createdAt).toLocaleString()}</strong></div>
          <Link className="ghostButton compactButton" href={order.type === 'shop' ? `/shop-orders/${order.id}` : `/orders/${order.id}`}>View order</Link></div>
          <div className="userHistoryItems">{order.items.map((item, index) => <div className="userHistoryItem" key={`${item.title}-${index}`}>
            {item.imageUrl ? <img src={resolveAssetUrl(item.imageUrl)} alt=""/> : <div className="userHistoryImagePlaceholder"/>}
            <div><strong>{item.title}</strong><small>{item.quantity} × {money(item.price)}</small></div><b>{money(item.quantity * item.price)}</b>
          </div>)}</div>
        </article>)}
      </div>}
    </section>
  </AdminShell>;
}
