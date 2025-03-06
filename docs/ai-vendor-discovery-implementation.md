# AI Vendor Discovery - Implementation Guide

## Overview

A natural language search feature that helps event planners discover vendors using Google Places API and Claude 3.7, integrating with our existing vendor management system.

## Core Value Proposition (80/20)

- **Natural Language Search**: Users describe exactly what they need in plain language
- **AI-Enhanced Results**: Claude processes vendor data to match specific event needs
- **One-Click Integration**: Seamlessly add discovered vendors to the platform
- **Contextual Relevance**: Results scored by relevance to the specific search query

## Linear-Inspired Design Principles

- **Speed First**: All interactions complete in under 200ms to feel instantaneous
- **Functional Minimalism**: Every UI element serves a clear purpose, nothing extraneous
- **Progressive Disclosure**: Show essential information first, reveal details on demand
- **Contextual Actions**: Primary actions prominently displayed, secondary actions in context menus

## Technical Architecture

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│ Search Box     │─────▶ API Route      │─────▶ Google Places  │
│ Component      │     │ /api/discovery │     │ API            │
└────────────────┘     └────────────────┘     └────────────────┘
                              │                       │
                              ▼                       ▼
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│ Results Cards  │◀────│ Result         │◀────│ AWS Bedrock    │
│                │     │ Processor      │     │ (Claude 3.7)   │
└────────────────┘     └────────────────┘     └────────────────┘
```

## MVP Data Model

```typescript
// Core data structure
export interface DiscoveredVendor {
  // Essential vendor data
  placeId: string;
  name: string;
  category?: VendorCategory;
  rating?: VendorRating;
  priceLevel?: PriceTier;
  location?: string;
  
  // Contact info
  website?: string;
  phoneNumber?: string;
  
  // Claude-enhanced data
  eventSuitabilityScore?: number; // 1-5 rating for event suitability
  description?: string;
  
  // Source data
  source: 'google_places';
  sourceData: any; // Original data
}
```

## Essential Files (Build These First)

1. **Search Component** - `src/components/vendors/vendor-discovery-search.tsx`
2. **API Route** - `src/app/api/discovery/route.ts`
3. **Results Component** - `src/components/vendors/vendor-discovery-results.tsx`
4. **Discovery Page** - `src/app/[locale]/(dashboard)/vendors/discover/page.tsx`
5. **Vendor Integration Utils** - `src/lib/vendor-discovery.ts`

## Critical Claude Prompt (Invest Time Here)

This prompt is the core of the AI enhancement - worth spending time to refine:

```
I need you to analyze these venue results from a search for: "${originalQuery}"

For each venue, determine:
1. The most appropriate vendor category from this list: venue, catering, entertainment, staffing, equipment, transportation, other
2. An event suitability score from 1-5 based on how well this vendor would meet the needs described in the query
3. A brief 1-2 sentence description of the venue

Format your response as valid JSON with the following structure:
{
  "enhancedResults": [
    {
      "placeId": "the_place_id",
      "category": "one of the categories listed above",
      "eventSuitabilityScore": number from 1-5,
      "description": "brief description"
    },
    ...
  ]
}
```

## Linear-Inspired UI Elements

### 1. Search Component

- Clean, minimal search input with search icon
- Placeholder text that guides users on natural language queries
- Clear button that appears only when there's input
- No visible submit button - auto-submit on Enter

### 2. Results Component

- Loading state: Subtle skeleton UI with pulse animation
- Results appear with staggered fade-in (feels responsive)
- Each result card shows:
  - Name and rating (top section)
  - Category and price level (subtle, secondary info)
  - Event suitability displayed as a visual progress bar
  - Brief description from Claude
  - Primary action button: "Add to Vendors"

### 3. Visual Design Elements

- Dark mode interface (Background: #0C0C0C, Cards: #141414)
- Subtle borders that lighten on hover (#1F1F1F to #2F2F2F)
- Accent color for interactive elements (#5E6AD2)
- Typography: 15px for titles, 13px for content, proper line height
- Spacing: Consistent 4px grid system (margins and padding divisible by 4)

## Environment Setup

```
# Google Places API (required)
GOOGLE_PLACES_API_KEY=your_google_places_api_key

# AWS Bedrock (required for Claude 3.7)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

## Navigation Integration

- Add "Discover" button in the vendor management navigation
- Use consistent styling with existing navigation
- Include search icon for visual recognition

## Animations & Interactions

- **Search Focus**: Subtle border color shift and shadow effect (100ms)
- **Results Loading**: Skeleton screens with pulse animation
- **Results Appearance**: Staggered fade-in (50ms delay between cards)  
- **Hover States**: Subtle border lightening on hover
- **Button Interactions**: Background color shift on hover

## CSS Design System

### Colors
- Background: #0C0C0C (primary), #141414 (secondary)
- Borders: #1F1F1F (default), #2F2F2F (hover)
- Accent: #5E6AD2 (default), #6872E5 (hover)
- Text: #FFFFFF (primary), #A1A1A1 (secondary)

### Transitions
- Quick transitions: 120ms ease-in-out
- Normal transitions: 200ms ease-in-out

## MVP Implementation Checklist

1. ⬜ Create discovery page skeleton with Linear styling
2. ⬜ Implement Google Places API integration
3. ⬜ Add Claude enhancement function
4. ⬜ Build results display component with Linear-inspired animations
5. ⬜ Add "Add to Vendors" functionality

## Top 3 High-Impact Enhancements

After validating the MVP, these three enhancements will deliver the most value with reasonable implementation effort:

### 1. Event Context Awareness (Highest Impact)

**What**: Enhance Claude's vendor matching by incorporating the user's current event details.

**Why Important**:
- Dramatically improves result relevance (from generic to event-specific)
- Makes recommendations feel personalized to the user's actual needs
- Reduces manual filtering by users

**Implementation**:
- Fetch event context from current event (type, attendees, budget, location)
- Add context data to Claude prompt
- Update suitability scoring to account for specific event factors
- Estimated effort: 1-2 days

### 2. Progressive Loading with Instant Results (Best UX Improvement)

**What**: Show Google Places results immediately, then enhance them with Claude in real-time.

**Why Important**:
- Eliminates waiting (Google results appear in ~200ms vs 2-3s with Claude)
- Creates a delightful experience as results visibly improve before user's eyes
- Graceful degradation if Claude is unavailable

**Implementation**:
- Display raw Google results instantly
- Show subtle "Enhancing results..." indicator
- Apply Claude enhancements progressively as they become available
- Add subtle animations when results update
- Estimated effort: 1 day

### 3. Result Caching (Best Cost-Performance Ratio)

**What**: Cache search results for 24 hours to reduce API costs and improve speed.

**Why Important**:
- Reduces API costs significantly for repeated or similar searches
- Makes the feature much faster for popular queries
- Improves overall system reliability

**Implementation**:
- Add Redis/KV store for caching search results
- Create compound cache keys based on query + event context
- Implement cache hit/miss tracking
- Set up automatic invalidation after 24 hours
- Estimated effort: 4-8 hours

These enhancements are strategically ordered to maximize impact while minimizing implementation effort. They focus on making the feature feel faster, more personalized, and more cost-efficient - three qualities that will transform it from useful to exceptional.

## Implementation Priority

1. ✓ Focus on the core Google Places → Claude pipeline first
2. ✓ Build minimal, functional UI that shows the key value proposition
3. ✓ Ensure error resilience and graceful fallback
4. ✓ Only then move to the top 3 high-impact enhancements 