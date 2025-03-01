import { z } from 'zod';
import { ParticipantStatus } from '@/types/participant';

// Participant schema for form validation
export const participantSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(100, { message: 'Name must not exceed 100 characters' }),
  email: z
    .string()
    .email({ message: 'Please enter a valid email address' })
    .max(255, { message: 'Email must not exceed 255 characters' }),
  organization: z
    .string()
    .max(100, { message: 'Organization must not exceed 100 characters' })
    .optional(),
  role: z
    .string()
    .max(100, { message: 'Role must not exceed 100 characters' })
    .optional(),
  dietaryRequirements: z
    .string()
    .max(500, { message: 'Dietary requirements must not exceed 500 characters' })
    .optional(),
  accessibilityNeeds: z
    .string()
    .max(500, { message: 'Accessibility needs must not exceed 500 characters' })
    .optional(),
  notes: z
    .string()
    .max(1000, { message: 'Notes must not exceed 1000 characters' })
    .optional(),
});

// Schema for event participant relationship
export const eventParticipantSchema = z.object({
  eventId: z.string().uuid({ message: 'Invalid event ID' }),
  participantId: z.string().uuid({ message: 'Invalid participant ID' }),
  status: z.enum(['confirmed', 'pending', 'declined', 'waitlisted'] as const),
  notes: z.string().max(1000).optional(),
});

// Type inference for our schemas
export type ParticipantFormValues = z.infer<typeof participantSchema>;
export type EventParticipantFormValues = z.infer<typeof eventParticipantSchema>; 