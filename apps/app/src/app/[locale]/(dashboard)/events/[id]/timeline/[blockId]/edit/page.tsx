import React from 'react';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Event } from "../../../../../../../../types/events";
import { TimelineBlock } from "../../../../../../../../types/timeline";
import { EditTimelineBlockForm } from "../../../../../../../../components/timeline/edit-timeline-block-form";

export const metadata = {
  title: "Edit Timeline Block",
};

export default async function EditTimelineBlockPage({ params }: { params: { id: string, blockId: string } }) {
  const supabase = createServerComponentClient({ cookies });
  
  // Fetch event data to ensure it exists and to display event info
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
  
  // Fetch the timeline block data
  const { data: blockData, error: blockError } = await supabase
    .from("timeline_blocks")
    .select("*")
    .eq("id", params.blockId)
    .eq("event_id", params.id)
    .single();
  
  if (blockError || !blockData) {
    return notFound();
  }
  
  // Transform block data to match our TypeScript types
  const block: TimelineBlock = {
    id: blockData.id,
    eventId: blockData.event_id,
    title: blockData.title,
    startTime: blockData.start_time,
    endTime: blockData.end_time,
    location: blockData.location,
    description: blockData.description,
    status: blockData.status,
    createdAt: blockData.created_at,
    updatedAt: blockData.updated_at,
  };

  return (
    <div className="px-6 py-6">
      {/* Header with back button */}
      <div className="mb-8">
        <Link 
          href={`/en/events/${event.id}/timeline`} 
          className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4 transition-colors duration-120"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1.5">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to timeline
        </Link>
        
        <h1 className="text-xl font-semibold tracking-tight mb-2">Edit Timeline Block</h1>
        <p className="text-gray-400 text-[15px]">
          Edit timeline block for {event.name}
        </p>
      </div>
      
      <div className="border-t border-[#1F1F1F] pt-8">
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1">
            <EditTimelineBlockForm 
              eventId={event.id} 
              blockId={params.blockId}
              block={block}
            />
          </div>
          
          {/* Tips sidebar */}
          <div className="w-full lg:w-72 space-y-5">
            <div className="bg-[#141414] border border-[#1F1F1F] rounded-md p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
              <h3 className="text-[13px] font-medium uppercase tracking-wider text-gray-400 mb-3">
                Quick Tips
              </h3>
              <ul className="space-y-3 text-[13px] text-gray-400">
                <li className="flex gap-2.5 items-start">
                  <span className="text-[#5E6AD2] text-xs mt-0.5">●</span>
                  <span>Timeline blocks must be aligned to 30-minute intervals by default</span>
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="text-[#5E6AD2] text-xs mt-0.5">●</span>
                  <span>Switch to 15-minute precision for more granular scheduling</span>
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="text-[#5E6AD2] text-xs mt-0.5">●</span>
                  <span>Use the delete button to remove this block completely</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 