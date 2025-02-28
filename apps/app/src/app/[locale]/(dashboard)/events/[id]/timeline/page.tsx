import React from 'react';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Event } from "../../../../../../types/events";
import { TimelineBlock, TimelineBlockDbRow } from "../../../../../../types/timeline";
import { TimelineViewVertical } from "../../../../../../components/timeline/timeline-view-vertical";
import { GhostBlockCleanup } from "../../../../../../components/timeline/ghost-block-cleanup";
import { generateDateRange } from "../../../../../../utils/date-utils";

export const metadata = {
  title: "Timeline",
};

/**
 * Normalizes a date string or Date object to YYYY-MM-DD format in local time
 * This ensures consistent date comparison without time/timezone complications
 */
function normalizeDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default async function TimelinePage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies });
  
  // Fetch event data
  const { data: eventData, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("id", params.id)
    .single();
    
  if (eventError || !eventData) {
    console.error("Error fetching event:", eventError);
    return notFound();
  }
  
  // Transform event data to match our TypeScript types
  const event: Event = {
    id: eventData.id,
    name: eventData.name,
    startDate: eventData.start_date,
    endDate: eventData.end_date,
    location: eventData.location,
    status: eventData.status,
    attendeeCount: eventData.attendee_count,
    description: eventData.description,
    type: eventData.type,
    parentEventId: eventData.parent_event_id,
    createdAt: eventData.created_at,
    updatedAt: eventData.updated_at,
  };
  
  // Fetch timeline blocks for the event
  const { data: timelineData, error: timelineError } = await supabase
    .from("timeline_blocks")
    .select("*")
    .eq("event_id", params.id)
    .order("start_time", { ascending: true });
  
  if (timelineError) {
    console.error("Error fetching timeline data:", timelineError);
    return (
      <div className="px-6 py-4">
        <h1 className="text-xl font-semibold mb-4">Timeline</h1>
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-md">
          Error loading timeline data
        </div>
      </div>
    );
  }
  
  // Map timeline blocks to TimelineBlock type
  const timelineBlocks: TimelineBlock[] = timelineData ? timelineData.map((block: TimelineBlockDbRow) => ({
    id: block.id,
    eventId: block.event_id,
    title: block.title,
    startTime: block.start_time,
    endTime: block.end_time,
    location: block.location || '',
    description: block.description || '',
    status: block.status as any, // Type assertion since we know the values
    createdAt: block.created_at,
    updatedAt: block.updated_at,
  })) : [];
  
  // Check for blocks with potential issues in how they render
  const potentialGhostBlocks = timelineBlocks.filter(block => {
    const startTime = new Date(block.startTime);
    const endTime = new Date(block.endTime);
    
    // Check for suspect time issues, including:
    // 1. Start time after end time
    // 2. Start and end time on different days
    // 3. Missing required fields
    return startTime > endTime || 
           normalizeDate(startTime) !== normalizeDate(endTime) ||
           !block.title;
  });
  
  // Generate a complete date range for the event - using normalized dates
  const eventDateRange = generateDateRange(event.startDate, event.endDate);
  
  // Debug to check the calculated date range
  console.log("Event date range:", eventDateRange);
  
  // Group blocks by normalized date
  const blocksByDate: Record<string, TimelineBlock[]> = {};
  
  // Initialize each event date with an empty array
  eventDateRange.forEach(dateStr => {
    blocksByDate[dateStr] = [];
  });
  
  // Map blocks to their dates using normalized dates
  timelineBlocks.forEach(block => {
    // Only process blocks that aren't identified as problematic
    if (!potentialGhostBlocks.includes(block)) {
      const blockDateStr = normalizeDate(block.startTime);
      
      // Only add blocks that fall within the event's date range
      if (eventDateRange.includes(blockDateStr)) {
        blocksByDate[blockDateStr].push(block);
      } else {
        console.log(`Block with date ${blockDateStr} is outside event range`, block);
      }
    }
  });
  
  // Get sorted date entries that have blocks or are part of the event range
  const dateEntries = Object.entries(blocksByDate)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB));

  return (
    <div className="px-6 py-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold mb-1">Timeline</h1>
          <p className="text-gray-400 text-[15px]">
            Timeline for {event.name}
          </p>
        </div>
        <Link 
          href={`/en/events/${params.id}/timeline/add`}
          className="px-3 py-2 bg-[#1E1E1E] hover:bg-[#2A2A2A] text-sm text-white font-medium rounded-md transition-colors duration-120 border border-[#333333] hover:border-[#444444] inline-flex items-center shadow-sm"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Timeline Block
        </Link>
      </div>
      
      {/* Ghost Block Cleanup UI - only shown if ghost blocks detected */}
      {potentialGhostBlocks.length > 0 && (
        <GhostBlockCleanup 
          blocks={potentialGhostBlocks} 
          eventId={params.id}
        />
      )}
      
      {/* Timeline Groups by Date - Display vertical timeline view for each date */}
      <div className="space-y-6">
        {dateEntries.length > 0 ? (
          dateEntries.map(([dateStr, blocks]) => (
            <div key={dateStr} className="border-t border-[#1F1F1F] pt-6 first:border-t-0 first:pt-0">
              <TimelineViewVertical
                blocks={blocks}
                dateKey={dateStr}
                eventId={params.id}
              />
            </div>
          ))
        ) : (
          <div className="bg-[#141414] border border-[#1F1F1F] rounded-md p-6 text-center shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <p className="text-gray-400 mb-4">No timeline blocks added yet</p>
            <Link
              href={`/en/events/${params.id}/timeline/add`}
              className="px-3 py-1.5 bg-[#1E1E1E] hover:bg-[#2A2A2A] text-sm text-gray-400 hover:text-white font-medium rounded transition-colors duration-120 border border-[#333333] inline-flex items-center"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Add your first timeline block
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 