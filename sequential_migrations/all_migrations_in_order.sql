-- Create the events table - core entity for the Event Command Center
-- This follows the MVP-focused approach defined in our architecture
create table public.events (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  location text not null,
  status text not null default 'draft',
  attendee_count integer not null,
  description text,
  type text,
  parent_event_id uuid references public.events(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add comment to the table
comment on table public.events is 'Stores events managed by the Event Command Center';

-- Create an index on status for common filtering operations
create index events_status_idx on public.events(status);

-- Set up RLS (Row Level Security)
alter table public.events enable row level security;

-- Create policy for authenticated users
-- For MVP, we'll use a simple policy where any authenticated user can see all events
create policy "Authenticated users can view events"
  on public.events for select
  to authenticated
  using (true);

-- Only the creator can insert/update/delete their events
-- This is a simplified approach for the MVP
create policy "Users can insert their own events"
  on public.events for insert
  to authenticated
  with check (true);

create policy "Users can update their own events"
  on public.events for update
  to authenticated
  using (true);

create policy "Users can delete their own events"
  on public.events for delete
  to authenticated
  using (true);

-- In a real app with multiple users/orgs, we'd need more sophisticated policies
-- We'll update these policies in later iterations -- Drop existing policies that might be restricting access
DROP POLICY IF EXISTS "Authenticated users can view events" ON events;
DROP POLICY IF EXISTS "Users can insert their own events" ON events;
DROP POLICY IF EXISTS "Users can update their own events" ON events;
DROP POLICY IF EXISTS "Users can delete their own events" ON events;
DROP POLICY IF EXISTS "Admins can manage all events" ON events;

-- Create an open policy for development purposes
-- IMPORTANT: This is only for local development - DO NOT USE IN PRODUCTION
COMMENT ON TABLE events IS 'Table storing event information with temporary open access for MVP development';

-- Create development-only policies that allow all operations
CREATE POLICY "Dev: Allow all select operations"
  ON events FOR SELECT
  USING (true);

CREATE POLICY "Dev: Allow all insert operations"
  ON events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Dev: Allow all update operations"
  ON events FOR UPDATE
  USING (true);

CREATE POLICY "Dev: Allow all delete operations"
  ON events FOR DELETE
  USING (true);

-- Add a comment indicating this is temporary
COMMENT ON POLICY "Dev: Allow all select operations" ON events IS 'TEMPORARY: Development-only policy for MVP phase';
COMMENT ON POLICY "Dev: Allow all insert operations" ON events IS 'TEMPORARY: Development-only policy for MVP phase';
COMMENT ON POLICY "Dev: Allow all update operations" ON events IS 'TEMPORARY: Development-only policy for MVP phase';
COMMENT ON POLICY "Dev: Allow all delete operations" ON events IS 'TEMPORARY: Development-only policy for MVP phase'; -- Create the timeline_blocks table
create table timeline_blocks (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) not null,
  title text not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  location text,
  description text,
  status text default 'pending',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add index for faster queries
create index timeline_blocks_event_id_idx on timeline_blocks(event_id);

-- Add RLS policies (simplified for MVP - matching our events table approach)
alter table timeline_blocks enable row level security;

-- Create temporary open policies for development (same as events table)
create policy "Dev: Allow all select operations on timeline_blocks"
  on timeline_blocks for select
  using (true);

create policy "Dev: Allow all insert operations on timeline_blocks"
  on timeline_blocks for insert
  with check (true);

create policy "Dev: Allow all update operations on timeline_blocks"
  on timeline_blocks for update
  using (true);

create policy "Dev: Allow all delete operations on timeline_blocks"
  on timeline_blocks for delete
  using (true);

-- Add comments for documentation
comment on table timeline_blocks is 'Stores timeline blocks for events with 30-minute precision';
comment on column timeline_blocks.event_id is 'Reference to the parent event';
comment on column timeline_blocks.start_time is 'Start time of the block (typically rounded to 30-min intervals)';
comment on column timeline_blocks.end_time is 'End time of the block (typically rounded to 30-min intervals)'; -- Create vendors table
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
EXECUTE FUNCTION public.handle_updated_at(); -- Create budget_items table with a clean, minimal structure
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

-- Expand timeline_blocks table with additional fields for MVP needs
ALTER TABLE timeline_blocks 
  -- Who is responsible for this timeline block
  ADD COLUMN personnel TEXT,
  
  -- What equipment/resources are needed
  ADD COLUMN equipment TEXT,
  
  -- Additional notes/context for the block
  ADD COLUMN notes TEXT;

-- Add comments for documentation
COMMENT ON COLUMN timeline_blocks.personnel IS 'Person or team responsible for this timeline block';
COMMENT ON COLUMN timeline_blocks.equipment IS 'Equipment or resources needed for this timeline block';
COMMENT ON COLUMN timeline_blocks.notes IS 'Additional notes or context for this timeline block'; -- Create vendor_documents table to store document metadata
CREATE TABLE IF NOT EXISTS public.vendor_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vendor_documents_vendor_id ON public.vendor_documents(vendor_id);

-- Enable RLS policies
ALTER TABLE public.vendor_documents ENABLE ROW LEVEL SECURITY;

-- For simplicity in development, allow all authenticated users to access vendor documents
CREATE POLICY "Enable all operations for authenticated users" ON public.vendor_documents
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS set_vendor_documents_updated_at ON public.vendor_documents;
CREATE TRIGGER set_vendor_documents_updated_at
BEFORE UPDATE ON public.vendor_documents
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at(); -- Create a storage bucket for vendor documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-documents', 'vendor-documents', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Set up security policy for the vendor documents bucket
-- Only authenticated users can access
DROP POLICY IF EXISTS "Authenticated users can access vendor documents" ON storage.objects;
CREATE POLICY "Authenticated users can access vendor documents"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'vendor-documents' 
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'vendor-documents' 
  AND auth.role() = 'authenticated'
); -- Create participants table
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization TEXT,
  role TEXT,
  dietary_requirements TEXT,
  accessibility_needs TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create event_participants junction table
CREATE TABLE IF NOT EXISTS event_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, participant_id)
);

-- Create indexes for better query performance
CREATE INDEX participants_email_idx ON participants(email);
CREATE INDEX event_participants_event_id_idx ON event_participants(event_id);
CREATE INDEX event_participants_participant_id_idx ON event_participants(participant_id);

-- Add trigger to update the updated_at field on participants
CREATE TRIGGER set_participants_updated_at
BEFORE UPDATE ON participants
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add trigger to update the updated_at field on event_participants
CREATE TRIGGER set_event_participants_updated_at
BEFORE UPDATE ON event_participants
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at(); -- Add unique constraint to email column in participants table
ALTER TABLE participants ADD CONSTRAINT participants_email_key UNIQUE (email); -- Add is_per_attendee column to budget_items table
ALTER TABLE public.budget_items ADD COLUMN IF NOT EXISTS is_per_attendee BOOLEAN DEFAULT false;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_budget_items_is_per_attendee ON public.budget_items(is_per_attendee);

-- Add comment to explain purpose
COMMENT ON COLUMN public.budget_items.is_per_attendee IS 'Indicates if the budget item cost is per attendee (true) or a fixed cost (false)'; create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
    insert into public.users (id, email, full_name)
    values (
        new.id,
        new.email,
        new.raw_user_meta_data ->> 'full_name'
    );
    return new;
end;
$$;

-- trigger the function every time a user is created
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();-- create users table
create table public.users (
    id uuid primary key,
    email text unique not null,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    constraint fk_auth_user foreign key (id) references auth.users(id) on delete cascade
);

-- enable row level security (rls)
alter table public.users enable row level security;

-- create a trigger to update the updated_at column
create or replace function update_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger users_updated_at
before update on public.users
for each row
execute function update_updated_at();

-- create a policy to allow users to read their own profile
create policy select_own_profile on public.users
for select using (auth.uid() = id);

-- create a policy to allow users to update their own profile
create policy update_own_profile on public.users
for update using (auth.uid() = id);-- create posts table
create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- add foreign key constraint
alter table
  posts
add
  constraint fk_posts_user foreign key (user_id) references public.users(id) on
delete
  cascade;

-- create index for faster queries
create index idx_posts_user_id on posts(user_id);

-- add rls policies
alter table
  posts enable row level security;

-- policy to allow read access for all authenticated users
create policy "allow read access for all authenticated users" on posts for
select
  to authenticated
  using (true);

-- policy to allow users to insert their own posts
create policy "allow insert for authenticated users" on posts for
insert
  with check (auth.uid() = user_id);

-- policy to allow users to update their own posts
create policy "allow update for post owners" on posts for
update
  using (auth.uid() = user_id);

-- policy to allow users to delete their own posts
create policy "allow delete for post owners" on posts for
delete
  using (auth.uid() = user_id);

-- function to update the updated_at timestamp
create
or replace function update_updated_at() returns trigger as $$ begin
  new.updated_at = now();

return new;

end;

$$ language plpgsql;

-- trigger to call the update_updated_at function
create trigger update_posts_updated_at before
update
  on posts for each row execute function update_updated_at();-- Create vendors table
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

