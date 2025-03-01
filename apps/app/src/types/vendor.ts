/**
 * Vendor types for Event Command Center
 * 
 * Defines the core vendor data structures used throughout the application
 */

/**
 * Core vendor categories for filtering and organization
 */
export type VendorCategory = 
  | 'venue' 
  | 'catering' 
  | 'entertainment' 
  | 'staffing' 
  | 'equipment' 
  | 'transportation' 
  | 'other';

/**
 * Price tier representation ($ to $$$$)
 */
export type PriceTier = 1 | 2 | 3 | 4;

/**
 * Vendor rating on a 5-star scale
 */
export type VendorRating = 1 | 2 | 3 | 4 | 5;

/**
 * Core vendor type with essential fields for MVP
 */
export interface Vendor {
  id: string;
  name: string;
  category: VendorCategory;
  priceTier: PriceTier;
  capacity?: number;
  rating?: VendorRating;
  location?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  amenities?: string[];
  website?: string;
  notes?: string;
  isFavorite?: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * Database representation of the vendor
 * Uses snake_case column names following your existing patterns
 */
export interface VendorDbRow {
  id: string;
  name: string;
  category: string;
  price_tier: number;
  capacity: number | null;
  rating: number | null;
  location: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  amenities: string[] | null;
  website: string | null;
  notes: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Form values for creating/editing vendors
 */
export interface VendorFormValues {
  name: string;
  category: VendorCategory;
  priceTier: PriceTier;
  capacity?: number;
  rating?: VendorRating;
  location?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  amenities?: string[];
  website?: string;
  notes?: string;
  isFavorite?: boolean;
}

/**
 * Relationship between events and vendors
 */
export interface EventVendor {
  id: string;
  eventId: string;
  vendorId: string;
  role?: string;
  budget?: number;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * Database representation of the event-vendor relationship
 */
export interface EventVendorDbRow {
  id: string;
  event_id: string;
  vendor_id: string;
  role: string | null;
  budget: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Vendor document type for file attachments
 */
export interface VendorDocument {
  id: string;
  vendorId: string;
  name: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * Database representation of the vendor document
 */
export interface VendorDocumentDbRow {
  id: string;
  vendor_id: string;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
} 