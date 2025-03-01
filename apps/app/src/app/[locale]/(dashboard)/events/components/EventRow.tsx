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
}

interface EventRowProps {
  event: Event;
  locale: string;
}

export function EventRow({ event, locale }: EventRowProps) {
  const router = useRouter();
  
  const handleRowClick = () => {
    router.push(`/${locale}/events/${event.id}`);
  };

  return (
    <tr 
      onClick={handleRowClick}
      className="border-t border-[#1F1F27] hover:bg-[#1A1A21] transition-colors duration-150 cursor-pointer group relative"
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
        <div className="font-medium text-white group-hover:text-white transition-colors">{event.name}</div>
        {event.description && (
          <div className="text-sm" style={{ color: colors.text.secondary }}>
            {event.description}
          </div>
        )}
      </td>
      <td className="px-4 py-3" style={{ color: colors.text.secondary }}>
        {event.date}
      </td>
      <td className="px-4 py-3" style={{ color: colors.text.secondary }}>
        {event.location}
      </td>
      <td className="px-4 py-3">
        <StatusPill status={event.status} />
      </td>
      
      {/* Linear-style subtle chevron that appears on hover/focus */}
      <td className="w-5 opacity-0 group-hover:opacity-50 focus-within:opacity-50 transition-opacity duration-150">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </td>
    </tr>
  );
} 