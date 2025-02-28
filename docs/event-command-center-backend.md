# Event Command Center: Backend Implementation

This document details the technical implementation specifics for the Event Command Center backend, providing a comprehensive reference for developers. It follows Linear's approach to technical documentation: clear, minimal, comprehensive, and developer-focused.

## Domain Models

### Core Types

```typescript
// Primary domain types that reflect core business entities - MVP focused

type Event = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  location: string;
  status: 'draft' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  attendeeCount: number;
  createdAt: Date;
  updatedAt: Date;
  // Optional fields - add only when needed after MVP
  description?: string;
  type?: string;
  parentEventId?: string;
};

type TimelineBlock = {
  id: string;
  eventId: string;
  startTime: Date;
  endTime: Date;
  activity: string;
  status: 'pending' | 'in-progress' | 'complete';
  createdAt: Date;
  updatedAt: Date;
  // Optional fields - add only when needed after MVP
  location?: string;
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
};

type Vendor = {
  id: string;
  name: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
  // Optional fields - add only when needed after MVP
  capacity?: number;
  priceTier?: string;
  location?: string;
  rating?: number;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  parentVendorId?: string;
};

type Participant = {
  id: string;
  name: string;
  email: string;
  status: 'invited' | 'confirmed' | 'declined';
  createdAt: Date;
  updatedAt: Date;
  // Optional fields - add only when needed after MVP
  phone?: string;
  dietaryNeeds?: string[];
  accessibilityNeeds?: string[];
};

type BudgetItem = {
  id: string;
  eventId: string;
  category: string;
  description: string;
  plannedAmount: number;
  createdAt: Date;
  updatedAt: Date;
  // Optional fields - add only when needed after MVP
  vendorId?: string;
  actualAmount?: number;
  paymentStatus?: 'pending' | 'paid' | 'partially_paid' | 'cancelled';
  paymentDate?: Date;
};
```

### Relationship Types

```typescript
// Simplified relationship types for MVP

// We'll use a pragmatic approach that combines input/output types
// rather than creating many separate types
type EventParticipant = {
  id: string;
  eventId: string;
  participantId: string;
  createdAt: Date;
  updatedAt: Date;
  role?: string;
};

type EventVendor = {
  id: string;
  eventId: string;
  vendorId: string;
  createdAt: Date;
  updatedAt: Date;
};

type PersonnelAssignment = {
  id: string;
  timelineBlockId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  role?: string;
};
```

### Input/Output Types

```typescript
// Pragmatic approach to input/output types
// Instead of many separate types, use base types + partial/pick utility types

// Input types derive from domain models
type EventInput = Omit<Event, 'id' | 'createdAt' | 'updatedAt'>;
type EventUpdateInput = Partial<EventInput>;

type TimelineBlockInput = Omit<TimelineBlock, 'id' | 'createdAt' | 'updatedAt'>;
type TimelineBlockUpdateInput = Partial<Omit<TimelineBlockInput, 'eventId'>>;

// Same pattern applies for other entities
```

### Enums

```typescript
// We'll use string literals instead of separate enums for simplicity
// This avoids having to import enum types across files
// When we need these in multiple places, we can define string constants

// Examples of string literal types we use throughout the app
type EventStatus = 'draft' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
type TimelineBlockStatus = 'pending' | 'in-progress' | 'complete';
type ParticipantStatus = 'invited' | 'confirmed' | 'declined';
type PaymentStatus = 'pending' | 'paid' | 'partially_paid' | 'cancelled';

// If needed, we can create constants for these values
const EVENT_STATUSES = {
  DRAFT: 'draft',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;
```

### Utility Types

```typescript
// Support types used within the domain models

type ContactInfo = {
  name?: string;
  email?: string;
  phone?: string;
  position?: string;
  notes?: string;
};

type DateRange = {
  startDate: Date;
  endDate: Date;
};

type TimeRange = {
  startTime: Date;
  endTime: Date;
};

type ResourceConflict = {
  resourceId: string;
  conflictingBlocks: string[];
};
```

## Database Schema

The Supabase PostgreSQL database schema implements the domain models with a focus on simplicity and flexibility for the MVP.

### Core Entities

```sql
-- Events table - core fields only for MVP
create table events (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  location text not null,
  status text not null,
  attendee_count integer not null,
  description text,
  type text,
  parent_event_id uuid references events(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Timeline blocks table - core fields only for MVP
create table timeline_blocks (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  activity text not null,
  status text not null default 'pending',
  location text,
  priority text,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Vendors table - core fields only for MVP
create table vendors (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null,
  capacity integer,
  price_tier text,
  location text,
  rating integer,
  website text,
  contact_email text,
  contact_phone text,
  parent_vendor_id uuid references vendors(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Participants table - core fields only for MVP
create table participants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  status text not null default 'invited',
  phone text,
  dietary_needs text[],
  accessibility_needs text[],
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Budget items table - core fields only for MVP
create table budget_items (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) not null,
  category text not null,
  description text not null,
  planned_amount numeric not null,
  vendor_id uuid references vendors(id),
  actual_amount numeric,
  payment_status text,
  payment_date timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### Relationship Tables

```sql
-- Event participants junction table - simplified for MVP
create table event_participants (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) not null,
  participant_id uuid references participants(id) not null,
  role text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(event_id, participant_id)
);

-- Event vendors junction table - simplified for MVP
create table event_vendors (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) not null,
  vendor_id uuid references vendors(id) not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(event_id, vendor_id)
);

-- Personnel assignments table - simplified for MVP
create table personnel_assignments (
  id uuid primary key default uuid_generate_v4(),
  timeline_block_id uuid references timeline_blocks(id) not null,
  user_id uuid references auth.users(id) not null,
  role text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### Indexes

```sql
-- Start with minimal indexes for MVP - add more based on actual query patterns
-- Focus on the most critical query paths

-- Events indexes
create index events_status_idx on events(status);

-- Timeline blocks indexes
create index timeline_blocks_event_id_idx on timeline_blocks(event_id);

-- Budget items indexes
create index budget_items_event_id_idx on budget_items(event_id);
```

### Row-Level Security Policies

```sql
-- Simplified RLS for MVP - prioritize getting started quickly
-- We can add more granular policies as needed

-- Events policies
create policy "Team members can access events"
  on events for all
  using (auth.uid() in (
    select auth.uid() from user_profiles
    where organization_id = (
      select organization_id from events where id = events.id
    )
  ));

-- Timeline blocks policies
create policy "Team members can access timeline blocks"
  on timeline_blocks for all
  using (auth.uid() in (
    select auth.uid() from user_profiles
    where organization_id = (
      select organization_id from events where id = timeline_blocks.event_id
    )
  ));

-- Similar simple policies for other tables
```

### Database Functions

```sql
-- Start with just one essential function for MVP
-- Add more as specific needs arise

-- Detect timeline conflicts (simplified version)
create or replace function detect_timeline_conflicts(event_ids uuid[])
returns table(block_id1 uuid, block_id2 uuid)
language sql
as $$
  -- Find overlapping timeline blocks
  select a.id as block_id1, b.id as block_id2
  from timeline_blocks a
  join timeline_blocks b on
    a.id < b.id and  -- Avoid duplicates
    a.event_id = any(event_ids) and
    b.event_id = any(event_ids) and
    a.start_time < b.end_time and
    b.start_time < a.end_time;
$$;
```

## API Contracts

The Event Command Center API follows RESTful principles with simplified contracts for MVP.

### Timeline Management

```typescript
// Simplified API contracts for MVP - focus on standard RESTful patterns

// GET /api/events/{eventId}/timeline
// Returns all timeline blocks for an event with optional filtering
type GetTimelineBlocksRequest = {
  params: {
    eventId: string;
  };
  query?: {
    status?: string;
    startAfter?: string; // ISO date string
    endBefore?: string; // ISO date string
  };
};

type GetTimelineBlocksResponse = {
  data: TimelineBlock[];
  error?: string;
};

// POST /api/events/{eventId}/timeline
// Creates a new timeline block
type CreateTimelineBlockRequest = {
  params: {
    eventId: string;
  };
  body: TimelineBlockInput;
};

type CreateTimelineBlockResponse = {
  data?: TimelineBlock;
  error?: string;
};

// PUT /api/events/{eventId}/timeline/{blockId}
// Updates an existing timeline block
type UpdateTimelineBlockRequest = {
  params: {
    eventId: string;
    blockId: string;
  };
  body: TimelineBlockUpdateInput;
};

type UpdateTimelineBlockResponse = {
  data?: TimelineBlock;
  error?: string;
};

// DELETE /api/events/{eventId}/timeline/{blockId}
// Deletes a timeline block
type DeleteTimelineBlockRequest = {
  params: {
    eventId: string;
    blockId: string;
  };
};

type DeleteTimelineBlockResponse = {
  success?: boolean;
  error?: string;
};
```

### Vendor Management

```typescript
// Simplified vendor API for MVP

// GET /api/vendors
// Returns filtered list of vendors with basic pagination
type GetVendorsRequest = {
  query?: {
    type?: string;
    search?: string;
    limit?: number;
    offset?: number;
  };
};

type GetVendorsResponse = {
  data: Vendor[];
  count: number;
  error?: string;
};

// POST /api/events/{eventId}/vendors
// Assigns a vendor to an event
type AssignVendorRequest = {
  params: {
    eventId: string;
  };
  body: {
    vendorId: string;
  };
};

type AssignVendorResponse = {
  data?: EventVendor;
  error?: string;
};
```

### Document Generation

```typescript
// Simplified document generation for MVP

// POST /api/documents/generate
// Generates a document from event data
type GenerateDocumentRequest = {
  body: {
    eventId: string;
    documentType: 'run-of-show' | 'contract' | 'budget';
    format: 'pdf' | 'docx';
    options?: {
      vendorId?: string;
      includeNotes?: boolean;
    };
  };
};

type GenerateDocumentResponse = {
  data?: {
    url: string;
  };
  error?: string;
};
```

## Type Validation with Zod

For MVP, we'll use simplified Zod schemas focused on the core validation needs:

```typescript
// Pragmatic Zod schemas for MVP validation

import { z } from 'zod';

// Timeline block validation schema - core validation only
const timelineBlockSchema = z.object({
  eventId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  activity: z.string().min(1),
  status: z.enum(['pending', 'in-progress', 'complete']).default('pending'),
  location: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  notes: z.string().optional()
}).refine(
  data => new Date(data.startTime) < new Date(data.endTime),
  {
    message: 'End time must be after start time',
    path: ['endTime']
  }
);

// Event validation schema - core validation only
const eventSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(), 
  location: z.string(),
  status: z.enum(['draft', 'confirmed', 'in-progress', 'completed', 'cancelled']),
  attendeeCount: z.number().int().positive(),
  description: z.string().optional(),
  type: z.string().optional(),
  parentEventId: z.string().uuid().optional()
}).refine(
  data => new Date(data.startDate) < new Date(data.endDate),
  {
    message: 'End date must be after start date',
    path: ['endDate']
  }
);

// Example API implementation with simplified error handling
export async function POST(request: Request, { params }: { params: { eventId: string } }) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = timelineBlockSchema.safeParse(body);
    if (!result.success) {
      return Response.json({ error: 'Validation error', details: result.error.format() }, { status: 400 });
    }
    
    // Create the timeline block
    const { data, error } = await supabase
      .from('timeline_blocks')
      .insert([{
        ...result.data,
        event_id: params.eventId
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    return Response.json({ data });
  } catch (error) {
    console.error('Error creating timeline block:', error);
    return Response.json({ 
      error: 'Failed to create timeline block' 
    }, { status: 500 });
  }
}
```

## State Management

### Server State

Server state management is simplified for MVP using React Query:

```typescript
// Simplified query key structure
const queryKeys = {
  events: 'events',
  event: (id: string) => ['event', id],
  timeline: (eventId: string) => ['timeline', eventId],
  vendors: 'vendors',
  vendor: (id: string) => ['vendor', id],
  participants: 'participants',
};

// Basic query hook example
function useTimelineBlocks(eventId: string) {
  return useQuery({
    queryKey: queryKeys.timeline(eventId),
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}/timeline`);
      if (!response.ok) {
        throw new Error('Failed to fetch timeline blocks');
      }
      return (await response.json()).data;
    },
    // Longer stale time for MVP to reduce unnecessary refetching
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
```

### Client State

Client state is managed using Zustand with minimal stores:

```typescript
// Minimal UI state store for MVP
interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  selectedBlockId: string | null;
  setSelectedBlockId: (id: string | null) => void;
  viewMode: 'week' | 'day' | 'list';
  setViewMode: (mode: 'week' | 'day' | 'list') => void;
}

const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  selectedBlockId: null,
  setSelectedBlockId: (id) => set({ selectedBlockId: id }),
  viewMode: 'day',
  setViewMode: (mode) => set({ viewMode: mode }),
}));

// Simple filter state
interface FilterState {
  eventFilters: {
    search: string;
    status: string | null;
  };
  setEventSearch: (search: string) => void;
  setEventStatus: (status: string | null) => void;
  resetEventFilters: () => void;
}

const useFilterStore = create<FilterState>((set) => ({
  eventFilters: {
    search: '',
    status: null,
  },
  setEventSearch: (search) => set((state) => ({
    eventFilters: { ...state.eventFilters, search }
  })),
  setEventStatus: (status) => set((state) => ({
    eventFilters: { ...state.eventFilters, status }
  })),
  resetEventFilters: () => set({
    eventFilters: { search: '', status: null }
  }),
}));

// Basic mutation hook for creating timeline blocks
function useCreateTimelineBlock(eventId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (blockData: TimelineBlockInput) => {
      const response = await fetch(`/api/events/${eventId}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blockData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create timeline block');
      }
      
      return (await response.json()).data;
    },
    // Simple cache update on success
    onSuccess: (newBlock) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.timeline(eventId) });
    },
  });
}
```

## Error Handling

### Pragmatic Error Handling for MVP

```typescript
// Simplified error types for MVP
type ApiError = {
  message: string;
  details?: Record<string, any>;
};

// Server-side error handler for API routes
function handleApiError(error: unknown) {
  console.error('API error:', error);
  
  // Default error response
  let statusCode = 500;
  let message = 'An unexpected error occurred';
  
  // Handle known error types
  if (error instanceof Error) {
    message = error.message;
    
    // Map error messages to status codes
    if (message.includes('not found')) {
      statusCode = 404;
    } else if (message.includes('validation')) {
      statusCode = 400;
    } else if (message.includes('unauthorized') || message.includes('authentication')) {
      statusCode = 401;
    } else if (message.includes('permission') || message.includes('access')) {
      statusCode = 403;
    }
  }
  
  return {
    statusCode,
    body: { error: message }
  };
}

// Example API route with error handling
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Get event data
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', params.id)
      .single();
    
    if (error) throw new Error(error.message);
    if (!data) throw new Error(`Event not found: ${params.id}`);
    
    return Response.json({ data });
  } catch (error) {
    const { statusCode, body } = handleApiError(error);
    return Response.json(body, { status: statusCode });
  }
}

// Client-side error handler
const handleError = (error: unknown, fallbackMessage: string) => {
  if (error instanceof Error) {
    toast.error(error.message);
  } else {
    toast.error(fallbackMessage);
  }
  console.error(error);
};

// Usage example
try {
  await mutation.mutateAsync(data);
  toast.success('Timeline block created successfully');
} catch (error) {
  handleError(error, 'Failed to create timeline block');
}
```

## Performance Considerations

### MVP Performance Focus

For the MVP, we'll focus on a few key performance areas that provide the most value:

```typescript
// 1. Efficient queries - Only fetch what's needed
async function getEventSummary(eventId: string) {
  const { data } = await supabase
    .from('events')
    .select(`
      id, 
      name, 
      start_date, 
      end_date, 
      location, 
      status,
      timeline_blocks:timeline_blocks(count),
      vendors:event_vendors(count)
    `)
    .eq('id', eventId)
    .single();
    
  return data;
}

// 2. Pagination for lists - Prevent loading too much data
async function getTimelineBlocksPaginated(eventId: string, page: number = 1, limit: number = 20) {
  const { data, count } = await supabase
    .from('timeline_blocks')
    .select('*', { count: 'exact' })
    .eq('event_id', eventId)
    .order('start_time', { ascending: true })
    .range((page - 1) * limit, page * limit - 1);
    
  return {
    data,
    totalCount: count || 0,
    page,
    limit,
    hasMore: (count || 0) > page * limit
  };
}

// 3. Limit expensive operations - Batch updates when possible
async function updateTimelineBlockStatuses(eventId: string, blocks: { id: string; status: string }[]) {
  // Build a single query to update multiple records
  const updates = blocks.map(block => ({
    id: block.id,
    status: block.status,
    updated_at: new Date().toISOString()
  }));
  
  const { data, error } = await supabase
    .from('timeline_blocks')
    .upsert(updates)
    .eq('event_id', eventId);
    
  if (error) throw error;
  return data;
}

// 4. Basic caching strategies for common data
const commonCacheTimes = {
  events: 5 * 60 * 1000, // 5 minutes
  vendors: 10 * 60 * 1000, // 10 minutes
  participants: 5 * 60 * 1000, // 5 minutes
};

// 5. Minimize watchers and real-time subscriptions
// Only use real-time for collaborative features when absolutely needed
function useMinimalRealtime(eventId: string) {
  useEffect(() => {
    // Only subscribe to high-value real-time updates
    const supabase = createClientComponentClient();
    const channel = supabase
      .channel(`event-${eventId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'events',
        filter: `id=eq.${eventId}`,
      }, (payload) => {
        // Only handle critical status changes
        if (payload.new.status !== payload.old.status) {
          toast.info(`Event status changed to ${payload.new.status}`);
          queryClient.invalidateQueries({ queryKey: queryKeys.event(eventId) });
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);
}
```

## Conclusion

This document provides a pragmatic, MVP-focused approach to the Event Command Center backend implementation. By following these patterns, we can:

1. **Get to market faster** - Focus on essential functionality first
2. **Learn from real usage** - Gather feedback before adding complexity
3. **Evolve with confidence** - Build on a solid foundation
4. **Maintain simplicity** - Avoid premature optimization
5. **Deliver value incrementally** - Each layer adds clear value

The patterns and implementation details in this document prioritize quick development of a functional MVP while maintaining the quality and developer experience that are core to Linear's design principles.

As the product evolves based on user feedback, we can incrementally introduce more sophisticated patterns, performance optimizations, and additional features. 