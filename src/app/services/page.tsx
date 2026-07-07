'use client';

import {useEffect, useState} from 'react';
import {PackagePlus, Plus, RefreshCw, Trash2} from 'lucide-react';
import {AdminShell} from '@/components/AdminShell';
import {Field, ImagePickerField} from '@/components/AdminFields';
import {
  AdminCategory,
  AdminService,
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
  const [serviceForm, setServiceForm] =
    useState<Partial<AdminService>>(emptyService);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    const [nextServices, nextCategories] = await Promise.all([
      getServices(),
      getCategories().catch(() => fallbackCategories),
    ]);
    setServices(nextServices);
    setCategories(nextCategories.length ? nextCategories : fallbackCategories);
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
    </AdminShell>
  );
}

