import { z } from "zod";
import { EventStatus } from "@/types/events";

// Custom date validator that works with datetime-local input
const dateStringSchema = z.string().refine(
  (val) => {
    try {
      // This validates if the string can be parsed as a date
      // and will work with datetime-local format YYYY-MM-DDThh:mm
      return !isNaN(new Date(val).getTime());
    } catch {
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
  parentEventId: z.string().uuid().optional(),
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