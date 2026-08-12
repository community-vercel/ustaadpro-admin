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


export interface AdminComplaint {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  service: string;
  sub_service: string | null;
  description: string | null;
  images: string[] | null;
  status: 'pending' | 'in-review' | 'resolved' | 'rejected';
  created_at: string;
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
  status: 'checking_receipt' | 'confirmed' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
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
  walletUsed?: number;
  originalTotal?: number;
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
  paymentStage?: 'advance' | 'remaining' | 'full';
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
  subcategoryId?: string | null;
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
  redirectType?: 'category' | 'all_services' | 'quick_services' | 'subscriptions';
  visual: string;
  imageUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
}

export interface AdminSettings {
  inspectionFee: number;
  serviceTaxPercent: number;
  minimumBookingLeadHours: number;
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
  webImageUrl?: string;
  mobileIconUrl?: string;
}

export interface AdminSubcategory {
  id: string;
  categoryId: string;
  title: string;
  description?: string | null;
  webImageUrl?: string;
  mobileIconUrl?: string;
}

export interface AdminCatalogue {
  categories: AdminCategory[];
  subcategories: AdminSubcategory[];
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
  createdAt?: string;
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

export interface AdminPaymentReceiptsPage {
  receipts: AdminPaymentReceipt[];
  total: number;
  hasMore: boolean;
}

export interface AdminPaymentReceiptDetails {
  receipt: AdminPaymentReceipt;
  receipts: AdminPaymentReceipt[];
}

export function getPaymentReceipts(params: {limit?: number; offset?: number; search?: string; orderId?: string} = {}) {
  const query = new URLSearchParams();
  query.set('limit', String(params.limit ?? 15));
  query.set('offset', String(params.offset ?? 0));
  if (params.search) query.set('search', params.search);
  if (params.orderId) query.set('orderId', params.orderId);
  return request<AdminPaymentReceiptsPage>('/admin/payment-receipts?' + query.toString());
}

export function getPaymentReceipt(id: number | string) {
  return request<AdminPaymentReceiptDetails>('/admin/payment-receipts/' + id);
}

export function updatePaymentReceiptStatus(id: number, status: 'submitted' | 'verified' | 'rejected') {
  return request('/admin/payment-receipts/' + id + '/status', {method: 'PATCH', body: JSON.stringify({status})});
}
export function deleteHomeSlide(id: string) {
  return request(`/admin/home-slides/${id}`, {method: 'DELETE'});
}
export function getServices() {
  return request<AdminService[]>('/admin/services');
}

export function getCategories() {
  return request<AdminCategory[]>('/categories');
}

export function getAdminCatalogue() {
  return request<AdminCatalogue>('/admin/catalogue');
}

export interface CatalogImportPreview {
  rows: number;
  categories: string[];
  subcategories: number;
  preview: Array<{ row: number; mainCategory: string; subcategory: string; title: string; price: number; unitDescription: string }>;
  imported?: boolean;
}

export function importServiceCatalog(dataUrl: string, commit = false) {
  return request<CatalogImportPreview>('/admin/catalogue/import', {
    method: 'POST',
    body: JSON.stringify({ dataUrl, commit }),
  });
}
export function saveAdminCategory(category: Partial<AdminCategory>) {
  return request('/admin/categories', { method: 'POST', body: JSON.stringify(category) });
}

export function saveAdminSubcategory(subcategory: Partial<AdminSubcategory>) {
  return request('/admin/subcategories', { method: 'POST', body: JSON.stringify(subcategory) });
}

export function deleteAdminCategory(id: string) {
  return request(`/admin/categories/${id}`, { method: 'DELETE' });
}

export function deleteAdminSubcategory(id: string) {
  return request(`/admin/subcategories/${id}`, { method: 'DELETE' });
}

export function deleteAdminService(id: string) {
  return request(`/admin/services/${id}`, { method: 'DELETE' });
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

export interface AdminShopProductsPage {
  products: AdminShopProduct[];
  total: number;
  page: number;
  limit: number;
  categories: Array<{name: string; total: number}>;
}

export async function getShopProducts(options: {page?: number; limit?: number; search?: string; category?: string} = {}): Promise<AdminShopProductsPage> {
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.limit) params.set('limit', String(options.limit));
  if (options.search) params.set('search', options.search);
  if (options.category && options.category !== 'All') params.set('category', options.category);
  const query = params.toString();
  const response = await request<AdminShopProductsPage | AdminShopProduct[]>(
    `/admin/shop/products${query ? `?${query}` : ''}`,
  );

  if (!Array.isArray(response)) {
    return {
      products: Array.isArray(response.products) ? response.products : [],
      total: Number(response.total || 0),
      page: Number(response.page || options.page || 1),
      limit: Number(response.limit || options.limit || 10),
      categories: Array.isArray(response.categories) ? response.categories : [],
    };
  }

  // Backward compatibility while an older backend deployment still returns
  // a plain array. Apply filtering and pagination locally until it is updated.
  const search = String(options.search || '').trim().toLowerCase();
  const category = options.category || 'All';
  const categoryTotals = new Map<string, number>();
  response.forEach(product => {
    categoryTotals.set(product.category, (categoryTotals.get(product.category) || 0) + 1);
  });
  const filtered = response.filter(product => {
    const matchesCategory = category === 'All' || product.category === category;
    const matchesSearch = !search || `${product.title} ${product.category} ${product.description}`.toLowerCase().includes(search);
    return matchesCategory && matchesSearch;
  });
  const page = Math.max(1, Number(options.page || 1));
  const limit = Math.max(1, Number(options.limit || 10));
  return {
    products: filtered.slice((page - 1) * limit, page * limit),
    total: filtered.length,
    page,
    limit,
    categories: [...categoryTotals.entries()].map(([name, total]) => ({name, total})),
  };
}

export async function getShopProduct(id: string): Promise<AdminShopProduct> {
  try {
    return await request<AdminShopProduct>(
      `/admin/shop/products/${encodeURIComponent(id)}`,
    );
  } catch (detailError) {
    // Older backend deployments have no single-product endpoint. Read the
    // existing list API directly and locate the record until the backend is updated.
    const firstResponse = await request<AdminShopProductsPage | AdminShopProduct[]>(
      '/admin/shop/products?page=1&limit=100',
    );
    if (Array.isArray(firstResponse)) {
      const product = firstResponse.find(item => item.id === id);
      if (product) return product;
      throw detailError;
    }

    const firstMatch = (firstResponse.products || []).find(item => item.id === id);
    if (firstMatch) return firstMatch;
    const totalPages = Math.ceil(
      Number(firstResponse.total || 0) / Math.max(1, Number(firstResponse.limit || 100)),
    );
    for (let page = 2; page <= totalPages; page += 1) {
      const response = await request<AdminShopProductsPage>(
        `/admin/shop/products?page=${page}&limit=100`,
      );
      const product = (response.products || []).find(item => item.id === id);
      if (product) return product;
    }
    throw detailError;
  }
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
  return botRequest<BotStat>('/bot/stats');
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

export async function getComplaints(status?: string, limit = 50, offset = 0) {
  const url = new URL(`${API_BASE_URL}/complaints`);
  if (status) url.searchParams.set('status', status);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('offset', String(offset));

  return request<any>(url.toString().replace(API_BASE_URL, ''));
}

export async function updateComplaintStatus(id: number, status: string) {
  return request<any>(`/complaints/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

