/**
 * Budget types for Event Command Center
 * 
 * Defines the core budget data structures used throughout the application
 */

/**
 * Core budget item type with essential fields for MVP
 */
export interface BudgetItem {
  id: string;
  eventId: string;
  description: string;
  category: string;
  plannedAmount: number;
  actualAmount?: number;
  vendorId?: string;
  isPaid: boolean;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * Database representation of a budget item
 * Uses snake_case column names following existing patterns
 */
export interface BudgetItemDbRow {
  id: string;
  event_id: string;
  description: string;
  category: string;
  planned_amount: number;
  actual_amount: number | null;
  vendor_id: string | null;
  is_paid: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Form values for creating/editing budget items
 */
export interface BudgetItemFormValues {
  description: string;
  category: string;
  plannedAmount: number;
  actualAmount?: number;
  vendorId?: string;
  isPaid: boolean;
  notes?: string;
} 