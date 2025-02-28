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

## When to Add Entries

Add entries to this log when you:
1. Choose a significant technology or architectural approach
2. Make a non-obvious optimization or performance decision
3. Intentionally take on technical debt with a clear reason
4. Reject a "standard" approach in favor of a custom solution
5. Make a decision you might question later or would need to explain to others

Keep entries brief and focused on reasoning that isn't captured elsewhere. 