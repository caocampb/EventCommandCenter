import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { 
  timelineBlockSchema, 
  timelineBlockSchema15Min,
  TimePrecision 
} from "../../../../../lib/validations/timeline-block-schema";
import { TimelineBlockDbRow } from "../../../../../types/timeline";

// Supabase service role client for bypassing RLS
// Use hardcoded values directly from .env for development
const SUPABASE_URL = "http://127.0.0.1:55321";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const serviceRoleClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY
);

// GET /api/events/[id]/timeline - Get all timeline blocks for an event
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("GET /api/events/[id]/timeline - Starting request");
    const eventId = params.id;
    
    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    // Fetch timeline blocks for the event
    const { data, error } = await serviceRoleClient
      .from("timeline_blocks")
      .select("*")
      .eq("event_id", eventId)
      .order("start_time", { ascending: true });
      
    console.log("GET timeline blocks response:", { data, error });
      
    if (error) {
      console.error("Error fetching timeline blocks:", error);
      return NextResponse.json(
        { error: "Failed to fetch timeline blocks: " + error.message },
        { status: 500 }
      );
    }
    
    // If no data or empty array, return empty array
    if (!data || data.length === 0) {
      return NextResponse.json({ data: [] });
    }
    
    // Map column names to camelCase for frontend
    const timelineBlocks = data.map((block: TimelineBlockDbRow) => ({
      id: block.id,
      eventId: block.event_id,
      title: block.title,
      startTime: block.start_time,
      endTime: block.end_time,
      location: block.location,
      description: block.description,
      status: block.status,
      personnel: block.personnel,
      equipment: block.equipment,
      notes: block.notes,
      createdAt: block.created_at,
      updatedAt: block.updated_at,
    }));
    
    return NextResponse.json({ data: timelineBlocks });
  } catch (error) {
    console.error("Error in timeline blocks GET route:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/timeline - Create a new timeline block
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("POST /api/events/[id]/timeline - Starting request");
    const eventId = params.id;
    
    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    
    console.log("Received timeline block data:", JSON.stringify(body, null, 2));
    
    // Add eventId from route parameter to the body
    body.eventId = eventId;
    
    // Determine which schema to use based on precision
    const precision = body.precision as TimePrecision;
    const schema = precision === '15min' ? timelineBlockSchema15Min : timelineBlockSchema;
    
    console.log(`Using ${precision} precision for validation`);
    
    const validationResult = schema.safeParse(body);
    
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.format());
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const validatedData = validationResult.data;
    
    // Map camelCase to snake_case for database columns
    const { data, error } = await serviceRoleClient
      .from("timeline_blocks")
      .insert({
        event_id: validatedData.eventId,
        title: validatedData.title,
        start_time: validatedData.startTime,
        end_time: validatedData.endTime,
        location: validatedData.location,
        description: validatedData.description,
        status: validatedData.status,
        personnel: validatedData.personnel,
        equipment: validatedData.equipment,
        notes: validatedData.notes,
      })
      .select();
    
    console.log("Insert response:", { data, error });
      
    if (error) {
      console.error("Error creating timeline block:", error);
      return NextResponse.json(
        { error: "Failed to create timeline block: " + error.message },
        { status: 500 }
      );
    }
    
    if (!data || data.length === 0) {
      console.error("No data returned after insert");
      return NextResponse.json(
        { error: "Failed to create timeline block" },
        { status: 500 }
      );
    }
    
    // Map response to camelCase for frontend
    const createdBlock = {
      id: data[0].id,
      eventId: data[0].event_id,
      title: data[0].title,
      startTime: data[0].start_time,
      endTime: data[0].end_time,
      location: data[0].location,
      description: data[0].description,
      status: data[0].status,
      personnel: data[0].personnel,
      equipment: data[0].equipment,
      notes: data[0].notes,
      createdAt: data[0].created_at,
      updatedAt: data[0].updated_at,
    };
    
    return NextResponse.json({ data: createdBlock }, { status: 201 });
  } catch (error) {
    console.error("Error in timeline blocks POST route:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// DELETE operation has been moved to [blockId]/route.ts
// Remove the DELETE function from this file to avoid conflicts 