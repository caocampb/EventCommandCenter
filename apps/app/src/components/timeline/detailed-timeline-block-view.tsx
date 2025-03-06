'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TimelineBlock, TimelineBlockStatus } from '../../types/timeline';
import { formatTimeForDisplay } from '@/utils/timezone-utils';
import { cn } from '@v1/ui/cn';

// Define the status styles mapping using CSS variables
const statusTagStyles = {
  pending: {
    bg: 'var(--status-pending-bg)',
    text: 'var(--status-pending-text)',
    border: 'var(--status-pending-text)',
    tailwind: {
      bg: 'bg-status-pending-bg',
      text: 'text-status-pending-text',
    }
  },
  "in-progress": {
    bg: 'var(--status-inProgress-bg)',
    text: 'var(--status-inProgress-text)',
    border: 'var(--status-inProgress-text)',
    tailwind: {
      bg: 'bg-status-inProgress-bg',
      text: 'text-status-inProgress-text',
    }
  },
  complete: {
    bg: 'var(--status-confirmed-bg)',
    text: 'var(--status-confirmed-text)',
    border: 'var(--status-confirmed-text)',
    tailwind: {
      bg: 'bg-status-confirmed-bg',
      text: 'text-status-confirmed-text',
    }
  },
  confirmed: {
    bg: 'var(--status-confirmed-bg)',
    text: 'var(--status-confirmed-text)',
    border: 'var(--status-confirmed-text)',
    tailwind: {
      bg: 'bg-status-confirmed-bg',
      text: 'text-status-confirmed-text',
    }
  },
  cancelled: {
    bg: 'var(--status-cancelled-bg)',
    text: 'var(--status-cancelled-text)',
    border: 'var(--status-cancelled-text)',
    tailwind: {
      bg: 'bg-status-cancelled-bg',
      text: 'text-status-cancelled-text',
    }
  },
  draft: {
    bg: 'var(--status-draft-bg)',
    text: 'var(--status-draft-text)',
    border: 'var(--status-draft-text)',
    tailwind: {
      bg: 'bg-status-draft-bg',
      text: 'text-status-draft-text',
    }
  }
};

interface DetailedTimelineBlockViewProps {
  block: TimelineBlock;
  onClose: () => void;
  onEdit: () => void;
}

export function DetailedTimelineBlockView({ 
  block, 
  onClose, 
  onEdit 
}: DetailedTimelineBlockViewProps) {
  const router = useRouter();
  
  // Format the start and end times for display - convert to string if Date objects
  const displayStartTime = formatTimeForDisplay(block.startTime.toString());
  const displayEndTime = formatTimeForDisplay(block.endTime.toString());
  const timeDisplay = `${displayStartTime} — ${displayEndTime}`;
  
  // Linear-style hover state tracking for buttons
  const [hoveringClose, setHoveringClose] = useState(false);
  const [hoveringEdit, setHoveringEdit] = useState(false);
  
  return (
    <div className="w-full rounded-lg bg-bg-secondary border border-border-primary overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Header with status indicator */}
      <div className="px-4 py-3 border-b border-border-primary flex items-center justify-between"
        style={{
          backgroundColor: statusTagStyles[block.status as keyof typeof statusTagStyles]?.bg || statusTagStyles.pending.bg,
        }}
      >
        <h3 className="text-[15px] font-medium">{block.title}</h3>
        <span 
          className="text-xs px-2 py-1 rounded-full capitalize"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            color: statusTagStyles[block.status as keyof typeof statusTagStyles]?.text || statusTagStyles.pending.text,
            borderColor: statusTagStyles[block.status as keyof typeof statusTagStyles]?.border || statusTagStyles.pending.border
          }}
        >
          {block.status.replace('-', ' ')}
        </span>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Time */}
        <div className="flex items-center gap-2 text-[14px]">
          <svg className="w-4 h-4 text-text-tertiary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-mono">{timeDisplay}</span>
        </div>
        
        {/* Location */}
        {block.location && (
          <div className="flex items-start gap-2 text-[14px]">
            <svg className="w-4 h-4 mt-0.5 text-text-tertiary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="leading-tight">{block.location}</span>
          </div>
        )}
        
        {/* Personnel */}
        {block.personnel && (
          <div className="flex items-start gap-2 text-[14px]">
            <svg className="w-4 h-4 mt-0.5 text-text-tertiary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="leading-tight">{block.personnel}</span>
          </div>
        )}
        
        {/* Equipment */}
        {block.equipment && (
          <div className="flex items-start gap-2 text-[14px]">
            <svg className="w-4 h-4 mt-0.5 text-text-tertiary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <span className="leading-tight">{block.equipment}</span>
          </div>
        )}
        
        {/* Description */}
        {block.description && (
          <div className="mt-4">
            <h4 className="text-[13px] font-medium text-text-tertiary mb-1.5">Description</h4>
            <div className="text-[14px] leading-relaxed p-3 bg-bg-page/20 rounded border border-border-primary">
              {block.description}
            </div>
          </div>
        )}
        
        {/* Notes */}
        {block.notes && (
          <div className="mt-4">
            <h4 className="text-[13px] font-medium text-text-tertiary mb-1.5">Notes</h4>
            <div className="text-[14px] leading-relaxed p-3 bg-bg-page/20 rounded border border-border-primary">
              {block.notes}
            </div>
          </div>
        )}
        
        {/* Timestamps */}
        <div className="flex justify-between mt-4 pt-4 border-t border-border-primary text-xs text-text-tertiary">
          <div>Created: {new Date(block.createdAt).toLocaleDateString()}</div>
          <div>Updated: {new Date(block.updatedAt).toLocaleDateString()}</div>
        </div>
      </div>
      
      {/* Footer with actions - Enhanced with Linear-style interactions */}
      <div className="px-4 py-3 border-t border-border-primary flex justify-end gap-2 bg-bg-page">
        <button
          onClick={onClose}
          onMouseEnter={() => setTimeout(() => setHoveringClose(true), 50)}
          onMouseLeave={() => setHoveringClose(false)}
          className={cn(
            "px-3 py-1.5 rounded-md border border-border-primary text-[13px] text-text-secondary transition-all duration-150",
            hoveringClose 
              ? "bg-bg-tertiary border-border-strong text-text-primary" 
              : "bg-transparent"
          )}
        >
          Close
        </button>
        <button
          onClick={onEdit}
          onMouseEnter={() => setTimeout(() => setHoveringEdit(true), 50)}
          onMouseLeave={() => setHoveringEdit(false)}
          className={cn(
            "px-3 py-1.5 rounded-md text-text-primary text-[13px] transition-all duration-150",
            hoveringEdit 
              ? "bg-primary-hover border border-primary-active shadow-[0_3px_12px_rgba(94,106,210,0.3)]" 
              : "bg-primary-default border border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
          )}
        >
          Edit
        </button>
      </div>
    </div>
  );
} 