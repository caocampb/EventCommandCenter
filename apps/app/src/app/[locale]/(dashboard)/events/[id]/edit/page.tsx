import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import React from 'react';
import { Event } from "@/types/events";
import { CreateEventForm } from "@/components/events/create-event-form";

export const metadata = {
  title: "Edit Event",
};

export default async function EditEventPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies });
  
  // Fetch event data
  const { data: eventData, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", params.id)
    .single();
    
  if (error || !eventData) {
    return notFound();
  }
  
  // Transform data to match our TypeScript types
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

  // Debug log the event data
  console.log("Edit page - event data:", JSON.stringify(event, null, 2));

  // Convert dates to strings to match the form's expected types
  const eventForForm = {
    ...event,
    startDate: typeof event.startDate === 'object' ? event.startDate.toISOString() : event.startDate,
    endDate: typeof event.endDate === 'object' ? event.endDate.toISOString() : event.endDate,
    createdAt: typeof event.createdAt === 'object' ? event.createdAt.toISOString() : event.createdAt,
    updatedAt: typeof event.updatedAt === 'object' ? event.updatedAt.toISOString() : event.updatedAt
  };

  return (
    <div className="w-full max-w-6xl px-6 py-6">
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
        
        <h1 className="text-xl font-semibold tracking-tight mb-2">Edit Event</h1>
        <p className="text-gray-400 text-[15px]">
          Update the details for "{event.name}"
        </p>
      </div>
    
      <div className="border-t border-[#1F1F1F] pt-8">
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1">
            <CreateEventForm event={eventForForm} mode="edit" />
          </div>
          
          {/* Tips sidebar - helpful for users without cluttering the UI */}
          <div className="w-full lg:w-72 space-y-5">
            <div className="bg-[#141414] border border-[#1F1F1F] rounded-md p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
              <h3 className="text-[13px] font-medium uppercase tracking-wider text-gray-400 mb-3">
                Quick Tips
              </h3>
              <ul className="space-y-3 text-[13px] text-gray-400">
                <li className="flex gap-2.5 items-start">
                  <span className="text-[#5E6AD2] text-xs mt-0.5">●</span>
                  <span>Changing dates will not automatically update timeline blocks</span>
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="text-[#5E6AD2] text-xs mt-0.5">●</span>
                  <span>All fields are required except for Description</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 