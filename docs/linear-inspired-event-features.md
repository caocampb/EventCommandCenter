# Linear-Inspired Event Planning Features

> The 80/20 approach: implementing the critical 20% that delivers 80% of value

## Overview

This document outlines our focused implementation plan for two key features inspired by Linear's design philosophy, tailored for a small logistics team:

1. **Task Manager**: A minimal, context-aware task system
2. **Simple Sub-Events**: A clean parent-child relationship for multi-part events

Both features maintain Linear's core principles: powerful functionality with minimal UI, context-awareness, and reduced cognitive load.

## Design Philosophy

- **Ruthless Simplicity**: Only implement what actually matters
- **Context-Awareness**: Adapt displays based on event timeline proximity
- **Progressive Disclosure**: Show only what's needed at the current level
- **Keyboard-First Efficiency**: Optimize for speed and reduced clicking
- **Intelligent Defaults**: Reduce decision fatigue with smart suggestions

## 1. Linear-Inspired Task Manager

### Core Functionality

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Event: Summer Conference 2024                               ⌘K | Filter ▾│
├─────────────────────────────────────────────────────────────────────────┤
│ Tasks (7)                                               + New Task (N)   │
├─────────────────────────────────────────────────────────────────────────┤
│ ▼ Critical (2)                                                           │
├─────────────────────────────────────────────────────────────────────────┤
│ ○ Confirm final headcount with venue                         Due: Today  │
│   #Catering                                                    [E] [⌘D]  │
│                                                                          │
│ ○ Book AV equipment rental                                  Due: Jun 10  │
│   #MainEvent                                                   [E] [⌘D]  │
├─────────────────────────────────────────────────────────────────────────┤
│ ▼ This Week (3)                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│ ○ Send reminder emails to speakers                          Due: Jun 11  │
│   #Speakers                                                    [E] [⌘D]  │
│                                                                          │
│ ● Print attendee name badges                                Due: Jun 12  │
│   #Materials                                                   [E] [⌘D]  │
│                                                                          │
│ ○ Order additional catering supplies                        Due: Jun 13  │
│   #Catering                                                    [E] [⌘D]  │
├─────────────────────────────────────────────────────────────────────────┤
│ ▶ Later (2)                                                 Space to open│
└─────────────────────────────────────────────────────────────────────────┘

┌─ Task Details ─────────────────────────────────────────────────────────┐
│ Confirm final headcount with venue                                     │
├─────────────────────────────────────────────────────────────────────────┤
│ Due: Today (June 8)                                  Status: ○ Open [S] │
│ Priority: Critical [P]                                Tags: #Catering   │
│                                                                         │
│ Assignee: Sarah [A]                                                     │
│                                                                         │
│ Notes:                                                                  │
│ - Call venue with final numbers                                         │
│ - Confirm dietary restrictions list is complete                         │
│ - Update invoice if numbers changed                                     │
│                                                                         │
│ Linked: Catering vendor • Summer Conference                             │
└─────────────────────────────────────────────────────────────────────────┘

┌─ Quick Create (⌘N) ───────────────────────────────────────────────────┐
│ Call speaker re: slides #Speakers due tomorrow                         │
│                                                                        │
│ [Create]  [Cancel]                                                     │
└────────────────────────────────────────────────────────────────────────┘

┌─ Command Palette (⌘K) ───────────────────────────────────────────────┐
│ book                                                                  │
├────────────────────────────────────────────────────────────────────────┤
│ ➤ New task "Book..."                                                   │
│ → Edit task "Book AV equipment rental"                                 │
│ → Mark "Book AV equipment rental" as complete                          │
│ → Set "Book AV equipment rental" as critical                           │
│ → Filter tasks by #av                                                  │
└────────────────────────────────────────────────────────────────────────┘
```

### Implementation Requirements

#### Database Changes
- New `tasks` table with minimal fields:
  - `id`: UUID primary key
  - `event_id`: Foreign key to events table
  - `title`: String (required)
  - `due_date`: Timestamp
  - `assignee_id`: Foreign key to users table
  - `status`: Enum ('not_started', 'in_progress', 'complete')
  - `priority`: Boolean (true = critical, false = standard)
  - `tags`: String (optional, simple # prefixed tags)
  - Standard timestamps

#### API Endpoints
- `GET /api/events/:id/tasks` - List tasks for an event
- `POST /api/events/:id/tasks` - Create a new task
- `PATCH /api/events/:id/tasks/:taskId` - Update a task status
- `DELETE /api/events/:id/tasks/:taskId` - Delete a task

#### UI Components
- TaskList: Timeline-grouped list with keyboard navigation
- CommandPalette: ⌘K shortcut for quick actions
- QuickAdd: Single-line task creation with natural language parsing
- StatusToggle: One-click status changes

#### High-Value Features (The 80/20)
- Timeline proximity grouping (Today, This Week, Later)
- Binary priority (Critical vs. Standard)
- Simple tags with # prefix for lightweight categorization
- Position-based status (completed items move to bottom of group)
- Command palette for everything

### Implementation Strategy

1. **Core System** (2-3 days)
   - Minimal database schema
   - Basic list with timeline grouping
   - Priority flagging
   - Single-click status toggle

2. **Speed Enhancements** (1-2 days)
   - Command palette (⌘K) for task management
   - Keyboard shortcuts for everything
   - Quick filters (My Tasks, Critical)
   - Simple tag support

3. **Context Integration** (1-2 days)
   - Smart due date suggestions based on event timeline
   - Task templates for common event activities
   - Default assignee based on current user

## 2. Simple Sub-Events System

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Conference 2024                                                   ⋅⋅⋅   │
├─────────────────────────────────────────────────────────────────────────┤
│ Overview  Timeline  Budget  Vendors  Sub-Events                         │
├─────────────────────────────────────────────────────────────────────────┤
│ Sub-Events (3)                                       + Add Sub-Event    │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Day 1: Workshops                                       Jun 10        │ │
│ │ Main Hall                                        9:00 AM - 5:00 PM   │ │
│ │                                                                     │ │
│ │ Progress: ████████████████████░░░░░                  80% complete   │ │
│ │                                                                     │ │
│ │ 3 vendors • 2 staff • 65 attendees                  View Details >  │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Day 2: Keynotes                                        Jun 11        │ │
│ │ Auditorium                                      10:00 AM - 3:00 PM   │ │
│ │                                                                     │ │
│ │ Progress: ███████████████░░░░░░░░░                   65% complete   │ │
│ │                                                                     │ │
│ │ 2 vendors • 4 staff • 120 attendees                 View Details >  │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Evening: Mixer                                         Jun 11        │ │
│ │ Rooftop Lounge                                   7:00 PM - 10:00 PM  │ │
│ │                                                                     │ │
│ │ Progress: ███████░░░░░░░░░░░░░░░░░░░                45% complete   │ │
│ │                                                                     │ │
│ │ 1 vendor • 3 staff • 85 attendees                   View Details >  │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘

┌─ Create Sub-Event ─────────────────────────────────────────────────────┐
│ Title: [Day 3: Closing Session                                    ]    │
│                                                                        │
│ Date: [06/12/2024]     Start: [10:00 AM]     End: [12:00 PM]          │
│                                                                        │
│ Location: [Auditorium                                             ]    │
│                                                                        │
│ Inherit from parent:  ☑ Budget categories  ☑ Vendors  ☐ Tasks         │
│                                                                        │
│ Expected attendees: [100          ]                                    │
│                                                                        │
│ Description (optional):                                                │
│ [Closing remarks and next steps announcement                      ]    │
│ [                                                                 ]    │
│                                                                        │
│            [Cancel]                             [Create Sub-Event]     │
└────────────────────────────────────────────────────────────────────────┘

┌─ Sub-Event Details ───────────────────────────────────────────────────┐
│ Day 2: Keynotes                                              Edit ✏️   │
├────────────────────────────────────────────────────────────────────────┤
│ Date: June 11, 2024                                10:00 AM - 3:00 PM  │
│ Location: Auditorium                                                   │
│ Status: Confirmed                                                      │
│                                                                        │
│ Progress: ███████████████░░░░░░░░░                       65% complete  │
│                                                                        │
│ ┌─ Resources ───────────────────────────────────────────────────────┐  │
│ │ Vendors (2):  Sound Pro AV • Premium Catering                     │  │
│ │ Staff (4):    Sarah (Lead) • James • Miguel • Priya               │  │
│ │ Attendees:    120 confirmed                                       │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│ ┌─ Tasks ─────────────────────────────────────────────────┐ View All  │
│ │ ● Print speaker badges                        Complete  │ + Add Task │
│ │ ○ Final AV check                              Due Today │           │
│ │ ○ Prepare speaker gifts                       Due Today │           │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│ Parent: Conference 2024                                  ↑ Return      │
└────────────────────────────────────────────────────────────────────────┘
```

### Implementation Requirements

#### Database Changes
- Add to `events` table:
  - `parent_event_id`: Self-referential foreign key (nullable)
  - `display_order`: Integer for sorting sibling events

#### API Endpoints
- `GET /api/events/:id/subevents` - Get all child events
- `POST /api/events/:id/subevents` - Create child event
- `PATCH /api/events/:id/parent` - Change parent relationship

#### UI Components
- SubEventList: Simple list of child events with key metrics
- SubEventForm: Creation form with parent inheritance options
- BatchEditor: Make changes across multiple sub-events at once

#### High-Value Features (The 80/20)
- One-level deep hierarchy (parent + children)
- Automatic inheritance of key properties from parent
- Batch operations for common changes across sub-events
- Resource conflict detection between sub-events
- Quick toggle between parent and child views

### Implementation Phases

1. **Foundation** (3-4 days)
   - Database schema changes
   - Basic parent-child relationship
   - Sub-event list view

2. **Efficiency Enhancements** (2-3 days)
   - Property inheritance system
   - Simple conflict detection
   - Batch operations

## Technical Considerations

- Use existing Supabase RLS policies for security
- Optimize for performance even with limited data
- Maintain mobile responsiveness throughout
- Prioritize keyboard shortcuts for all operations

## Success Metrics

- 90%+ task completion rate for events (up from current rate)
- 50%+ reduction in coordination time between team members
- Zero critical tasks missed for events
- Ability to manage events with 5-10 sub-events efficiently

## Next Steps

1. Implement Task Manager core system
2. Add keyboard shortcuts and command palette
3. Test with upcoming events
4. Implement Sub-Events foundation
5. Gather team feedback and iterate on most-used features 