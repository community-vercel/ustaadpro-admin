'use client';

import {useEffect, useState} from 'react';
import {PackagePlus, RefreshCw} from 'lucide-react';
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

  const handleSaveService = async () => {
    try {
      const includes = (serviceForm.includes || []).filter(Boolean);
      const excludes = (serviceForm.excludes || []).filter(Boolean);
      const details = (serviceForm.details || []).filter(Boolean);
      await saveService({...serviceForm, includes, excludes, details});
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
    setServiceForm(service);
    window.scrollTo({top: 0, behavior: 'smooth'});
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
              label="Price (PKR)"
              type="number"
              value={String(serviceForm.price || '')}
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
            <Field
              label="Specific Work / Includes, comma separated"
              value={(serviceForm.includes || []).join(', ')}
              onChange={value =>
                setServiceForm({
                  ...serviceForm,
                  includes: value.split(',').map(item => item.trim()),
                })
              }
            />
            <Field
              label="Service Detail Checkmarks, comma separated"
              value={(serviceForm.details || []).join(', ')}
              onChange={value =>
                setServiceForm({
                  ...serviceForm,
                  details: value.split(',').map(item => item.trim()),
                })
              }
            />
            <Field
              label="Excludes, comma separated"
              value={(serviceForm.excludes || []).join(', ')}
              onChange={value =>
                setServiceForm({
                  ...serviceForm,
                  excludes: value.split(',').map(item => item.trim()),
                })
              }
            />
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
                  <b>{money(Number(serviceForm.price || 0))}</b>
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
                {money(service.price)} - {service.duration}
              </small>
            </button>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
