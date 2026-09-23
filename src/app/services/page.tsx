'use client';

import { useEffect, useState, useCallback } from 'react';
import { ChevronRight, Layers, PackagePlus, Plus, RefreshCw, Trash2, Edit2, Upload, FolderPlus, FilePlus, X, Copy, AlertCircle, Calculator } from 'lucide-react';
import { AdminShell } from '@/components/AdminShell';
import { Field, ImagePickerField } from '@/components/AdminFields';
import {
  AdminCategory,
  AdminSubcategory,
  AdminService,
  AdminServiceWorkPrice,
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

/* --- Work Price / Texture Sub-Category Editor ---
 * Card-based editor for a service's specific works (e.g. texture designs).
 * Each card = one sub-category in the customer app with its own image and
 * rate. Per-sqft rows activate the square-feet calculator in the app.
 */
function WorkPriceEditor({ value, onChange }: { value: AdminServiceWorkPrice[]; onChange: (next: AdminServiceWorkPrice[]) => void }) {
  const rows = value || [];
  const anyPerSqft = rows.some(w => w.pricingMode === 'per_sqft');
  const allPerSqft = rows.length > 0 && rows.every(w => w.pricingMode === 'per_sqft');
  const perSqftPrices = rows
    .filter(w => w.pricingMode === 'per_sqft' && Number(w.price || 0) > 0)
    .map(w => Number(w.price));
  const rateRange = perSqftPrices.length
    ? perSqftPrices.length > 1
      ? `Rs ${Math.min(...perSqftPrices)} – Rs ${Math.max(...perSqftPrices)}/sq ft`
      : `Rs ${perSqftPrices[0]}/sq ft`
    : '';

  const updateRow = (index: number, patch: Partial<AdminServiceWorkPrice>) =>
    onChange(rows.map((w, i) => (i === index ? { ...w, ...patch } : w)));

  const addRow = () => {
    const lastMode = rows.length ? rows[rows.length - 1].pricingMode : 'fixed';
    onChange([...rows, { ...blankWorkPrice, pricingMode: lastMode || 'fixed', sortOrder: rows.length }]);
  };

  const removeRow = (index: number) => onChange(rows.filter((_, i) => i !== index));

  const duplicateRow = (index: number) => {
    const source = rows[index];
    const copy: AdminServiceWorkPrice = {
      ...source,
      id: undefined,
      title: source.title ? `${source.title} (copy)` : '',
      price: 0,
    };
    onChange([...rows.slice(0, index + 1), copy, ...rows.slice(index + 1)]);
  };

  const isIncomplete = (w: AdminServiceWorkPrice) => {
    const started = (w.title && w.title.trim()) || Number(w.price || 0) > 0 || w.pricingMode === 'per_sqft';
    return Boolean(started && (!(w.title && w.title.trim()) || !(Number(w.price || 0) > 0)));
  };

  return (
    <div className="field fieldWide workPriceEditor" style={{ marginTop: 10 }}>
      <div className="workPriceHeader">
        <span>
          {anyPerSqft ? 'Texture Sub-Categories / Designs & Pricing' : 'Specific Work / Dynamic Prices'}
        </span>
        <button type="button" className="primaryButton" style={{ height: 36 }} onClick={addRow}>
          <Plus size={15} />Add Sub-Category
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="workEmptyState">
          <strong>No sub-categories yet</strong>
          <p>
            Add texture designs (e.g. “Design A”, “Design B”). Each one gets its own image and its own
            rate, and appears in the customer app as a selectable sub-category.
          </p>
          <button type="button" className="secondaryButton" onClick={addRow}><Plus size={15} />Add first design</button>
        </div>
      ) : (
        <div className="workCards">
          {rows.map((work, index) => (
            <div className={isIncomplete(work) ? 'workCard incomplete' : 'workCard'} key={index}>
              <div className="workCardImg">
                <ImagePickerField
                  label="Design image"
                  value={work.imageUrl || ''}
                  onChange={v => updateRow(index, { imageUrl: v })}
                />
              </div>
              <div className="workCardFields">
                <div className="workCardTop">
                  <span className="workCardIndex">{index + 1}</span>
                  <span className="workCardNamePreview">
                    {work.title?.trim() || 'Unnamed design'}
                  </span>
                  {work.pricingMode === 'per_sqft' && (
                    <span className="workModeChip"><Calculator size={12} />Per sq ft</span>
                  )}
                  <div className="workCardActions" style={{ marginLeft: 'auto' }}>
                    <button type="button" className="ghostButton" style={{ height: 30, padding: '0 8px' }} title="Duplicate this design" onClick={() => duplicateRow(index)}><Copy size={14} /></button>
                    <button
                      type="button"
                      className="ghostButton"
                      style={{ height: 30, padding: '0 8px', color: '#ef4444', borderColor: '#fca5a5', background: '#fff1f1' }}
                      title="Remove this design"
                      onClick={() => removeRow(index)}
                    ><Trash2 size={14} /></button>
                  </div>
                </div>

                <label className="workField">
                  <span className="workFieldLabel">Design name (shown in app)</span>
                  <input
                    value={work.title || ''}
                    onChange={e => updateRow(index, { title: e.target.value })}
                    placeholder="e.g. Wall Texture Design A"
                  />
                </label>

                <label className="workField">
                  <span className="workFieldLabel">Short note (optional)</span>
                  <input
                    value={work.description || ''}
                    onChange={e => updateRow(index, { description: e.target.value })}
                    placeholder="e.g. Modern textured wall finish"
                  />
                </label>

                <div className="workPricingRow">
                  <div>
                    <span className="workFieldLabel">Pricing type</span>
                    <div className="modeToggle">
                      <button
                        type="button"
                        className={work.pricingMode === 'per_sqft' ? 'modeToggleBtn' : 'modeToggleBtn active'}
                        onClick={() => updateRow(index, { pricingMode: 'fixed' })}
                      >Fixed price</button>
                      <button
                        type="button"
                        className={work.pricingMode === 'per_sqft' ? 'modeToggleBtn activeSqft' : 'modeToggleBtn'}
                        onClick={() => updateRow(index, { pricingMode: 'per_sqft' })}
                      >Per sq ft</button>
                    </div>
                  </div>
                  <label className="workField" style={{ flex: 1 }}>
                    <span className="workFieldLabel">
                      {work.pricingMode === 'per_sqft' ? 'Rate (PKR per square feet)' : 'Price (PKR)'}
                    </span>
                    <div className="priceInputWrap">
                      <input
                        type="number"
                        value={String(work.price || '')}
                        onChange={e => updateRow(index, { price: Number(e.target.value) })}
                        placeholder={work.pricingMode === 'per_sqft' ? 'e.g. 85' : 'e.g. 1500'}
                      />
                      <span className="priceUnit">
                        {work.pricingMode === 'per_sqft' ? 'Rs / sq ft' : 'Rs'}
                      </span>
                    </div>
                  </label>
                </div>

                {isIncomplete(work) && (
                  <div className="workCardWarning">
                    <AlertCircle size={14} />
                    Fill in the design name and the {work.pricingMode === 'per_sqft' ? 'rate per sq ft' : 'price'} to save this row.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {rows.length > 0 && (
        <div className="workSummaryBar">
          <span><b>{rows.length}</b> sub-category{rows.length === 1 ? '' : 'ies'}</span>
          {rateRange && <span className="workSummaryChip">{rateRange}</span>}
          {anyPerSqft && (
            <span className="workSummaryChip success"><Calculator size={12} />Area calculator active in app</span>
          )}
        </div>
      )}

      <small style={{ color: 'var(--muted)', display: 'block', marginTop: 6 }}>
        <b>Per sq ft designs</b> (e.g. wall texture) let the customer pick a sub-category, enter square
        feet, and get charged rate × area in the app. Texture bookings require 2-day advance. Each row
        needs <b>both a name and a price/rate</b> to save.
      </small>
    </div>
  );
}

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
    // Work rows without BOTH a name and a price are silently dropped by the
    // server. Block the save with a clear message instead of losing them.
    const allWorkRows = editingService.workPrices || [];
    const configuredRows = allWorkRows.filter(w => (w.title && w.title.trim()) || Number(w.price || 0) > 0 || w.pricingMode === 'per_sqft');
    const invalidRows = configuredRows.filter(w => !(w.title && w.title.trim()) || !(Number(w.price || 0) > 0));
    if (invalidRows.length) {
      const details = invalidRows.map(w => {
        const missing: string[] = [];
        if (!(w.title && w.title.trim())) missing.push('Work name');
        if (!(Number(w.price || 0) > 0)) missing.push(`Price${w.pricingMode === 'per_sqft' ? ' (rate per sq ft)' : ''}`);
        return `• "${w.title?.trim() || '(no name yet)'}" — missing: ${missing.join(' and ')}`;
      });
      alert(
        `The pricing row you selected "Per sq ft" on is not complete yet.\n\n${details.join('\n')}\n\nIn the "Specific Work / Dynamic Prices" section, the row has these boxes:\n  1. Image  2. Work name  3. Note  4. Fixed/Per sq ft dropdown  5. Price\n\nFill in the WORK NAME (e.g. "Wall Texture Design A") and the PRICE (e.g. 85), then press Save again.\n\nOr if you don't want specific designs: leave the work row empty, and instead type "Per sq. ft." in the "Unit / Description" field of the service — the app will show the area calculator for the whole service.`,
      );
      return;
    }
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
                      <div className="catalogCategoryInfo">
                        <strong>{sub.title}</strong>
                        <small>{sub.description || 'Sub-service'}{sub.pricingMode === 'per_sqft' ? ' · Per sq ft' : ''}</small>
                      </div>
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
            <label className="field fieldWide" style={{flexDirection: 'row', alignItems: 'center', gap: 8, cursor: 'pointer'}}>
              <input
                type="checkbox"
                checked={editingSubcategory.pricingMode === 'per_sqft'}
                onChange={e => setEditingSubcategory({...editingSubcategory, pricingMode: e.target.checked ? 'per_sqft' : 'fixed'})}
                style={{width: 18, height: 18}}
              />
              <span style={{fontWeight: 600}}>Per sq ft pricing (area calculator in app)</span>
            </label>
            <small style={{color: 'var(--muted)', marginTop: -12, marginBottom: 8}}>
              When enabled, every service added under this subcategory shows the square-feet calculator in the customer app and charges price × area. Use for texture walls and similar area-based work.
            </small>
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

              <div className="field fieldWide" style={{marginTop: 10}}>
                <WorkPriceEditor
                  value={editingService.workPrices || []}
                  onChange={next => setEditingService({ ...editingService, workPrices: next })}
                />
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
