'use client';

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {ArrowLeft, Save} from 'lucide-react';
import {Field, ImagePickerField} from '@/components/AdminFields';
import {AdminShopProduct, getShopProduct, resolveAssetUrl, saveShopProduct} from '@/lib/api';
import {money} from '@/lib/adminUi';

const emptyProduct: Partial<AdminShopProduct> = {title: '', category: 'Home Care', brand: '', description: '', price: 0, originalPrice: 0, imageUrl: '', stock: 10, isActive: true};

export function ProductEditor({productId}: {productId?: string}) {
  const router = useRouter();
  const [form, setForm] = useState<Partial<AdminShopProduct>>(emptyProduct);
  const [loading, setLoading] = useState(Boolean(productId));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!productId) return;
    getShopProduct(productId).then(setForm).catch(error => setMessage(error instanceof Error ? error.message : 'Could not load product.')).finally(() => setLoading(false));
  }, [productId]);

  const save = async () => {
    setSaving(true); setMessage('');
    try {
      const result = await saveShopProduct(form) as {id: string};
      router.push(`/shop-products/${encodeURIComponent(result.id || productId || '')}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save product.');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="empty">Loading product...</div>;
  return <>
    {message && <div className="notice">{message}</div>}
    <section className="panel productEditorPage">
      <div className="panelHead"><div><p className="eyebrow">Product information</p><h3>{productId ? 'Edit Product' : 'Add Product'}</h3></div><Link className="ghostButton" href={productId ? `/shop-products/${encodeURIComponent(productId)}` : '/shop-products'}><ArrowLeft size={16}/>Cancel</Link></div>
      <div className="serviceEditor">
        <div className="formGrid">
          <Field label="Title" value={form.title || ''} onChange={title => setForm({...form, title})}/>
          <Field label="Category" value={form.category || ''} onChange={category => setForm({...form, category})}/>
          <Field label="Brand (Optional)" value={form.brand || ''} onChange={brand => setForm({...form, brand})}/>
          <ImagePickerField label="Product Image" value={form.imageUrl} onChange={imageUrl => setForm({...form, imageUrl})}/>
          <Field label="Price (PKR)" type="number" value={String(form.price ?? '')} onChange={price => setForm({...form, price: Number(price)})}/>
          <Field label="Original Price (PKR)" type="number" value={String(form.originalPrice ?? '')} onChange={originalPrice => setForm({...form, originalPrice: Number(originalPrice)})}/>
          <Field label="Stock" type="number" value={String(form.stock ?? '')} onChange={stock => setForm({...form, stock: Number(stock)})}/>
          <label className="field"><span>Status</span><select value={form.isActive === false ? 'inactive' : 'active'} onChange={e => setForm({...form, isActive: e.target.value === 'active'})}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
          <label className="field fieldWide"><span>Description</span><textarea value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})}/></label>
        </div>
        <div className="mobilePreview"><p className="eyebrow">Store preview</p><div className="appServiceCard"><div className="appServiceHero" style={{backgroundImage: form.imageUrl ? `url(${resolveAssetUrl(form.imageUrl)})` : undefined}}><span>{form.category || 'Product'}</span></div><div className="appServiceBody"><strong>{form.title || 'Product title'}</strong><small>{form.category || 'Category'}</small><p>{form.description || 'Product description appears here.'}</p><div className="appServiceFooter"><b>{money(Number(form.price || 0))}</b><button>Add</button></div></div></div></div>
      </div>
      <div className="productFormActions"><Link className="ghostButton" href="/shop-products">Cancel</Link><button className="primaryButton" disabled={saving} onClick={save}><Save size={17}/>{saving ? 'Saving...' : 'Save Product'}</button></div>
    </section>
  </>;
}