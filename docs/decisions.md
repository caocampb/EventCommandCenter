# Event Command Center: Implementation Decisions Log

This document tracks significant technical decisions made during the development of Event Command Center. 
It focuses only on important choices that might not be obvious from the code itself or that future-you might question.

## Format

```
YYYY-MM-DD: Decision title

Context: Brief background on the problem or situation
Decision: What was decided
Reasoning: Why this approach was chosen over alternatives
Implications: Expected effects of this decision (optional)
```

## Decisions

### 2023-05-15: Selected Next.js + Supabase stack

**Context**: Needed to choose a frontend framework and backend solution for the MVP.

**Decision**: Using Next.js with TypeScript for frontend and Supabase for backend/auth/database.

**Reasoning**: 
- Next.js provides a solid foundation with good TypeScript support
- Supabase offers auth, Postgres, and realtime subscriptions in one service
- Stack allows focusing on product features rather than infrastructure
- Linear-inspired UI is easier to implement with React-based framework

### 2023-05-16: Optimistic UI updates for timeline operations

**Context**: Timeline block operations (create, update, reorder) need to feel instant.

**Decision**: Implementing optimistic UI updates for all timeline operations.

**Reasoning**:
- Timeline is core to the user experience and used constantly
- Even 300ms delays feel sluggish in timeline operations
- Matches Linear's approach to performance as a feature
- Worth the added complexity for the improved user experience

### 2023-05-18: Local-first approach for document generation

**Context**: Document generation could be handled client-side or server-side.

**Decision**: Using client-side PDF generation with jsPDF rather than server rendering.

**Reasoning**:
- Eliminates server processing time and reduces hosting costs
- Better privacy as sensitive documents don't transit through servers
- Works offline which aligns with "day-of" event requirements
- Simpler implementation for MVP stage

### 2023-05-19: Using midday-ai/v1 starter kit

**Context**: Need a foundation that implements many of our key architectural decisions while following best practices.

**Decision**: Using midday-ai/v1 as the starter kit for implementation rather than starting from scratch.

**Reasoning**:
- Provides a production-ready monorepo structure that aligns with our needs
- Includes our core technology choices (Next.js, TypeScript, Supabase, Tailwind)
- Brings additional value with Shadcn UI components that will help create Linear-like UI
- Offers built-in email templates, background jobs, and analytics that we'll need
- Follows modern best practices with a focus on code reuse
- Allows faster implementation of our vertical slices by not reinventing infrastructure

**Implications**:
- Faster development of core functionality
- Less time spent on infrastructure and boilerplate
- Better alignment with modern best practices
- May need to adapt certain components to match our specific Timeline/Vendor management needs

### 2023-06-10: Google OAuth for authentication

**Context**: Needed to choose an authentication method for a small logistics team of two users.

**Decision**: Implemented Google OAuth as the primary authentication method.

**Reasoning**:
- Small team size (2 users) makes Google authentication straightforward to manage
- Users already have Google accounts, eliminating the need for separate credentials
- Integration with Supabase made implementation relatively simple
- Provides better security than email/password (2FA, Google's security measures)
- "External" OAuth consent screen setting provides flexibility for different email domains

**Implications**:
- Login process is familiar and secure for users
- No need to manage password resets or account creation
- Environment variables (GOOGLE_CLIENT_ID, GOOGLE_SECRET) need to be maintained
- Future users would need to be added to test users list until app verification

### 2024-05-29: Simplified RLS policies for MVP development

**Context**: Needed to balance security with development speed for the MVP phase.

**Decision**: Removed restrictive Row-Level Security (RLS) policies and implemented completely open policies for the MVP development.

**Reasoning**:
- MVP is intended for a small, trusted team of users
- Overly restrictive RLS policies were slowing down development
- For a small internal team, the authentication layer provides sufficient security
- Complex permission models add unnecessary complexity at this stage
- Development speed is prioritized over granular access control for MVP

**Implications**:
- Dramatically faster development of core event management features
- All authenticated users can perform all operations on events
- Simplified debugging and testing process
- MUST implement proper security policies before production deployment
- Will revisit security model before scaling to larger organizations or public release

### 2024-06-01: Client-side authentication component

**Context**: Needed a reliable way to handle authentication state and sign-out functionality in the UI.

**Decision**: Created a dedicated `AuthButton` client component that handles authentication state and sign-out.

**Reasoning**:
- Cleanly separates authentication UI concerns from layout structure
- Reactive to authentication state changes through Supabase's onAuthStateChange
- Works with middleware pattern for server-side auth checks
- Provides clear, consistent sign-out experience

**Implications**:
- Simplified dashboard layout with cleaner separation of concerns
- Consistent auth state representation across the application
- When authentication is needed it can be handled without duplicating code
- Works within the security ecosystem of the midday-ai/v1 starter kit

### 2024-06-04: Client Component Pattern for Interactive Server-Rendered Tables

**Context**: Needed to implement clickable table rows in a server component while maintaining proper HTML table structure.

**Decision**: Created a dedicated client component (`ClickableTableRow`) that wraps TR elements and handles navigation.

**Reasoning**: 
- Allows server rendering of the main page content for better performance
- Minimizes client JavaScript to only interactive elements
- Maintains proper HTML table structure
- Follows Next.js App Router best practices for mixing server and client components

**Implications**:
- Small increase in bundle size for the client component
- Cleaner separation between data fetching and interactive UI
- More maintainable pattern for future interactive elements
- Enables consistent hover behavior across the entire row

### 2024-06-12: Proportional Scaling for Timeline Visualization

**Context**: Timeline needed to display blocks of different durations accurately while ensuring content readability, particularly for short 15-minute blocks.

**Decision**: Implemented a proportional scaling system for the timeline with an increased `HOUR_HEIGHT` (from 80px to 128px) while maintaining true proportional representation of time blocks.

**Reasoning**:
- Precise time representation is essential for a timeline interface
- 15-minute blocks needed to be both proportionally accurate and contain readable content
- Larger scale provides better visual distinction between different block durations
- Maintains design integrity while improving usability of short blocks

**Implications**:
- Taller timeline provides adequate space for all content regardless of block duration
- Consistent proportional relationship (15min = 32px, 30min = 64px, 1hr = 128px)
- Future implementation may need filtering or pagination for multi-day views
- Simplified codebase by avoiding special case handling for different duration blocks

### 2024-06-14: Simple but Effective Status Styling for Timeline Blocks

**Context**: Timeline blocks needed to clearly indicate their status (pending, in-progress, complete, cancelled) while maintaining a clean, readable design.

**Decision**: Implemented a consistent status styling system using color-coded borders and backgrounds with proper contrast ratios.

**Reasoning**:
- Status information is critical for event planning and execution
- Color-coding provides immediate visual identification of block status
- Subtle background colors with matching borders maintain readability of content
- Consistent styling pattern creates a coherent visual language across the application

**Implications**:
- Users can quickly scan the timeline to identify block status
- The design scales well to both 15-minute and longer duration blocks
- Status styles are defined once and reused consistently
- Future status types can be added using the same styling pattern

### 2024-07-08: Modal-Based Detailed Timeline Block View

**Context**: Users needed a way to view comprehensive timeline block details without navigating away from the timeline view.

**Decision**: Implemented a modal-based detailed view pattern for timeline blocks, accessible by clicking on any block, with options to close or edit. Enhanced with Linear-style hover interactions and visual feedback.

**Reasoning**:
- Direct navigation to edit page disrupted the workflow and context
- Modal approach maintains context while providing detailed information
- Two-step pattern (view details → optionally edit) follows Linear's progressive disclosure principle
- Enhanced hover states with 50ms delays prevent flickering and provide clear feedback
- Left-side accent bar and subtle elevation on hover match Linear's interaction patterns
- Consistent with the way other modern interfaces (like Linear, Notion) handle detailed views

**Implications**:
- Users maintain timeline context while viewing block details
- Provides a complete view of all block data including new fields (personnel, equipment, notes)
- Navigation to edit page becomes an explicit choice rather than default action
- Hover states provide clear affordance about interactivity without documentation
- Subtle visual cues like the left accent bar and elevation create a more polished feel
- Pattern can be reused for other detailed views throughout the application
- Creates a more discoverable and intuitive user experience

### 2024-07-09: Contextual Add Buttons for Timeline

**Context**: Users needed a consistent and context-aware way to add timeline blocks to specific dates.

**Decision**: Implemented Linear-style contextual add buttons that appear on hover in day headers, with pre-filled date parameters.

**Reasoning**:
- Progressive disclosure (buttons only appear on hover) reduces visual clutter
- Context-aware design pre-fills the date based on where the user initiates the action
- Consistent placement in day headers creates a predictable pattern
- 50ms delay on hover state prevents flickering during normal mouse movement
- Subtle styling with minimal visual weight maintains clean interface
- Direct association between the date header and add action creates clear causality

**Implications**:
- Users can add blocks to specific days without manually selecting dates
- Interface maintains minimal visual noise while providing clear affordances
- Consistent pattern can be extended to other areas of the application
- The minimal 50ms delay creates a more polished feel without noticeable lag
- Empty state add button and contextual day header button work together as a coherent system
- Reduces cognitive load by handling date context automatically

### 2024-07-10: Consistent Navigation with Contextual Back Links

**Context**: Users needed clear navigation paths in hierarchical views while maintaining a clean interface.

**Decision**: Implemented Linear-style back links that appear only in appropriate contexts, following a consistent visual pattern.

**Reasoning**:
- Back links are only shown when there's a clear parent-child relationship (e.g., Event → Timeline)
- Consistent styling using subtle gray text that brightens on hover
- Arrow icon provides clear directional guidance without needing explanation
- Positioned at the top of the page to establish context before content
- Explicit destination naming ("Back to event") rather than generic "Back" label
- Maintains hierarchical awareness without requiring breadcrumbs

**Implications**:
- Users always understand their current location in the navigation hierarchy
- Interface remains clean with navigation elements only where truly needed
- Creates a consistent pattern that users can rely on throughout the application
- Reduces unnecessary back buttons in contexts served by primary navigation
- Provides direct path to parent context from detail pages
- Follows Linear's principle of only showing UI elements that serve a specific purpose

### 2024-06-28: Vendor Management Implementation with Favorites System

**Context**: Needed to implement a comprehensive vendor management system that allows users to track, filter, and favorite vendors for events.

**Decision**: Implemented a vendor management module with the following key components:
1. Main list view with filtering, search, and sort capabilities
2. Detailed vendor view and edit pages
3. Favorites system with star icons across all views
4. Optimistic UI updates for immediate feedback

**Reasoning**:
- The star-based favorites system follows Linear's design principles of clean iconography and immediate visual feedback
- Optimistic UI updates ensure that users see immediate responses to their actions, enhancing perceived performance
- Consistent UI elements (star icons, tooltips) across all views provide a cohesive experience
- Direct manipulation of state with error rollback provides both speed and data integrity
- Filter dropdowns with clear visual indicators improve discoverability and ease of use

**Implications**:
- The favorites implementation allows users to quickly mark and filter preferred vendors
- Optimistic UI patterns established here can be replicated across other features
- The consistent star iconography sets a pattern for other "favorite" or "bookmark" features
- The tooltip pattern improves discoverability without cluttering the UI 

**Technical Implementation**:
- List view uses client-side filtering with immediate state updates
- Favorites toggle API calls include error handling with state rollback
- Tooltips use a consistent group-hover pattern that can be reused
- Star icons maintain consistent styling and placement across all views
- Filter controls follow a unified pattern that can be extended to other modules

### 2024-06-30: Bidirectional Event-Vendor Relationship with Linear-Style UI

**Context**: Needed to implement a relationship between events and vendors that allows management from both sides of the relationship while maintaining a clean, consistent UI.

**Decision**: Created a bidirectional relationship management system with these key features:
1. Junction table (`event_vendors`) to support many-to-many relationships
2. API endpoints supporting operations from both sides (vendor-to-event and event-to-vendor)
3. Inline vendor assignment with real-time search filtering 
4. Subtle "x" removal buttons that appear on hover for both directions
5. Optimistic UI updates for immediate feedback

**Reasoning**:
- Following Linear's design philosophy of contextual UI that only appears when relevant
- A true bidirectional relationship makes management intuitive from both perspectives
- Subtle UI elements maintain a clean interface while still providing necessary functionality
- Optimistic updates create a responsive feel even when network operations take time
- Consistent styling across both relationship directions maintains UI coherence

**Implications**:
- Users can efficiently manage assignments from either the event or vendor perspective
- The consistent removal UI creates a predictable mental model for relationship management
- The optimistic UI approach will be reused in other relationship management features
- The established search and filtering pattern provides a foundation for other selection interfaces

**Technical Implementation**:
- The junction table approach allows for future extensions (like adding roles or notes)
- Search-driven dropdowns follow the same pattern for consistency and future reuse
- API endpoints handle both data validation and optimistic UI error scenarios
- Hover-based UI elements reduce visual clutter without sacrificing functionality
- TypeScript interfaces ensure consistent data handling across components

### 2024-07-02: Hybrid Optimistic UI for Budget Management

**Context**: Needed to balance responsive UI with accurate budget calculations for the budget management feature.

**Decision**: Implemented a hybrid approach combining immediate optimistic UI updates with background server synchronization.

**Reasoning**:
- Pure optimistic updates were type-unsafe and prone to calculation errors
- Server-only updates felt too sluggish for financial operations
- Budget totals and category breakdowns needed to stay accurate
- Linear's design philosophy emphasizes immediate feedback

**Implications**:
- Users see immediate UI feedback when adding/updating/deleting budget items
- Budget data refreshes automatically in the background every 60 seconds
- After critical operations, data is refreshed without blocking the UI
- Calculation errors are prevented by eventually getting the server's calculation

**Technical Implementation**:
- Extracted fetch logic into a reusable, memoized function
- Applied proper TypeScript safety with null checks
- Added interval-based background data refresh
- Implemented optimistic UI updates for all CRUD operations
- Added error recovery that reverts optimistic updates on API failures

### 2024-07-05: Budget Export Functionality with Format-Specific Optimizations

**Context**: Event planners need to share budget data with stakeholders and use budget information in external tools like spreadsheets.

**Decision**: Implemented a comprehensive export system with specific optimizations for different target formats (CSV, Google Sheets, Airtable) and a clean print view.

**Reasoning**:
- Event planners regularly need to share budget information with clients and team members
- Different tools require different formatting for optimal import
- The Linear design philosophy emphasizes subtle UI that appears only when needed
- Print view is essential for meetings and hardcopy documentation

**Implications**:
- Users can seamlessly move budget data into their preferred external tools
- The export dropdown maintains a clean interface while providing multiple options
- Format-specific optimizations make external tool integration frictionless
- Print view provides professional documentation for client presentations

**Technical Implementation**:
- Created a dropdown UI pattern that follows Linear's subtle design approach
- Implemented specific export functions for each target platform
- Added number formatting and formula generation for spreadsheet exports
- Created a dedicated print view with professional styling and auto-print functionality
- Used typed callbacks with error handling for all export functions

### 2024-07-06: Category Filtering for Budget Management

**Context**: As budget items grow, users need to focus on specific categories without being overwhelmed by the full list.

**Decision**: Implemented a Linear-inspired category filtering system with pill-shaped toggles that maintain state visually.

**Reasoning**:
- Category filtering allows focusing on relevant budget sections
- Linear's approach emphasizes subtle visual indicators for state
- Toggle pattern provides immediate feedback and clear current state
- Keeping filters visible maintains context while browsing

**Implications**:
- Users can quickly focus on specific budget categories
- The filtering UI is consistent with Linear's minimal aesthetic
- Filter patterns established here can be extended to other list views
- The pill-based filter UI sets a pattern for similar filtering needs

**Technical Implementation**:
- Used pill-shaped toggle buttons with subtle active/inactive states
- Implemented memoized filtering functions for performance
- Added clear filters button that only appears when needed
- Maintained consistent styling with Linear's color system
- Used clear visual feedback for active filter state

### 2024-07-12: PDF Document Attachments for Vendors

### Context
Event planning involves numerous documents from vendors (contracts, menus, floor plans, etc.) that need to be easily accessible within the application. Previously, these documents would be stored externally requiring users to manually organize and access them separately from the application.

### Decision
Implement a PDF attachment system for vendor profiles with the following features:
- Dedicated Supabase storage bucket with appropriate RLS policies
- Database table tracking document metadata (name, size, type, upload date)
- Upload component with validation, size limits, and progress feedback
- Document preview directly in the browser for quick reference
- Download option for offline access
- Delete functionality with proper cleanup

### PDF Experience Decision
We chose to implement two distinct actions for document interaction:
1. **Preview**: Uses the browser's built-in PDF renderer to display the document directly in the application without requiring download. This is ideal for quick reference.
2. **Download**: Provides a direct link to the document with proper headers to trigger a download for offline access or sharing.

This dual-approach balances immediate access needs with offline functionality, improving user workflow efficiency.

### Reasoning
Including vendor documents directly within the application creates a more complete planning experience, reduces context switching, and ensures all relevant information is accessible in one place. The implementation follows our design principles of progressive disclosure and minimal data entry friction.

### Implications
- Users can now access, preview, and download vendor documents without leaving the application
- Document management is integrated into the vendor profile workflow
- UI consistently shows document actions on hover, following the Linear-style interaction pattern
- Storage is properly secured with appropriate access controls

### Technical Implementation
- Created `vendor_documents` table with fields for document metadata
- Set up storage bucket with RLS policies enforcing proper access control
- Implemented API endpoints for uploading, fetching, and deleting documents
- Designed UI components for document management with proper error handling

## When to Add Entries

Add entries to this log when you:
1. Choose a significant technology or architectural approach
2. Make a non-obvious optimization or performance decision
3. Intentionally take on technical debt with a clear reason
4. Reject a "standard" approach in favor of a custom solution
5. Make a decision you might question later or would need to explain to others

Keep entries brief and focused on reasoning that isn't captured elsewhere. 