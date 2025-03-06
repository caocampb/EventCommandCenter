'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { TimelineBlock } from "../../types/timeline";
import { formatDateForDisplay, formatTimeForDisplay } from "../../utils/timezone-utils";
import { DetailedTimelineBlockView } from './detailed-timeline-block-view';
import { StatusPill } from '@/components/ui/StatusPill';

// Keep the formatTime function for timeline calculations, but use the utility for display
function formatTime(dateString: string) {
  return formatTimeForDisplay(dateString);
}

// Format date for display using our shared utility
function formatDate(dateString: string) {
  return formatDateForDisplay(dateString);
}

// Check if date is today
function isToday(dateString: string) {
  // Parse the date string to a Date object
  const date = new Date(dateString);
  const today = new Date();
  
  // Compare year, month, and day only
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}

// Get the hour from a date string (as a number 0-23)
function getHour(dateString: string): number {
  return new Date(dateString).getHours();
}

// Mapping helper to convert timeline status to our StatusPill types
function mapStatusToType(status: string): 'confirmed' | 'draft' | 'cancelled' | 'pending' {
  switch (status) {
    case 'confirmed':
      return 'confirmed';
    case 'tentative':
    case 'in-progress':
      return 'pending';
    case 'complete':
      return 'confirmed';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'draft';
  }
}

// Helper to calculate position and width percentages for timeline blocks
function calculateTimePosition(
  startTime: string, 
  endTime: string, 
  dayStartHour: number, 
  dayEndHour: number
) {
  // Create date objects from the strings
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  // Convert to minutes since start of day for more precise calculations
  const startMinutesSinceStartOfDay = (start.getHours() * 60) + start.getMinutes();
  const endMinutesSinceStartOfDay = (end.getHours() * 60) + end.getMinutes();
  
  // Convert day boundary hours to minutes
  const dayStartMinutes = dayStartHour * 60;
  const dayEndMinutes = dayEndHour * 60;
  const totalMinutesInView = dayEndMinutes - dayStartMinutes;
  
  // Calculate position as percentage of total view width
  const startPercentage = ((startMinutesSinceStartOfDay - dayStartMinutes) / totalMinutesInView) * 100;
  const endPercentage = ((endMinutesSinceStartOfDay - dayStartMinutes) / totalMinutesInView) * 100;
  
  // Ensure values are within bounds
  const left = Math.max(0, startPercentage);
  const width = Math.max(1, Math.min(100 - left, endPercentage - startPercentage));
  
  // Debug log for blocks that might have positioning issues
  if (end.getHours() >= 22 || start.getHours() >= 21) {
    console.log('Block positioning calculation:', {
      blockStart: start.toLocaleTimeString(),
      blockEnd: end.toLocaleTimeString(),
      startMinutes: startMinutesSinceStartOfDay,
      endMinutes: endMinutesSinceStartOfDay,
      dayStartMinutes,
      dayEndMinutes,
      totalMinutesInView,
      startPercentage,
      endPercentage,
      left,
      width
    });
  }
  
  return { left, width };
}

// Format time for super compact display (used for narrow blocks)
function formatTimeCompact(dateString: string): string {
  const formatted = formatTime(dateString);
  return formatted.replace(' am', 'a').replace(' pm', 'p');
}

// Get status-specific styles for blocks (using theme CSS variables)
function getStatusStyles(status: string) {
  switch (status) {
    case 'complete':
      return {
        background: `bg-status-confirmed-bg`,
        border: `border-status-confirmed-text/20`,
        hover: `hover:bg-status-confirmed-bg/80 hover:border-status-confirmed-text/30`,
        text: `text-status-confirmed-text`,
        shadow: 'shadow-[0_1px_2px_rgba(0,0,0,0.15)]',
        hoverShadow: 'hover:shadow-[0_2px_8px_rgba(94,68,210,0.2)]'
      };
    case 'in-progress':
      return {
        background: `bg-status-inProgress-bg`,
        border: `border-status-inProgress-text/20`,
        hover: `hover:bg-status-inProgress-bg/80 hover:border-status-inProgress-text/30`,
        text: `text-status-inProgress-text`,
        shadow: 'shadow-[0_1px_2px_rgba(0,0,0,0.15)]',
        hoverShadow: 'hover:shadow-[0_2px_8px_rgba(125,111,255,0.2)]'
      };
    case 'confirmed':
      return {
        background: `bg-status-confirmed-bg`,
        border: `border-status-confirmed-text/20`,
        hover: `hover:bg-status-confirmed-bg/80 hover:border-status-confirmed-text/30`,
        text: `text-status-confirmed-text`,
        shadow: 'shadow-[0_1px_2px_rgba(0,0,0,0.15)]',
        hoverShadow: 'hover:shadow-[0_2px_8px_rgba(16,185,129,0.2)]'
      };
    case 'cancelled':
      return {
        background: `bg-status-cancelled-bg`,
        border: `border-status-cancelled-text/20`,
        hover: `hover:bg-status-cancelled-bg/80 hover:border-status-cancelled-text/30`,
        text: `text-status-cancelled-text`,
        shadow: 'shadow-[0_1px_2px_rgba(0,0,0,0.15)]',
        hoverShadow: 'hover:shadow-[0_2px_8px_rgba(239,68,68,0.2)]'
      };
    default: // pending
      return {
        background: `bg-bg-tertiary`,
        border: `border-status-draft-text/20`,
        hover: `hover:bg-bg-hover hover:border-status-draft-text/30`,
        text: `text-text-secondary`,
        shadow: 'shadow-[0_1px_2px_rgba(0,0,0,0.15)]',
        hoverShadow: 'hover:shadow-[0_2px_8px_rgba(255,255,255,0.05)]'
      };
  }
}

export function TimelineView({ 
  blocks, 
  dateKey, 
  eventId 
}: { 
  blocks: TimelineBlock[]; 
  dateKey: string;
  eventId: string;
}) {
  const [viewType, setViewType] = useState<'visual' | 'list'>('visual');
  const [selectedBlock, setSelectedBlock] = useState<TimelineBlock | null>(null);
  const router = useRouter();
  const hasBlocks = blocks.length > 0;
  
  // Ensure dateKey is in a consistent format for comparison
  const normalizedDateKey = dateKey.includes('T') 
    ? dateKey 
    : `${dateKey}T00:00:00`;
    
  const isCurrentDay = isToday(normalizedDateKey);
  
  // Dynamically calculate time range based on blocks
  const { dayStartHour, dayEndHour, isExpanded } = useMemo(() => {
    // Default range is 6am to 10pm (16 hours)
    let startHour = 6;  // 6am default
    let endHour = 22;   // 10pm default
    let expanded = false;
  
    if (hasBlocks) {
      // Find earliest and latest hours from blocks, considering minutes too
      const startTimes = blocks.map(block => {
        const date = new Date(block.startTime.toString());
        return date.getHours() + (date.getMinutes() / 60);
      });
      
      const endTimes = blocks.map(block => {
        const date = new Date(block.endTime.toString());
        // Add a more generous buffer (0.25 hour = 15 min) to ensure blocks ending near hour boundaries are fully visible
        return date.getHours() + (date.getMinutes() / 60) + 0.25;
      });
      
      const minHour = Math.floor(Math.min(...startTimes));
      // Ensure we have enough space after the last block
      const maxHour = Math.ceil(Math.max(...endTimes)); 
      
      // Debug log to see the actual calculated hours
      console.log('Timeline range calculation:', {
        startTimes,
        endTimes,
        minHour,
        maxHour,
        defaultStartHour: startHour,
        defaultEndHour: endHour,
        blocks: blocks.map(b => ({
          title: b.title,
          start: new Date(b.startTime.toString()).toLocaleTimeString(),
          end: new Date(b.endTime.toString()).toLocaleTimeString(),
          startDecimal: new Date(b.startTime.toString()).getHours() + (new Date(b.startTime.toString()).getMinutes() / 60),
          endDecimal: new Date(b.endTime.toString()).getHours() + (new Date(b.endTime.toString()).getMinutes() / 60)
        }))
      });
      
      // Only expand the range if blocks fall outside default range
      if (minHour < startHour) {
        startHour = Math.max(0, minHour - 1); // Provide 1 hour padding, but not below 0
        expanded = true;
      }
      
      if (maxHour > endHour) {
        // Always ensure we have at least 1 full hour after the latest block
        endHour = Math.min(24, maxHour + 1); 
        expanded = true;
      }
      
      // CRITICAL FIX: Special case for blocks ending between 10pm and 11pm
      // This ensures blocks like 9:30pm-10:30pm are always fully visible
      const hasBlocksEndingAfter10pm = endTimes.some(time => time > 22 && time <= 23);
      if (hasBlocksEndingAfter10pm) {
        console.log('Detected blocks ending between 10pm-11pm, expanding timeline');
        endHour = Math.max(endHour, 23); // Ensure timeline extends to at least 11pm
        expanded = true;
      }
    }
    
    return { dayStartHour: startHour, dayEndHour: endHour, isExpanded: expanded };
  }, [blocks, hasBlocks]);
  
  // Function to handle editing a block
  const handleEditBlock = () => {
    if (selectedBlock) {
      router.push(`/en/events/${eventId}/timeline/${selectedBlock.id}/edit`);
    }
  };
  
  // Function to close the detailed view
  const handleCloseDetailedView = () => {
    setSelectedBlock(null);
  };
  
  return (
    <div className="pb-2">
      {/* Day header - Linear style */}
      <div className="sticky top-0 z-10 py-2 mb-3 -mx-6 px-6 bg-gradient-to-b from-bg-page to-bg-page/95 backdrop-blur-sm">
        <div className="flex justify-between items-center">
          <h2 className="text-[13px] font-medium text-text-secondary">{formatDate(normalizedDateKey)}</h2>
          
          {/* Linear-inspired view toggle */}
          <div className="bg-bg-secondary border border-border-primary p-0.5 rounded-md flex text-sm">
            <button
              onClick={() => setViewType('visual')}
              className={`px-2.5 py-1 rounded ${
                viewType === 'visual' 
                  ? 'bg-bg-tertiary text-text-primary' 
                  : 'text-text-tertiary hover:text-text-secondary'
              } transition-colors duration-120`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </button>
            <button
              onClick={() => setViewType('list')}
              className={`px-2.5 py-1 rounded ${
                viewType === 'list' 
                  ? 'bg-bg-tertiary text-text-primary' 
                  : 'text-text-tertiary hover:text-text-secondary'
              } transition-colors duration-120`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
              
      {/* Visual timeline - Linear style (shown when viewType is 'visual') */}
      {viewType === 'visual' && (
        <div className="mb-6 border border-border-primary rounded-md bg-bg-secondary p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          {/* Expanded range indicator */}
          {isExpanded && (
            <div className="mb-2 text-xs text-text-tertiary flex items-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              Timeline range expanded to show all blocks
            </div>
          )}
        
          {/* Time scale header - dynamically generated based on calculated range */}
          <div className="flex border-b border-border-primary pb-2 mb-4">
            {Array.from({ length: dayEndHour - dayStartHour + 1 }, (_, i) => i + dayStartHour).map((hour) => (
              <div key={hour} className="flex-1 text-center">
                <span className="text-[10px] font-mono text-text-tertiary">
                  {hour % 12 === 0 ? '12' : hour % 12}{hour < 12 ? 'am' : 'pm'}
                </span>
              </div>
            ))}
          </div>
          
          {/* Timeline blocks visualized */}
          <div className="relative h-auto min-h-[100px]">
            {hasBlocks ? (
              blocks.map((block) => {
                const { left, width } = calculateTimePosition(
                  block.startTime.toString(), 
                  block.endTime.toString(),
                  dayStartHour,
                  dayEndHour
                );
                
                // Get status-specific styling
                const styles = getStatusStyles(block.status as string);
                
                // Format times in a more compact way for small blocks
                const startFormatted = formatTime(block.startTime.toString());
                const endFormatted = formatTime(block.endTime.toString());
                
                // Create a more compact time format for very narrow blocks
                const compactStartTime = formatTimeCompact(block.startTime.toString());
                const compactEndTime = formatTimeCompact(block.endTime.toString());
                
                return (
                  <div 
                    key={block.id}
                    onClick={() => setSelectedBlock(block)}
                    className="absolute group hover:z-10 cursor-pointer"
                    style={{ 
                      left: `${left}%`, 
                      width: `${width}%`,
                      top: '0.25rem',
                      height: 'calc(100% - 0.5rem)'
                    }}
                  >
                    {/* Density-aware block rendering */}
                    {width < 8 ? (
                      // Ultra-compact mode for very narrow blocks
                      <div className={`
                        h-full rounded-md border-l-2 ${styles.border.replace('border', 'border-l')} 
                        ${styles.background} hover:shadow-sm hover:scale-[1.02] 
                        transition-all duration-100 ease-out transform origin-left
                      `}>
                        <div className="h-full flex items-center py-1 px-1.5">
                          <span className="text-[10px] font-medium truncate">{block.title}</span>
                        </div>
                        {/* Hover card with more details */}
                        <div className="opacity-0 group-hover:opacity-100 absolute -right-1 top-0 z-20 pointer-events-none
                            bg-[#1A1A1A] border border-[#333] rounded-md shadow-xl p-2 w-48 transition-opacity duration-150">
                          <p className="font-medium text-[13px] mb-1">{block.title}</p>
                          <div className="flex items-center text-xs text-gray-400 mb-1">
                            <svg className="w-3 h-3 mr-1.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <path d="M12 6v6l4 2"/>
                            </svg>
                            <span className="font-mono">{startFormatted} – {endFormatted}</span>
                          </div>
                          {block.description && (
                            <p className="text-[11px] text-gray-400">{block.description}</p>
                          )}
                        </div>
                      </div>
                    ) : width < 15 ? (
                      // Compact mode for narrow blocks
                      <div className={`
                        h-full rounded-md ${styles.background} border ${styles.border} 
                        hover:shadow-sm transition-all duration-100 ease-out
                        flex flex-col p-1.5
                      `}>
                        <div className="font-medium text-[11px] truncate mb-auto">{block.title}</div>
                        <div className="flex items-center text-[9px] font-mono text-gray-500">
                          <span>{compactStartTime}</span>
                        </div>
                      </div>
                    ) : (
                      // Standard mode for regular blocks
                      <div className={`
                        h-full rounded-md ${styles.background} border ${styles.border}
                        ${styles.hover} px-2 py-1.5 transition-all duration-150 ease-out
                        overflow-hidden flex flex-col justify-between
                        hover:shadow-md group-hover:translate-y-[-1px]
                        ${styles.shadow}
                      `}>
                        <div className="flex items-start justify-between mb-0.5">
                          <h3 className="text-[12px] font-medium truncate mr-1">{block.title}</h3>
                          {width > 22 && (
                            <StatusPill status={mapStatusToType(block.status as string)} />
                          )}
                        </div>
                        
                        {width > 22 && block.description && (
                          <p className="text-[10px] text-gray-400 line-clamp-1 mb-auto">
                            {block.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 mt-auto">
                          <span>{width > 20 ? startFormatted : compactStartTime}</span>
                          {width > 15 && <span className="mx-0.5">–</span>}
                          {width > 15 && <span>{width > 20 ? endFormatted : compactEndTime}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              // Empty state for visual view when date has no blocks - consistent with list view
              <div className="flex items-center justify-center h-full min-h-[80px]">
                <p className="text-text-tertiary text-sm mb-3">No timeline blocks scheduled for this day</p>
                <Link
                  href={`/en/events/${eventId}/timeline/add`}
                  className="px-3 py-1.5 bg-bg-tertiary hover:bg-bg-hover text-sm text-text-tertiary hover:text-text-primary font-medium rounded transition-colors duration-120 border border-border-primary inline-flex items-center ml-4"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  Add Block
                </Link>
              </div>
            )}
            
            {/* Current time indicator (Linear-style) - ONLY shown for current day */}
            {isCurrentDay && (
              <div className="absolute top-0 bottom-0 border-l-2 border-primary-default z-10" 
                    style={{ 
                      left: `${(() => {
                        const now = new Date();
                        const nowMinutes = (now.getHours() * 60) + now.getMinutes();
                        const dayStartMinutes = dayStartHour * 60;
                        const dayEndMinutes = dayEndHour * 60;
                        const totalMinutesInView = dayEndMinutes - dayStartMinutes;
                        
                        return Math.max(0, Math.min(100, ((nowMinutes - dayStartMinutes) / totalMinutesInView) * 100));
                      })()}%`
                    }}>
                <div className="h-2.5 w-2.5 rounded-full bg-primary-default relative -left-[5px] -top-1"></div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Standard list view - (shown when viewType is 'list') */}
      {viewType === 'list' && (
        <div className="space-y-1.5">
          {hasBlocks ? (
            blocks.map((block) => {
              // Get status-specific styling
              const styles = getStatusStyles(block.status as string);
              
              return (
                <div 
                  key={block.id} 
                  className={`border rounded-md overflow-hidden shadow-md hover:shadow-lg transition-all duration-150 group relative
                    ${styles.background} ${styles.border} ${styles.hover} ${styles.shadow} ${styles.hoverShadow}`}
                >
                  <div className="px-4 py-3">
                    {/* Title row with integrated status */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="text-[14px] font-medium text-text-primary truncate">{block.title}</h3>
                        <StatusPill status={mapStatusToType(block.status as string)} />
                      </div>
                      
                      {/* Edit button - always positioned consistently */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <Link 
                          href={`/en/events/${eventId}/timeline/${block.id}/edit`} 
                          className="flex items-center justify-center w-6 h-6 rounded text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </Link>
                      </div>
                    </div>
                    
                    {/* Content row */}
                    {block.description && (
                      <p className="text-[13px] text-text-tertiary mb-2 line-clamp-2">{block.description}</p>
                    )}
                    
                    {/* Metadata row */}
                    <div className="flex items-center text-[13px] text-text-tertiary gap-3">
                      <div className="font-mono">
                        {formatTime(block.startTime.toString())} – {formatTime(block.endTime.toString())}
                      </div>
                      
                      {block.location && (
                        <div className="flex items-center gap-1 text-[12px]">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          {block.location}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            // Empty state for list view when date has no blocks
            <div className="border border-border-primary bg-bg-secondary rounded-md p-4 text-center">
              <p className="text-text-tertiary text-sm mb-3">No timeline blocks scheduled for this day</p>
              <Link
                href={`/en/events/${eventId}/timeline/add`}
                className="px-3 py-1.5 bg-bg-tertiary hover:bg-bg-hover text-sm text-text-tertiary hover:text-text-primary font-medium rounded transition-colors duration-120 border border-border-primary inline-flex items-center"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Add Block
              </Link>
            </div>
          )}
        </div>
      )}
      
      {/* Detailed Timeline Block View Modal */}
      {selectedBlock && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200">
            <DetailedTimelineBlockView 
              block={selectedBlock} 
              onClose={handleCloseDetailedView} 
              onEdit={handleEditBlock} 
            />
          </div>
        </div>
      )}
    </div>
  );
} 