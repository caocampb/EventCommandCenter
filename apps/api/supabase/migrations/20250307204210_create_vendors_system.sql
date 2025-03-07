-- Create vendors table
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    category TEXT,
    website TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Set RLS (Row Level Security) on vendors table
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to authenticated users
CREATE POLICY "Allow read access for authenticated users" ON public.vendors
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy to allow insert/update/delete for authenticated users
CREATE POLICY "Allow insert/update/delete for authenticated users" ON public.vendors
    FOR ALL USING (auth.role() = 'authenticated');

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

-- Set RLS on event_vendors table
ALTER TABLE public.event_vendors ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to authenticated users
CREATE POLICY "Allow read access for authenticated users" ON public.event_vendors
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy to allow insert/update/delete for authenticated users
CREATE POLICY "Allow insert/update/delete for authenticated users" ON public.event_vendors
    FOR ALL USING (auth.role() = 'authenticated');

