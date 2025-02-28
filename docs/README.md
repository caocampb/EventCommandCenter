# Event Command Center

A Linear-inspired event planning platform that transforms fragmented processes into a focused, efficient system for professional program operators.

## What It Is

Event Command Center is a specialized tool for professional event planners who:
- Manage complex events with 30-250 attendees
- Coordinate multiple vendors and team members
- Need precise timeline control with 30-minute blocks
- Require integrated budget tracking
- Generate professional documentation

## Core Principles

- **Timeline-First Planning**: Everything connects to timeline blocks
- **Focused Interface**: Desktop-optimized for professional productivity
- **Deliberate Simplicity**: Includes only what matters, nothing more
- **Opinionated Workflows**: Guided but not rigid process flows
- **Performance as Feature**: Instant response to time-sensitive operations

## Technology Stack

This project is built on the [midday-ai/v1](https://github.com/midday-ai/v1) starter kit, which provides:

- **Next.js App Router** with TypeScript
- **Turborepo** monorepo structure
- **Supabase** for backend, auth, and database
- **Shadcn UI** components for Linear-inspired interfaces
- **Tailwind CSS** for styling
- **Biome** for linting and formatting
- **Plus** essential SaaS infrastructure (emails, logging, analytics)

## Current Implementation Status

As of June 2024, we have implemented:

- **Authentication System**
  - Google OAuth integration
  - Protected routes with middleware
  - Sign-out functionality
  - User session management

- **Event Management**
  - Event creation form with validation
  - Event listing with status badges and clickable rows
  - Event detail views with Linear-inspired design
  - Event editing and deletion
  - Clean, consistent UI with hover states

- **Application Architecture**
  - Server Components for data-fetching pages
  - Client Components for interactive elements
  - Proper separation of concerns
  - Linear-inspired visual language

- **Database**
  - Events table with core fields
  - Simplified security model for MVP development
    - Removed complex Row-Level Security (RLS) policies
    - Implemented open policies for authenticated users
    - Development-focused approach for rapid iteration

Next phases will include timeline blocks, vendor management, and budget tracking, along with more robust security policies before production deployment.

## Getting Started

To set up the development environment and start working with the Event Command Center:

1. See the [Initial Setup Guide](./initial-setup-guide.md) for complete instructions
2. Follow the vertical slice development approach
3. Reference the [Architecture](./event-command-center-architecture.md) for technical details
4. Use the [Implementation Plan](./event-command-center-implementation-plan.md) for day-by-day tasks

## Documentation Structure

| Document | Purpose | Audience |
|----------|---------|----------|
| [Documentation Guide](./DOCUMENTATION.md) | Documentation organization and relationships | All Contributors |
| [Initial Setup Guide](./initial-setup-guide.md) | Development environment setup instructions | Developers |
| [PRD](./event-command-center-prd.md) | Complete feature specifications | Product/Dev Teams |
| [Design Foundations](./event-command-center-design-foundations.md) | Design system specifications | Designers/Developers |
| [Architecture](./event-command-center-architecture.md) | Technical architecture and implementation | Developers |
| [Implementation Plan](./event-command-center-implementation-plan.md) | Day-by-day build approach | Project/Dev Teams |
| [Backend Implementation](./event-command-center-backend.md) | Detailed backend architecture | Backend Developers |
| [UI Mockups](./event-command-center-ui-mock.md) | Visual reference implementation | Developers |
| [User Journey Map](./event-command-center-user-journey.md) | Experience flow | Product/UX Teams |
| [Implementation Decisions](./decisions.md) | Record of key technical decisions | Development Team |

## Features by Build Layer

### Layer 1: Core Event Management
- Advanced Timeline Creator (30-minute blocks)
- Comprehensive Vendor System
- Financial Management

### Layer 2: Operational Efficiency
- Team Responsibility System
- Document Generation Engine
- Event Dashboard

### Layer 3: Process Optimization
- Inventory Management
- Multi-Event Project Management
- Smart Templates

### Layer 4: Integration & Enhancement
- External System Connections
- Advanced Analytics
- On-Site Command Mode

## Development Philosophy

This project embraces The Linear Way combined with midday-ai's best practices:
- **Quality over quantity**: We build fewer, better features rather than more mediocre ones
- **Thoughtful minimalism**: We maintain a focused UI with nothing unnecessary
- **Performance as a feature**: We prioritize fast interactions (<100ms for critical operations)
- **Developer experience**: We structure code for clarity and maintainability
- **Pragmatic implementation**: We leverage established patterns from midday-ai/v1
- **Component reuse**: We build on Shadcn UI and extend with our Linear-inspired components

---

Built with focus, precision, and care. 