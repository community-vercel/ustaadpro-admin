import type {
  AdminCategory,
  AdminHomeSlide,
  AdminService,
  AdminSettings,
} from './api';

export const fallbackCategories: AdminCategory[] = [
  {
    id: 'ac-services',
    title: 'AC Services',
    subtitle: 'Maintenance, installation, gas refill',
    icon: 'air-conditioner',
    tint: '#4F46E5',
  },
  {
    id: 'electrician',
    title: 'Electrician',
    subtitle: 'Wiring, fans, lights, sockets',
    icon: 'lightning-bolt',
    tint: '#F59E0B',
  },
  {
    id: 'plumbers',
    title: 'Plumbers',
    subtitle: 'Leakage, taps, geyser and pipe repairs',
    icon: 'wrench',
    tint: '#0891B2',
  },
  {
    id: 'home-cleaning',
    title: 'Home Cleaning',
    subtitle: 'Deep cleaning and maintenance',
    icon: 'sparkles',
    tint: '#006C49',
  },
  {
    id: 'dry-cleaning',
    title: 'Dry Cleaning',
    subtitle: 'Sofa, carpet, rug shampooing',
    icon: 'sparkle',
    tint: '#213145',
  },
  {
    id: 'subscriptions',
    title: 'Subscriptions',
    subtitle: 'Monthly home/office maintenance',
    icon: 'calendar',
    tint: '#213145',
  },
  {
    id: 'painters',
    title: 'Painters',
    subtitle: 'Wall painting and polishing',
    icon: 'format-paint',
    tint: '#D97706',
  },
  {
    id: 'carpenter',
    title: 'Carpenter',
    subtitle: 'Furniture, doors, locks',
    icon: 'hammer',
    tint: '#92400E',
  },
  {
    id: 'welder-fabricator',
    title: 'Welder & Fabricator',
    subtitle: 'Gate, grill, glass and ceiling works',
    icon: 'anvil',
    tint: '#4B5563',
  },
  {
    id: 'cctv',
    title: 'CCTV Services',
    subtitle: 'Camera installation and maintenance',
    icon: 'cctv',
    tint: '#1E3A8A',
  },
];

export const emptyService: Partial<AdminService> = {
  categoryId: 'ac-services',
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
  workPrices: [{title: '', description: '', price: 0, sortOrder: 0}],
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
  rewardEnabled: true,
  rewardPointValue: 25,
  rewardMinimumRedeem: 100,
  serviceRewardPointsOnCompletion: 1,
  serviceRewardMaxDiscountPercent: 10,
  shopRewardEarnPercent: 0.5,
  shopRewardMaxDiscountPercent: 5,
};

export function money(value: number) {
  return `Rs. ${Number(value || 0).toLocaleString('en-PK')}`;
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
