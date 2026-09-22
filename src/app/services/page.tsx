'use client';

import { useEffect, useState, useCallback } from 'react';
import { ChevronRight, Layers, PackagePlus, Plus, RefreshCw, Trash2, Edit2, Upload, FolderPlus, FilePlus, X } from 'lucide-react';
import { AdminShell } from '@/components/AdminShell';
import { Field, ImagePickerField } from '@/components/AdminFields';
import {
  AdminCategory,
  AdminSubcategory,
  AdminService,
  getAdminCatalogue,
  getCategories,
  getServices,
  resolveAssetUrl,
  saveService,
  saveAdminCategory,
  saveAdminSubcategory,
  importServiceCatalog,
  CatalogImportPreview,
  deleteAdminService,
  deleteAdminCategory,
  deleteAdminSubcategory,
} from '@/lib/api';
import {
  categoryHeroColor,
  emptyService,
  fallbackCategories,
  money,
} from '@/lib/adminUi';

/* --- Shared Modal --- */
function Modal({ title, onClose, children, width = 640 }: { title: string, onClose: () => void, children: React.ReactNode, width?: number }) {
  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalContent" style={{maxWidth: width}} onClick={e => e.stopPropagation()}>
        <div className="modalHeader">
          <h3>{title}</h3>
          <button className="ghostButton" style={{height: 32, padding: '0 8px'}} onClick={onClose}><X size={18}/></button>
        </div>
        <div className="modalBody">
          {children}
        </div>
      </div>
    </div>
  );
}

const blankWorkPrice = { title: '', description: '', imageUrl: '', price: 0, pricingMode: 'fixed' as 'fixed' | 'per_sqft', sortOrder: 0 };
function compactList(items?: string[]) { return (items || []).map(item => item.trim()).filter(Boolean); }
function ensureEditableList(items?: string[]) { const compacted = compactList(items); return compacted.length ? compacted : ['']; }
type ServiceListKey = 'includes' | 'details' | 'excludes';

export default function ServicesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [subcategories, setSubcategories] = useState<AdminSubcategory[]>([]);
  const [services, setServices] = useState<AdminService[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Browser state
  const [selectedCategory, setSelectedCategory] = useState<AdminCategory | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<AdminSubcategory | null>(null);

  // Modal states
  const [editingCategory, setEditingCategory] = useState<Partial<AdminCategory> | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Partial<AdminSubcategory> | null>(null);
  const [editingService, setEditingService] = useState<Partial<AdminService> | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Import State
  const [fileDataUrl, setFileDataUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<CatalogImportPreview | null>(null);

  const loadData = async () => {
    setLoading(true);
    setMessage('');
    try {
      const [nextServices, catalogue] = await Promise.all([
        getServices(),
        getAdminCatalogue().catch(() => null),
      ]);
      setServices(nextServices);
      setCategories(catalogue?.categories || fallbackCategories);
      setSubcategories(catalogue?.subcategories || []);
    } catch {
      setMessage('Could not load catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  const handleSaveCategory = async () => {
    if (!editingCategory?.title) return;
    setBusy(true);
    try {
      await saveAdminCategory(editingCategory);
      setEditingCategory(null);
      void loadData();
    } catch (e) {
      alert('Error saving category');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!editingCategory?.id) return;
    if (!confirm(`Delete category "${editingCategory.title}"?`)) return;
    setBusy(true);
    try {
      await deleteAdminCategory(editingCategory.id);
      setEditingCategory(null);
      setSelectedCategory(null);
      void loadData();
    } catch (e) {
      alert('Error deleting category');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveSubcategory = async () => {
    if (!editingSubcategory?.title || !editingSubcategory?.categoryId) return;
    setBusy(true);
    try {
      await saveAdminSubcategory(editingSubcategory as AdminSubcategory);
      setEditingSubcategory(null);
      void loadData();
    } catch (e) {
      alert('Error saving subcategory');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteSubcategory = async () => {
    if (!editingSubcategory?.id) return;
    if (!confirm(`Delete subcategory "${editingSubcategory.title}"?`)) return;
    setBusy(true);
    try {
      await deleteAdminSubcategory(editingSubcategory.id);
      setEditingSubcategory(null);
      setSelectedSubcategory(null);
      void loadData();
    } catch (e) {
      alert('Error deleting subcategory');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveService = async () => {
    if (!editingService?.title || !editingService?.categoryId) return;
    setBusy(true);
    try {
      const validWorkPrices = (editingService.workPrices || []).map((w, i) => ({...w, price: Number(w.price||0), pricingMode: (w.pricingMode === 'per_sqft' ? 'per_sqft' : 'fixed') as 'fixed' | 'per_sqft', sortOrder: i})).filter(w => w.title && w.price > 0);
      const minPrice = validWorkPrices.length ? Math.min(...validWorkPrices.map(w => w.price)) : Number(editingService.price || 0);
      await saveService({
        ...editingService,
        price: minPrice,
        allowQuantity: editingService.allowQuantity !== false,
        includes: compactList(editingService.includes),
        excludes: compactList(editingService.excludes),
        details: compactList(editingService.details),
        workPrices: validWorkPrices,
      });
      setEditingService(null);
      void loadData();
    } catch (e) {
      alert('Error saving service');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteService = async () => {
    if (!editingService?.id) return;
    if (!confirm(`Delete service "${editingService.title}"?`)) return;
    setBusy(true);
    try {
      await deleteAdminService(editingService.id);
      setEditingService(null);
      void loadData();
    } catch (e) {
      alert('Error deleting service');
    } finally {
      setBusy(false);
    }
  };

  const importFile = async () => {
    if (!fileDataUrl || !preview) return;
    setBusy(true);
    try {
      await importServiceCatalog(fileDataUrl, true);
      setImportModalOpen(false);
      setFileDataUrl('');
      setPreview(null);
      void loadData();
    } catch (e) {
      alert('Import failed');
    } finally {
      setBusy(false);
    }
  };

  const handleCategoryClick = (cat: AdminCategory) => {
    setSelectedCategory(cat);
    setSelectedSubcategory(null);
  };
  const handleSubcategoryClick = (sub: AdminSubcategory) => {
    setSelectedSubcategory(sub);
  };
  const handleBack = () => {
    if (selectedSubcategory) setSelectedSubcategory(null);
    else setSelectedCategory(null);
  };

  const subsForCategory = selectedCategory ? subcategories.filter(s => s.categoryId === selectedCategory.id) : [];
  const activeServices = services.filter(s => {
    if (selectedSubcategory) return s.subcategoryId === selectedSubcategory.id;
    if (selectedCategory) return s.categoryId === selectedCategory.id && !s.subcategoryId;
    return false;
  });

  return (
    <AdminShell eyebrow="Workforce" title="Services Catalog" action={
      <div className="pageActions">
        <button className="ghostButton" onClick={() => setImportModalOpen(true)}><Upload size={17}/>Bulk Import</button>
        <button className="ghostButton" onClick={loadData}><RefreshCw size={17}/>Refresh</button>
      </div>
    }>
      {message && <div className="notice">{message}</div>}

      <section className="panel catalogBrowser">
        <div className="panelHead">
          <div><p className="eyebrow">Browse deployed services</p><h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Layers size={18} />Service Catalog</h3></div>
          <div style={{display:'flex', gap:10}}>
            {selectedCategory && <button className="ghostButton" onClick={handleBack}>? Back</button>}
            {!selectedCategory && <button className="primaryButton" onClick={() => setEditingCategory({ title: '', tint: '#006C49' })}><FolderPlus size={17}/>Add Category</button>}
            {selectedCategory && !selectedSubcategory && <button className="primaryButton" onClick={() => setEditingSubcategory({ title: '', categoryId: selectedCategory.id })}><FolderPlus size={17}/>Add Subcategory</button>}
            {selectedCategory && <button className="primaryButton" onClick={() => setEditingService({ ...emptyService, categoryId: selectedCategory.id, subcategoryId: selectedSubcategory?.id || null })}><FilePlus size={17}/>Add Service</button>}
          </div>
        </div>

        {selectedCategory && (
          <div className="catalogBreadcrumb">
            <span className="catalogCrumb" style={{ cursor: 'pointer', color: 'var(--green)' }} onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); }}>All Services</span>
            <ChevronRight size={14} />
            <span className="catalogCrumb" style={selectedSubcategory ? { cursor: 'pointer', color: 'var(--green)' } : { fontWeight: 700 }} onClick={selectedSubcategory ? () => setSelectedSubcategory(null) : undefined}>{selectedCategory.title}</span>
            {selectedSubcategory && <><ChevronRight size={14} /><span className="catalogCrumb" style={{ fontWeight: 700 }}>{selectedSubcategory.title}</span></>}
          </div>
        )}

        {loading ? <div style={{padding:20}}>Loading catalog...</div> : (
          <>
            {!selectedCategory && (
              <div className="catalogCategoryGrid">
                {categories.map(cat => (
                  <div key={cat.id} style={{position:'relative'}}>
                    <button className="catalogCategoryCard" style={{ borderColor: cat.tint, width:'100%' }} onClick={() => handleCategoryClick(cat)}>
                      <div className="catalogCategoryDot" style={{ background: cat.tint }} />
                      <div className="catalogCategoryInfo">
                        <strong>{cat.title}</strong>
                        <small>{subcategories.filter(s => s.categoryId === cat.id).length} sub-services</small>
                      </div>
                      <ChevronRight size={16} className="catalogChevron" />
                    </button>
                    <div style={{position:'absolute', top:12, right:40, display:'flex', gap:6}}>
                      <button className="ghostButton" style={{height:30, padding:'0 8px'}} onClick={(e) => { e.stopPropagation(); setEditingCategory(cat); }}><Edit2 size={14}/></button>
                      <button className="ghostButton" style={{height:30, padding:'0 8px', color:'#ef4444', borderColor:'#fca5a5', background:'#fff1f1'}} onClick={(e) => { e.stopPropagation(); setEditingCategory(cat); setTimeout(() => handleDeleteCategory(), 0); }}><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedCategory && !selectedSubcategory && subsForCategory.length > 0 && (
              <div className="catalogCategoryGrid" style={{marginBottom: 20}}>
                {subsForCategory.map(sub => (
                  <div key={sub.id} style={{position:'relative'}}>
                    <button className="catalogCategoryCard" style={{width:'100%'}} onClick={() => handleSubcategoryClick(sub)}>
                      <div className="catalogCategoryDot" style={{ background: selectedCategory.tint }} />
                      <div className="catalogCategoryInfo"><strong>{sub.title}</strong><small>{sub.description || 'Sub-service'}</small></div>
                      <ChevronRight size={16} className="catalogChevron" />
                    </button>
                    <div style={{position:'absolute', top:12, right:40, display:'flex', gap:6}}>
                      <button className="ghostButton" style={{height:30, padding:'0 8px'}} onClick={(e) => { e.stopPropagation(); setEditingSubcategory(sub); }}><Edit2 size={14}/></button>
                      <button className="ghostButton" style={{height:30, padding:'0 8px', color:'#ef4444', borderColor:'#fca5a5', background:'#fff1f1'}} onClick={(e) => { e.stopPropagation(); setEditingSubcategory(sub); setTimeout(() => handleDeleteSubcategory(), 0); }}><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(selectedSubcategory || (selectedCategory && subsForCategory.length === 0)) && (
              <div>
                <h4 style={{marginBottom: 14}}>{selectedSubcategory ? `Services in ${selectedSubcategory.title}` : `Direct Services in ${selectedCategory?.title}`}</h4>
                {activeServices.length === 0 ? <p style={{color:'var(--muted)'}}>No services here yet. Click "Add Service" above.</p> : (
                  <div className="catalogServiceGrid">
                    {activeServices.map(service => (
                      <div key={service.id} className="catalogServiceCard">
                        {service.imageUrl && <div className="catalogServiceImage" style={{ backgroundImage: `url(${resolveAssetUrl(service.imageUrl)})` }} />}
                        <div className="catalogServiceBody">
                          <strong>{service.title}</strong>
                          <small>{service.serviceType || 'Standard Visit'}</small>
                          <p className="catalogServiceDesc">{service.description}</p>
                          <div className="catalogServiceFooter">
                            <b>{money(service.price)}</b>
                            <div style={{display:'flex', gap:6}}>
                              <button className="ghostButton" style={{ height: 32, fontSize: 13 }} onClick={() => setEditingService(service)}>Edit</button>
                              <button className="ghostButton" style={{ height: 32, fontSize: 13, color:'#ef4444', borderColor:'#fca5a5', background:'#fff1f1' }} onClick={() => { setEditingService(service); setTimeout(() => handleDeleteService(), 0); }}><Trash2 size={15}/></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </section>

      {/* --- Category Modal --- */}
      {editingCategory && (
        <Modal title={editingCategory.id ? 'Edit Category' : 'Add Category'} onClose={() => setEditingCategory(null)}>
          <div className="formGrid" style={{marginBottom:20}}>
            <Field label="Category Title" value={editingCategory.title || ''} onChange={v => setEditingCategory({...editingCategory, title: v})} />
            <Field label="Subtitle" value={editingCategory.subtitle || ''} onChange={v => setEditingCategory({...editingCategory, subtitle: v})} />
            <Field label="Tint Color (Hex)" value={editingCategory.tint || '#006C49'} onChange={v => setEditingCategory({...editingCategory, tint: v})} />
            <ImagePickerField label="Mobile Icon" value={editingCategory.mobileIconUrl || ''} onChange={v => setEditingCategory({...editingCategory, mobileIconUrl: v})} />
            <ImagePickerField label="Desktop/Web Image" value={editingCategory.webImageUrl || ''} onChange={v => setEditingCategory({...editingCategory, webImageUrl: v})} />
          </div>
          <div style={{display:'flex', gap:10, justifyContent:'flex-end'}}>
            {editingCategory.id && <button className="dangerButton" onClick={handleDeleteCategory} disabled={busy}><Trash2 size={16}/>Delete</button>}
            <button className="ghostButton" onClick={() => setEditingCategory(null)}>Cancel</button>
            <button className="primaryButton" onClick={handleSaveCategory} disabled={busy || !editingCategory.title}>Save</button>
          </div>
        </Modal>
      )}

      {/* --- Subcategory Modal --- */}
      {editingSubcategory && (
        <Modal title={editingSubcategory.id ? 'Edit Subcategory' : 'Add Subcategory'} onClose={() => setEditingSubcategory(null)}>
          <div className="formGrid" style={{marginBottom:20}}>
            <Field label="Subcategory Title" value={editingSubcategory.title || ''} onChange={v => setEditingSubcategory({...editingSubcategory, title: v})} />
            <Field label="Description" value={editingSubcategory.description || ''} onChange={v => setEditingSubcategory({...editingSubcategory, description: v})} />
            <label className="field">
              <span>Parent Category</span>
              <select value={editingSubcategory.categoryId || ''} onChange={e => setEditingSubcategory({...editingSubcategory, categoryId: e.target.value})}>
                <option value="">Select category...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </label>
            <ImagePickerField label="Mobile Image" value={editingSubcategory.mobileIconUrl || ''} onChange={v => setEditingSubcategory({...editingSubcategory, mobileIconUrl: v})} />
            <ImagePickerField label="Desktop Image" value={editingSubcategory.webImageUrl || ''} onChange={v => setEditingSubcategory({...editingSubcategory, webImageUrl: v})} />
          </div>
          <div style={{display:'flex', gap:10, justifyContent:'flex-end'}}>
            {editingSubcategory.id && <button className="dangerButton" onClick={handleDeleteSubcategory} disabled={busy}><Trash2 size={16}/>Delete</button>}
            <button className="ghostButton" onClick={() => setEditingSubcategory(null)}>Cancel</button>
            <button className="primaryButton" onClick={handleSaveSubcategory} disabled={busy || !editingSubcategory.title || !editingSubcategory.categoryId}>Save</button>
          </div>
        </Modal>
      )}

      {/* --- Service Modal --- */}
      {editingService && (
        <Modal title={editingService.id ? 'Edit Service' : 'Add Service'} width={800} onClose={() => setEditingService(null)}>
          <div className="serviceEditor" style={{marginBottom:20}}>
            <div className="formGrid">
              <Field label="Title" value={editingService.title || ''} onChange={v => setEditingService({ ...editingService, title: v })} />
              <label className="field">
                <span>Category</span>
                <select value={editingService.categoryId || ''} onChange={e => setEditingService({ ...editingService, categoryId: e.target.value, subcategoryId: null })}>
                  <option value="">Select...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Sub-service</span>
                <select value={editingService.subcategoryId || ''} onChange={e => setEditingService({ ...editingService, subcategoryId: e.target.value || null })}>
                  <option value="">Direct service (no sub-service)</option>
                  {subcategories.filter(s => s.categoryId === editingService.categoryId).map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </label>
              <Field label="Unit / Description" value={editingService.serviceType || ''} onChange={v => setEditingService({ ...editingService, serviceType: v })} />
              <ImagePickerField label="Upload Service Image" value={editingService.imageUrl || ''} onChange={v => setEditingService({ ...editingService, imageUrl: v })} />
              <Field label="Minimum Price (PKR)" type="number" value={String(editingService.price || '')} onChange={v => setEditingService({ ...editingService, price: Number(v) })} />
              <Field label="Original Price (PKR)" type="number" value={String(editingService.originalPrice || '')} onChange={v => setEditingService({ ...editingService, originalPrice: Number(v) })} />
              
              <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, cursor: 'pointer'}}>
                <input type="checkbox" checked={editingService.allowQuantity !== false} onChange={e => setEditingService({ ...editingService, allowQuantity: e.target.checked })} style={{width: 18, height: 18}} />
                <span style={{fontWeight: 600}}>Allow Multiple Quantity (+/-) in App</span>
              </label>

              <div className="field fieldWide workPriceEditor" style={{marginTop: 10}}>
                <div className="workPriceHeader">
                  <span>Specific Work / Dynamic Prices</span>
                  <button type="button" className="ghostButton" onClick={() => setEditingService(c => ({...c, workPrices: [...(c?.workPrices || []), {...blankWorkPrice, sortOrder: c?.workPrices?.length || 0}]}))}><Plus size={15} />Add Work</button>
                </div>
                {(editingService.workPrices?.length ? editingService.workPrices : [blankWorkPrice]).map((work, index) => (
                  <div className="workPriceRow" key={index}>
                    <ImagePickerField label="Image" value={work.imageUrl || ''} onChange={v => { const w = [...(editingService.workPrices||[blankWorkPrice])]; w[index] = {...w[index], imageUrl: v}; setEditingService({...editingService, workPrices: w}); }} />
                    <input value={work.title || ''} onChange={e => { const w = [...(editingService.workPrices||[blankWorkPrice])]; w[index] = {...w[index], title: e.target.value}; setEditingService({...editingService, workPrices: w}); }} placeholder="Work name e.g. Design A" />
                    <input value={work.description || ''} onChange={e => { const w = [...(editingService.workPrices||[blankWorkPrice])]; w[index] = {...w[index], description: e.target.value}; setEditingService({...editingService, workPrices: w}); }} placeholder="Note" />
                    <select
                      value={work.pricingMode === 'per_sqft' ? 'per_sqft' : 'fixed'}
                      onChange={e => { const w = [...(editingService.workPrices||[blankWorkPrice])]; w[index] = {...w[index], pricingMode: e.target.value as 'fixed' | 'per_sqft'}; setEditingService({...editingService, workPrices: w}); }}
                      title="How this work is charged in the app"
                    >
                      <option value="fixed">Fixed price</option>
                      <option value="per_sqft">Per sq ft</option>
                    </select>
                    <input
                      type="number"
                      value={String(work.price || '')}
                      onChange={e => { const w = [...(editingService.workPrices||[blankWorkPrice])]; w[index] = {...w[index], price: Number(e.target.value)}; setEditingService({...editingService, workPrices: w}); }}
                      placeholder={work.pricingMode === 'per_sqft' ? 'Rs / sq ft' : 'Price'}
                    />
                    <button type="button" className="secondaryButton" onClick={() => { const w = [...(editingService.workPrices||[])]; w.splice(index, 1); setEditingService({...editingService, workPrices: w}); }} disabled={(editingService.workPrices||[]).length <= 1}><Trash2 size={15} /></button>
                  </div>
                ))}
                <small style={{color: 'var(--muted)'}}>
                  Per sq ft works (e.g. wall texture designs) ask the customer for area size in the app and charge price × square feet. These bookings require a 2-day advance appointment.
                </small>
              </div>

              <Field label="Duration" value={editingService.duration || ''} onChange={v => setEditingService({ ...editingService, duration: v })} />
              <Field label="Badge" value={editingService.badge || ''} onChange={v => setEditingService({ ...editingService, badge: v })} />
              <label className="field fieldWide"><span>Description</span><textarea value={editingService.description || ''} onChange={e => setEditingService({ ...editingService, description: e.target.value })} /></label>
              <label className="field fieldWide"><span>Details Description</span><textarea value={editingService.detailDescription || ''} onChange={e => setEditingService({ ...editingService, detailDescription: e.target.value })} /></label>

              {(['includes', 'details', 'excludes'] as ServiceListKey[]).map(key => (
                <div key={key} className="field fieldWide listEditor">
                  <div className="listEditorHeader"><span>{key.toUpperCase()}</span><button type="button" className="ghostButton" onClick={() => { const arr = ensureEditableList(editingService[key]); arr.push(''); setEditingService({...editingService, [key]: arr}); }}><Plus size={15}/>Add Item</button></div>
                  {ensureEditableList(editingService[key]).map((item, index) => (
                    <div className="listEditorRow" key={index}>
                      <input value={item} onChange={e => { const arr = ensureEditableList(editingService[key]); arr[index] = e.target.value; setEditingService({...editingService, [key]: arr}); }} placeholder="Item text..." />
                      <button type="button" className="secondaryButton" onClick={() => { const arr = ensureEditableList(editingService[key]); arr.splice(index, 1); setEditingService({...editingService, [key]: arr.length ? arr : ['']}); }}><Trash2 size={15}/></button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div style={{display:'flex', gap:10, justifyContent:'flex-end'}}>
            {editingService.id && <button className="dangerButton" onClick={handleDeleteService} disabled={busy}><Trash2 size={16}/>Delete</button>}
            <button className="ghostButton" onClick={() => setEditingService(null)}>Cancel</button>
            <button className="primaryButton" onClick={handleSaveService} disabled={busy || !editingService.title}>Save</button>
          </div>
        </Modal>
      )}

      {/* --- Bulk Import Modal --- */}
      {importModalOpen && (
        <Modal title="Bulk Catalog Import" onClose={() => setImportModalOpen(false)}>
          <div className="formGrid" style={{marginBottom: 20}}>
            <label className="field fieldWide">
              <span>Excel file (.xlsx)</span>
              <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const r = new FileReader();
                r.onload = () => { if (typeof r.result === 'string') { setFileDataUrl(r.result); setFileName(file.name); setPreview(null); } };
                r.readAsDataURL(file);
              }} />
              {fileName && <small>Selected: {fileName}</small>}
            </label>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="ghostButton" onClick={() => setImportModalOpen(false)}>Cancel</button>
            <button className="secondaryButton" disabled={!fileDataUrl || busy} onClick={async () => {
              setBusy(true);
              try { setPreview(await importServiceCatalog(fileDataUrl)); }
              catch(e) { alert('Preview failed'); }
              finally { setBusy(false); }
            }}>Validate</button>
            <button className="primaryButton" disabled={!preview || busy} onClick={importFile}>{busy ? 'Working�' : 'Import Catalog'}</button>
          </div>
          {preview && <div className="noticeSuccess" style={{ marginTop: 16 }}>Ready to import {preview.rows} services across {preview.categories.length} main categories and {preview.subcategories} subcategory/direct groups.</div>}
        </Modal>
      )}

    </AdminShell>
  );
}
