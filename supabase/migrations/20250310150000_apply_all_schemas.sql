-- Comprehensive migration to recreate all necessary database objects
-- Based on the migrations from apps/api/supabase/migrations

-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create trigger for updated_at on events
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_events_updated_at ON public.events;
CREATE TRIGGER set_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create timeline_blocks table
CREATE TABLE IF NOT EXISTS public.timeline_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create vendors table
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    website TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create budget_items table
CREATE TABLE IF NOT EXISTS public.budget_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    planned_amount INTEGER NOT NULL,
    actual_amount INTEGER,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
    is_paid BOOLEAN DEFAULT false,
    is_per_attendee BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create vendor_documents table
CREATE TABLE IF NOT EXISTS public.vendor_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    document_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create participants table
CREATE TABLE IF NOT EXISTS public.participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'invited',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create budget_by_category view
DROP VIEW IF EXISTS public.budget_by_category;
CREATE VIEW public.budget_by_category AS
SELECT 
  event_id,
  category,
  SUM(planned_amount) as total_planned,
  SUM(actual_amount) as total_spent,
  COUNT(*) as item_count
FROM 
  public.budget_items
GROUP BY 
  event_id, category;

-- Create budget_by_vendor view
DROP VIEW IF EXISTS public.budget_by_vendor;
CREATE VIEW public.budget_by_vendor AS
SELECT 
  v.id as vendor_id,
  v.name as vendor_name,
  b.event_id,
  e.name as event_name,
  SUM(b.planned_amount) as total_planned,
  SUM(b.actual_amount) as total_spent,
  COUNT(*) as item_count
FROM 
  public.budget_items b
JOIN 
  public.vendors v ON b.vendor_id = v.id
JOIN
  public.events e ON b.event_id = e.id
GROUP BY 
  v.id, v.name, b.event_id, e.name;

-- Create needed indexes
CREATE INDEX IF NOT EXISTS idx_budget_items_event_id ON public.budget_items(event_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_category ON public.budget_items(category);
CREATE INDEX IF NOT EXISTS idx_budget_items_vendor_id ON public.budget_items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_is_paid ON public.budget_items(is_paid);

CREATE INDEX IF NOT EXISTS idx_timeline_blocks_event_id ON public.timeline_blocks(event_id);
CREATE INDEX IF NOT EXISTS idx_participants_event_id ON public.participants(event_id);
CREATE INDEX IF NOT EXISTS idx_vendor_documents_vendor_id ON public.vendor_documents(vendor_id);

-- Set up RLS (Row Level Security) policies
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable all operations for authenticated users on events" ON public.events
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users on budget_items" ON public.budget_items
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users on timeline_blocks" ON public.timeline_blocks
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users on vendors" ON public.vendors
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users on vendor_documents" ON public.vendor_documents
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users on participants" ON public.participants
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Add triggers for updated_at on all tables
DROP TRIGGER IF EXISTS set_budget_items_updated_at ON public.budget_items;
CREATE TRIGGER set_budget_items_updated_at
BEFORE UPDATE ON public.budget_items
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_timeline_blocks_updated_at ON public.timeline_blocks;
CREATE TRIGGER set_timeline_blocks_updated_at
BEFORE UPDATE ON public.timeline_blocks
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_vendors_updated_at ON public.vendors;
CREATE TRIGGER set_vendors_updated_at
BEFORE UPDATE ON public.vendors
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_vendor_documents_updated_at ON public.vendor_documents;
CREATE TRIGGER set_vendor_documents_updated_at
BEFORE UPDATE ON public.vendor_documents
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_participants_updated_at ON public.participants;
CREATE TRIGGER set_participants_updated_at
BEFORE UPDATE ON public.participants
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Make sure RLS policies apply to views
ALTER VIEW public.budget_by_category OWNER TO authenticated;
ALTER VIEW public.budget_by_vendor OWNER TO authenticated; 