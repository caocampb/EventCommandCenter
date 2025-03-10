-- Create budget_items table with a clean, minimal structure
CREATE TABLE IF NOT EXISTS public.budget_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    planned_amount INTEGER NOT NULL,
    actual_amount INTEGER,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
    is_paid BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_budget_items_event_id ON public.budget_items(event_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_category ON public.budget_items(category);
CREATE INDEX IF NOT EXISTS idx_budget_items_vendor_id ON public.budget_items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_is_paid ON public.budget_items(is_paid);

-- Enable RLS policies
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

-- For MVP development, allow all authenticated users to access budget_items
CREATE POLICY "Enable all operations for authenticated users" ON public.budget_items
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS set_budget_items_updated_at ON public.budget_items;
CREATE TRIGGER set_budget_items_updated_at
BEFORE UPDATE ON public.budget_items
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

