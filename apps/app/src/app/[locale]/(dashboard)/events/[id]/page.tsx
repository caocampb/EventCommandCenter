import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Event } from "@/types/events";
import EventDetailClient from "@/components/events/event-detail-client";

export default async function EventDetailPage({ params }: { params: { id: string } }) {
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

  return <EventDetailClient event={event} />;
} 