import { z } from "zod";
import { VendorCategory, PriceTier, VendorRating } from "@/types/vendor";

// Validation for vendor categories
const vendorCategoryEnum = z.enum([
  'venue',
  'catering',
  'entertainment',
  'staffing',
  'equipment',
  'transportation',
  'other'
]) as z.ZodType<VendorCategory>;

// Validation for price tiers - updated to use numbers directly
const priceTierEnum = z.number()
  .int()
  .min(1)
  .max(4)
  .transform(val => val as PriceTier);

// Validation for vendor ratings - updated to use numbers directly
const vendorRatingEnum = z.number()
  .int()
  .min(1)
  .max(5)
  .transform(val => val as VendorRating);

// Core vendor schema
export const vendorSchema = z.object({
  name: z.string()
    .min(2, { message: "Vendor name must be at least 2 characters" })
    .max(100, { message: "Vendor name cannot exceed 100 characters" }),
  
  category: vendorCategoryEnum,
  
  priceTier: priceTierEnum,
  
  capacity: z.number()
    .int()
    .positive()
    .optional(),
  
  rating: vendorRatingEnum.optional(),
  
  location: z.string()
    .max(150, { message: "Location cannot exceed 150 characters" })
    .optional(),
  
  contactName: z.string()
    .max(100, { message: "Contact name cannot exceed 100 characters" })
    .optional(),
  
  contactEmail: z.string()
    .email({ message: "Please enter a valid email address" })
    .max(100, { message: "Email cannot exceed 100 characters" })
    .optional(),
  
  contactPhone: z.string()
    .max(20, { message: "Phone number cannot exceed 20 characters" })
    .optional(),
  
  website: z.string()
    .url({ message: "Please enter a valid URL" })
    .max(200, { message: "Website URL cannot exceed 200 characters" })
    .optional(),
  
  notes: z.string()
    .max(1000, { message: "Notes cannot exceed 1000 characters" })
    .optional(),
  
  isFavorite: z.boolean().default(false),
  
  amenities: z.array(z.string()).optional(),
});

// Export the type for form values
export type VendorFormValues = z.infer<typeof vendorSchema>;

// Event-Vendor relationship schema
export const eventVendorSchema = z.object({
  eventId: z.string(),
  vendorId: z.string(),
  role: z.string().max(100).optional(),
  budget: z.number().positive().optional(),
  notes: z.string().max(500).optional(),
}); 