'use client';

import {useCallback, useEffect, useState} from 'react';
import Link from 'next/link';
import {Edit2, Eye, PackagePlus, RefreshCw, Search} from 'lucide-react';
import {AdminShell} from '@/components/AdminShell';
import {AdminShopProduct, getShopProducts, resolveAssetUrl} from '@/lib/api';
import {money} from '@/lib/adminUi';

const PAGE_SIZE = 10;
export default function ShopProductsPage(){
 const [products,setProducts]=useState<AdminShopProduct[]>([]); const [total,setTotal]=useState(0); const [page,setPage]=useState(1); const [search,setSearch]=useState(''); const [category,setCategory]=useState('All'); const [categories,setCategories]=useState<Array<{name:string;total:number}>>([]); const [loading,setLoading]=useState(true); const [message,setMessage]=useState('');
 const load=useCallback(async()=>{setLoading(true);setMessage('');try{const data=await getShopProducts({page,limit:PAGE_SIZE,search,category});setProducts(data.products || []);setTotal(Number(data.total || 0));setCategories(data.categories || []);}catch{setMessage('Could not load shop products.')}finally{setLoading(false)}},[page,search,category]);
 useEffect(()=>{const timer=setTimeout(()=>void load(),search?300:0);return()=>clearTimeout(timer)},[load,search]);
 const pages=Math.max(1,Math.ceil(total/PAGE_SIZE)); const first=total?(page-1)*PAGE_SIZE+1:0; const last=Math.min(page*PAGE_SIZE,total);
 return <AdminShell eyebrow="Store catalog" title="Shop Products" action={<div className="pageActions"><button className="ghostButton" onClick={()=>void load()}><RefreshCw size={17}/>Refresh</button><Link className="primaryButton" href="/shop-products/new"><PackagePlus size={17}/>Add Product</Link></div>}>
  {message&&<div className="notice">{message}</div>}
  <section className="panel">
   <div className="productListToolbar"><label className="productSearch"><Search size={17}/><input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Search products..."/></label><select value={category} onChange={e=>{setCategory(e.target.value);setPage(1)}}><option>All</option>{categories.map(item=><option key={item.name}>{item.name}</option>)}</select></div>
   <div className="adminTableWrap"><table className="productTable"><thead><tr><th>Product</th><th>Category</th><th>Stock</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead><tbody>{products.map(product=><tr key={product.id}><td><div className="productTableIdentity">{product.imageUrl?<img src={resolveAssetUrl(product.imageUrl)} alt=""/>:<div className="productThumbFallback">P</div>}<div><strong>{product.title}</strong><small>{product.id}</small></div></div></td><td>{product.category}</td><td><span className={product.stock>0?'stockOk':'stockOut'}>{product.stock>0?product.stock:'Out of stock'}</span></td><td><strong>{money(product.price)}</strong>{product.originalPrice>product.price&&<small className="tableSubtext">{money(product.originalPrice)}</small>}</td><td><span className={product.isActive?'productStatus active':'productStatus inactive'}>{product.isActive?'Active':'Inactive'}</span></td><td><div className="rowActions"><Link title="View details" href={`/shop-products/${encodeURIComponent(product.id)}`}><Eye size={17}/></Link><Link title="Edit product" href={`/shop-products/${encodeURIComponent(product.id)}/edit`}><Edit2 size={17}/></Link></div></td></tr>)}</tbody></table>{!loading&&!products.length&&<div className="empty">No products found.</div>}{loading&&<div className="empty">Loading products...</div>}</div>
   <div className="paginationBar"><span>Showing {first}-{last} of {total}</span><div className="paginationActions"><button className="ghostButton" disabled={page<=1} onClick={()=>setPage(v=>v-1)}>Previous</button><strong>Page {page} of {pages}</strong><button className="ghostButton" disabled={page>=pages} onClick={()=>setPage(v=>v+1)}>Next</button></div></div>
  </section>
 </AdminShell>
}