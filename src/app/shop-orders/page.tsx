'use client';

import {useEffect, useState} from 'react';
import {RefreshCw, ShoppingCart} from 'lucide-react';
import {AdminShell} from '@/components/AdminShell';
import {
  AdminShopOrder,
  getShopOrders,
  updateShopOrderStatus,
} from '@/lib/api';
import {money} from '@/lib/adminUi';

const statuses: AdminShopOrder['status'][] = [
  'placed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

export default function ShopOrdersPage() {
  const [orders, setOrders] = useState<AdminShopOrder[]>([]);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    setOrders(await getShopOrders());
  };

  useEffect(() => {
    loadData().catch(() => setMessage('Could not load shop orders.'));
  }, []);

  const updateStatus = async (id: string, status: AdminShopOrder['status']) => {
    try {
      const result = await updateShopOrderStatus(id, status);
      await loadData();
      setMessage(`Shop order status updated. ${result.pushMessage}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update order.');
    }
  };

  return (
    <AdminShell
      eyebrow="Store operations"
      title="Shop Orders"
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
            <p className="eyebrow">Customer shopping orders</p>
            <h3>Orders</h3>
          </div>
          <span className="countPill">{orders.length} orders</span>
        </div>

        <div className="orderList">
          {orders.map(order => (
            <article className="orderCard" key={order.id}>
              <div className="orderTop">
                <div className="orderIcon">
                  <ShoppingCart size={19} />
                </div>
                <div>
                  <strong>{order.id}</strong>
                  <p>
                    {order.customerName} - {order.customerPhone}
                  </p>
                </div>
                <div>
                  <b>{money(order.total)}</b>
                  <p>Shipping: {money(order.shippingCost || 0)}</p>
                </div>
              </div>

              <div className="orderItems">
                {order.items.map(item => (
                  <span key={`${order.id}-${item.product.id}`}>
                    {item.quantity}x {item.product.title} ({money(item.price)})
                  </span>
                ))}
              </div>

              <p className="mutedLine">{order.address}</p>

              <label className="field compactField">
                <span>Status</span>
                <select
                  value={order.status}
                  onChange={event =>
                    updateStatus(
                      order.id,
                      event.target.value as AdminShopOrder['status'],
                    )
                  }
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </article>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
