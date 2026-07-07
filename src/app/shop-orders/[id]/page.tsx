'use client';

import {useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import {useParams} from 'next/navigation';
import {ArrowLeft, Package, ShoppingCart} from 'lucide-react';
import {AdminShell} from '@/components/AdminShell';
import {AdminShopOrder, getShopOrders, resolveApiAssetUrl} from '@/lib/api';
import {money} from '@/lib/adminUi';

function formatDate(value?: string) {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function ShopOrderDetailsPage() {
  const params = useParams<{id: string}>();
  const [orders, setOrders] = useState<AdminShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getShopOrders()
      .then(data => setOrders(data))
      .catch(() => setMessage('Could not load shop order details.'))
      .finally(() => setLoading(false));
  }, []);

  const order = useMemo(
    () => orders.find(item => item.id === params.id),
    [orders, params.id],
  );

  const productsSubtotal = order?.items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  ) || 0;

  return (
    <AdminShell
      eyebrow="Store operations"
      title="Shop Order Details"
      action={
        <Link className="ghostButton" href="/shop-orders">
          <ArrowLeft size={17} />
          Back
        </Link>
      }
    >
      {message && <div className="notice">{message}</div>}
      {loading ? (
        <div className="empty">Loading shop order...</div>
      ) : !order ? (
        <div className="empty">Shop order not found.</div>
      ) : (
        <div className="shopOrderDetailPage">
          <section className="panel shopOrderHero">
            <div>
              <p className="eyebrow">{order.id}</p>
              <h3>{order.customerName || 'Customer'}</h3>
              <p>{order.customerPhone} • {order.customerEmail || 'No email'}</p>
            </div>
            <div className="shopOrderHeroAmount">
              <span>{order.status}</span>
              <strong>{money(order.total)}</strong>
            </div>
          </section>

          <section className="panel shopOrderDetailGrid">
            <div className="detailBlock">
              <h3>Customer</h3>
              <dl className="detailList">
                <div><dt>Name</dt><dd>{order.customerName || 'Customer'}</dd></div>
                <div><dt>Phone</dt><dd>{order.customerPhone}</dd></div>
                <div><dt>Email</dt><dd>{order.customerEmail || 'No email'}</dd></div>
                <div className="wideDetail"><dt>Address</dt><dd>{order.address || 'No address'}</dd></div>
              </dl>
            </div>

            <div className="detailBlock">
              <h3>Order</h3>
              <dl className="detailList">
                <div><dt>Order ID</dt><dd>{order.id}</dd></div>
                <div><dt>Status</dt><dd>{order.status}</dd></div>
                <div><dt>Created</dt><dd>{formatDate(order.createdAt)}</dd></div>
                <div><dt>Payment</dt><dd>{order.paymentMethod || 'Not set'}</dd></div>
                {order.cancelReason ? (
                  <div className="wideDetail"><dt>Cancel reason</dt><dd>{order.cancelReason}</dd></div>
                ) : null}
              </dl>
            </div>

            <div className="detailBlock">
              <h3>Payment Summary</h3>
              <dl className="detailList">
                <div><dt>Products subtotal</dt><dd>{money(productsSubtotal)}</dd></div>
                <div><dt>Shipping</dt><dd>{money(order.shippingCost || 0)}</dd></div>
                <div><dt>Reward redeemed</dt><dd>{order.rewardPointsRedeemed || 0} points</dd></div>
                <div><dt>Reward earned</dt><dd>{order.rewardPointsEarned || 0} points</dd></div>
                <div><dt>Reward discount</dt><dd>-{money(order.rewardDiscount || 0)}</dd></div>
                <div><dt>Total</dt><dd>{money(order.total)}</dd></div>
              </dl>
            </div>
          </section>

          <section className="panel">
            <div className="panelHead">
              <div>
                <p className="eyebrow">Shopping cart</p>
                <h3>Products</h3>
              </div>
              <ShoppingCart size={21} />
            </div>
            <div className="shopOrderProductsList">
              {order.items.map(item => (
                <div className="shopOrderProductRow" key={`${order.id}-${item.product.id}`}>
                  {item.product.imageUrl ? (
                    <img src={resolveApiAssetUrl(item.product.imageUrl)} alt={item.product.title} />
                  ) : (
                    <div className="shopOrderProductIcon"><Package size={22} /></div>
                  )}
                  <div>
                    <strong>{item.product.title}</strong>
                    <p>{item.product.category}</p>
                    <small>{item.product.description || 'No description'}</small>
                  </div>
                  <div className="shopOrderProductPrice">
                    <strong>{item.quantity}x {money(item.price)}</strong>
                    <span>{money(Number(item.price || 0) * Number(item.quantity || 0))}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </AdminShell>
  );
}