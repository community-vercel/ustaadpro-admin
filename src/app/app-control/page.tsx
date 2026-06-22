'use client';

import {useEffect, useState} from 'react';
import {RefreshCw} from 'lucide-react';
import {AdminShell} from '@/components/AdminShell';
import {Field, ImagePickerField} from '@/components/AdminFields';
import {
  AdminCategory,
  AdminHomeSlide,
  AdminSettings,
  getCategories,
  getHomeSlides,
  getSettings,
  saveHomeSlide,
  saveSettings,
} from '@/lib/api';
import {defaultSettings, emptySlide, fallbackCategories} from '@/lib/adminUi';

export default function AppControlPage() {
  const [categories, setCategories] =
    useState<AdminCategory[]>(fallbackCategories);
  const [slides, setSlides] = useState<AdminHomeSlide[]>([]);
  const [slideForm, setSlideForm] =
    useState<Partial<AdminHomeSlide>>(emptySlide);
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    const [nextCategories, nextSlides, nextSettings] = await Promise.all([
      getCategories().catch(() => fallbackCategories),
      getHomeSlides(),
      getSettings(),
    ]);
    setCategories(nextCategories.length ? nextCategories : fallbackCategories);
    setSlides(nextSlides);
    setSettings(nextSettings);
  };

  useEffect(() => {
    loadData().catch(() =>
      setMessage('Could not load app controls. Check that the API is running.'),
    );
  }, []);

  const handleSaveSlide = async () => {
    try {
      await saveHomeSlide(slideForm);
      setSlideForm(emptySlide);
      await loadData();
      setMessage('Home header slide saved for the mobile app.');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not save header slide.',
      );
    }
  };

  const handleSaveSettings = async () => {
    const nextSettings = await saveSettings(settings);
    setSettings(nextSettings);
    setMessage('Invoice pricing settings saved.');
  };

  const editSlide = (slide: AdminHomeSlide) => {
    setSlideForm(slide);
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  return (
    <AdminShell
      eyebrow="Mobile app controls"
      title="App Control"
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
            <p className="eyebrow">Mobile home header</p>
            <h3>{slideForm.id ? 'Edit Header Slide' : 'Add Header Slide'}</h3>
          </div>
        </div>

        <div className="formGrid">
          <Field
            label="Slide ID"
            value={slideForm.id || ''}
            onChange={id => setSlideForm({...slideForm, id})}
          />
          <Field
            label="Badge"
            value={slideForm.badge || ''}
            onChange={badge => setSlideForm({...slideForm, badge})}
          />
          <label className="field">
            <span>Category target</span>
            <select
              value={slideForm.categoryId || 'home'}
              onChange={event => {
                const selected = categories.find(
                  category => category.id === event.target.value,
                );
                setSlideForm({
                  ...slideForm,
                  categoryId: event.target.value,
                  categoryTitle: selected?.title || event.target.value,
                });
              }}
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.title}
                </option>
              ))}
            </select>
          </label>
          <Field
            label="Title"
            value={slideForm.title || ''}
            onChange={title => setSlideForm({...slideForm, title})}
          />
          <Field
            label="Button Label"
            value={slideForm.buttonLabel || ''}
            onChange={buttonLabel => setSlideForm({...slideForm, buttonLabel})}
          />
          <Field
            label="Visual Text"
            value={slideForm.visual || ''}
            onChange={visual => setSlideForm({...slideForm, visual})}
          />
          <Field
            label="Primary Color"
            value={slideForm.primaryColor || ''}
            onChange={primaryColor =>
              setSlideForm({...slideForm, primaryColor})
            }
          />
          <Field
            label="Secondary Color"
            value={slideForm.secondaryColor || ''}
            onChange={secondaryColor =>
              setSlideForm({...slideForm, secondaryColor})
            }
          />
          <Field
            label="Sort Order"
            type="number"
            value={String(slideForm.sortOrder || '')}
            onChange={sortOrder =>
              setSlideForm({...slideForm, sortOrder: Number(sortOrder)})
            }
          />
          <ImagePickerField
            label="Upload Header Image"
            value={slideForm.imageUrl}
            onChange={imageUrl => setSlideForm({...slideForm, imageUrl})}
          />
          <label className="field fieldWide">
            <span>Subtitle</span>
            <textarea
              value={slideForm.subtitle || ''}
              onChange={event =>
                setSlideForm({...slideForm, subtitle: event.target.value})
              }
            />
          </label>
        </div>

        <button className="primaryButton" onClick={handleSaveSlide}>
          Save Header Slide
        </button>

        <div className="slideList">
          {slides.map(slide => (
            <button
              className="slideTile"
              key={slide.id}
              onClick={() => editSlide(slide)}
            >
              <span>{slide.badge}</span>
              <strong>{slide.title.replace(/\n/g, ' ')}</strong>
              <small>{slide.categoryTitle}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panelHead">
          <div>
            <p className="eyebrow">Invoice pricing</p>
            <h3>Booking Fees & Platform Charges</h3>
          </div>
        </div>
        <div className="formGrid">
          <Field
            label="Inspection Fee (PKR)"
            type="number"
            value={String(settings.inspectionFee)}
            onChange={inspectionFee =>
              setSettings({
                ...settings,
                inspectionFee: Number(inspectionFee),
              })
            }
          />
          <Field
            label="Platform Charges (%)"
            type="number"
            value={String(settings.serviceTaxPercent)}
            onChange={serviceTaxPercent =>
              setSettings({
                ...settings,
                serviceTaxPercent: Number(serviceTaxPercent),
              })
            }
          />
          <Field
            label="Currency"
            value={settings.currency}
            onChange={currency => setSettings({...settings, currency})}
          />
          <Field
            label="Support Phone"
            value={settings.supportPhone}
            onChange={supportPhone => setSettings({...settings, supportPhone})}
          />
          <Field
            label="Shop Shipping Cost (PKR)"
            type="number"
            value={String(settings.shippingCost)}
            onChange={shippingCost =>
              setSettings({...settings, shippingCost: Number(shippingCost)})
            }
          />
        </div>
        <button className="primaryButton" onClick={handleSaveSettings}>
          Save Pricing
        </button>
      </section>
    </AdminShell>
  );
}
