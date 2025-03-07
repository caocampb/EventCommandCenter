import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { eventParticipantSchema } from "@/lib/validations/participant-schema";
import { ParticipantDbRow } from "@/types/participant";

// Supabase service role client for bypassing RLS
// Use hardcoded values directly from .env for development
const SUPABASE_URL = "http://127.0.0.1:55321";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

// Create a Supabase client with the service role key
const serviceRoleClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY
);

/**
 * GET /api/events/[id]/participants
 * Get all participants for an event
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // No need to check auth status when using service role client
    // Service role bypasses RLS
    
    const eventId = params.id;
    
    // First, check if the event exists
    const { data: eventData, error: eventError } = await serviceRoleClient
      .from("events")
      .select("id")
      .eq("id", eventId)
      .single();
    
    if (eventError || !eventData) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    // Get participants for this event with their status
    const { data, error } = await serviceRoleClient
      .from("event_participants")
      .select(`
        id, 
        status, 
        notes,
        created_at,
        updated_at,
        participants (*)
      `)
      .eq("event_id", eventId);
    
    if (error) {
      console.error("Error fetching event participants:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Transform the data to our app types
    const participants = data.map(item => {
      // Cast to the right type
      const participant = item.participants as unknown as ParticipantDbRow;
      
      return {
        id: item.id,
        eventId: eventId,
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
    
    return NextResponse.json({ data: participants }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error in GET /api/events/[id]/participants:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events/[id]/participants
 * Add a participant to an event
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // No need to check auth status when using service role client
    // Service role bypasses RLS
    
    const eventId = params.id;
    
    // First, check if the event exists
    const { data: eventData, error: eventError } = await serviceRoleClient
      .from("events")
      .select("id")
      .eq("id", eventId)
      .single();
    
    if (eventError || !eventData) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    // Parse and validate request body
    const body = await req.json();
    
    // For bulk import, handle array of participants
    if (Array.isArray(body)) {
      // Simple validation for bulk import
      if (!body.length) {
        return NextResponse.json(
          { error: "No participants provided" },
          { status: 400 }
        );
      }
      
      // Validate each participant minimally
      const participants = body.map(p => ({
        name: p.name,
        email: p.email,
        organization: p.organization || null,
        role: p.role || null,
        dietary_requirements: p.dietaryRequirements || null,
        accessibility_needs: p.accessibilityNeeds || null,
        notes: p.notes || null
      }));
      
      // First, insert all participants that don't exist yet
      const { error: participantsError } = await serviceRoleClient
        .from("participants")
        .upsert(participants, { 
          onConflict: 'email'
        });
      
      if (participantsError) {
        console.error("Error creating participants:", participantsError);
        return NextResponse.json({ error: participantsError.message }, { status: 500 });
      }
      
      // Get the inserted participants by email
      const emails = participants.map(p => p.email);
      
      const { data: insertedParticipants, error: fetchError } = await serviceRoleClient
        .from("participants")
        .select("id, email")
        .in("email", emails);
      
      if (fetchError) {
        console.error("Error fetching inserted participants:", fetchError);
        return NextResponse.json({ error: fetchError.message }, { status: 500 });
      }
      
      // Create a map of email to id
      const emailToIdMap = new Map();
      insertedParticipants.forEach(p => {
        emailToIdMap.set(p.email, p.id);
      });
      
      // Create event_participants entries
      const eventParticipants = emails.map(email => ({
        event_id: eventId,
        participant_id: emailToIdMap.get(email),
        status: 'pending'
      }));
      
      // Insert the event-participant relationships
      const { error: relationError } = await serviceRoleClient
        .from("event_participants")
        .upsert(eventParticipants, {
          onConflict: 'event_id,participant_id'
        });
      
      if (relationError) {
        console.error("Error creating event-participant relationships:", relationError);
        return NextResponse.json({ error: relationError.message }, { status: 500 });
      }
      
      // Return success
      return NextResponse.json(
        { 
          message: `Added ${emails.length} participants to event`,
          count: emails.length
        }, 
        { status: 201 }
      );
    } 
    // For single participant
    else {
      // If participantId is provided, just add the relationship
      if (body.participantId) {
        const validatedData = eventParticipantSchema.parse({
          ...body,
          eventId: eventId
        });
        
        // Add the event-participant relationship
        const { data, error } = await serviceRoleClient
          .from("event_participants")
          .insert({
            event_id: eventId,
            participant_id: validatedData.participantId,
            status: validatedData.status,
            notes: validatedData.notes || null
          })
          .select(`
            id, 
            status, 
            notes,
            created_at,
            updated_at,
            participants (*)
          `)
          .single();
        
        if (error) {
          console.error("Error creating event-participant relationship:", error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        
        // Cast to proper type
        const participant = data.participants as unknown as ParticipantDbRow;
        
        // Transform to our app types
        const result = {
          id: data.id,
          eventId: eventId,
          participantId: participant.id,
          status: data.status,
          notes: data.notes || undefined,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
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
        
        return NextResponse.json({ data: result }, { status: 201 });
      }
      // If creating a new participant and adding to event
      else {
        // First, validate and create the participant
        const participantData = {
          name: body.name,
          email: body.email,
          organization: body.organization || null,
          role: body.role || null,
          dietary_requirements: body.dietaryRequirements || null,
          accessibility_needs: body.accessibilityNeeds || null,
          notes: body.notes || null
        };
        
        // Insert or update the participant
        const { data: participant, error: participantError } = await serviceRoleClient
          .from("participants")
          .upsert(participantData, { onConflict: 'email' })
          .select()
          .single();
        
        if (participantError) {
          console.error("Error creating participant:", participantError);
          return NextResponse.json({ error: participantError.message }, { status: 500 });
        }
        
        // Now add the event-participant relationship
        const { data: relationship, error: relationshipError } = await serviceRoleClient
          .from("event_participants")
          .insert({
            event_id: eventId,
            participant_id: participant.id,
            status: body.status || 'pending',
            notes: body.relationshipNotes || null
          })
          .select()
          .single();
        
        if (relationshipError) {
          console.error("Error creating event-participant relationship:", relationshipError);
          return NextResponse.json({ error: relationshipError.message }, { status: 500 });
        }
        
        // Return the result
        const result = {
          id: relationship.id,
          eventId: eventId,
          participantId: participant.id,
          status: relationship.status,
          notes: relationship.notes || undefined,
          createdAt: relationship.created_at,
          updatedAt: relationship.updated_at,
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
        
        return NextResponse.json({ data: result }, { status: 201 });
      }
    }
  } catch (error) {
    console.error("Unexpected error in POST /api/events/[id]/participants:", error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events/[id]/participants?participantId=xxx
 * Remove a participant from an event
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // No need to check auth status when using service role client
    // Service role bypasses RLS
    
    const eventId = params.id;
    const { searchParams } = new URL(req.url);
    const participantId = searchParams.get('participantId');
    
    if (!participantId) {
      return NextResponse.json(
        { error: "Participant ID is required" },
        { status: 400 }
      );
    }
    
    // Delete the event-participant relationship
    const { error } = await serviceRoleClient
      .from("event_participants")
      .delete()
      .eq("event_id", eventId)
      .eq("participant_id", participantId);
    
    if (error) {
      console.error("Error removing participant from event:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(
      { message: "Participant removed from event" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error in DELETE /api/events/[id]/participants:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 