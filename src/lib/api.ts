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
  rewardPoints: number;
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
  rewardPointsEarned?: number;
  rewardPointsRedeemed?: number;
  rewardDiscount?: number;
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
    serviceWorkPriceId?: number | null;
    serviceWorkTitle?: string | null;
    imageUrl?: string;
    detailDescription?: string;
    details?: string[];
    quantity: number;
    price: number;
  }>;
}

export interface AdminPaymentReceipt {
  id: number;
  orderId: string;
  userId: number;
  receiptUrl: string;
  amount: number;
  accountNumber: string;
  accountTitle: string;
  status: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  orderTotal: number;
  orderStatus: string;
  bookedFor: string;
  paymentMethod: string;
  address: string;
  items: AdminOrder['items'];
}
export interface AdminServiceWorkPrice {
  id?: number;
  serviceId?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  price: number;
  sortOrder?: number;
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
  workPrices?: AdminServiceWorkPrice[];
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
  rewardEnabled: boolean;
  rewardPointValue: number;
  rewardMinimumRedeem: number;
  serviceRewardPointsOnCompletion: number;
  serviceRewardMaxDiscountPercent: number;
  shopRewardEarnPercent: number;
  shopRewardMaxDiscountPercent: number;
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
  rewardPointsEarned?: number;
  rewardPointsRedeemed?: number;
  rewardDiscount?: number;
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
  // Ensure we don't duplicate /api if API_BASE_URL already has it,
  // and make sure the path starts with /api
  const base = API_BASE_URL.replace(/\/api\/?$/, '');
  const finalPath = path.startsWith('/api') ? path : `/api${path.startsWith('/') ? '' : '/'}${path}`;

  const response = await fetch(`${base}${finalPath}`, {
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

export function getPaymentReceipts() {
  return request<AdminPaymentReceipt[]>('/admin/payment-receipts');
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

// â”€â”€â”€ WHATSAPP BOT API TYPES & METHODS â”€â”€â”€

export interface BotStat {
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  todayBookings: number;
  activeServices: number;
  activeSessions: number;
}

export interface BotService {
  id?: string;
  _id?: string;
  category: string;
  name: string;
  msg: string;
  options: Record<string, string>;
  active: boolean;
}

export interface BotBooking {
  id?: string;
  _id?: string;
  userId: string;
  mainCategory: string;
  serviceType: string;
  subService: string;
  date: string;
  time: string;
  customerPhone?: string;
  customer_phone?: string;
  address?: string;
  addressType?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt?: string;
}

export interface BotSession {
  userId?: string;
  user_id?: string;
  step: string;
  updatedAt?: string;
  updated_at?: string;
  order_details?: any;
}

export function getBotStats() {
  return botRequest<BotStat>('/stats');
}

export function getBotServices() {
  return botRequest<BotService[]>('/bot/services');
}

export function saveBotService(service: Partial<BotService>) {
  const id = service.id || service._id;
  const isUpdate = Boolean(id);
  return botRequest(
    isUpdate ? `/bot/services/${id}` : '/bot/services',
    {
      method: isUpdate ? 'PUT' : 'POST',
      body: JSON.stringify(service),
    },
  );
}

export function deleteBotService(id: string) {
  return botRequest(`/bot/services/${id}`, { method: 'DELETE' });
}

export function getBotBookings() {
  return botRequest<BotBooking[]>('/bookings');
}

export function updateBotBookingStatus(id: string, status: BotBooking['status']) {
  return botRequest(`/bookings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function deleteBotBooking(id: string) {
  return botRequest(`/bookings/${id}`, { method: 'DELETE' });
}

export function getBotSessions() {
  return botRequest<BotSession[]>('/sessions');
}

export interface BotConnectionStatus {
  status: 'online' | 'offline' | 'connecting' | 'starting';
  qr?: string | null;
  phone?: string | null;
}

async function botRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let base = 'https://api.ustaadpro.pk'; // DEFAULT for local development

  if (typeof window !== 'undefined') {
    // Check if NOT running on localhost (i.e., production)
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      base = 'https://api.ustaadpro.pk'; // Production URL
    }
  }

  const finalPath = path.startsWith('/api') ? path : `/api${path}`;

  console.log('🔧 botRequest URL:', `${base}${finalPath}`);

  const response = await fetch(`${base}${finalPath}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    cache: 'no-store',
  });

  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

export function getBotConnectionStatus() {
  return botRequest<BotConnectionStatus>('/bot/status');
}

export function startBot() {
  return botRequest<{ success: boolean; status: string; qr?: string | null; phone?: string | null }>('/bot/start', { method: 'POST' });
}

export function stopBot() {
  return botRequest<{ success: boolean; message: string }>('/bot/stop', { method: 'POST' });
}
