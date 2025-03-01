import React from 'react';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Event } from "../../../../../../types/events";
import { ParticipantsList } from "../../../../../../components/participants/participants-list";
import { ParticipantDbRow } from "../../../../../../types/participant";
import { AddParticipantButton } from "../../../../../../components/participants/add-participant-button";

export const metadata = {
  title: "Participants",
};

export default async function ParticipantsPage({ params }: { params: { id: string } }) {
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

  // Fetch participants data
  const { data: participantsData, error: participantsError } = await supabase
    .from("event_participants")
    .select(`
      id, 
      status, 
      notes,
      created_at,
      updated_at,
      participants (*)
    `)
    .eq("event_id", params.id);
  
  if (participantsError) {
    console.error("Error fetching participants:", participantsError);
    return (
      <div className="px-6 py-4">
        <h1 className="text-xl font-semibold mb-4">Participants</h1>
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-md">
          Error loading participants data
        </div>
      </div>
    );
  }
  
  // Transform the participants data
  const participants = participantsData.map(item => {
    // Cast to the right type to fix TS errors
    const participant = item.participants as unknown as ParticipantDbRow;
    
    return {
      id: item.id,
      eventId: params.id,
      participantId: participant.id,
      status: item.status,
      notes: item.notes || undefined,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      participant: {
        id: participant.id,
        name: participant.name,
        email: participant.email,
        organization: participant.organization || undefined,
        role: participant.role || undefined,
        dietaryRequirements: participant.dietary_requirements || undefined,
        accessibilityNeeds: participant.accessibility_needs || undefined,
        notes: participant.notes || undefined,
        createdAt: participant.created_at,
        updatedAt: participant.updated_at,
      }
    };
  });
  
  return (
    <div className="px-6 py-4">
      {/* Header with back button */}
      <div className="mb-6">
        <Link 
          href={`/en/events/${params.id}`} 
          className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-3 transition-colors duration-120"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1.5">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to event
        </Link>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold mb-1">Participants</h1>
            <p className="text-gray-400 text-[15px]">
              Manage participants for {event.name}
            </p>
          </div>
          <div>
            {/* Add Participant Button - Linear-inspired minimal style */}
            <AddParticipantButton 
              eventId={params.id}
            />
          </div>
        </div>
      </div>
      
      {/* Participants List */}
      <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-md p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <ParticipantsList 
          eventId={params.id} 
          initialParticipants={participants}
        />
      </div>
    </div>
  );
} 