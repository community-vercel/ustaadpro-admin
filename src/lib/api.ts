const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.ustaadpro.pk/api';
const PUBLIC_API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export function resolveApiAssetUrl(url?: string) {
  if (!url) return '';
  const localUploadPath = url.match(
    /^https?:\/\/(?:127\.0\.0\.1|localhost):\d+(\/uploads\/.+)$/i,
  )?.[1];
  if (localUploadPath) {
    return `${PUBLIC_API_ORIGIN}${localUploadPath}`;
  }
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${PUBLIC_API_ORIGIN}${url}`;
}

export interface AdminSummary {
  totalOrders: number;
  activeOrders: number;
  totalCustomers: number;
  totalServices: number;
  revenue: number;
}



export interface AdminUser {
  id: number;
  name: string;
  phone: string;
  email: string;
  createdAt: string;
  totalOrders: number;
  totalSpend: number;
}

export interface AdminOrder {
  id: string;
  total: number;
  status: 'confirmed' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  bookedFor: string;
  paymentMethod: string;
  address: string;
  specialInstructions?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  inspectionFee: number;
  tax: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: Array<{
    serviceId: string;
    title: string;
    description: string;
    duration: string;
    categoryId: string;
    serviceType?: string;
    imageUrl?: string;
    detailDescription?: string;
    details?: string[];
    quantity: number;
    price: number;
  }>;
}

export interface AdminService {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  duration: string;
  rating: number;
  reviews: number;
  badge?: string | null;
  serviceType?: string;
  imageUrl?: string;
  detailDescription?: string;
  details?: string[];
  includes: string[];
  excludes: string[];
}

export interface AdminHomeSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  buttonLabel: string;
  categoryId: string;
  categoryTitle: string;
  visual: string;
  imageUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  sortOrder: number;
  isActive: boolean;
}

export interface AdminSettings {
  inspectionFee: number;
  serviceTaxPercent: number;
  currency: string;
  supportPhone: string;
  shippingCost: number;
}

export interface AdminCategory {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  tint: string;
}

export interface AdminSubscription {
  id: string;
  title: string;
  duration: string;
  price: number;
  originalPrice: number;
  perks: string[];
}

export interface AdminShopProduct {
  id: string;
  title: string;
  category: string;
  description: string;
  price: number;
  originalPrice: number;
  imageUrl?: string;
  stock: number;
  isActive: boolean;
}

export interface AdminShopOrder {
  id: string;
  total: number;
  shippingCost?: number;
  status: 'placed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  cancelReason?: string | null;
  paymentMethod: string;
  address: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: Array<{
    quantity: number;
    price: number;
    product: {
      id: string;
      title: string;
      category: string;
      description: string;
      imageUrl?: string;
    };
  }>;
}

export interface BroadcastNotificationResult {
  message: string;
  sentCount: number;
  failedCount: number;
  targetCount: number;
}


async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || `Request failed: ${response.status}`);
  }

  return response.json();
}

export function resolveAssetUrl(url?: string) {
  if (!url) return '';
  const localUploadPath = url.match(
    /^https?:\/\/(?:127\.0\.0\.1|localhost):\d+(\/uploads\/.+)$/i,
  )?.[1];
  if (localUploadPath) {
    return `${PUBLIC_API_ORIGIN}${localUploadPath}`;
  }
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${PUBLIC_API_ORIGIN}${url}`;
}

export function getSummary() {
  return request<AdminSummary>('/admin/summary');
}

export function getOrders() {
  return request<AdminOrder[]>('/admin/orders');
}

export function getOrder(id: string) {
  return request<AdminOrder>(`/admin/orders/${id}`);
}

export function getUsers() {
  return request<AdminUser[]>('/admin/users');
}

export function deleteUser(id: number) {
  return request(`/admin/users/${id}`, {
    method: 'DELETE',
  });
}

export function getServices() {
  return request<AdminService[]>('/admin/services');
}

export function getCategories() {
  return request<AdminCategory[]>('/categories');
}

export function getHomeSlides() {
  return request<AdminHomeSlide[]>('/admin/home-slides');
}

export function saveHomeSlide(slide: Partial<AdminHomeSlide>) {
  const path = slide.id
    ? `/admin/home-slides/${slide.id}`
    : '/admin/home-slides';
  return request(path, {
    method: slide.id ? 'PUT' : 'POST',
    body: JSON.stringify(slide),
  });
}

export function getSettings() {
  return request<AdminSettings>('/admin/settings');
}

export function saveSettings(settings: AdminSettings) {
  return request<AdminSettings>('/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}

export async function uploadImage(dataUrl: string, filename: string) {
  const response = await request<{ url: string }>('/admin/uploads', {
    method: 'POST',
    body: JSON.stringify({ dataUrl, filename }),
  });

  return response.url;
}

export function updateOrderStatus(
  id: string,
  status: AdminOrder['status'],
  cancelReason?: string | null,
) {
  return request(`/admin/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, cancelReason }),
  });
}

export function saveService(service: Partial<AdminService>) {
  const isUpdate = Boolean(service.id);
  return request(
    isUpdate ? `/admin/services/${service.id}` : '/admin/services',
    {
      method: isUpdate ? 'PUT' : 'POST',
      body: JSON.stringify(service),
    },
  );
}

export function getSubscriptions() {
  return request<AdminSubscription[]>('/admin/subscriptions');
}

export function saveSubscription(sub: Partial<AdminSubscription>) {
  const isUpdate = Boolean(sub.id);
  return request(
    isUpdate ? `/admin/subscriptions/${sub.id}` : '/admin/subscriptions',
    {
      method: isUpdate ? 'PUT' : 'POST',
      body: JSON.stringify(sub),
    },
  );
}

export function deleteSubscription(id: string) {
  return request(`/admin/subscriptions/${id}`, {
    method: 'DELETE',
  });
}

export function getShopProducts() {
  return request<AdminShopProduct[]>('/admin/shop/products');
}

export function saveShopProduct(product: Partial<AdminShopProduct>) {
  const isUpdate = Boolean(product.id);
  return request(
    isUpdate ? `/admin/shop/products/${product.id}` : '/admin/shop/products',
    {
      method: isUpdate ? 'PUT' : 'POST',
      body: JSON.stringify(product),
    },
  );
}

export function getShopOrders() {
  return request<AdminShopOrder[]>('/admin/shop/orders');
}

export function updateShopOrderStatus(
  id: string,
  status: AdminShopOrder['status'],
  cancelReason?: string | null,
) {
  return request<{
    message: string;
    id: string;
    status: AdminShopOrder['status'];
    pushStatus: 'sent' | 'failed' | 'not_sent' | 'not_configured';
    pushMessage: string;
  }>(`/admin/shop/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, cancelReason }),
  });
}

export function sendBroadcastNotification(input: {
  title: string;
  message: string;
}) {
  return request<BroadcastNotificationResult>('/admin/notifications/broadcast', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
