'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TimelineBlock, TimelineBlockStatus } from '../../types/timeline';
import { formatTimeForDisplay } from '@/utils/timezone-utils';
import { cn } from '@v1/ui/cn';

// Define the status styles mapping
const statusStyles = {
  pending: "bg-yellow-500/10 border border-yellow-500/20 text-yellow-500",
  "in-progress": "bg-blue-500/10 border border-blue-500/20 text-blue-500",
  complete: "bg-green-500/10 border border-green-500/20 text-green-500",
  cancelled: "bg-red-500/10 border border-red-500/20 text-red-500",
  draft: "bg-gray-500/10 border border-gray-500/20 text-gray-500"
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
    <div className="w-full rounded-lg bg-[#111111] border border-[#222222] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Header with status indicator */}
      <div className={cn("px-4 py-3 border-b border-[#222222] flex items-center justify-between", 
        statusStyles[block.status as TimelineBlockStatus])}>
        <h3 className="text-[15px] font-medium">{block.title}</h3>
        <span className="text-xs px-2 py-1 rounded-full bg-black/20 capitalize">
          {block.status.replace('-', ' ')}
        </span>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Time */}
        <div className="flex items-center gap-2 text-[14px]">
          <svg className="w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-mono">{timeDisplay}</span>
        </div>
        
        {/* Location */}
        {block.location && (
          <div className="flex items-start gap-2 text-[14px]">
            <svg className="w-4 h-4 mt-0.5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="leading-tight">{block.location}</span>
          </div>
        )}
        
        {/* Personnel */}
        {block.personnel && (
          <div className="flex items-start gap-2 text-[14px]">
            <svg className="w-4 h-4 mt-0.5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="leading-tight">{block.personnel}</span>
          </div>
        )}
        
        {/* Equipment */}
        {block.equipment && (
          <div className="flex items-start gap-2 text-[14px]">
            <svg className="w-4 h-4 mt-0.5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <span className="leading-tight">{block.equipment}</span>
          </div>
        )}
        
        {/* Description */}
        {block.description && (
          <div className="mt-4">
            <h4 className="text-[13px] font-medium text-gray-400 mb-1.5">Description</h4>
            <div className="text-[14px] leading-relaxed p-3 bg-black/20 rounded border border-[#222222]">
              {block.description}
            </div>
          </div>
        )}
        
        {/* Notes */}
        {block.notes && (
          <div className="mt-4">
            <h4 className="text-[13px] font-medium text-gray-400 mb-1.5">Notes</h4>
            <div className="text-[14px] leading-relaxed p-3 bg-black/20 rounded border border-[#222222]">
              {block.notes}
            </div>
          </div>
        )}
        
        {/* Timestamps */}
        <div className="flex justify-between mt-4 pt-4 border-t border-[#222222] text-xs text-gray-500">
          <div>Created: {new Date(block.createdAt).toLocaleDateString()}</div>
          <div>Updated: {new Date(block.updatedAt).toLocaleDateString()}</div>
        </div>
      </div>
      
      {/* Footer with actions - Enhanced with Linear-style interactions */}
      <div className="px-4 py-3 border-t border-[#222222] flex justify-end gap-2 bg-[#0F0F0F]">
        <button
          onClick={onClose}
          onMouseEnter={() => setTimeout(() => setHoveringClose(true), 50)}
          onMouseLeave={() => setHoveringClose(false)}
          className={cn(
            "px-3 py-1.5 rounded-md border border-[#333333] text-[13px] text-gray-300 transition-all duration-150",
            hoveringClose 
              ? "bg-[#1A1A1A] border-[#444444] text-white" 
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
            "px-3 py-1.5 rounded-md text-white text-[13px] transition-all duration-150",
            hoveringEdit 
              ? "bg-[#6872E5] border border-[#8D95F2] shadow-[0_3px_12px_rgba(94,106,210,0.3)]" 
              : "bg-[#5E6AD2] border border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
          )}
        >
          Edit
        </button>
      </div>
    </div>
  );
} 