'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import Link from 'next/link';
import {Download, Edit2, Eye, PackagePlus, RefreshCw, Search, Trash2, Upload} from 'lucide-react';
import {AdminShell} from '@/components/AdminShell';
import {AdminShopProduct, ShopImportResult, bulkDeleteShopProducts, deleteAllShopProducts, deleteShopProduct, getShopProducts, importShopProductsExcel, resolveAssetUrl} from '@/lib/api';
import {money} from '@/lib/adminUi';

const PAGE_SIZE = 10;

export default function ShopProductsPage() {
  const [products, setProducts] = useState<AdminShopProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [categories, setCategories] = useState<Array<{name: string; total: number}>>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ShopImportResult | null>(null);
  const [message, setMessage] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const allSelected = products.length > 0 && products.every(p => selected.has(p.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(products.map(p => p.id)));
  const toggleOne = (id: string) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const data = await getShopProducts({page, limit: PAGE_SIZE, search, category});
      setProducts(data.products || []);
      setTotal(Number(data.total || 0));
      setCategories(data.categories || []);
    } catch {
      setMessage('Could not load shop products.');
    } finally {
      setLoading(false);
    }
  }, [page, search, category]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const handleExportExcel = async () => {
    setExporting(true);
    setMessage('');
    try {
      const token = localStorage.getItem('adminToken') || '';
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const url = new URL(`${baseUrl}/api/admin/shop/products-export/excel`);
      if (search) url.searchParams.set('search', search);
      if (category) url.searchParams.set('category', category);
      
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Export failed');
      
      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `ustaadpro-shop-products-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(downloadUrl);
    } catch {
      setMessage('Could not export products.');
    } finally {
      setExporting(false);
    }
  };

  const handleImportExcelFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setImporting(true);
    setMessage('');
    setImportResult(null);
    try {
      const result = await importShopProductsExcel(file);
      setImportResult(result);
      void load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteOne = async (product: AdminShopProduct) => {
    if (!confirm(`Delete "${product.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteShopProduct(product.id);
      setSelected(prev => { const s = new Set(prev); s.delete(product.id); return s; });
      void load();
    } catch {
      setMessage('Could not delete product.');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} selected product(s)? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await bulkDeleteShopProducts(ids);
      setSelected(new Set());
      void load();
    } catch {
      setMessage('Could not delete selected products.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(`⚠️ Delete ALL ${total} shop products? This will remove every product from the database and cannot be undone.`)) return;
    const confirmation = prompt('Are you absolutely sure? Type "DELETE ALL" to confirm.');
    if (confirmation !== 'DELETE ALL') return;
    setDeleting(true);
    try {
      const data = await deleteAllShopProducts();
      setMessage(data.message || 'All products deleted.');
      setSelected(new Set());
      void load();
    } catch {
      setMessage('Could not delete all products.');
    } finally {
      setDeleting(false);
    }
  };

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const first = total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const last = Math.min(page * PAGE_SIZE, total);

  return (
    <AdminShell eyebrow="Store catalog" title="Shop Products" action={
      <div className="pageActions">
        <input
          ref={importInputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          style={{display: 'none'}}
          onChange={handleImportExcelFile}
        />
        <button className="ghostButton" onClick={() => importInputRef.current?.click()} disabled={importing}>
          <Upload size={17}/>{importing ? 'Importing...' : 'Import Excel'}
        </button>
        <button className="ghostButton" onClick={handleExportExcel} disabled={exporting}>
          <Download size={17}/>{exporting ? 'Exporting...' : 'Export Excel'}
        </button>
        <button className="ghostButton" onClick={() => void load()}><RefreshCw size={17}/>Refresh</button>
        <Link className="primaryButton" href="/shop-products/new"><PackagePlus size={17}/>Add Product</Link>
      </div>
    }>
      {message && <div className="notice">{message}</div>}
      {importResult && (
        <div className={importResult.errors.length ? 'notice' : 'noticeSuccess'} style={{marginBottom: 12}}>
          <strong>{importResult.message}</strong>
          {importResult.errors.length > 0 && (
            <ul style={{marginTop: 6, paddingLeft: 18}}>
              {importResult.errors.map((e, i) => <li key={i} style={{fontSize: 12}}>{e}</li>)}
            </ul>
          )}
          <button style={{marginTop: 6, fontSize: 12, cursor: 'pointer', background: 'none', border: 'none', textDecoration: 'underline'}} onClick={() => setImportResult(null)}>Dismiss</button>
        </div>
      )}
      <section className="panel">
        <div className="productListToolbar">
          <div style={{display:'flex', gap:10, alignItems:'center'}}>
            <label className="productSearch"><Search size={17}/><input value={search} onChange={e => {setSearch(e.target.value); setPage(1);}} placeholder="Search products..."/></label>
            <select value={category} onChange={e => {setCategory(e.target.value); setPage(1);}}>
              <option>All</option>
              {categories.map(item => <option key={item.name}>{item.name}</option>)}
            </select>
          </div>
          {total > 0 && (
            <button className="dangerButton" onClick={handleDeleteAll} disabled={deleting || loading} style={{marginLeft: 'auto'}}>
              <Trash2 size={15}/>Delete All Products
            </button>
          )}
        </div>
        {selected.size > 0 && (
          <div style={{display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid #e5e7eb', marginBottom:4}}>
            <span style={{fontSize:13, color:'#64748b'}}>{selected.size} selected</span>
            <button className="dangerButton" onClick={handleBulkDelete} disabled={deleting}>
              <Trash2 size={15}/>{deleting ? 'Deleting...' : `Delete ${selected.size}`}
            </button>
            <button className="ghostButton" style={{fontSize:13}} onClick={() => setSelected(new Set())}>Clear selection</button>
          </div>
        )}
        <div className="adminTableWrap">
          <table className="productTable">
            <thead><tr><th style={{width:36}}><input type="checkbox" checked={allSelected} onChange={toggleAll}/></th><th>Product</th><th>Category</th><th>Brand</th><th>Stock</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id} style={selected.has(product.id) ? {background:'#fef9ec'} : {}}>
                  <td><input type="checkbox" checked={selected.has(product.id)} onChange={() => toggleOne(product.id)}/></td>
                  <td><div className="productTableIdentity">{product.imageUrl ? <img src={resolveAssetUrl(product.imageUrl)} alt=""/> : <div className="productThumbFallback">P</div>}<div><strong>{product.title}</strong><small>{product.id}</small></div></div></td>
                  <td>{product.category}</td>
                  <td>{product.brand || <span style={{color:'#aaa',fontStyle:'italic'}}>—</span>}</td>
                  <td><span className={product.stock > 0 ? 'stockOk' : 'stockOut'}>{product.stock > 0 ? product.stock : 'Out of stock'}</span></td>
                  <td><strong>{money(product.price)}</strong>{product.originalPrice > product.price && <small className="tableSubtext">{money(product.originalPrice)}</small>}</td>
                  <td><span className={product.isActive ? 'productStatus active' : 'productStatus inactive'}>{product.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td><div className="rowActions">
                    <Link title="View details" href={`/shop-products/${encodeURIComponent(product.id)}`}><Eye size={17}/></Link>
                    <Link title="Edit product" href={`/shop-products/${encodeURIComponent(product.id)}/edit`}><Edit2 size={17}/></Link>
                    <button title="Delete product" onClick={() => handleDeleteOne(product)} disabled={deleting} style={{background:'none',border:'none',cursor:'pointer',color:'#ef4444',padding:'2px 4px',display:'flex',alignItems:'center'}}><Trash2 size={16}/></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !products.length && <div className="empty">No products found.</div>}
          {loading && <div className="empty">Loading products...</div>}
        </div>
        <div className="paginationBar">
          <span>Showing {first}–{last} of {total}</span>
          <div className="paginationActions">
            <button className="ghostButton" disabled={page <= 1} onClick={() => setPage(v => v - 1)}>Previous</button>
            <strong>Page {page} of {pages}</strong>
            <button className="ghostButton" disabled={page >= pages} onClick={() => setPage(v => v + 1)}>Next</button>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}