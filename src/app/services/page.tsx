'use client';

import {useEffect, useState, useCallback} from 'react';
import {ChevronRight, Layers, PackagePlus, Plus, RefreshCw, Trash2} from 'lucide-react';
import {AdminShell} from '@/components/AdminShell';
import {Field, ImagePickerField} from '@/components/AdminFields';
import {
  AdminCategory,
  AdminSubcategory,
  AdminService,
  getAdminCatalogue,
  getCategories,
  getServices,
  resolveAssetUrl,
  saveService,
} from '@/lib/api';
import {
  categoryHeroColor,
  emptyService,
  fallbackCategories,
  money,
} from '@/lib/adminUi';

/* ─── Catalog browser types ─── */
interface CatalogCategory extends AdminCategory {
  subcategories: AdminSubcategory[];
}

/* ─── Catalog Browser Component ─── */
function CatalogBrowser({onEdit}: {onEdit: (service: AdminService) => void}) {
  const [catalog, setCatalog] = useState<CatalogCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CatalogCategory | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<AdminSubcategory | null>(null);
  const [browseServices, setBrowseServices] = useState<AdminService[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [browserError, setBrowserError] = useState('');

  useEffect(() => {
    getAdminCatalogue()
      .then(data => {
        const byCategory = new Map<string, AdminSubcategory[]>();
        for (const sub of data.subcategories) {
          const list = byCategory.get(sub.categoryId) ?? [];
          list.push(sub);
          byCategory.set(sub.categoryId, list);
        }
        setCatalog(
          data.categories.map(cat => ({
            ...cat,
            subcategories: byCategory.get(cat.id) ?? [],
          })),
        );
      })
      .catch(() => setBrowserError('Could not load catalog.'));
  }, []);

  const loadServices = useCallback(
    async (categoryId: string, subcategoryId?: string) => {
      setLoadingServices(true);
      setBrowseServices([]);
      setBrowserError('');
      try {
        const params = new URLSearchParams({categoryId});
        if (subcategoryId) params.set('subcategoryId', subcategoryId);
        const all = await getServices();
        setBrowseServices(
          all.filter(
            s =>
              s.categoryId === categoryId &&
              (subcategoryId ? s.subcategoryId === subcategoryId : !s.subcategoryId),
          ),
        );
      } catch {
        setBrowserError('Could not load services for this selection.');
      } finally {
        setLoadingServices(false);
      }
    },
    [],
  );

  const handleCategoryClick = (cat: CatalogCategory) => {
    setSelectedCategory(cat);
    setSelectedSubcategory(null);
    if (cat.subcategories.length === 0) {
      // No subcategories → show direct services
      loadServices(cat.id);
    } else {
      setBrowseServices([]);
    }
  };

  const handleSubcategoryClick = (sub: AdminSubcategory) => {
    setSelectedSubcategory(sub);
    if (selectedCategory) loadServices(selectedCategory.id, sub.id);
  };

  const handleBack = () => {
    if (selectedSubcategory) {
      setSelectedSubcategory(null);
      setBrowseServices([]);
    } else {
      setSelectedCategory(null);
      setBrowseServices([]);
    }
  };

  /* ── render ── */
  return (
    <section className="panel catalogBrowser">
      <div className="panelHead">
        <div>
          <p className="eyebrow">Browse deployed services</p>
          <h3 style={{display: 'flex', alignItems: 'center', gap: 8}}>
            <Layers size={18} />
            Service Catalog
          </h3>
        </div>
        {selectedCategory && (
          <button className="ghostButton" onClick={handleBack}>
            ← Back
          </button>
        )}
      </div>

      {/* Breadcrumb */}
      {selectedCategory && (
        <div className="catalogBreadcrumb">
          <span
            className="catalogCrumb"
            style={{cursor: 'pointer', color: 'var(--green)'}}
            onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); setBrowseServices([]); }}
          >
            All Services
          </span>
          <ChevronRight size={14} />
          <span
            className="catalogCrumb"
            style={selectedSubcategory ? {cursor: 'pointer', color: 'var(--green)'} : {fontWeight: 700}}
            onClick={selectedSubcategory ? () => { setSelectedSubcategory(null); setBrowseServices([]); if (selectedCategory.subcategories.length === 0) loadServices(selectedCategory.id); } : undefined}
          >
            {selectedCategory.title}
          </span>
          {selectedSubcategory && (
            <>
              <ChevronRight size={14} />
              <span className="catalogCrumb" style={{fontWeight: 700}}>{selectedSubcategory.title}</span>
            </>
          )}
        </div>
      )}

      {browserError && <div className="notice" style={{color: '#b91c1c', background: '#fff1f2', borderColor: '#fecaca'}}>{browserError}</div>}

      {/* Level 1 — Main Categories */}
      {!selectedCategory && (
        <div className="catalogCategoryGrid">
          {catalog.map(cat => (
            <button
              key={cat.id}
              className="catalogCategoryCard"
              style={{'--cat-tint': cat.tint} as React.CSSProperties}
              onClick={() => handleCategoryClick(cat)}
            >
              <div className="catalogCategoryDot" style={{background: cat.tint}} />
              <div className="catalogCategoryInfo">
                <strong>{cat.title}</strong>
                <small>
                  {cat.subcategories.length > 0
                    ? `${cat.subcategories.length} sub-services`
                    : 'Direct services'}
                </small>
              </div>
              <ChevronRight size={16} className="catalogChevron" />
            </button>
          ))}
          {catalog.length === 0 && (
            <p style={{color: 'var(--muted)', gridColumn: '1/-1'}}>Loading categories…</p>
          )}
        </div>
      )}

      {/* Level 2 — Subcategories */}
      {selectedCategory && !selectedSubcategory && selectedCategory.subcategories.length > 0 && (
        <div className="catalogCategoryGrid">
          {selectedCategory.subcategories.map(sub => (
            <button
              key={sub.id}
              className="catalogCategoryCard"
              onClick={() => handleSubcategoryClick(sub)}
            >
              <div className="catalogCategoryDot" style={{background: selectedCategory.tint}} />
              <div className="catalogCategoryInfo">
                <strong>{sub.title}</strong>
                <small>{sub.description || 'Sub-service'}</small>
              </div>
              <ChevronRight size={16} className="catalogChevron" />
            </button>
          ))}
        </div>
      )}

      {/* Level 3 — Services */}
      {(selectedSubcategory || (selectedCategory && selectedCategory.subcategories.length === 0)) && (
        <div>
          {loadingServices && <p style={{color: 'var(--muted)'}}>Loading services…</p>}
          {!loadingServices && browseServices.length === 0 && !browserError && (
            <p style={{color: 'var(--muted)'}}>No services found for this selection.</p>
          )}
          <div className="catalogServiceGrid">
            {browseServices.map(service => (
              <div key={service.id} className="catalogServiceCard">
                {service.imageUrl && (
                  <div
                    className="catalogServiceImage"
                    style={{backgroundImage: `url(${resolveAssetUrl(service.imageUrl)})`}}
                  />
                )}
                <div className="catalogServiceBody">
                  <strong>{service.title}</strong>
                  <small>{service.serviceType || 'Standard Visit'}</small>
                  <p className="catalogServiceDesc">{service.description}</p>
                  <div className="catalogServiceFooter">
                    <b>{money(service.price)}</b>
                    <button
                      className="ghostButton"
                      style={{height: 32, fontSize: 13}}
                      onClick={() => {
                        onEdit(service);
                        window.scrollTo({top: 0, behavior: 'smooth'});
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

type ServiceListKey = 'includes' | 'details' | 'excludes';

const blankWorkPrice = {
  title: '',
  description: '',
  imageUrl: '',
  price: 0,
  sortOrder: 0,
};

function compactList(items?: string[]) {
  return (items || []).map(item => item.trim()).filter(Boolean);
}

function ensureEditableList(items?: string[]) {
  const compacted = compactList(items);
  return compacted.length ? compacted : [''];
}

export default function ServicesPage() {
  const [services, setServices] = useState<AdminService[]>([]);
  const [categories, setCategories] =
    useState<AdminCategory[]>(fallbackCategories);
  const [subcategories, setSubcategories] = useState<AdminSubcategory[]>([]);
  const [serviceForm, setServiceForm] =
    useState<Partial<AdminService>>(emptyService);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    const [nextServices, catalogue] = await Promise.all([
      getServices(),
      getAdminCatalogue().catch(() => null),
    ]);
    setServices(nextServices);
    const nextCategories = catalogue?.categories || await getCategories().catch(() => fallbackCategories);
    setCategories(nextCategories.length ? nextCategories : fallbackCategories);
    setSubcategories(catalogue?.subcategories || []);
  };

  useEffect(() => {
    loadData().catch(() =>
      setMessage('Could not load services. Check that the API is running.'),
    );
  }, []);

  const workPrices = serviceForm.workPrices?.length
    ? serviceForm.workPrices
    : [blankWorkPrice];
  const validWorkPrices = workPrices
    .map((work, index) => ({
      ...work,
      title: work.title?.trim() || '',
      description: work.description?.trim() || '',
      price: Number(work.price || 0),
      sortOrder: index,
    }))
    .filter(work => work.title && work.price > 0);
  const minimumWorkPrice = validWorkPrices.length
    ? Math.min(...validWorkPrices.map(work => work.price))
    : Number(serviceForm.price || 0);

  const updateWorkPrice = (
    index: number,
    patch: Partial<NonNullable<AdminService['workPrices']>[number]>,
  ) => {
    setServiceForm(current => {
      const nextWorkPrices = [
        ...(current.workPrices?.length ? current.workPrices : [blankWorkPrice]),
      ];
      nextWorkPrices[index] = {...nextWorkPrices[index], ...patch};
      return {...current, workPrices: nextWorkPrices};
    });
  };

  const addWorkPrice = () => {
    setServiceForm(current => ({
      ...current,
      workPrices: [
        ...(current.workPrices || []),
        {...blankWorkPrice, sortOrder: current.workPrices?.length || 0},
      ],
    }));
  };

  const removeWorkPrice = (index: number) => {
    setServiceForm(current => ({
      ...current,
      workPrices: (current.workPrices || []).filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    }));
  };

  const updateListItem = (
    key: ServiceListKey,
    index: number,
    value: string,
  ) => {
    setServiceForm(current => {
      const nextItems = ensureEditableList(current[key]);
      nextItems[index] = value;
      return {...current, [key]: nextItems};
    });
  };

  const addListItem = (key: ServiceListKey) => {
    setServiceForm(current => ({
      ...current,
      [key]: [...ensureEditableList(current[key]), ''],
    }));
  };

  const removeListItem = (key: ServiceListKey, index: number) => {
    setServiceForm(current => {
      const nextItems = ensureEditableList(current[key]).filter(
        (_, itemIndex) => itemIndex !== index,
      );
      return {...current, [key]: nextItems.length ? nextItems : ['']};
    });
  };

  const handleSaveService = async () => {
    try {
      await saveService({
        ...serviceForm,
        price: minimumWorkPrice,
        includes: compactList(serviceForm.includes),
        excludes: compactList(serviceForm.excludes),
        details: compactList(serviceForm.details),
        workPrices: validWorkPrices,
      });
      setServiceForm(emptyService);
      await loadData();
      setMessage('Service saved and mobile app catalog updated.');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not save service.',
      );
    }
  };

  const editService = (service: AdminService) => {
    setServiceForm({
      ...service,
      includes: ensureEditableList(service.includes),
      details: ensureEditableList(service.details),
      excludes: ensureEditableList(service.excludes),
      workPrices: service.workPrices?.length
        ? service.workPrices
        : [
            {
              title: service.title,
              description: service.serviceType || '',
              price: service.price,
              imageUrl: '',
              sortOrder: 0,
            },
          ],
    });
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const renderListEditor = (
    key: ServiceListKey,
    label: string,
    placeholder: string,
  ) => {
    const items = ensureEditableList(serviceForm[key]);

    return (
      <div className="field fieldWide listEditor">
        <div className="workPriceHeader">
          <span>{label}</span>
          <button
            type="button"
            className="ghostButton"
            onClick={() => addListItem(key)}
          >
            <Plus size={15} />
            Add Line
          </button>
        </div>
        {items.map((item, index) => (
          <div className="listEditorRow" key={`${key}-${index}`}>
            <input
              value={item}
              onChange={event => updateListItem(key, index, event.target.value)}
              placeholder={placeholder}
            />
            <button
              type="button"
              className="secondaryButton"
              onClick={() => removeListItem(key, index)}
              disabled={items.length <= 1}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <AdminShell
      eyebrow="Dynamic app catalog"
      title="Services"
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
            <p className="eyebrow">Mobile service catalog</p>
            <h3>{serviceForm.id ? 'Edit Service' : 'Add Service'}</h3>
          </div>
          <PackagePlus size={22} />
        </div>

        <div className="serviceEditor">
          <div className="formGrid">
            <Field
              label="Title"
              value={serviceForm.title || ''}
              onChange={title => setServiceForm({...serviceForm, title})}
            />
            <label className="field">
              <span>Category used inside app</span>
              <select
                value={serviceForm.categoryId || 'home'}
                onChange={event =>
                  setServiceForm({
                    ...serviceForm,
                    categoryId: event.target.value,
                  })
                }
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Sub-service</span>
              <select
                value={serviceForm.subcategoryId || ''}
                onChange={event => setServiceForm({...serviceForm, subcategoryId: event.target.value || null})}>
                <option value="">Direct service (no sub-service)</option>
                {subcategories
                  .filter(item => item.categoryId === serviceForm.categoryId)
                  .map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
              <small>Choose a sub-service, or leave direct for services shown immediately under the main service.</small>
            </label>
            <Field
              label="Service Type"
              value={serviceForm.serviceType || ''}
              onChange={serviceType =>
                setServiceForm({...serviceForm, serviceType})
              }
            />
            <ImagePickerField
              label="Upload Service Image"
              value={serviceForm.imageUrl}
              onChange={imageUrl => setServiceForm({...serviceForm, imageUrl})}
            />
            <Field
              label="Minimum Price (PKR)"
              type="number"
              value={String(minimumWorkPrice || serviceForm.price || '')}
              onChange={price =>
                setServiceForm({...serviceForm, price: Number(price)})
              }
            />
            <Field
              label="Original Price (PKR)"
              type="number"
              value={String(serviceForm.originalPrice || '')}
              onChange={originalPrice =>
                setServiceForm({
                  ...serviceForm,
                  originalPrice: Number(originalPrice),
                })
              }
            />
            <div className="field fieldWide workPriceEditor">
              <div className="workPriceHeader">
                <span>Specific Work / Dynamic Prices</span>
                <button type="button" className="ghostButton" onClick={addWorkPrice}>
                  <Plus size={15} />
                  Add Work
                </button>
              </div>
              {workPrices.map((work, index) => (
                <div className="workPriceRow" key={index}>
                  <ImagePickerField
                    label="Work Image"
                    value={work.imageUrl}
                    onChange={imageUrl => updateWorkPrice(index, {imageUrl})}
                  />
                  <input
                    value={work.title || ''}
                    onChange={event =>
                      updateWorkPrice(index, {title: event.target.value})
                    }
                    placeholder="Work name, e.g. Breaker replacement"
                  />
                  <input
                    value={work.description || ''}
                    onChange={event =>
                      updateWorkPrice(index, {description: event.target.value})
                    }
                    placeholder="Short note shown in app"
                  />
                  <input
                    type="number"
                    value={String(work.price || '')}
                    onChange={event =>
                      updateWorkPrice(index, {price: Number(event.target.value)})
                    }
                    placeholder="Price"
                  />
                  <button
                    type="button"
                    className="secondaryButton"
                    onClick={() => removeWorkPrice(index)}
                    disabled={workPrices.length <= 1}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <small>Our Services shows the minimum price: {money(minimumWorkPrice)}</small>
            </div>
            <Field
              label="Duration"
              value={serviceForm.duration || ''}
              onChange={duration => setServiceForm({...serviceForm, duration})}
            />
            <Field
              label="Badge"
              value={serviceForm.badge || ''}
              onChange={badge => setServiceForm({...serviceForm, badge})}
            />
            <label className="field fieldWide">
              <span>Description</span>
              <textarea
                value={serviceForm.description || ''}
                onChange={event =>
                  setServiceForm({
                    ...serviceForm,
                    description: event.target.value,
                  })
                }
              />
            </label>
            <label className="field fieldWide">
              <span>Service Details Description</span>
              <textarea
                value={serviceForm.detailDescription || ''}
                onChange={event =>
                  setServiceForm({
                    ...serviceForm,
                    detailDescription: event.target.value,
                  })
                }
              />
            </label>
            {renderListEditor(
              'includes',
              'Specific Work / Includes',
              'e.g. Breaker inspection',
            )}
            {renderListEditor(
              'details',
              'Service Detail Checkmarks',
              'e.g. Faulty breaker point inspected',
            )}
            {renderListEditor(
              'excludes',
              'Excludes',
              'e.g. Breaker/MCB cost',
            )}
          </div>

          <div className="mobilePreview">
            <p className="eyebrow">App preview</p>
            <div className="appServiceCard">
              <div
                className="appServiceHero"
                style={{
                  backgroundColor: categoryHeroColor(serviceForm.categoryId),
                  backgroundImage: serviceForm.imageUrl
                    ? `url(${resolveAssetUrl(serviceForm.imageUrl)})`
                    : undefined,
                }}
              >
                <span>{serviceForm.title || 'Service Title'}</span>
              </div>
              <div className="appServiceBody">
                <strong>{serviceForm.title || 'Service Title'}</strong>
                <small>{serviceForm.serviceType || 'Standard Visit'}</small>
                <p>
                  {serviceForm.description ||
                    'Service description appears here exactly like the mobile app card.'}
                </p>
                <div className="appServiceFooter">
                  <b>{money(minimumWorkPrice)}</b>
                  <button>Book Service</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button className="primaryButton" onClick={handleSaveService}>
          Save Service
        </button>
      </section>

      <section className="panel">
        <div className="panelHead">
          <div>
            <p className="eyebrow">Existing</p>
            <h3>Services</h3>
          </div>
          <span className="countPill">{services.length} services</span>
        </div>
        <div className="serviceGrid">
          {services.map(service => (
            <button
              className="serviceTile"
              key={service.id}
              onClick={() => editService(service)}
            >
              <span>{service.categoryId}</span>
              <strong>{service.title}</strong>
              <small>
                {money(service.price)} min - {service.duration}
              </small>
            </button>
          ))}
        </div>
      </section>

      <CatalogBrowser onEdit={editService} />
    </AdminShell>
  );
}

