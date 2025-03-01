import { z } from "zod";

// Budget item schema - clean and minimal validation
export const budgetItemSchema = z.object({
  // Required fields
  eventId: z.string().uuid(),
  description: z.string()
    .min(2, { message: "Description must be at least 2 characters" })
    .max(100, { message: "Description cannot exceed 100 characters" }),
  category: z.string()
    .min(1, { message: "Category is required" })
    .max(50, { message: "Category cannot exceed 50 characters" }),
  plannedAmount: z.number()
    .int({ message: "Amount must be a whole number" })
    .nonnegative({ message: "Amount must be zero or positive" }),
  
  // Optional fields
  actualAmount: z.number()
    .int({ message: "Amount must be a whole number" })
    .nonnegative({ message: "Amount must be zero or positive" })
    .optional(),
  vendorId: z.string().uuid().optional(),
  isPaid: z.boolean().default(false),
  notes: z.string()
    .max(500, { message: "Notes cannot exceed 500 characters" })
    .optional(),
});

// Export the type for form values
export type BudgetItemFormValues = z.infer<typeof budgetItemSchema>;

// Schema for updating a budget item - all fields optional
export const budgetItemUpdateSchema = budgetItemSchema.partial().omit({ eventId: true }); 