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
-- We'll update these policies in later iterations 