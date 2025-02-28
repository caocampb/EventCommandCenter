# Event Command Center: Initial Setup Guide

This guide provides step-by-step instructions for setting up the Event Command Center development environment using the [midday-ai/v1](https://github.com/midday-ai/v1) starter kit as our foundation.

## Prerequisites

Before beginning, ensure you have the following installed:

- **Bun** - Package manager and runtime (preferred over npm for this project)
- **Docker** - For local development environment
- **Git** - Version control
- **VSCode** (recommended) - IDE with helpful extensions

## Getting Started

### 1. Clone the Starter Kit

We're using the midday-ai/v1 starter kit as our foundation. Start by creating a new project using degit:

```bash
bunx degit midday-ai/v1 event-command-center
cd event-command-center
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Set Up Environment Variables

Copy the example environment files for each app in the monorepo:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/app/.env.example apps/app/.env
cp apps/web/.env.example apps/web/.env
```

### 4. Configure Supabase

1. Create a free Supabase account at [supabase.com](https://supabase.com)
2. Create a new project and note your project URL and API keys
3. Update your `.env` files with the appropriate Supabase configuration values

### 5. Configure Google OAuth (for Authentication)

Google OAuth is used as the primary authentication method for the Event Command Center. Follow these steps to set it up:

1. Create a Google Cloud Project:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project (or use an existing one)

2. Configure the OAuth Consent Screen:
   - Navigate to "APIs & Services" > "OAuth consent screen"
   - Choose "External" for testing with a small team (or "Internal" if all users are in the same organization)
   - Fill in the required app information (name, email, etc.)
   - Add authorized domains including your deployment domain and `localhost`
   - Save and continue

3. Create OAuth Credentials:
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application" as the application type
   - Add "Authorized JavaScript Origins": `http://localhost:3000`
   - Add "Authorized Redirect URIs": `http://localhost:54321/auth/v1/callback`
   - Click "Create" and note your Client ID and Client Secret

4. Update Environment Variables:
   - Add your Google credentials to `apps/api/.env`:
   ```
   GOOGLE_CLIENT_ID=your-client-id-here
   GOOGLE_SECRET=your-client-secret-here
   ```

5. Restart Supabase:
   ```bash
   cd apps/api
   bun run supabase stop
   bun run supabase start
   ```

6. Test Authentication:
   - Start your application with `bun dev`
   - Navigate to the login page and verify "Sign in with Google" works

### 6. Set Up Additional Services

The midday-ai/v1 starter kit utilizes several services that you'll need to configure:

- **Upstash** - For Redis cache and rate limiting
- **Resend** - For email delivery
- **Trigger.dev** - For background jobs
- **Dub** - For sharable links
- **Sentry** - For error monitoring
- **OpenPanel** - For analytics

Create accounts for each service and add the appropriate environment variables to your `.env` files.

### 7. Initialize Database

Run database migrations and seed commands:

```bash
bun migrate
bun seed
```

### 8. Run the Development Server

The midday-ai/v1 starter provides several development scripts:

```bash
# Start everything (web, app, api, email)
bun dev

# Or start individual components
bun dev:web  # Start the marketing site
bun dev:app  # Start the main application
bun dev:api  # Start the API (Supabase)
bun dev:email  # Start the email preview
```

## Project Structure

The Event Command Center follows the midday-ai/v1 monorepo structure:

```
.
├── apps                         # App workspace
│    ├── api                     # Supabase (API, Auth, Storage, Realtime)
│    ├── app                     # Our main Event Command Center application
│    ├── web                     # Marketing site
│    └── ...                     
├── packages                     # Shared packages between apps
│    ├── analytics               # OpenPanel analytics
│    ├── email                   # React email library
│    ├── jobs                    # Trigger.dev background jobs
│    ├── kv                      # Upstash rate-limited key-value storage
│    ├── logger                  # Logger library
│    ├── supabase                # Supabase - Queries, Mutations, Clients
│    └── ui                      # Shared UI components (Shadcn)
├── tooling                      # Shared configuration used by the apps and packages
│    └── typescript              # Shared TypeScript configuration
└── ...
```

### Event Command Center-Specific Additions

We'll extend the starter kit structure with our own event-specific components:

```
.
├── apps
│    ├── app
│    │    ├── components
│    │    │    ├── timeline       # Timeline components
│    │    │    ├── vendors        # Vendor components
│    │    │    ├── budget         # Budget tracking components
│    │    │    └── ...
│    │    ├── app
│    │    │    ├── events         # Event pages
│    │    │    ├── vendors        # Vendor pages
│    │    │    ├── timeline       # Timeline pages
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
/supabase               # Supabase configuration
  /migrations           # Database migration scripts
```

## Development Workflow

1. **Pull latest changes**: `git pull origin main`
2. **Create a new branch**: `git checkout -b feature/your-feature-name`
3. **Implement your changes**
4. **Run tests**: `npm test`
5. **Submit a pull request**

### Vertical Slice Development

Follow these guidelines when implementing new features:

1. Start with database schema changes
2. Implement server-side API endpoints
3. Create UI components
4. Connect data fetching and mutations
5. Add error handling and loading states

Each vertical slice should deliver a complete feature from database to UI.

## Documentation

Make sure to update relevant documentation when making changes:

1. For feature changes, update the [PRD](./event-command-center-prd.md)
2. For design changes, update [Design Foundations](./event-command-center-design-foundations.md)
3. For architecture changes, update [Architecture](./event-command-center-architecture.md)
4. For implementation plans, update [Implementation Plan](./event-command-center-implementation-plan.md)

Refer to the [Documentation Guide](./DOCUMENTATION.md) for a complete overview of documentation practices.

## Common Tasks

### Creating a New API Endpoint

1. Create a new file in the appropriate location under `app/api/`
2. Implement the route handler functions (GET, POST, etc.)
3. Add validation using Zod schemas
4. Connect to Supabase for data operations

Example:

```typescript
// app/api/events/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('start_date');
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ data });
}

const eventSchema = z.object({
  name: z.string().min(1, "Name is required"),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  location: z.string().optional(),
  description: z.string().optional(),
  attendee_count: z.number().int().positive().optional()
});

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Parse and validate the request body
  const body = await request.json();
  const result = eventSchema.safeParse(body);
  
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.format() },
      { status: 400 }
    );
  }
  
  // Insert validated data
  const { data, error } = await supabase
    .from('events')
    .insert(result.data)
    .select();
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ data });
}
```

### Creating a New Component

1. Create a new file in the appropriate location under `components/`
2. Define the component props using TypeScript
3. Implement the component with proper styling
4. Export the component for use in pages

Example:

```tsx
// components/ui/Button.tsx
import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        // Base styles
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        // Variant styles
        variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700',
        variant === 'secondary' && 'bg-gray-200 text-gray-900 hover:bg-gray-300',
        variant === 'outline' && 'border border-gray-300 text-gray-700 hover:bg-gray-100',
        // Size styles
        size === 'sm' && 'h-8 px-3 text-sm',
        size === 'md' && 'h-10 px-4',
        size === 'lg' && 'h-12 px-6 text-lg',
        // Additional custom classes
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

## Need Help?

- **Documentation**: Refer to the project [documentation](./DOCUMENTATION.md)
- **Issues**: Create an issue in the GitHub repository
- **Discussions**: Join the project discussion forum 