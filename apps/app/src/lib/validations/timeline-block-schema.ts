import { z } from "zod";
import { TimelineBlockStatus } from "../../types/timeline";

// Precision options for time blocks
export type TimePrecision = '15min' | '30min';

// Helper function to round time based on precision
export const roundToTimeInterval = (date: Date, precision: TimePrecision = '30min'): Date => {
  const minutes = date.getMinutes();
  let roundedMinutes: number;
  
  if (precision === '15min') {
    // Round to nearest 15 minutes
    roundedMinutes = Math.round(minutes / 15) * 15;
    if (roundedMinutes === 60) roundedMinutes = 0;
  } else {
    // Default: round to nearest 30 minutes
    roundedMinutes = minutes < 15 ? 0 : minutes < 45 ? 30 : 0;
    // If rounding up to the next hour
    if (minutes >= 45) {
      const newDate = new Date(date);
      newDate.setHours(date.getHours() + 1);
      newDate.setMinutes(0);
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);
      return newDate;
    }
  }
  
  const newDate = new Date(date);
  newDate.setMinutes(roundedMinutes);
  newDate.setSeconds(0);
  newDate.setMilliseconds(0);
  return newDate;
};

// Factory function to create a time validator based on precision
export const createTimeValidator = (precision: TimePrecision = '30min') => {
  return z.string().refine(
    (val) => {
      try {
        // Validate if the string can be parsed as a date
        const parsed = new Date(val);
        const isValid = !isNaN(parsed.getTime());
        
        if (!isValid) return false;
        
        // Check if the time is aligned to the right intervals
        const minutes = parsed.getMinutes();
        
        if (precision === '15min') {
          // Allow 15-minute intervals (0, 15, 30, 45)
          return minutes % 15 === 0;
        } else {
          // Default: allow 30-minute intervals (0, 30)
          return minutes === 0 || minutes === 30;
        }
      } catch {
        return false;
      }
    },
    {
      message: precision === '15min' 
        ? "Time must be aligned to 15-minute intervals (XX:00, XX:15, XX:30, or XX:45)" 
        : "Time must be aligned to 30-minute intervals (XX:00 or XX:30)",
    }
  );
};

// Default time validator with 30-minute precision
export const timeValidator = createTimeValidator('30min');

// Timeline block validation schema
export const timelineBlockSchema = z.object({
  eventId: z.string().uuid("Event ID must be a valid UUID"),
  title: z.string().min(1, "Title is required"),
  startTime: timeValidator,
  endTime: timeValidator,
  location: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'in-progress', 'complete', 'cancelled'] as const).default('pending'),
}).refine(
  data => new Date(data.startTime) < new Date(data.endTime),
  {
    message: "End time must be after start time",
    path: ["endTime"],
  }
);

// Create a version of the schema that allows 15-minute precision
export const timelineBlockSchema15Min = z.object({
  eventId: z.string().uuid("Event ID must be a valid UUID"),
  title: z.string().min(1, "Title is required"),
  startTime: createTimeValidator('15min'),
  endTime: createTimeValidator('15min'),
  location: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'in-progress', 'complete', 'cancelled'] as const).default('pending'),
}).refine(
  data => new Date(data.startTime) < new Date(data.endTime),
  {
    message: "End time must be after start time",
    path: ["endTime"],
  }
);

// Type for our form values, derived from the schema
export type TimelineBlockFormValues = z.infer<typeof timelineBlockSchema>; 