'use client';

import Link from 'next/link';

interface PageHeaderProps {
  eventId: string;
  eventName: string;
}

export function PageHeader({ eventId, eventName }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <Link 
          href={`/en/events/${eventId}`}
          className="inline-flex items-center text-sm text-text-tertiary hover:text-text-primary transition-colors duration-150"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1.5">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to event
        </Link>
        
        <Link
          href="/en/budget"
          className="inline-flex items-center text-sm text-text-tertiary hover:text-text-primary transition-colors duration-150"
        >
          View all budgets
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-1.5">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>
      
      <h1 className="text-xl font-semibold tracking-tight mb-1 text-text-primary">Budget for {eventName}</h1>
      <p className="text-sm text-text-tertiary">Manage your event budget</p>
    </div>
  );
} 