'use client';

import { StatusPill, StatusType } from '@/components/ui/StatusPill';
import { colors } from '@/styles/colors';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface Event {
  id: string;
  name: string;
  description?: string;
  date: string;
  location: string;
  status: StatusType;
  attendeeCount?: number;
}

interface EventRowProps {
  event: Event;
  locale: string;
}

// Helper function to calculate days until event
function getDaysUntil(dateString: string): number {
  const today = new Date();
  const eventDate = new Date(dateString);
  const diffTime = eventDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Helper function to check if event is upcoming
function isUpcoming(dateString: string): boolean {
  const today = new Date();
  const eventDate = new Date(dateString);
  const diffDays = getDaysUntil(dateString);
  return diffDays > 0 && diffDays <= 30; // Show indicator for events within 30 days
}

export function EventRow({ event, locale }: EventRowProps) {
  const router = useRouter();
  
  // Days until event (for upcoming events)
  const daysUntil = getDaysUntil(event.date);
  const showDaysIndicator = isUpcoming(event.date);
  
  const handleRowClick = () => {
    router.push(`/${locale}/events/${event.id}`);
  };

  // Handle action button clicks without triggering row click
  const handleTimelineClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/${locale}/events/${event.id}/timeline`);
  };

  const handleVendorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/${locale}/events/${event.id}/vendors`);
  };

  return (
    <tr 
      onClick={handleRowClick}
      className="interactive-row border-b border-theme-border-subtle hover:bg-theme-hover-row hover:border-theme-border-strong focus:bg-theme-hover-row transition-all duration-200 cursor-pointer group relative"
      tabIndex={0}
      role="link"
      aria-label={`View details for ${event.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleRowClick();
        }
      }}
    >
      <td className="px-4 py-3">
        <div className="font-medium text-theme-text-primary transition-colors">{event.name}</div>
        {event.description && (
          <div className="text-sm text-theme-text-secondary">
            {event.description}
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-theme-text-secondary">
        {event.date}
        {/* Date-based visual indicator */}
        {showDaysIndicator && (
          <span 
            className={`ml-2 text-[10px] py-0.5 px-1.5 rounded-sm inline-flex items-center
              ${daysUntil <= 7 
                ? 'bg-theme-status-pending-bg text-theme-status-pending-text' 
                : 'bg-theme-status-draft-bg text-theme-status-draft-text'}`}
          >
            {daysUntil}d
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        {/* Capacity indicators */}
        <div className="flex flex-col">
          <div className="text-theme-text-secondary">{event.location}</div>
          {event.attendeeCount && event.attendeeCount > 0 && (
            <div className="flex items-center text-xs mt-0.5 text-theme-text-tertiary">
              <svg className="mr-1" width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {event.attendeeCount}
            </div>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <StatusPill status={event.status} />
      </td>
      
      {/* Context-aware quick actions */}
      <td className="opacity-0 group-hover:opacity-100 pr-2 transition-opacity duration-50">
        <div className="flex space-x-1">
          <button 
            className="p-1 rounded hover:bg-theme-hover-button transition-colors duration-150"
            onClick={handleTimelineClick}
            aria-label="Go to timeline"
            title="Timeline"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.5" />
              <line x1="9" y1="2" x2="9" y2="6" stroke="currentColor" strokeWidth="1.5" />
              <line x1="15" y1="2" x2="15" y2="6" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
          <button 
            className="p-1 rounded hover:bg-theme-hover-button transition-colors duration-150"
            onClick={handleVendorClick}
            aria-label="Manage vendors"
            title="Vendors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </td>
      
      {/* Linear-style subtle chevron that appears on hover/focus */}
      <td className="w-5 opacity-0 group-hover:opacity-40 focus-within:opacity-40 transition-opacity duration-50">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </td>
    </tr>
  );
} 