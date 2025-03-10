-- Add is_per_attendee column to budget_items table
ALTER TABLE public.budget_items ADD COLUMN IF NOT EXISTS is_per_attendee BOOLEAN DEFAULT false;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_budget_items_is_per_attendee ON public.budget_items(is_per_attendee);

-- Add comment to explain purpose
COMMENT ON COLUMN public.budget_items.is_per_attendee IS 'Indicates if the budget item cost is per attendee (true) or a fixed cost (false)'; 