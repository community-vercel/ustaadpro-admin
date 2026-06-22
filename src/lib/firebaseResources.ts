const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    'AIzaSyAqSn3aXPTnclhcMFmvH9pwEjS7DIVCG_c',
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'fixnow-8f2bb',
};

type FirestoreValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  timestampValue?: string;
  arrayValue?: {values?: FirestoreValue[]};
  mapValue?: {fields?: Record<string, FirestoreValue>};
  nullValue?: null;
};

type FirestoreDocument = {
  name: string;
  fields?: Record<string, FirestoreValue>;
};

type FirestoreListResponse = {
  documents?: FirestoreDocument[];
  nextPageToken?: string;
};

export type ServiceProviderResource = {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  area: string;
  address: string;
  locationText: string;
  latitude: number | null;
  longitude: number | null;
  accountStatus: string;
  role: string;
  serviceCategory: string;
  serviceType: string;
  subcategories: string[];
  totalSubcategories: number;
  isOnline: boolean;
  createdAt: string;
  lastSeen: string;
  reviewedAt: string;
  profileImage: string;
  cnicFront: string;
  cnicBack: string;
  reason: string;
};

function readFirestoreValue(value?: FirestoreValue): unknown {
  if (!value) return undefined;
  if ('stringValue' in value) return value.stringValue || '';
  if ('integerValue' in value) return Number(value.integerValue || 0);
  if ('doubleValue' in value) return Number(value.doubleValue || 0);
  if ('booleanValue' in value) return Boolean(value.booleanValue);
  if ('timestampValue' in value) return value.timestampValue || '';
  if ('arrayValue' in value) {
    return (value.arrayValue?.values || []).map(item => readFirestoreValue(item));
  }
  if ('mapValue' in value) {
    return Object.fromEntries(
      Object.entries(value.mapValue?.fields || {}).map(([key, item]) => [
        key,
        readFirestoreValue(item),
      ]),
    );
  }
  return undefined;
}

function formatFirebaseDate(value: unknown) {
  if (!value || typeof value !== 'string') return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function fieldString(fields: Record<string, unknown>, key: string) {
  const value = fields[key];
  return typeof value === 'string' ? value : '';
}

function fieldNumber(fields: Record<string, unknown>, key: string) {
  const value = fields[key];
  return typeof value === 'number' ? value : Number(value || 0);
}

function fieldBoolean(fields: Record<string, unknown>, key: string) {
  return fields[key] === true;
}

function fieldNullableNumber(fields: Record<string, unknown>, key: string) {
  const value = fields[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readLocationText(fields: Record<string, unknown>) {
  const location = fields.location;
  if (typeof location === 'string') return location;
  if (location && typeof location === 'object') {
    const values = location as Record<string, unknown>;
    return [
      values.address,
      values.area,
      values.city,
      values.latitude && values.longitude
        ? `${values.latitude}, ${values.longitude}`
        : undefined,
    ]
      .filter(Boolean)
      .join(', ');
  }
  return '';
}

function mapProvider(document: FirestoreDocument): ServiceProviderResource {
  const fields = Object.fromEntries(
    Object.entries(document.fields || {}).map(([key, value]) => [
      key,
      readFirestoreValue(value),
    ]),
  );
  const id = document.name.split('/').pop() || fieldString(fields, 'uid');
  const subcategories = fields.subcategories;

  return {
    id,
    uid: fieldString(fields, 'uid') || id,
    name: fieldString(fields, 'name') || 'Unnamed provider',
    email: fieldString(fields, 'email'),
    phone: fieldString(fields, 'phone'),
    city: fieldString(fields, 'city') || 'Unknown',
    area: fieldString(fields, 'area'),
    address: fieldString(fields, 'address'),
    locationText: readLocationText(fields),
    latitude:
      fieldNullableNumber(fields, 'latitude') ??
      fieldNullableNumber(fields, 'lat'),
    longitude:
      fieldNullableNumber(fields, 'longitude') ??
      fieldNullableNumber(fields, 'lng'),
    accountStatus: fieldString(fields, 'accountStatus') || 'pending',
    role: fieldString(fields, 'role') || 'ServiceProvider',
    serviceCategory: fieldString(fields, 'serviceCategory') || 'General',
    serviceType: fieldString(fields, 'serviceType') || 'Service',
    subcategories: Array.isArray(subcategories)
      ? subcategories.filter((item): item is string => typeof item === 'string')
      : [],
    totalSubcategories: fieldNumber(fields, 'totalSubcategories'),
    isOnline: fieldBoolean(fields, 'isOnline'),
    createdAt: formatFirebaseDate(fields.createdAt),
    lastSeen: formatFirebaseDate(fields.lastSeen),
    reviewedAt: formatFirebaseDate(fields.reviewedAt),
    profileImage: fieldString(fields, 'profileImage'),
    cnicFront: fieldString(fields, 'cnicFront'),
    cnicBack: fieldString(fields, 'cnicBack'),
    reason: fieldString(fields, 'reason'),
  };
}

export async function getServiceProviderResources() {
  const baseEndpoint =
    `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}` +
    '/databases/(default)/documents/ServiceProviders';
  const documents: FirestoreDocument[] = [];
  let pageToken = '';

  do {
    const params = new URLSearchParams({
      key: firebaseConfig.apiKey,
      pageSize: '300',
    });
    if (pageToken) params.set('pageToken', pageToken);

    const response = await fetch(`${baseEndpoint}?${params.toString()}`);

    if (!response.ok) {
      throw new Error('Could not load service providers from Firebase.');
    }

    const payload = (await response.json()) as FirestoreListResponse;
    documents.push(...(payload.documents || []));
    pageToken = payload.nextPageToken || '';
  } while (pageToken);

  return documents.map(mapProvider);
}
