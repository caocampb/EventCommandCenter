-- Create vendors table
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price_tier INTEGER NOT NULL CHECK (price_tier >= 1 AND price_tier <= 4),
    capacity INTEGER,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    location TEXT,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    amenities TEXT[],
    website TEXT,
    notes TEXT,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create event_vendors junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.event_vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    role TEXT,
    budget NUMERIC(10,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(event_id, vendor_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vendors_category ON public.vendors(category);
CREATE INDEX IF NOT EXISTS idx_vendors_price_tier ON public.vendors(price_tier);
CREATE INDEX IF NOT EXISTS idx_vendors_rating ON public.vendors(rating);
CREATE INDEX IF NOT EXISTS idx_vendors_is_favorite ON public.vendors(is_favorite);
CREATE INDEX IF NOT EXISTS idx_event_vendors_event_id ON public.event_vendors(event_id);
CREATE INDEX IF NOT EXISTS idx_event_vendors_vendor_id ON public.event_vendors(vendor_id);

-- Enable RLS policies
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_vendors ENABLE ROW LEVEL SECURITY;

-- For simplicity in development, allow all authenticated users to access vendors
CREATE POLICY "Enable all operations for authenticated users" ON public.vendors
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
    
-- Allow all authenticated users to access event_vendors
CREATE POLICY "Enable all operations for authenticated users" ON public.event_vendors
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for vendors table
DROP TRIGGER IF EXISTS set_vendors_updated_at ON public.vendors;
CREATE TRIGGER set_vendors_updated_at
BEFORE UPDATE ON public.vendors
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add trigger for event_vendors table
DROP TRIGGER IF EXISTS set_event_vendors_updated_at ON public.event_vendors;
CREATE TRIGGER set_event_vendors_updated_at
BEFORE UPDATE ON public.event_vendors
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at(); 