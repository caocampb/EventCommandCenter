# Event Command Center: Architecture & Technical Implementation

This document outlines the technical architecture and implementation approach for the Event Command Center, complementing the Product Requirements Document (PRD) with details specific to development.

## Implementation Approach

The Event Command Center follows a pragmatic, minimal implementation approach:

1. **Vertical Slice Architecture**: Each feature is implemented as a complete vertical slice from UI to database.
2. **Database-First Design**: Schema design precedes UI implementation to ensure data integrity.
3. **Progressive Enhancement**: Start with core functionality, then add refinements iteratively.
4. **Optimistic UI**: Critical operations use optimistic updates for perceived performance.
5. **Type-Driven Development**: TypeScript types and Zod schemas define contracts between layers.

This pragmatic approach prioritizes working software over perfect architecture, while maintaining sufficient structure for future extensibility.

## Technology Stack

For building the Event Command Center for GauntletAI's intensive educational program, we recommend a modern, efficient stack that minimizes infrastructure management while providing all necessary capabilities:

### Frontend

- **Framework**: Next.js 14+
  - Server and client components for optimal performance
  - Built-in API routes eliminate need for separate backend
  - TypeScript for type safety and developer experience
  - App Router for simplified routing and layouts
  - Vercel deployment for easy hosting

- **UI Library**:
  - Tailwind CSS for utility-based styling with minimal CSS overhead
  - shadcn/ui for Linear-inspired components
  - Framer Motion for purposeful animations (limited to meaningful interactions)
  - Radix UI primitives for accessible components
  - Lucide icons for consistent iconography

### Backend Services

- **Backend-as-a-Service**: Supabase
  - PostgreSQL database for complex relationships and queries
  - Built-in authentication with row-level security for permission model
  - Storage for documents and files
  - Real-time subscriptions for collaborative features
  - GraphQL support via pg_graphql extension
  - Generous free tier for initial development

### State Management & Data Fetching

- **Server State**: React Query
  - Advanced cache management for complex data relationships
  - Built-in mutation handling for forms
  - Background refetching and revalidation
  - Devtools for debugging data flows
  - Optimistic UI updates for immediate feedback

- **Client State**: Zustand (minimal usage)
  - For UI state that doesn't belong in the server
  - Simple, hooks-based API with minimal boilerplate
  - TypeScript integration for type safety

### Form Handling & Validation

- **Form Management**: React Hook Form
  - Performance-focused form handling
  - Uncontrolled components for better performance
  - Integration with validation libraries

- **Validation**: Zod
  - TypeScript-first schema validation
  - Runtime validation with static type inference
  - Integration with React Hook Form
  - Schema reuse between client and server

### Document Generation

- **PDF Generation**: react-pdf
  - Declarative PDF creation with React components
  - Support for dynamic content from database
  - Consistent styling across generated documents

- **Word Documents**: docx-templates
  - Template-based Word document generation
  - Dynamic content insertion
  - Maintenance of formatting and styles

- **Visual Exports**: html-to-image
  - Timeline and dashboard exports as images
  - Support for sharing and printing

### Development Tooling

- **Code Quality**:
  - ESLint with strict config
  - Prettier for consistent formatting
  - Husky for pre-commit hooks

- **Testing**:
  - Vitest for unit and integration tests
  - Playwright for end-to-end testing (for critical flows)

- **Component Development**:
  - Storybook for isolated component development (optional)

## Authentication & User Management

The Event Command Center implements a secure and streamlined authentication system designed for a small logistics team:

### Authentication Strategy

- **Primary Method**: Google OAuth 2.0
  - Simplified login for users with existing Google accounts
  - Enhanced security with Google's authentication infrastructure
  - No password management required

- **Implementation**: Supabase Auth
  - Leverages Supabase's built-in authentication providers
  - JWT-based session management
  - Secure token handling and refresh

- **Configuration**:
  - Google OAuth configured with "External" consent screen
  - Authorized domains for localhost and production environments
  - Environment variables for credentials (GOOGLE_CLIENT_ID, GOOGLE_SECRET)

### User Management

- **Team Management**: Small team approach
  - Manual user addition as test users in Google Cloud Console
  - Direct assignment of roles and permissions

- **User Profile**:
  - Basic profile information from Google account
  - Custom profile fields as needed for logistics team
  - Profile syncing with Google account information

### Security Considerations

- **Authorization**: Row-Level Security (RLS) policies
  - User-based access control for all resources
  - Role-based permission enforcement
  - Secure, server-enforced policies

- **Session Management**:
  - Secure session handling with appropriate timeouts
  - Session invalidation on logout
  - Cross-site request forgery (CSRF) protection

This authentication architecture provides a balance of security and simplicity, appropriate for the logistics team's size and needs while maintaining strong security practices.

## Data Architecture

### Database Schema

The Supabase PostgreSQL database will organize data using the following core tables:

#### Core Entities

**events**
```sql
create table events (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  location text,
  description text,
  attendee_count integer,
  type text,
  status text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  parent_event_id uuid references events(id)
);
```

**timeline_blocks**
```sql
create table timeline_blocks (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  activity text not null,
  location text,
  priority text,
  status text,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

**vendors**
```sql
create table vendors (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null,
  capacity integer,
  price_tier text,
  location text,
  rating integer,
  amenities text[],
  website text,
  contact_info jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  parent_vendor_id uuid references vendors(id)
);
```

**participants**
```sql
create table participants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text,
  phone text,
  cohort text,
  status text,
  dietary_needs text[],
  accessibility_needs text[],
  custom_fields jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

**budget_items**
```sql
create table budget_items (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) not null,
  vendor_id uuid references vendors(id),
  category text not null,
  description text not null,
  planned_amount numeric not null,
  actual_amount numeric,
  payment_status text,
  payment_date timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

#### Relationship Tables

**event_participants**
```sql
create table event_participants (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) not null,
  participant_id uuid references participants(id) not null,
  role text,
  attendance_status text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(event_id, participant_id)
);
```

**event_vendors**
```sql
create table event_vendors (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) not null,
  vendor_id uuid references vendors(id) not null,
  contract_details jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(event_id, vendor_id)
);
```

**personnel_assignments**
```sql
create table personnel_assignments (
  id uuid primary key default uuid_generate_v4(),
  timeline_block_id uuid references timeline_blocks(id) not null,
  user_id uuid references auth.users(id) not null,
  role text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### Row-Level Security Policies

To implement the multi-level permissions system, we'll use Supabase's Row-Level Security (RLS) policies:

**Example RLS Policy for Events**
```sql
-- Allow users to see all events they are assigned to
create policy "Users can view their events"
  on events for select
  using (
    auth.uid() in (
      select user_id from personnel_assignments pa
      join timeline_blocks tb on pa.timeline_block_id = tb.id
      where tb.event_id = events.id
    )
  );

-- Allow administrators to manage all events
create policy "Admins can manage all events"
  on events for all
  using (
    auth.uid() in (
      select user_id from user_roles
      where role = 'admin'
    )
  );
```

## API Implementation

The Next.js App Router will be used to create API routes for data operations. These will interface with Supabase directly.

### Example API Routes

**Timeline Block Management**
```typescript
// app/api/events/[eventId]/timeline/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';

export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data, error } = await supabase
    .from('timeline_blocks')
    .select('*')
    .eq('event_id', params.eventId)
    .order('start_time');
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ data });
}

// Create schema for validation
const timelineBlockSchema = z.object({
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  activity: z.string().min(1),
  location: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['pending', 'in-progress', 'complete']).optional(),
  notes: z.string().optional()
});

export async function POST(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Parse and validate request body
  const body = await request.json();
  const validation = timelineBlockSchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.format() },
      { status: 400 }
    );
  }
  
  // Add to database
  const { data, error } = await supabase
    .from('timeline_blocks')
    .insert({
      ...validation.data,
      event_id: params.eventId
    })
    .select();
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ data });
}
```

## Key Frontend Components

### Timeline Creator

The Timeline Creator will use a combination of server and client components:

```tsx
// Server Component for initial data fetching
// app/events/[id]/timeline/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { TimelineEditor } from '@/components/timeline/TimelineEditor';

export default async function TimelinePage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies });
  
  // Fetch event data
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', params.id)
    .single();
    
  // Fetch timeline blocks
  const { data: timelineBlocks } = await supabase
    .from('timeline_blocks')
    .select('*')
    .eq('event_id', params.id)
    .order('start_time');
    
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">{event.name} • {new Date(event.start_date).toLocaleDateString()}</h1>
      
      <TimelineEditor 
        initialBlocks={timelineBlocks} 
        eventId={params.id} 
      />
    </div>
  );
}
```

```tsx
// Client Component for interactive editing
// components/timeline/TimelineEditor.tsx
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { TimelineBlock } from '@/types';

export function TimelineEditor({ 
  initialBlocks, 
  eventId 
}: { 
  initialBlocks: TimelineBlock[],
  eventId: string 
}) {
  const queryClient = useQueryClient();
  const [selectedBlock, setSelectedBlock] = useState<TimelineBlock | null>(null);
  
  // Use React Query for data fetching and mutations
  const { data: blocks } = useQuery({
    queryKey: ['timelineBlocks', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}/timeline`);
      const json = await response.json();
      return json.data;
    },
    initialData: initialBlocks
  });
  
  const addBlockMutation = useMutation({
    mutationFn: async (newBlock: Omit<TimelineBlock, 'id'>) => {
      const response = await fetch(`/api/events/${eventId}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBlock)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['timelineBlocks', eventId]);
    }
  });
  
  // Rest of component implementation...
  
  return (
    <div className="grid grid-cols-[200px_1fr] gap-4">
      {/* Navigation sidebar */}
      <div className="border-r pr-4">
        <nav className="space-y-2">
          <div className="px-3 py-2 rounded bg-gray-800">Timeline</div>
          <div className="px-3 py-2 rounded hover:bg-gray-800">Vendors</div>
          <div className="px-3 py-2 rounded hover:bg-gray-800">Budget</div>
          <div className="px-3 py-2 rounded hover:bg-gray-800">Tasks</div>
          <div className="px-3 py-2 rounded hover:bg-gray-800">Docs</div>
        </nav>
      </div>
      
      {/* Timeline table */}
      <div>
        <h2 className="text-lg font-medium mb-4">{new Date(blocks[0]?.start_time).toLocaleDateString()}</h2>
        
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left p-2">Time</th>
              <th className="text-left p-2">Activity</th>
              <th className="text-left p-2">Owner</th>
              <th className="text-left p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {blocks.map(block => (
              <tr 
                key={block.id} 
                className="border-b border-gray-700 hover:bg-gray-800 cursor-pointer"
                onClick={() => setSelectedBlock(block)}
              >
                <td className="p-2">{formatTime(block.start_time)}</td>
                <td className="p-2">{block.activity}</td>
                <td className="p-2">Owner</td>
                <td className="p-2">{block.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <button 
          className="mt-4 px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
          onClick={() => {/* Show add block form */}}
        >
          + Add Block
        </button>
      </div>
      
      {/* Block details */}
      {selectedBlock && (
        <div className="col-span-2 mt-6 border border-gray-700 rounded-md p-4">
          {/* Block details form */}
        </div>
      )}
    </div>
  );
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}
```

## Conflict Detection Implementation

A key technical challenge is resource conflict detection. Here's how we'll implement it:

```typescript
// utils/conflicts.ts
import { TimelineBlock } from '@/types';

interface Resource {
  id: string;
  name: string;
}

export function detectResourceConflicts(
  blocks: TimelineBlock[],
  resources: {
    [blockId: string]: Resource[]
  }
): {
  [resourceId: string]: {
    conflictingBlocks: string[]
  }
} {
  const conflicts: {
    [resourceId: string]: {
      conflictingBlocks: string[]
    }
  } = {};
  
  // Create a timeline of when each resource is used
  const resourceTimeline: {
    [resourceId: string]: {
      [blockId: string]: [Date, Date] // start and end times
    }
  } = {};
  
  // Populate resource timeline
  blocks.forEach(block => {
    const blockResources = resources[block.id] || [];
    const startTime = new Date(block.start_time);
    const endTime = new Date(block.end_time);
    
    blockResources.forEach(resource => {
      if (!resourceTimeline[resource.id]) {
        resourceTimeline[resource.id] = {};
      }
      
      resourceTimeline[resource.id][block.id] = [startTime, endTime];
    });
  });
  
  // Check for conflicts
  Object.entries(resourceTimeline).forEach(([resourceId, usages]) => {
    const blockIds = Object.keys(usages);
    
    for (let i = 0; i < blockIds.length; i++) {
      for (let j = i + 1; j < blockIds.length; j++) {
        const blockId1 = blockIds[i];
        const blockId2 = blockIds[j];
        
        const [start1, end1] = usages[blockId1];
        const [start2, end2] = usages[blockId2];
        
        // Check for overlap
        if (start1 < end2 && start2 < end1) {
          if (!conflicts[resourceId]) {
            conflicts[resourceId] = {
              conflictingBlocks: []
            };
          }
          
          conflicts[resourceId].conflictingBlocks.push(blockId1, blockId2);
        }
      }
    }
  });
  
  return conflicts;
}
```

## Database Queries for Participant Management

For the dietary requirements summary:

```typescript
// Example query for dietary requirements summary
async function getDietaryRequirementsSummary(eventId: string) {
  const { data, error } = await supabase.rpc('get_dietary_summary', {
    event_id: eventId
  });
  
  if (error) {
    throw new Error(`Error fetching dietary summary: ${error.message}`);
  }
  
  return data;
}

// SQL Function in Supabase
// This would be created in the Supabase SQL editor
const dietarySummaryFunction = `
create or replace function get_dietary_summary(event_id uuid)
returns json
language sql
as $$
  with dietary_counts as (
    select 
      unnest(p.dietary_needs) as dietary_need,
      count(*) as count
    from 
      participants p
      join event_participants ep on p.id = ep.participant_id
    where 
      ep.event_id = event_id
    group by 
      unnest(p.dietary_needs)
  )
  select 
    coalesce(json_object_agg(dietary_need, count), '{}'::json)
  from 
    dietary_counts;
$$;
`;
```

## Document Generation Implementation

For generating a run-of-show document:

```typescript
// app/api/documents/run-of-show/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { eventId } = await request.json();
  
  // Fetch event data
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();
    
  if (eventError) {
    return NextResponse.json({ error: eventError.message }, { status: 500 });
  }
  
  // Fetch timeline blocks
  const { data: blocks, error: blocksError } = await supabase
    .from('timeline_blocks')
    .select(`
      *,
      personnel_assignments (
        id,
        user_id,
        role,
        users:user_id (
          email,
          first_name,
          last_name
        )
      )
    `)
    .eq('event_id', eventId)
    .order('start_time');
    
  if (blocksError) {
    return NextResponse.json({ error: blocksError.message }, { status: 500 });
  }
  
  // Generate PDF
  const pdfDoc = await PDFDocument.create();
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const page = pdfDoc.addPage();
  
  const { width, height } = page.getSize();
  
  // Add title
  page.drawText(`Run of Show: ${event.name}`, {
    x: 50,
    y: height - 50,
    size: 20,
    font: timesRoman
  });
  
  // Add date
  page.drawText(`Date: ${new Date(event.start_date).toLocaleDateString()}`, {
    x: 50,
    y: height - 80,
    size: 12,
    font: timesRoman
  });
  
  // Add timeline
  let yPosition = height - 120;
  
  blocks.forEach((block, index) => {
    // Format times
    const startTime = new Date(block.start_time).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const endTime = new Date(block.end_time).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Draw time range
    page.drawText(`${startTime} - ${endTime}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: timesRoman
    });
    
    // Draw activity
    page.drawText(block.activity, {
      x: 150,
      y: yPosition,
      size: 12,
      font: timesRoman
    });
    
    // Draw location if available
    if (block.location) {
      page.drawText(`Location: ${block.location}`, {
        x: 350,
        y: yPosition,
        size: 10,
        font: timesRoman
      });
    }
    
    // Move down for next item
    yPosition -= 30;
    
    // Add a new page if we're running out of space
    if (yPosition < 50) {
      page = pdfDoc.addPage();
      yPosition = height - 50;
    }
  });
  
  // Serialize PDF to bytes
  const pdfBytes = await pdfDoc.save();
  
  return new NextResponse(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${event.name.replace(/\s+/g, '_')}_run_of_show.pdf"`
    }
  });
}
```

## Real-time Updates Implementation

For real-time updates on timeline changes:

```typescript
// hooks/useRealtimeTimeline.ts
'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { TimelineBlock } from '@/types';

export function useRealtimeTimeline(eventId: string) {
  const queryClient = useQueryClient();
  const supabase = createClientComponentClient();
  
  useEffect(() => {
    // Subscribe to changes in timeline_blocks table
    const channel = supabase
      .channel(`timeline-updates-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'timeline_blocks',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          // Update the query cache based on the change type
          switch (payload.eventType) {
            case 'INSERT':
              queryClient.setQueryData(
                ['timelineBlocks', eventId],
                (old: TimelineBlock[] = []) => [...old, payload.new as TimelineBlock]
              );
              break;
              
            case 'UPDATE':
              queryClient.setQueryData(
                ['timelineBlocks', eventId],
                (old: TimelineBlock[] = []) => 
                  old.map(block => 
                    block.id === payload.new.id ? payload.new as TimelineBlock : block
                  )
              );
              break;
              
            case 'DELETE':
              queryClient.setQueryData(
                ['timelineBlocks', eventId],
                (old: TimelineBlock[] = []) => 
                  old.filter(block => block.id !== payload.old.id)
              );
              break;
          }
        }
      )
      .subscribe();
      
    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, queryClient, supabase]);
}
```

## Performance Optimization Strategies

### Server-Side Rendering for Initial Load

We'll use Next.js Server Components for initial data loading to improve perceived performance and SEO:

```tsx
// app/events/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';

export default async function EventsPage() {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('start_date', { ascending: true })
    .limit(10);
    
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Events</h1>
        <Link 
          href="/events/new" 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Create Event
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events?.map(event => (
          <Link href={`/events/${event.id}`} key={event.id}>
            <div className="border border-gray-700 rounded-md p-4 hover:bg-gray-800">
              <h2 className="text-lg font-medium">{event.name}</h2>
              <p className="text-gray-400">
                {new Date(event.start_date).toLocaleDateString()}
              </p>
              <p className="mt-2">{event.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

### Optimistic UI Updates

For better user experience, we'll implement optimistic updates for common actions:

```typescript
// Example of optimistic update with React Query
const addTimelineBlockMutation = useMutation({
  mutationFn: async (newBlock) => {
    const response = await fetch(`/api/events/${eventId}/timeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBlock)
    });
    return response.json();
  },
  
  // Optimistically update the UI
  onMutate: async (newBlock) => {
    // Cancel any outgoing refetches
    await queryClient.cancelQueries(['timelineBlocks', eventId]);
    
    // Snapshot the previous value
    const previousBlocks = queryClient.getQueryData(['timelineBlocks', eventId]);
    
    // Optimistically update to the new value
    queryClient.setQueryData(['timelineBlocks', eventId], (old = []) => [
      ...old,
      { ...newBlock, id: 'temp-id-' + Date.now() } // Temporary ID
    ]);
    
    // Return a context object with the snapshot
    return { previousBlocks };
  },
  
  // If the mutation fails, roll back
  onError: (err, newBlock, context) => {
    queryClient.setQueryData(
      ['timelineBlocks', eventId],
      context.previousBlocks
    );
  },
  
  // Refetch after error or success
  onSettled: () => {
    queryClient.invalidateQueries(['timelineBlocks', eventId]);
  }
});
```

### Data Prefetching

To improve navigation performance:

```tsx
// Example of data prefetching on hover
import { useQueryClient } from '@tanstack/react-query';

function EventCard({ event }) {
  const queryClient = useQueryClient();
  
  const prefetchEventData = () => {
    // Prefetch event details
    queryClient.prefetchQuery(
      ['event', event.id],
      () => fetch(`/api/events/${event.id}`).then(res => res.json())
    );
    
    // Prefetch timeline blocks
    queryClient.prefetchQuery(
      ['timelineBlocks', event.id],
      () => fetch(`/api/events/${event.id}/timeline`).then(res => res.json())
    );
  };
  
  return (
    <Link 
      href={`/events/${event.id}`}
      onMouseEnter={prefetchEventData}
    >
      <div className="border border-gray-700 rounded-md p-4 hover:bg-gray-800">
        <h2 className="text-lg font-medium">{event.name}</h2>
        <p className="text-gray-400">
          {new Date(event.start_date).toLocaleDateString()}
        </p>
      </div>
    </Link>
  );
}
```

## Deployment Strategy

### Environments

We'll set up the following environments:

1. **Development** - For active development work
2. **Staging** - For testing before production
3. **Production** - The live environment

### CI/CD Pipeline

We'll use GitHub Actions for CI/CD:

```yaml
# .github/workflows/main.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
  
  deploy-staging:
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'
      - run: npm ci
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Monitoring

We'll implement basic monitoring:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const start = Date.now();
  
  const response = NextResponse.next();
  
  // Add timing header
  response.headers.set('Server-Timing', `request;dur=${Date.now() - start}`);
  
  return response;
}
```

## Migration Path

As new features are implemented according to the layered approach in the PRD, the codebase will evolve through these stages:

### Layer 1: Core Event Management

1. Set up Next.js and Supabase infrastructure
2. Implement core entity models and database schema
3. Build basic CRUD operations for events, timeline blocks, vendors, participants
4. Create UI for timeline creator, vendor management, budget tracking
5. Implement participant management with dietary tracking

### Layer 2: Operational Efficiency

1. Add team responsibility assignment system
2. Build document generation engine
3. Implement external sharing with permissions
4. Create dashboard for events overview

### Layer 3: Process Optimization

1. Add resource management and conflict detection
2. Implement multi-event project management
3. Create template system for reusing successful events

### Layer 4: Integration & Enhancement

1. Build external system connectors
2. Implement analytics module
3. Create mobile companion view

## Development Approach

### Code Organization

We'll organize the codebase following Next.js App Router conventions:

```
/app                    # Next.js App Router
  /api                  # API routes
  /events               # Event pages
  /dashboard            # Dashboard pages
/components             # React components
  /timeline             # Timeline components
  /vendors              # Vendor components
  /ui                   # Shared UI components
/hooks                  # Custom React hooks
/lib                    # Utility functions
/types                  # TypeScript type definitions
/public                 # Static assets
```

### Development Practices

1. **Feature Branches** - All new features are developed in separate branches
2. **Pull Requests** - Code reviews required for all PRs
3. **Tests** - Unit tests for critical functions, E2E tests for key flows
4. **Documentation** - Inline documentation using JSDoc

### Development Timeline

The implementation will follow the layered approach outlined in the PRD, with each layer building on the previous one to create a complete vertical slice of functionality. This ensures that program operators can begin using the system after Layer 1 is complete, with subsequent layers enhancing the experience. 