import React from 'react';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Event } from "../../../../../../types/events";
import { TimelineBlock, TimelineBlockDbRow } from "../../../../../../types/timeline";

export const metadata = {
  title: "Event Timeline",
};

export default async function TimelinePage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies });
  
  // Fetch event data
  const { data: eventData, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("id", params.id)
    .single();
    
  if (eventError || !eventData) {
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
  
  // Handle error fetching timeline blocks (don't fail, just show empty)
  const timelineBlocks: TimelineBlock[] = timelineData && !timelineError
    ? timelineData.map((block: TimelineBlockDbRow) => ({
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
      }))
    : [];

  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="px-6 py-6">
      {/* Header with back button */}
      <div className="mb-8">
        <Link 
          href={`/events/${event.id}`} 
          className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4 transition-colors duration-120"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1.5">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to event
        </Link>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-semibold tracking-tight mb-2">{event.name} Timeline</h1>
            <p className="text-gray-400 text-[15px]">
              {new Date(event.startDate.toString()).toLocaleDateString()} - {new Date(event.endDate.toString()).toLocaleDateString()}
            </p>
          </div>
          
          <Link 
            href={`/events/${event.id}/timeline/add`}
            className="px-3 py-1.5 bg-[#5E6AD2] hover:bg-[#6872E5] text-white text-sm font-medium rounded border border-transparent hover:border-[#8D95F2] transition-colors duration-120 shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-[0_3px_12px_rgba(94,106,210,0.2)]"
          >
            Add Block
          </Link>
        </div>
      </div>
      
      {/* Timeline content */}
      <div className="border border-[#1F1F1F] rounded-md overflow-hidden bg-[#141414] shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
        {timelineBlocks.length > 0 ? (
          <div className="divide-y divide-[#1F1F1F]">
            {timelineBlocks.map((block) => (
              <div 
                key={block.id} 
                className="p-4 hover:bg-[#181818] transition-colors duration-120"
              >
                <div className="flex items-start">
                  {/* Time column */}
                  <div className="w-32 flex-shrink-0">
                    <div className="text-[13px] font-mono font-medium text-gray-300">
                      {formatTime(block.startTime.toString())} - {formatTime(block.endTime.toString())}
                    </div>
                  </div>
                  
                  {/* Content column */}
                  <div className="flex-1">
                    <div className="font-medium text-[15px] mb-1">{block.title}</div>
                    {block.location && (
                      <div className="text-[13px] text-gray-400 mb-2">
                        Location: {block.location}
                      </div>
                    )}
                    {block.description && (
                      <div className="text-[13px] text-gray-400 mt-2 leading-relaxed">
                        {block.description}
                      </div>
                    )}
                  </div>
                  
                  {/* Status column */}
                  <div className="ml-4 flex-shrink-0">
                    <span 
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tracking-wide border
                        ${block.status === 'pending' ? 'bg-gray-600/15 text-gray-300 border-gray-500/30' : ''}
                        ${block.status === 'in-progress' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : ''}
                        ${block.status === 'complete' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : ''}
                        ${block.status === 'cancelled' ? 'bg-red-500/10 text-red-500 border-red-500/20' : ''}
                      `}
                    >
                      {block.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4 text-gray-500">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
              <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" />
              <line x1="9" y1="2" x2="9" y2="6" stroke="currentColor" strokeWidth="2" />
              <line x1="15" y1="2" x2="15" y2="6" stroke="currentColor" strokeWidth="2" />
            </svg>
            <p className="text-gray-400 font-medium mb-1">No timeline blocks yet</p>
            <p className="text-gray-500 text-sm max-w-md">
              Create your first timeline block to start planning this event.
              Timeline blocks help you organize your event schedule in 30-minute increments.
            </p>
            <Link 
              href={`/events/${event.id}/timeline/add`}
              className="mt-4 px-3 py-1.5 bg-[#1E1E1E] hover:bg-[#2A2A2A] text-sm border border-[#333333] rounded transition-colors duration-120"
            >
              Create First Block
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 