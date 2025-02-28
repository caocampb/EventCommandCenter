'use client';

import React, { useState, useMemo } from 'react';
import Link from "next/link";
import { TimelineBlock } from "../../types/timeline";
import { formatDateForDisplay, formatTimeForDisplay } from "../../utils/timezone-utils";

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

// Status badge component - reused from other views with Linear styling
function StatusBadge({ status }: { status: string }) {
  const getStatusStyles = () => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15';
      case 'in-progress':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/15';
      case 'complete':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/15';
      case 'cancelled':
        return 'bg-red-500/10 text-red-400 border-red-500/15';
      default: // pending
        return 'bg-gray-600/10 text-gray-400 border-gray-500/15';
    }
  };

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide border ${getStatusStyles()}`}>
      {status}
    </span>
  );
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

// Get status-specific styles for blocks (Linear-inspired color palette)
function getStatusStyles(status: string) {
  switch (status) {
    case 'complete':
      return {
        background: 'bg-[#1A184A]',
        border: 'border-purple-600/20',
        hover: 'hover:bg-[#201C54] hover:border-purple-500/30',
        text: 'text-purple-300',
        shadow: 'shadow-[0_1px_2px_rgba(0,0,0,0.15)]',
        hoverShadow: 'hover:shadow-[0_2px_8px_rgba(94,68,210,0.2)]'
      };
    case 'in-progress':
      return {
        background: 'bg-[#0E253A]',
        border: 'border-blue-600/20',
        hover: 'hover:bg-[#132C45] hover:border-blue-500/30',
        text: 'text-blue-300',
        shadow: 'shadow-[0_1px_2px_rgba(0,0,0,0.15)]',
        hoverShadow: 'hover:shadow-[0_2px_8px_rgba(58,130,246,0.2)]'
      };
    case 'confirmed':
      return {
        background: 'bg-[#0E2920]',
        border: 'border-emerald-600/20',
        hover: 'hover:bg-[#123328] hover:border-emerald-500/30',
        text: 'text-emerald-300',
        shadow: 'shadow-[0_1px_2px_rgba(0,0,0,0.15)]',
        hoverShadow: 'hover:shadow-[0_2px_8px_rgba(16,185,129,0.2)]'
      };
    case 'cancelled':
      return {
        background: 'bg-[#2C1616]',
        border: 'border-red-600/20',
        hover: 'hover:bg-[#351A1A] hover:border-red-500/30',
        text: 'text-red-300',
        shadow: 'shadow-[0_1px_2px_rgba(0,0,0,0.15)]',
        hoverShadow: 'hover:shadow-[0_2px_8px_rgba(239,68,68,0.2)]'
      };
    default: // pending
      return {
        background: 'bg-[#1C1C1C]',
        border: 'border-gray-600/20',
        hover: 'hover:bg-[#222222] hover:border-gray-500/30',
        text: 'text-gray-300',
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
  
  return (
    <div className="pb-2">
      {/* Day header - Linear style */}
      <div className="sticky top-0 z-10 py-2 mb-3 -mx-6 px-6 bg-gradient-to-b from-[#0F0F0F] to-[#0F0F0F]/95 backdrop-blur-sm">
        <div className="flex justify-between items-center">
          <h2 className="text-[13px] font-medium text-gray-300">{formatDate(normalizedDateKey)}</h2>
          
          {/* Linear-inspired view toggle */}
          <div className="bg-[#141414] border border-[#1F1F1F] p-0.5 rounded-md flex text-sm">
            <button
              onClick={() => setViewType('visual')}
              className={`px-2.5 py-1 rounded ${
                viewType === 'visual' 
                  ? 'bg-[#1E1E1E] text-white' 
                  : 'text-gray-400 hover:text-gray-300'
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
                  ? 'bg-[#1E1E1E] text-white' 
                  : 'text-gray-400 hover:text-gray-300'
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
        <div className="mb-6 border border-[#1F1F1F] rounded-md bg-[#141414] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          {/* Expanded range indicator */}
          {isExpanded && (
            <div className="mb-2 text-xs text-gray-500 flex items-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              Timeline range expanded to show all blocks
            </div>
          )}
        
          {/* Time scale header - dynamically generated based on calculated range */}
          <div className="flex border-b border-[#1F1F1F] pb-2 mb-4">
            {Array.from({ length: dayEndHour - dayStartHour + 1 }, (_, i) => i + dayStartHour).map((hour) => (
              <div key={hour} className="flex-1 text-center">
                <span className="text-[10px] font-mono text-gray-500">
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
                  <Link 
                    key={block.id}
                    href={`/en/events/${eventId}/timeline/${block.id}/edit`}
                    className="absolute group hover:z-10"
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
                            <StatusBadge status={block.status} />
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
                  </Link>
                );
              })
            ) : (
              // Empty state for visual view when date has no blocks - consistent with list view
              <div className="flex items-center justify-center h-full min-h-[80px]">
                <p className="text-gray-400 text-sm mb-3">No timeline blocks scheduled for this day</p>
                <Link
                  href={`/en/events/${eventId}/timeline/add`}
                  className="px-3 py-1.5 bg-[#1E1E1E] hover:bg-[#2A2A2A] text-sm text-gray-400 hover:text-white font-medium rounded transition-colors duration-120 border border-[#333333] inline-flex items-center ml-4"
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
              <div className="absolute top-0 bottom-0 border-l-2 border-[#5E6AD2] z-10" 
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
                <div className="h-2.5 w-2.5 rounded-full bg-[#5E6AD2] relative -left-[5px] -top-1"></div>
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
                        <h3 className="text-[14px] font-medium text-white truncate">{block.title}</h3>
                        <StatusBadge status={block.status} />
                      </div>
                      
                      {/* Edit button - always positioned consistently */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <Link 
                          href={`/en/events/${eventId}/timeline/${block.id}/edit`} 
                          className="flex items-center justify-center w-6 h-6 rounded text-gray-400 hover:text-white hover:bg-[#2A2A2A]"
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
                      <p className="text-[13px] text-gray-400 mb-2 line-clamp-2">{block.description}</p>
                    )}
                    
                    {/* Metadata row */}
                    <div className="flex items-center text-[13px] text-gray-500 gap-3">
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
            <div className="border border-[#1F1F1F] bg-[#141414] rounded-md p-4 text-center">
              <p className="text-gray-400 text-sm mb-3">No timeline blocks scheduled for this day</p>
              <Link
                href={`/en/events/${eventId}/timeline/add`}
                className="px-3 py-1.5 bg-[#1E1E1E] hover:bg-[#2A2A2A] text-sm text-gray-400 hover:text-white font-medium rounded transition-colors duration-120 border border-[#333333] inline-flex items-center"
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
    </div>
  );
} 