/**
 * Participant types for Event Command Center
 * 
 * Defines the core participant data structures used throughout the application
 */

/**
 * RSVP status options
 */
export type ParticipantStatus = 'confirmed' | 'pending' | 'declined' | 'waitlisted';

/**
 * Core participant type with essential fields for MVP
 */
export interface Participant {
  id: string;
  name: string;
  email: string;
  organization?: string;
  role?: string;
  dietaryRequirements?: string;
  accessibilityNeeds?: string;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * Database representation of the participant
 * Uses snake_case column names following your existing patterns
 */
export interface ParticipantDbRow {
  id: string;
  name: string;
  email: string;
  organization: string | null;
  role: string | null;
  dietary_requirements: string | null;
  accessibility_needs: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Form values for creating/editing participants
 */
export interface ParticipantFormValues {
  name: string;
  email: string;
  organization?: string;
  role?: string;
  dietaryRequirements?: string;
  accessibilityNeeds?: string;
  notes?: string;
}

/**
 * Relationship between events and participants
 */
export interface EventParticipant {
  id: string;
  eventId: string;
  participantId: string;
  status: ParticipantStatus;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * Database representation of the event-participant relationship
 */
export interface EventParticipantDbRow {
  id: string;
  event_id: string;
  participant_id: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
} 