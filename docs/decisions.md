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

## When to Add Entries

Add entries to this log when you:
1. Choose a significant technology or architectural approach
2. Make a non-obvious optimization or performance decision
3. Intentionally take on technical debt with a clear reason
4. Reject a "standard" approach in favor of a custom solution
5. Make a decision you might question later or would need to explain to others

Keep entries brief and focused on reasoning that isn't captured elsewhere. 