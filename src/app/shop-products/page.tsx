'use client';

import {useEffect, useState} from 'react';
import {PackagePlus, RefreshCw} from 'lucide-react';
import {AdminShell} from '@/components/AdminShell';
import {Field, ImagePickerField} from '@/components/AdminFields';
import {
  AdminShopProduct,
  getShopProducts,
  resolveAssetUrl,
  saveShopProduct,
} from '@/lib/api';
import {money} from '@/lib/adminUi';

const emptyProduct: Partial<AdminShopProduct> = {
  title: '',
  category: 'Home Care',
  description: '',
  price: 0,
  originalPrice: 0,
  imageUrl: '',
  stock: 10,
  isActive: true,
};

export default function ShopProductsPage() {
  const [products, setProducts] = useState<AdminShopProduct[]>([]);
  const [form, setForm] = useState<Partial<AdminShopProduct>>(emptyProduct);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    setProducts(await getShopProducts());
  };

  useEffect(() => {
    loadData().catch(() => setMessage('Could not load shop products.'));
  }, []);

  const handleSave = async () => {
    try {
      await saveShopProduct(form);
      setForm(emptyProduct);
      await loadData();
      setMessage('Shop product saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save product.');
    }
  };

  return (
    <AdminShell
      eyebrow="Store catalog"
      title="Shop Products"
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
            <p className="eyebrow">Products shown in mobile Store tab</p>
            <h3>{form.id ? 'Edit Product' : 'Add Product'}</h3>
          </div>
          <PackagePlus size={22} />
        </div>

        <div className="serviceEditor">
          <div className="formGrid">
            <Field
              label="Title"
              value={form.title || ''}
              onChange={title => setForm({...form, title})}
            />
            <Field
              label="Category"
              value={form.category || ''}
              onChange={category => setForm({...form, category})}
            />
            <ImagePickerField
              label="Product Image"
              value={form.imageUrl}
              onChange={imageUrl => setForm({...form, imageUrl})}
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
              label="Stock"
              type="number"
              value={String(form.stock || '')}
              onChange={stock => setForm({...form, stock: Number(stock)})}
            />
            <label className="field">
              <span>Status</span>
              <select
                value={form.isActive === false ? 'inactive' : 'active'}
                onChange={event =>
                  setForm({...form, isActive: event.target.value === 'active'})
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <label className="field fieldWide">
              <span>Description</span>
              <textarea
                value={form.description || ''}
                onChange={event =>
                  setForm({...form, description: event.target.value})
                }
              />
            </label>
          </div>

          <div className="mobilePreview">
            <p className="eyebrow">Store preview</p>
            <div className="appServiceCard">
              <div
                className="appServiceHero"
                style={{
                  backgroundImage: form.imageUrl
                    ? `url(${resolveAssetUrl(form.imageUrl)})`
                    : undefined,
                }}
              >
                <span>{form.category || 'Product'}</span>
              </div>
              <div className="appServiceBody">
                <strong>{form.title || 'Product title'}</strong>
                <small>{form.category || 'Category'}</small>
                <p>{form.description || 'Product description appears here.'}</p>
                <div className="appServiceFooter">
                  <b>{money(Number(form.price || 0))}</b>
                  <button>Add</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button className="primaryButton" onClick={handleSave}>
          Save Product
        </button>
      </section>

      <section className="panel">
        <div className="panelHead">
          <div>
            <p className="eyebrow">Existing</p>
            <h3>Products</h3>
          </div>
          <span className="countPill">{products.length} products</span>
        </div>
        <div className="serviceGrid">
          {products.map(product => (
            <button
              className="serviceTile"
              key={product.id}
              onClick={() => {
                setForm(product);
                window.scrollTo({top: 0, behavior: 'smooth'});
              }}
            >
              <span>{product.category}</span>
              <strong>{product.title}</strong>
              <small>
                {money(product.price)} - stock {product.stock}
              </small>
            </button>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
