# Event Command Center: UI Mockups

These mockups demonstrate how the Event Command Center embraces Linear's design principles of clarity, focused simplicity, and thoughtful minimalism while maintaining practical usability for small, busy logistics teams.

## Core Design Principles

```
• Desktop-optimized interface focused on large-screen productivity
• Command palette (⌘K) as primary navigation method for power users
• Template-first approach for creating new events
• 30-minute default timeline blocks (with 15-minute precision when needed)
• Simple visual indicators for status and priority
• Contextual quick actions based on selected content
• Cross-event timeline view for scheduling clarity
• One-click document generation from templates
• Guidance rather than rigid enforcement of workflows
• Clean, focused interface optimized for overworked teams
```

## Command Palette (⌘K)

```
[COMMAND PALETTE OVERLAY]
┌──────────────────────────────────────────────────┐
│ ⌘K Command Palette                          [ESC]│
├──────────────────────────────────────────────────┤
│ > _                                              │
├──────────────────────────────────────────────────┤
│ Recently Used                                    │
│ ├─ New Event from Template                       │
│ ├─ Generate Vendor Contract                      │
│ ├─ Switch to Cross-Event View                    │
│ └─ Assign Task to Team Member                    │
├──────────────────────────────────────────────────┤
│ Navigation                                       │
│ ├─ Go to Timeline ⌘T                             │
│ ├─ Go to Vendors ⌘V                              │
│ ├─ Go to Budget ⌘B                               │
│ └─ Go to Documents ⌘D                            │
└──────────────────────────────────────────────────┘
```

## Timeline Creator

```
[HEADER]
┌─────────────────────────────────────────────────────────────────────────────┐
│ Event Command Center                                        [User: J. Smith]│
└─────────────────────────────────────────────────────────────────────────────┘

[NAV]      [VIEW TOGGLE]                        [MODE]  [SEARCH] [⌘K]
┌─────┐    ┌────────────────────────┐           ┌───────────────────┐
│Routes│    │Single Event │ All Events│           │Edit │View │Preview│
└─────┘    └────────────────────────┘           └───────────────────┘
  
[TIMELINE VIEW - SINGLE EVENT]
┌─────────────────────────────────────────────────────────────────────────────┐
│ SXSW Morning Panel Series - Day 2                   [May 15] [4 team members]│
├─────────────────────────────────────────────────────────────────────────────┤
│ [Timeline]                                                                  │
│ 7:00 AM ┬─ Vendor arrival & setup ─────────────────────── [AV Team] [⚠️ ]  │
│         │                                                                  │
│ 8:00 AM ┼─ Speaker green room open ─────────────────────── [Catering] [✓]  │
│         │                                                                  │
│ 8:30 AM ┼─ Attendee check-in begins ───────────────────── [Front desk] [✓] │
│         │                                                                  │
│ 9:00 AM ┼─ Opening remarks ───────────────────────────── [Main stage] [..] │
│         │                                                                  │
│ 9:15 AM ┼─ Panel 1: "Future of AI" ────────────────────── [Main stage] [..] │
│         │   └─ [Speakers: J. Smith, A. Wong, T. Johnson]                   │
│         │                                                                  │
│10:00 AM ┴─ Coffee break ───────────────────────────────── [Catering] [..]  │
└─────────────────────────────────────────────────────────────────────────────┘

[TIMELINE VIEW - CROSS-EVENT] 
┌─────────────────────────────────────────────────────────────────────────────┐
│ All Events - Calendar View                                      [May 15-20] │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Calendar]    | Mon May 15  | Tue May 16  | Wed May 17  | Thu May 18  | Fri May 19  │
│ ─────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ 7:00 - 11:00 │SXSW Panel   │             │Corporate    │             │Tech Summit  │
│              │Series Day 1  │             │Dinner       │             │Setup        │
│              │[Team A]      │             │[Team B]     │             │[Team A]     │
│ ─────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ 11:00 - 3:00 │SXSW Panel   │Vendor       │             │Department   │Tech Summit  │
│              │Series Day 2  │Meeting      │             │Retreat      │Day 1        │
│              │[Team A]      │[Team B]     │             │[Team C]     │[Team A]     │
│ ─────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ 3:00 - 7:00  │             │Product      │             │Department   │Tech Summit  │
│              │             │Launch       │             │Retreat      │Day 2        │
│              │             │[Team C]     │             │[Team C]     │[Team A]     │
└─────────────────────────────────────────────────────────────────────────────┘

[QUICK ACTIONS TOOLBAR - Context: Timeline Block Selected]
┌───────────────────────────────────────────────────┐
│ [Edit] [Duplicate] [Generate Docs] [Assign] [Move]│
└───────────────────────────────────────────────────┘

## Vendor Management

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Event Command Center                                      [User Menu ▾] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Vendor Management                    [Search Vendors] [+ Add Vendor]   │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Category: [All] [Venue] [Catering] [Entertainment] [Staffing]     │  │
│  │                                                                   │  │
│  │ Filters                                                    [Clear] │  │
│  │                                                                   │  │
│  │ Price: [$$ - $$$$ ▾]   Capacity: [50-200 ▾]   Rating: [★★★+ ▾]  │  │
│  │ Location:  [Downtown ▾]    In Budget: [✓]                         │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  6 vendors match your criteria                                          │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────┐         │
│  │ ⭐ East Side Hall                    [View Contract ⤓]    │         │
│  │ Type: Venue  •  Capacity: 200  •  ★★★★☆  •  $$$         │         │
│  │                                                           │         │
│  │ Amenities: AV System, Stage, Bar Area, Catering Kitchen   │         │
│  │                                                           │         │
│  │ Used: 3 times previously  •  Last used: Jan 15, 2023      │         │
│  │ ✓ 95% of events with similar attendee count used this venue│        │
│  │                                                           │         │
│  │ Budget Status: $4,500 (Within Budget)                     │         │
│  │                                                           │         │
│  │ [View Details]   [Add to Event]   [Schedule Meeting]      │         │
│  └───────────────────────────────────────────────────────────┘         │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────┐         │
│  │ Riverside Venue                      [Request Quote]      │         │
│  │ Type: Venue  •  Capacity: 150  •  ★★★★★  •  $$$$         │         │
│  │                                                           │         │
│  │ Amenities: Full AV, Outdoor Patio, Valet Parking          │         │
│  │                                                           │         │
│  │ Used: Never                                               │         │
│  │                                                           │         │
│  │ Budget Status: Estimated $5,500 (⚠️ Above Budget)         │         │
│  │                                                           │         │
│  │ [View Details]   [Add to Event]   [Schedule Meeting]      │         │
│  └───────────────────────────────────────────────────────────┘         │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────┐         │
│  │ Downtown Conference Center          [View Options]        │         │
│  │ Type: Venue  •  Capacity: 175  •  ★★★☆☆  •  $$           │         │
│  │                                                           │         │
│  │ Amenities: Basic AV, Tables & Chairs, WiFi                │         │
│  │                                                           │         │
│  │ Used: 1 time previously  •  Last used: Nov 8, 2022        │         │
│  │                                                           │         │
│  │ Budget Status: $3,200 (✓ Under Budget)                    │         │
│  │                                                           │         │
│  │ [View Details]   [Add to Event]   [Schedule Meeting]      │         │
│  └───────────────────────────────────────────────────────────┘         │
│                                                                         │
│  [Load More]          [Compare Selected]       [Export Vendor List]     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Linear Design Elements:**
- Card-based layout with consistent spacing
- Subtle emphasis for favorite/preferred options
- Clean information hierarchy with minimal visual noise
- Purposeful use of whitespace
- Minimal color usage (ratings, favorites only)

## Template First Flow

```
[EVENT CREATION - TEMPLATE FIRST]
┌─────────────────────────────────────────────────────────────────────────────┐
│ Create New Event                                               [Close ×]    │
└─────────────────────────────────────────────────────────────────────────────┘

[EVENT TEMPLATES]
┌─────────────────────────────────────────────────────────────────────────────┐
│ Start with a Template                                       [Search ⌕]      │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐         │
│ │  Corporate Dinner │  │  Tech Conference  │  │  Networking Event │         │
│ │                   │  │                   │  │                   │         │
│ │ • 3-6 hour event  │  │ • Multi-day       │  │ • 2-3 hour event  │         │
│ │ • Single venue    │  │ • Multiple tracks │  │ • Basic setup     │         │
│ │ • Full service    │  │ • Complex logistics│  │ • Minimal vendors │         │
│ │                   │  │                   │  │                   │         │
│ │ [Select]          │  │ [Select]          │  │ [Select]          │         │
│ └───────────────────┘  └───────────────────┘  └───────────────────┘         │
│                                                                             │
│ ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐         │
│ │  Workshop         │  │  Product Launch   │  │  Custom Event     │         │
│ │                   │  │                   │  │                   │         │
│ │ • Half-day session│  │ • Media presence  │  │ • Start from      │         │
│ │ • Interactive     │  │ • Presentation    │  │   scratch         │         │
│ │ • Equipment heavy │  │ • Demo stations   │  │ • Full flexibility│         │
│ │                   │  │                   │  │                   │         │
│ │ [Select]          │  │ [Select]          │  │ [Select]          │         │
│ └───────────────────┘  └───────────────────┘  └───────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘

[TEMPLATE SELECTED - Tech Conference]
┌─────────────────────────────────────────────────────────────────────────────┐
│ Basic Event Details                               [Back] [Continue →]       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Event Name:    [Annual Tech Summit 2023_________________]                   │
│                                                                             │
│ Date Range:    [May 15, 2023_] to [May 17, 2023_]                          │
│                                                                             │
│ Location:      [Downtown Convention Center___________]                      │
│                                                                             │
│ Expected       [___250____] attendees                                       │
│ Attendance:                                                                 │
│                                                                             │
│ Number of      [__3__] parallel tracks                                      │
│ Tracks:                                                                     │
│                                                                             │
│ Template will pre-populate:                                                 │
│ • 3-day timeline with standard conference blocks                            │
│ • Common vendor categories (AV, Catering, Venue)                            │
│ • Typical budget allocations                                                │
│ • Standard team responsibilities                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Linear Design Elements:**
- Template-first approach for efficient event creation
- Card-based template selection with clear categorization
- Minimal information requirements upfront
- Smart defaults based on template selection
- Progressive disclosure of details as needed

## Budget Management

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Event Command Center                                      [User Menu ▾] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  SXSW Opening Reception Budget                           [+ Add Item]   │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │ Total Budget: $12,500                  Remaining: $2,345          │  │
│  │                                                                   │  │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 81% used            │  │
│  │                                                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  Categories                                                             │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Venue                $4,500     ━━━━━━━━━━━━━━━━━━ 100% of budget │  │
│  │ Catering           ! $4,050     ━━━━━━━━━━━━━━━━━━━ 110% of budget│  │
│  │ Entertainment        $1,200     ━━━━━━━━━━━━━━━━━  80% of budget  │  │
│  │ Decor                $600       ━━━━━━━━━━━━━━━    75% of budget  │  │
│  │ Staff                $0          No budget used                    │  │
│  │                                                                   │  │
│  │ ⓘ Catering is over budget. Review expenses or adjust allocation.  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  Line Items                                            [Export Budget]  │
│                                                                         │
│  ┌────────────┬────────────┬──────────┬──────────┬────────────────┐    │
│  │ Item       │ Category   │ Budget   │ Actual   │ Status         │    │
│  ├────────────┼────────────┼──────────┼──────────┼────────────────┤    │
│  │ East Hall  │ Venue      │ $4,500   │ $4,500   │ Paid           │    │
│  ├────────────┼────────────┼──────────┼──────────┼────────────────┤    │
│  │ Appetizers │ Catering   │ $2,000   │ $1,950   │ Paid           │    │
│  ├────────────┼────────────┼──────────┼──────────┼────────────────┤    │
│  │ Beverages  │ Catering   │ $2,000   │ $1,900   │ Paid           │    │
│  ├────────────┼────────────┼──────────┼──────────┼────────────────┤    │
│  │ DJ         │ Entertain. │ $1,500   │ $1,200   │ Invoiced       │    │
│  ├────────────┼────────────┼──────────┼──────────┼────────────────┤    │
│  │ Flowers    │ Decor      │ $800     │ $600     │ Invoiced       │    │
│  ├────────────┼────────────┼──────────┼──────────┼────────────────┤    │
│  │ Staff      │ Staff      │ $1,700   │ $0       │ Not Started    │    │
│  └────────────┴────────────┴──────────┴──────────┴────────────────┘    │
│                                                                         │
│  [Export]                                   [Adjust Total Budget]       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Linear Design Elements:**
- Visual progress bars with minimal design
- Clean table layout for line items
- Functional color usage (only for status indicators)
- Emphasis on numerical data with proper alignment
- Consistent spacing between sections

## Participant Management

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Event Command Center                                      [User Menu ▾] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Participant Management                            [+ Add Participant]  │
│                                                    [Import CSV]         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Filters                                                    [Clear] │  │
│  │                                                                   │  │
│  │ Cohort:   [All Cohorts ▾]      Dietary:  [Any ▾]                 │  │
│  │ Status:   [All Statuses ▾]     Search:   [                   ]   │  │
│  │                                                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  120 participants                                                       │
│                                                                         │
│  ┌───────────┬──────────────┬─────────────┬────────────────┬─────────┐  │
│  │ Name      │ Cohort       │ Status      │ Dietary Needs  │ Actions │  │
│  ├───────────┼──────────────┼─────────────┼────────────────┼─────────┤  │
│  │ Alex Chen │ Cohort A     │ Confirmed   │ Vegetarian     │   ⋮    │  │
│  ├───────────┼──────────────┼─────────────┼────────────────┼─────────┤  │
│  │ Jamie Kim │ Cohort A     │ Confirmed   │ None           │   ⋮    │  │
│  ├───────────┼──────────────┼─────────────┼────────────────┼─────────┤  │
│  │ Pat Smith │ Cohort B     │ Confirmed   │ Gluten-Free    │   ⋮    │  │
│  ├───────────┼──────────────┼─────────────┼────────────────┼─────────┤  │
│  │ Sam Lee   │ Cohort B     │ Confirmed   │ Vegan          │   ⋮    │  │
│  ├───────────┼──────────────┼─────────────┼────────────────┼─────────┤  │
│  │ Chris Wu  │ Cohort A     │ Pending     │ None           │   ⋮    │  │
│  ├───────────┼──────────────┼─────────────┼────────────────┼─────────┤  │
│  │ Robin Diaz│ Cohort C     │ Confirmed   │ Allergies      │   ⋮    │  │
│  └───────────┴──────────────┴─────────────┴────────────────┴─────────┘  │
│                                                                         │
│  [Load More]                                [Export]                    │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Dietary Requirements Summary                                      │  │
│  │                                                                   │  │
│  │ Vegetarian: 18    Vegan: 7          Gluten-Free: 12              │  │
│  │ Dairy-Free: 9     Allergies: 5      No Restrictions: 69          │  │
│  │                                                                   │  │
│  │ [Generate Meal Planning Report]                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Linear Design Elements:**
- Clean table layout for participant information
- Summary cards with actionable information
- Minimal color usage (only for status indicators)
- Focused filtering options
- Clear data visualization for dietary requirements

## Team Responsibility

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Event Command Center                                      [User Menu ▾] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Team Responsibilities                      [Filter ▾] [+ Assign Task]  │
│                                                                         │
│  ┌────────────────────────────────┐ ┌────────────────────────────────┐ │
│  │                                │ │                                │ │
│  │ Alex's Tasks (4/10 complete)   │ │ Jamie's Tasks (2/8 complete)   │ │
│  │ ━━━━━━━━━━━━━ 40% complete    │ │ ━━━━━━━━━ 25% complete         │ │
│  │                                │ │                                │ │
│  │ By Timeline Segment:           │ │ By Timeline Segment:           │ │
│  │ • Pre-Event: 3 tasks           │ │ • Pre-Event: 4 tasks           │ │
│  │ • 4:00-5:30 PM: 2 tasks        │ │ • 5:00-6:00 PM: 2 tasks        │ │
│  │ • 5:30-7:00 PM: 3 tasks        │ │ • 6:00-8:00 PM: 2 tasks        │ │
│  │ • Post-Event: 2 tasks          │ │                                │ │
│  │                                │ │                                │ │
│  │ ┌──────────────────────────┐   │ │ ┌──────────────────────────┐   │ │
│  │ │ Confirm Venue Details    │   │ │ │ Send Vendor Contracts    │   │ │
│  │ │ Due: Today               │   │ │ │ Due: Today               │   │ │
│  │ │ Event: SXSW Reception    │   │ │ │ Event: SXSW Reception    │   │ │
│  │ │ Timeline: Pre-Event      │   │ │ │ Timeline: Pre-Event      │   │ │
│  │ │ ■■■■□□ 60% Complete      │   │ │ │ ■□□□□□ 20% Complete      │   │ │
│  │ │                          │   │ │ │                          │   │ │
│  │ │ ✓ Contact venue manager  │   │ │ │ ✓ Create draft contract  │   │ │
│  │ │ ✓ Confirm A/V needs      │   │ │ │ □ Finalize contract      │   │ │
│  │ │ ✓ Check parking options  │   │ │ │ □ Send to vendors        │   │ │
│  │ │ □ Confirm floor plan     │   │ │ │ □ Collect signatures     │   │ │
│  │ │ □ Verify insurance       │   │ │ │ □ File in document system│   │ │
│  │ │                          │   │ │ │                          │   │ │
│  │ │ [View in Timeline]       │   │ │ │ [Generate Documents]     │   │ │
│  │ │ [Complete] [Edit] [Reassign] │ │ │ [Complete] [Edit] [Reassign] │ │
│  │ └──────────────────────────┘   │ │ └──────────────────────────┘   │ │
│  │                                │ │                                │ │
│  │ ┌──────────────────────────┐   │ │ ┌──────────────────────────┐   │ │
│  │ │ Monitor Welcome Speech   │   │ │ │ Prepare Registration     │   │ │
│  │ │ Due: Mar 12 @ 5:30 PM    │   │ │ │ Due: Mar 12 @ 5:00 PM    │   │ │
│  │ │ Priority: ⬤ High         │   │ │ │ Priority: ⬤ High         │   │ │
│  │ │                          │   │ │ │                          │   │ │
│  │ │ Related items:           │   │ │ │ Related items:           │   │ │
│  │ │ • 3 equipment pieces     │   │ │ │ • 120 participants       │   │ │
│  │ │ • 1 venue detail         │   │ │ │ • 2 documents needed     │   │ │
│  │ │                          │   │ │ │                          │   │ │
│  │ │ [View in Timeline]       │   │ │ │ [View in Timeline]       │   │ │
│  │ │ [Start] [Edit]           │   │ │ │ [Start] [Edit]           │   │ │
│  │ └──────────────────────────┘   │ │ └──────────────────────────┘   │ │
│  │                                │ │                                │ │
│  │ [View All Tasks]               │ │ [View All Tasks]               │ │
│  └────────────────────────────────┘ └────────────────────────────────┘ │
│                                                                         │
│  Task Templates                                            [+ Create]   │
│  [Opening Reception Tasks] [Vendor Setup] [Post-Event Closeout]         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Linear Design Elements:**
- Two-column layout for visual team separation
- Card-based task presentation
- Minimal checkbox design
- Consistent spacing and alignment
- Clear due date visibility

## Document Generation Engine

```
[DOCUMENT GENERATION INTERFACE]
┌─────────────────────────────────────────────────────────────────────────┐
│ Event Document Generator                                 [User: J. Smith]│
└─────────────────────────────────────────────────────────────────────────┘

[TABS]    [SEARCH]                            [VIEW] 
┌─────┐   ┌────────────────────────┐         ┌─────────────┐
│Routes│   │Search templates...     │         │Grid │ List  │
└─────┘   └────────────────────────┘         └─────────────┘

[RECENTLY USED TEMPLATES]
┌─────────────────────────────────────────────────────────────────────────┐
│ Recently Used                                             [See All ▾]   │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│ │Vendor Contract│  │Speaker Brief  │  │Run of Show   │                   │
│ │               │  │               │  │               │                   │
│ │[Generate Now] │  │[Generate Now] │  │[Generate Now] │                   │
│ └──────────────┘  └──────────────┘  └──────────────┘                   │
└─────────────────────────────────────────────────────────────────────────┘

[TEMPLATE CATEGORIES]
┌─────────────────────────────────────┐ ┌─────────────────────────────────┐
│ Event Planning                    ▾ │ │ On-Site Materials              ▾ │
├─────────────────────────────────────┤ ├─────────────────────────────────┤
│ ┌──────────────┐  ┌──────────────┐  │ │ ┌──────────────┐  ┌──────────────┐
│ │Timeline PDF  │  │Budget Report │  │ │ │Name Badges   │  │Signage       │
│ │               │  │               │  │ │               │  │               │
│ │[Preview]     │  │[Preview]     │  │ │ │[Preview]     │  │[Preview]     │
│ └──────────────┘  └──────────────┘  │ │ └──────────────┘  └──────────────┘
│                                     │ │                                   │
│ ┌──────────────┐  ┌──────────────┐  │ │ ┌──────────────┐  ┌──────────────┐
│ │Task List     │  │Contact Sheet │  │ │ │QR Codes      │  │Certificates  │
│ │               │  │               │  │ │               │  │               │
│ │[Preview]     │  │[Preview]     │  │ │ │[Preview]     │  │[Preview]     │
│ └──────────────┘  └──────────────┘  │ │ └──────────────┘  └──────────────┘
└─────────────────────────────────────┘ └─────────────────────────────────┘

[DOCUMENT PREVIEW - When template is selected]
┌─────────────────────────────────────────────────────────────────────────┐
│ Vendor Contract                                      [X] [Customize]    │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────┐  ┌─────────────────────────────────┐    │
│ │                             │  │ Output Format:  [PDF ▾]         │    │
│ │  [Preview of document with  │  │                                 │    │
│ │   actual event data         │  │ Event:         [SXSW Panel ▾]   │    │
│ │   automatically populated]  │  │                                 │    │
│ │                             │  │ Vendor:        [AV Team ▾]      │    │
│ │                             │  │                                 │    │
│ │                             │  │ Services:      [✓] Setup        │    │
│ │                             │  │                [✓] Equipment    │    │
│ │                             │  │                [✓] Staff        │    │
│ │                             │  │                                 │    │
│ │                             │  │ Contract Type: [Standard ▾]     │    │
│ │                             │  │                                 │    │
│ │                             │  │ Amount:        [$2,500]         │    │
│ │                             │  │                                 │    │
│ │                             │  └─────────────────────────────────┘    │
│ │                             │                                         │
│ │                             │  [Generate Now]                         │
│ │                             │                                         │
│ └─────────────────────────────┘  [Save as New Template]                 │
└─────────────────────────────────────────────────────────────────────────┘

[ONE-CLICK GENERATION DIALOG]
┌────────────────────────────────────────────────────┐
│ One-Click Document Generation                 [×]  │
├────────────────────────────────────────────────────┤
│                                                    │
│ Generate "Vendor Contract" using smart defaults:   │
│                                                    │
│ Event:        SXSW Panel Series                    │
│ Vendor:       AV Team                              │
│ Services:     All applicable from timeline         │
│ Amount:       $2,500 (from budget)                 │
│                                                    │
│ Output:       PDF (save to Documents folder)       │
│                                                    │
│ [Customize] [Generate Now] [Cancel]                │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Linear Design Elements:**
- Prioritizes frequently used templates at the top
- One-click document generation with smart defaults
- Clean, grid-based layout for template browsing
- Split-pane design for preview and options
- Minimal customization fields shown by default

## External Output Interface

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Event Command Center                                      [User Menu ▾] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  External Sharing                                                       │
│                                                                         │
│  ┌────────────────────────────┐  ┌───────────────────────────────────┐ │
│  │                            │  │                                   │ │
│  │ Share Settings             │  │ Preview (Vendor View)             │ │
│  │                            │  │                                   │ │
│  │ Event                      │  │ ┌─────────────────────────────┐  │ │
│  │ [SXSW Reception ▾]         │  │ │                             │  │ │
│  │                            │  │ │  SXSW RECEPTION             │  │ │
│  │ Share With                 │  │ │  March 12, 2023             │  │ │
│  │ [East Side Hall ▾]         │  │ │                             │  │ │
│  │                            │  │ │  TIMELINE                   │  │ │
│  │ Recipient Type             │  │ │                             │  │ │
│  │ ○ Vendor                   │  │ │  4:00 PM - Venue Access     │  │ │
│  │ ○ Participant             │  │ │  5:00 PM - Guest Arrival     │  │ │
│  │ ○ Team Member              │  │ │  5:30 PM - Welcome Speech   │  │ │
│  │ ● Custom                   │  │ │  8:00 PM - Event Close      │  │ │
│  │                            │  │ │                             │  │ │
│  │ Content to Include         │  │ │  CONTACT INFORMATION        │  │ │
│  │ ☑ Timeline                 │  │ │                             │  │ │
│  │ ☑ Contact Information      │  │ │  Event Coordinator:         │  │ │
│  │ ☐ Budget Details           │  │ │  Alex Chen - 555-123-4567   │  │ │
│  │ ☐ Vendor List              │  │ │                             │  │ │
│  │ ☑ Setup Instructions       │  │ │  SETUP INSTRUCTIONS         │  │ │
│  │                            │  │ │                             │  │ │
│  │ Access Expiration          │  │ │  Please arrange tables in   │  │ │
│  │ [March 15, 2023 ▾]         │  │ │  rows of 8 with center      │  │ │
│  │                            │  │ │  aisle. AV setup should     │  │ │
│  │ [Generate Share Link]      │  │ │  be complete by 4:30 PM.    │  │ │
│  │                            │  │ │                             │  │ │
│  └────────────────────────────┘  │ └─────────────────────────────┘  │ │
│                                  │                                   │ │
│  Active Share Links              │ [Copy Link]  [Send Email]         │ │
│                                  │                                   │ │
│  ┌───────────────────────────────────────────────────────────────┐    │
│  │ East Side Hall - Vendor View                                  │    │
│  │ Created: March 1, 2023  •  Expires: March 15, 2023            │    │
│  │ Viewed: Yes (March 2)                                         │    │
│  │ [Revoke]  [Edit]                                              │    │
│  └───────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────┐    │
│  │ Catering Team - Custom View                                   │    │
│  │ Created: March 1, 2023  •  Expires: March 15, 2023            │    │
│  │ Viewed: No                                                    │    │
│  │ [Revoke]  [Edit]                                              │    │
│  └───────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Linear Design Elements:**
- Split-pane layout showing content configuration and preview
- Card-based management of active share links
- Minimal interface with focused controls
- Clear information hierarchy
- Permission-based content controls
- Clean preview of shared information

## Dashboard View

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Event Command Center                                      [User Menu ▾] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Dashboard                                             [+ Create Event] │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ Upcoming Events                                                │    │
│  │                                                                │    │
│  │ ┌──────────────────────┐ ┌──────────────────────┐             │    │
│  │ │                      │ │                      │             │    │
│  │ │ SXSW Reception       │ │ GauntletAI Cohort A  │             │    │
│  │ │ March 12, 2023       │ │ April 3-5, 2023      │             │    │
│  │ │                      │ │                      │             │    │
│  │ │ Venue: East Side Hall│ │ Venue: Austin Center │             │    │
│  │ │ Participants: 200    │ │ Participants: 120    │             │    │
│  │ │                      │ │                      │             │    │
│  │ │ Timeline: 83% complete│ │ Timeline: 45% complete│             │    │
│  │ │ Tasks: 8/12 complete  │ │ Tasks: 5/20 complete  │             │    │
│  │ │ Budget: $10,155/$12,500│ │ Budget: $8,750/$22,000│             │    │
│  │ │                      │ │                      │             │    │
│  │ │ [View Event]         │ │ [View Event]         │             │    │
│  │ └──────────────────────┘ └──────────────────────┘             │    │
│  │                                                                │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────┐  │
│  │                             │  │                                 │  │
│  │ Recent Activity             │  │ Critical Alerts                 │  │
│  │                             │  │                                 │  │
│  │ • Participant list updated  │  │ • Dietary Requirements Count    │  │
│  │   GauntletAI Cohort A       │  │   GauntletAI Cohort A needs    │  │
│  │   10 minutes ago            │  │   final meal counts by tomorrow │  │
│  │                             │  │                                 │  │
│  │ • Budget updated            │  │ • Venue Contract Unsigned      │  │
│  │   SXSW Reception            │  │   Austin Center contract       │  │
│  │   2 hours ago               │  │   deadline in 3 days           │  │
│  │                             │  │                                 │  │
│  │ • Task completed            │  │ • AV Equipment Shortage        │  │
│  │   SXSW Reception            │  │   Not enough microphones       │  │
│  │   5 hours ago               │  │   for both events (Apr 3-5)    │  │
│  │                             │  │                                 │  │
│  │ [View All Activity]         │  │ [View All Alerts]               │  │
│  └─────────────────────────────┘  └─────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Linear Design Elements:**
- Card-based organization of events
- Clean progress indicators
- Two-column layout for related information
- Consistent typography and spacing
- Minimal use of color (only for status and progress)
- Critical alerts section for important notifications

These mockups demonstrate how the Event Command Center implements Linear design principles with a focus on clarity, functionality, and thoughtful minimalism. The interface prioritizes essential information, maintains consistent spacing and typography, and uses subtle visual cues rather than decorative elements. The revised mockups now include detailed views for Participant Management and External Output Interface to better align with the updated PRD. 