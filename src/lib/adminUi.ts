import type {
  AdminCategory,
  AdminHomeSlide,
  AdminService,
  AdminSettings,
} from './api';

export const fallbackCategories: AdminCategory[] = [
  {
    id: 'home',
    title: 'Home Services',
    subtitle: 'AC, plumbing, electrical',
    icon: 'tools',
    tint: '#0b1c30',
  },
  {
    id: 'cleaning',
    title: 'Cleaning',
    subtitle: 'Deep clean and sofa care',
    icon: 'sparkle',
    tint: '#0891B2',
  },
  {
    id: 'salon',
    title: 'Salon',
    subtitle: 'Facials, mani and pedi',
    icon: 'salon',
    tint: '#006c49',
  },
  {
    id: 'subscriptions',
    title: 'Subscriptions',
    subtitle: 'Monthly care bundles',
    icon: 'calendar',
    tint: '#7C3AED',
  },
];

export const emptyService: Partial<AdminService> = {
  categoryId: 'home',
  title: '',
  description: '',
  price: 0,
  originalPrice: 0,
  duration: '60 min',
  rating: 0,
  reviews: 0,
  badge: '',
  serviceType: 'Standard Visit',
  imageUrl: '',
  detailDescription: '',
  details: [
    'Complete safety inspection included',
    'Genuine replacement parts available',
    '7-day service warranty',
  ],
  includes: [''],
  excludes: [''],
};

export const emptySlide: Partial<AdminHomeSlide> = {
  id: '',
  badge: 'Featured',
  title: '',
  subtitle: '',
  buttonLabel: 'Book Now',
  categoryId: 'home',
  categoryTitle: 'Home Services',
  visual: 'UP',
  imageUrl: '',
  primaryColor: '#131b2e',
  secondaryColor: '#213145',
  sortOrder: 1,
  isActive: true,
};

export const defaultSettings: AdminSettings = {
  inspectionFee: 500,
  serviceTaxPercent: 12,
  currency: 'PKR',
  supportPhone: '+923001234567',
  shippingCost: 200,
};

export function money(value: number) {
  return `PKR ${Number(value || 0).toLocaleString('en-PK')}`;
}

export function parseBookingSchedule(bookedFor: string) {
  const recurringMatch = bookedFor.match(
    /^Recurring:\s*(.+?)\s+to\s+(.+?)\s+-\s+(.+)$/,
  );

  if (!recurringMatch) {
    return {
      isRecurring: false,
      start: bookedFor,
      end: '',
      time: '',
      label: bookedFor,
      occurrences: 1,
    };
  }

  const [, start, end, time] = recurringMatch;
  const startTime = Date.parse(start);
  const endTime = Date.parse(end);
  const occurrences =
    Number.isNaN(startTime) || Number.isNaN(endTime)
      ? 1
      : Math.max(
          1,
          Math.round((endTime - startTime) / (24 * 60 * 60 * 1000)) + 1,
        );

  return {
    isRecurring: true,
    start,
    end,
    time,
    label: `${start} to ${end} at ${time}`,
    occurrences,
  };
}

export function categoryHeroColor(categoryId?: string) {
  if (categoryId === 'cleaning') return '#e5eeff';
  if (categoryId === 'home') return '#dce9ff';
  if (categoryId === 'salon') return '#e8f8f1';
  return '#d3e4fe';
}
