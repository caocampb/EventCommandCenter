'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TimelineBlock } from '../../types/timeline';
import { formatTimeForDisplay, formatDateForDisplay } from '../../utils/timezone-utils';

interface TimelineViewVerticalProps {
  blocks: TimelineBlock[];
  dateKey: string;
  eventId: string;
}

// Simple, reliable timeline grid config
const HOUR_HEIGHT = 128; // Increased from 80px to 128px for better spacing
const MIN_BLOCK_HEIGHT = 32; // Exactly 15 minutes worth of height (1/4 of HOUR_HEIGHT)

// Default time range
const DEFAULT_START_HOUR = 8; // 8am
const DEFAULT_END_HOUR = 20;  // 8pm

/**
 * Extracts hours from a timestamp string, consistently handling
 * timezone issues by directly parsing the timestamp.
 */
function extractHoursFromTimestamp(timestamp: string): number {
  // Directly extract hours from timestamp string to avoid timezone issues
  try {
    // Handle ISO format like "2023-02-28T12:30:00.000Z"
    // Extract the hours directly from the string
    if (typeof timestamp === 'string' && 
        (timestamp.endsWith('Z') || timestamp.includes('+00:00'))) {
      const hoursStr = timestamp.substring(11, 13);
      return parseInt(hoursStr, 10);
    }
    
    // Fallback to Date object for other formats
    const date = new Date(timestamp);
    return date.getHours();
  } catch (e) {
    console.error("Error extracting hours:", e);
    return 0;
  }
}

/**
 * Extracts minutes from a timestamp string, consistently handling
 * timezone issues by directly parsing the timestamp.
 */
function extractMinutesFromTimestamp(timestamp: string): number {
  try {
    // Handle ISO format
    if (typeof timestamp === 'string' && 
        (timestamp.endsWith('Z') || timestamp.includes('+00:00'))) {
      const minutesStr = timestamp.substring(14, 16);
      return parseInt(minutesStr, 10);
    }
    
    // Fallback to Date object
    const date = new Date(timestamp);
    return date.getMinutes();
  } catch (e) {
    console.error("Error extracting minutes:", e);
    return 0;
  }
}

function TimelineBlockVertical({ 
  block, 
  eventId, 
  startHour
}: { 
  block: TimelineBlock; 
  eventId: string;
  startHour: number;
}) {
  // Format time for display
  const displayStartTime = formatTimeForDisplay(block.startTime.toString());
  const displayEndTime = formatTimeForDisplay(block.endTime.toString());
  
  // Extract time components directly from timestamp strings to avoid timezone issues
  const startHours = extractHoursFromTimestamp(block.startTime.toString());
  const startMinutes = extractMinutesFromTimestamp(block.startTime.toString());
  const endHours = extractHoursFromTimestamp(block.endTime.toString());
  const endMinutes = extractMinutesFromTimestamp(block.endTime.toString());
  
  // Calculate decimal hours for positioning
  const startHourDecimal = startHours + (startMinutes / 60);
  const endHourDecimal = endHours + (endMinutes / 60);
  
  // Position calculation relative to startHour
  const top = Math.max(0, Math.round((startHourDecimal - startHour) * HOUR_HEIGHT));
  
  // Calculate true proportional height - this is the key fix
  const height = Math.round((endHourDecimal - startHourDecimal) * HOUR_HEIGHT);
  
  // Determine duration for formatting decisions
  const durationMinutes = (endHourDecimal - startHourDecimal) * 60;
  const isShortBlock = durationMinutes <= 30;
  const isMediumBlock = durationMinutes > 30 && durationMinutes < 60;
  const isVeryShortBlock = durationMinutes <= 15;
  
  // Format time display based on duration
  let timeDisplay = '';
  if (isVeryShortBlock) {
    // Ultra-compact format for very short blocks
    const minutes = durationMinutes === 15 ? '15m' : `${Math.round(durationMinutes)}m`;
    timeDisplay = `${displayStartTime.replace(' am', 'a').replace(' pm', 'p')} (${minutes})`;
  } else if (isShortBlock) {
    // For 30 min blocks, show compact time range
    // Convert times to more compact format (e.g., "12:00-12:30")
    const compactStart = displayStartTime.replace(' am', '').replace(' pm', '');
    const compactEnd = displayEndTime.replace(' am', '').replace(' pm', '');
    const startAmPm = displayStartTime.includes('am') ? 'a' : 'p';
    const endAmPm = displayEndTime.includes('am') ? 'a' : 'p';
    
    if (startAmPm === endAmPm) {
      // Same AM/PM - only show it once at the end
      timeDisplay = `${compactStart}-${compactEnd}${startAmPm}`;
    } else {
      // Different AM/PM - show both
      timeDisplay = `${compactStart}${startAmPm}-${compactEnd}${endAmPm}`;
    }
  } else {
    // Standard format for longer blocks
    timeDisplay = `${displayStartTime} — ${displayEndTime}`;
  }
  
  // Status styling
  const getStyles = () => {
    switch (block.status as string) {
      case 'complete':
        return {
          bg: 'bg-[#1A184A]',
          border: 'border-purple-600/20',
          indicator: 'bg-purple-500'
        };
      case 'in-progress':
        return {
          bg: 'bg-[#0E253A]',
          border: 'border-blue-600/20',
          indicator: 'bg-blue-500'
        };
      case 'confirmed':
        return {
          bg: 'bg-[#0E2920]',
          border: 'border-emerald-600/20',
          indicator: 'bg-emerald-500'
        };
      case 'cancelled':
        return {
          bg: 'bg-[#2C1616]',
          border: 'border-red-600/20',
          indicator: 'bg-red-500'
        };
      default: // pending
        return {
          bg: 'bg-[#1C1C1C]',
          border: 'border-gray-600/20',
          indicator: 'bg-gray-500'
        };
    }
  };
  
  const styles = getStyles();
  
  return (
    <Link
      href={`/en/events/${eventId}/timeline/${block.id}/edit`}
      className="absolute left-0 right-0 group hover:z-20"
      style={{ 
        top: `${top}px`, 
        height: `${height}px`,
        zIndex: 10
      }}
    >
      <div className={`h-full ${styles.bg} border ${styles.border} px-3 flex flex-col shadow-sm hover:shadow transition-all duration-150`}>
        {isShortBlock ? (
          // Compact layout for short blocks (≤30 min)
          <div className="flex justify-between items-center h-full">
            <div className="flex items-center gap-1.5 max-w-[50%]">
              <div className={`w-2 h-2 rounded-full ${styles.indicator}`}></div>
              <h3 className="text-[13px] font-medium text-white truncate">{block.title}</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-gray-400">{timeDisplay}</span>
              <span className="text-[10px] font-medium text-gray-400 bg-gray-800/50 px-1.5 py-0.5 rounded border border-gray-700/30">
                {block.status}
              </span>
            </div>
          </div>
        ) : isMediumBlock ? (
          // Medium layout for blocks between 30min and 1 hour
          <div className="flex flex-col h-full justify-between py-1">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-1.5 max-w-[50%]">
                <div className={`w-2 h-2 rounded-full ${styles.indicator}`}></div>
                <h3 className="text-[13px] font-medium text-white truncate">{block.title}</h3>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-mono text-gray-400">{timeDisplay}</span>
                <span className="text-[10px] font-medium text-gray-400 bg-gray-800/50 px-1.5 py-0.5 rounded border border-gray-700/30 mt-0.5">
                  {block.status}
                </span>
              </div>
            </div>
          </div>
        ) : (
          // Standard layout for longer blocks
          <>
            <div className="flex items-start justify-between gap-2 mt-1">
              <div className="flex items-center gap-1.5 max-w-[50%]">
                <div className={`w-2 h-2 rounded-full ${styles.indicator}`}></div>
                <h3 className="text-[13px] font-medium text-white truncate">{block.title}</h3>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-mono text-gray-500">{timeDisplay}</span>
                <span className="text-[10px] font-medium text-gray-400 bg-gray-800/50 px-1.5 py-0.5 rounded border border-gray-700/30 mt-0.5">
                  {block.status}
                </span>
              </div>
            </div>
            
            {block.location && (
              <div className="flex flex-col text-[11px] mt-auto mb-1">
                <span className="text-gray-400 mb-0.5 flex items-center">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1 opacity-70">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span className="truncate">{block.location}</span>
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </Link>
  );
}

export function TimelineViewVertical({ blocks, dateKey, eventId }: TimelineViewVerticalProps) {
  // Default time range for the timeline (8am to 8pm by default)
  const [startHour, setStartHour] = useState(DEFAULT_START_HOUR);
  const [endHour, setEndHour] = useState(DEFAULT_END_HOUR);
  
  // Format date for display
  const formattedDate = formatDateForDisplay(
    dateKey.includes('T') ? dateKey : `${dateKey}T00:00:00`
  );
  
  // Auto-adjust time range based on blocks
  useEffect(() => {
    if (blocks.length === 0) {
      // If no blocks, use default range
      setStartHour(DEFAULT_START_HOUR);
      setEndHour(DEFAULT_END_HOUR);
      return;
    }
    
    // Find earliest and latest hours in blocks
    const allHours: number[] = [];
    
    blocks.forEach(block => {
      // Extract hours directly from timestamp strings
      const startHour = extractHoursFromTimestamp(block.startTime.toString());
      const endHour = extractHoursFromTimestamp(block.endTime.toString());
      const endMinutes = extractMinutesFromTimestamp(block.endTime.toString());
      
      // Add the hours to our collection
      allHours.push(startHour);
      
      // If the end time has minutes, include the next hour
      const adjustedEndHour = endHour + (endMinutes > 0 ? 1 : 0);
      allHours.push(adjustedEndHour);
    });
    
    // Find min and max
    const earliestBlockHour = Math.min(...allHours);
    const latestBlockHour = Math.max(...allHours);
    
    // Use default range unless blocks fall outside it
    const adjustedStartHour = earliestBlockHour < DEFAULT_START_HOUR 
      ? Math.max(0, earliestBlockHour - 1) // Add 1 hour padding if outside default
      : DEFAULT_START_HOUR;
      
    const adjustedEndHour = latestBlockHour > DEFAULT_END_HOUR
      ? Math.min(24, latestBlockHour + 1) // Add 1 hour padding if outside default
      : DEFAULT_END_HOUR;
    
    console.log('Timeline hours range:', { 
      allHours,
      earliestBlockHour,
      latestBlockHour,
      adjustedStartHour,
      adjustedEndHour,
      blockCount: blocks.length
    });
    
    setStartHour(adjustedStartHour);
    setEndHour(adjustedEndHour);
  }, [blocks]);

  // No blocks state
  if (blocks.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-[14px] font-medium pt-2">
          {formattedDate}
        </div>
        
        <div className="bg-[#141414] border border-[#1F1F1F] rounded-md p-6 text-center">
          <p className="text-gray-400 mb-4">No timeline blocks scheduled for this day</p>
          <Link
            href={`/en/events/${eventId}/timeline/add`}
            className="px-3 py-1.5 bg-[#1E1E1E] hover:bg-[#2A2A2A] text-sm text-gray-400 hover:text-white font-medium rounded border border-[#333333] inline-flex items-center"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Add Block
          </Link>
        </div>
      </div>
    );
  }

  // Calculate timeline height based on the hours range
  const displayedHours = endHour - startHour;
  const timelineHeight = displayedHours * HOUR_HEIGHT;

  // Generate all hour markers for the range
  const hourMarkers = [];
  for (let i = 0; i <= displayedHours; i++) {
    const hour = startHour + i;
    const isPastNoon = hour >= 12;
    const display12Hour = hour % 12 || 12;
    const ampm = isPastNoon ? 'pm' : 'am';
    
    hourMarkers.push({
      hour,
      displayHour: `${display12Hour}${ampm}`,
      isCurrent: new Date().getHours() === hour
    });
  }

  return (
    <div className="space-y-4">
      {/* Day header */}
      <div className="text-[14px] font-medium pt-2">
        {formattedDate}
      </div>
      
      {/* Timeline grid */}
      <div className="bg-[#141414] border border-[#1F1F1F] rounded-md overflow-hidden">
        <div className="flex" style={{ height: `${timelineHeight}px` }}>
          {/* Time markers column */}
          <div className="w-16 flex-shrink-0 border-r border-[#1F1F1F] bg-[#131313]">
            {hourMarkers.map(({ hour, displayHour, isCurrent }, index) => (
              <div 
                key={hour} 
                className="flex items-center justify-center border-t border-[#1F1F1F]"
                style={{ 
                  height: `${HOUR_HEIGHT}px`,
                  backgroundColor: isCurrent ? 'rgba(26, 24, 74, 0.1)' : ''
                }}
              >
                <span className={`text-[10px] font-mono ${isCurrent ? 'text-[#5E6AD2]' : 'text-gray-500'}`}>
                  {displayHour}
                </span>
                {isCurrent && <div className="w-1 h-1 rounded-full bg-[#5E6AD2] ml-1"></div>}
              </div>
            ))}
          </div>
          
          {/* Blocks area */}
          <div className="flex-1 relative">
            {/* Hour grid lines */}
            {hourMarkers.map(({ hour, isCurrent }, index) => (
              <div 
                key={`grid-${hour}`} 
                className={`absolute left-0 right-0 border-t ${isCurrent ? 'border-[#5E6AD2]/20' : 'border-[#1F1F1F]'}`}
                style={{ top: `${index * HOUR_HEIGHT}px` }}
              />
            ))}
            
            {/* Half-hour grid lines */}
            {Array.from({ length: displayedHours }).map((_, index) => (
              <div 
                key={`half-${index}`} 
                className="absolute left-0 right-0 border-t border-[#1F1F1F]/30"
                style={{ top: `${index * HOUR_HEIGHT + HOUR_HEIGHT/2}px` }}
              />
            ))}
            
            {/* Current time indicator */}
            {isToday(dateKey) && <CurrentTimeIndicator startHour={startHour} />}
            
            {/* Timeline blocks */}
            {blocks.map(block => (
              <TimelineBlockVertical
                key={block.id}
                block={block}
                eventId={eventId}
                startHour={startHour}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper: check if date is today
function isToday(date: string): boolean {
  const today = new Date();
  const compareDate = new Date(date);
  
  return (
    today.getFullYear() === compareDate.getFullYear() &&
    today.getMonth() === compareDate.getMonth() &&
    today.getDate() === compareDate.getDate()
  );
}

// Current time indicator
function CurrentTimeIndicator({ startHour }: { startHour: number }) {
  const [position, setPosition] = useState(0);
  
  useEffect(() => {
    function updatePosition() {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentDecimal = currentHour + (currentMinute / 60);
      const pos = Math.round((currentDecimal - startHour) * HOUR_HEIGHT);
      setPosition(Math.max(0, pos));
    }
    
    updatePosition();
    const interval = setInterval(updatePosition, 60000);
    return () => clearInterval(interval);
  }, [startHour]);
  
  return (
    <div 
      className="absolute left-0 right-0 z-20 pointer-events-none"
      style={{ top: `${position}px` }}
    >
      <div className="flex items-center">
        <div className="h-3 w-3 rounded-full bg-[#5E6AD2] relative -left-1.5"></div>
        <div className="flex-1 border-t border-dashed border-[#5E6AD2]"></div>
      </div>
    </div>
  );
} 