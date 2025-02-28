import { z } from "zod";
import { EventStatus } from "@/types/events";

// Custom date validator that works with datetime-local input
const dateStringSchema = z.string().refine(
  (val) => {
    try {
      // Debug log to see what values are being validated
      console.log("Validating date string:", val);
      
      // This validates if the string can be parsed as a date
      // and will work with datetime-local format YYYY-MM-DDThh:mm
      const parsed = new Date(val);
      const isValid = !isNaN(parsed.getTime());
      console.log(`Date parsing result: ${isValid ? 'valid' : 'invalid'}`);
      return isValid;
    } catch (err) {
      console.error("Date validation error:", err);
      return false;
    }
  },
  {
    message: "Please enter a valid date",
  }
);

// Event validation schema - core validation only for MVP
export const eventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  startDate: dateStringSchema,
  endDate: dateStringSchema,
  location: z.string().min(1, "Location is required"),
  status: z.enum(['draft', 'confirmed', 'in-progress', 'completed', 'cancelled'] as const).default('draft'),
  attendeeCount: z.number().int().positive("Attendee count must be a positive number"),
  description: z.string().optional(),
  type: z.string().optional(),
  // Allow parentEventId to be null, undefined, or a valid UUID string
  parentEventId: z.union([z.string().uuid(), z.null(), z.undefined()]),
}).refine(
  data => new Date(data.startDate) < new Date(data.endDate),
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
);

// Type for our form values, derived from the schema
export type EventFormValues = z.infer<typeof eventSchema>;

// Create event form validation - used in the create event form
export const createEventSchema = eventSchema; 