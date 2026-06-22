'use client';

import {useState} from 'react';
import {resolveAssetUrl, uploadImage} from '@/lib/api';

export function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={event => onChange(event.target.value)}
      />
    </label>
  );
}

export function ImagePickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFile = (file?: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        setUploading(true);
        try {
          const url = await uploadImage(reader.result, file.name);
          onChange(url);
        } finally {
          setUploading(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <label className="field imageUpload">
      <span>{label}</span>
      <input
        type="file"
        accept="image/*"
        onChange={event => handleFile(event.target.files?.[0])}
      />
      {uploading && <small>Uploading image...</small>}
      {value && <img src={resolveAssetUrl(value)} alt="" />}
    </label>
  );
}
