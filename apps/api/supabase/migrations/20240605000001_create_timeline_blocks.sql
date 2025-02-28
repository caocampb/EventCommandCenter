-- Create the timeline_blocks table
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
comment on column timeline_blocks.end_time is 'End time of the block (typically rounded to 30-min intervals)'; 