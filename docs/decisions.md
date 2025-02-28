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

## When to Add Entries

Add entries to this log when you:
1. Choose a significant technology or architectural approach
2. Make a non-obvious optimization or performance decision
3. Intentionally take on technical debt with a clear reason
4. Reject a "standard" approach in favor of a custom solution
5. Make a decision you might question later or would need to explain to others

Keep entries brief and focused on reasoning that isn't captured elsewhere. 