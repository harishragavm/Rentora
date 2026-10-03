export type ProductCategory =
  | 'bikes'
  | 'cameras'
  | 'laptops'
  | 'drones'
  | 'gaming'
  | 'tools'
  | 'outdoor'
  | 'audio'
  | 'other';

export type ProductCondition = 'brand_new' | 'like_new' | 'good' | 'fair';

export type ComponentConditionRating = 'excellent' | 'good' | 'poor';

export interface CategoryConditionDetails {
  overall?: ComponentConditionRating;
  engine?: ComponentConditionRating;
  tyre?: ComponentConditionRating;
  brake?: ComponentConditionRating;
  battery?: ComponentConditionRating;
  exterior?: ComponentConditionRating;
  body?: ComponentConditionRating;
  lens?: ComponentConditionRating;
  sensor?: ComponentConditionRating;
  display?: ComponentConditionRating;
  keyboardTrackpad?: ComponentConditionRating;
  performance?: ComponentConditionRating;
  accessoriesNotes?: string;
  additionalDescription?: string;
  [key: string]: any;
}

export type PricingPeriod = 'hour' | 'day' | 'week' | 'month';

export interface CategoryInfo {
  id: ProductCategory;
  label: string;
  description: string;
  iconName: string;
  popularItems: string[];
}

export interface SpecFieldDefinition {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'radio' | 'tags' | 'textarea' | 'checkbox';
  placeholder?: string;
  options?: string[];
  required?: boolean;
  helperText?: string;
  unit?: string;
}

export interface OwnerProfile {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  email: string;
  address?: string;
  city: string;
  pincode?: string;
  rating: number;
  totalReviews: number;
  verified: boolean;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  memberSince: string;
  responseRate: string;
}

export interface RenterProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  pincode: string;
  avatar?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
}

export interface ProductLocation {
  city: string;
  area?: string;
  address?: string;
  pincode?: string;
  district?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  pickupInstructions?: string;
  deliveryAvailable?: boolean;
}

export interface UserLocation {
  city: string;
  area?: string;
  address?: string;
  pincode?: string;
  district?: string;
  formattedAddress?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  isLive?: boolean;
  isManual?: boolean;
  permissionState?: 'loading' | 'granted' | 'denied' | 'unavailable';
  errorMessage?: string;
}

export interface AvailabilityConfig {
  startDate?: string;
  endDate?: string;
  openEnded: boolean;
  pickupTimeStart: string;
  pickupTimeEnd: string;
  minDuration: number;
  minDurationUnit: 'hours' | 'days';
  maxDuration?: number;
  returnTimeInstructions?: string;
}

export interface RentalPricing {
  price: number;
  period: PricingPeriod;
  securityDeposit: number;
  lateFeePerHour?: number;
  cancellationPolicy: 'Flexible (100% refund up to 24h prior)' | 'Moderate (50% refund up to 48h prior)' | 'Strict (Non-refundable)';
}

export interface ProductListing {
  id: string;
  ownerId: string;
  ownerName?: string;
  ownerMobile?: string;
  ownerLocation?: ProductLocation;
  title: string;
  category: ProductCategory;
  brand: string;
  model: string;
  description: string;
  images: string[];
  primaryImageIndex: number;
  condition: ProductCondition;
  conditionNotes?: string;
  categoryCondition?: CategoryConditionDetails;
  healthStatus?: string;
  specs: Record<string, any>;
  accessoriesIncluded: string[];
  documentsProvided?: string[];
  location: ProductLocation;
  productLocation?: ProductLocation;
  availability: AvailabilityConfig;
  pricing: RentalPricing;
  rules: string[];
  owner: OwnerProfile;
  createdAt: string;
  status: 'active' | 'paused';
  viewsCount: number;
  rentalCount: number;
  distanceKm?: number;
}
