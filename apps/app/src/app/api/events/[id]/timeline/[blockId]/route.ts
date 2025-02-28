import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timelineBlockSchema } from "../../../../../../lib/validations/timeline-block-schema";

// Supabase service role client for bypassing RLS
// Use hardcoded values directly from .env for development
const SUPABASE_URL = "http://127.0.0.1:54321";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const serviceRoleClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY
);

// GET /api/events/[id]/timeline/[blockId] - Get a specific timeline block
export async function GET(
  request: Request,
  { params }: { params: { id: string, blockId: string } }
) {
  try {
    console.log("GET /api/events/[id]/timeline/[blockId] - Starting request");
    const eventId = params.id;
    const blockId = params.blockId;
    
    if (!eventId || !blockId) {
      return NextResponse.json(
        { error: "Event ID and Block ID are required" },
        { status: 400 }
      );
    }

    // Fetch the specific timeline block
    const { data, error } = await serviceRoleClient
      .from("timeline_blocks")
      .select("*")
      .eq("id", blockId)
      .eq("event_id", eventId)
      .single();
      
    if (error) {
      console.error("Error fetching timeline block:", error);
      return NextResponse.json(
        { error: "Failed to fetch timeline block: " + error.message },
        { status: 500 }
      );
    }
    
    if (!data) {
      return NextResponse.json(
        { error: "Timeline block not found" },
        { status: 404 }
      );
    }
    
    // Map column names to camelCase for frontend
    const timelineBlock = {
      id: data.id,
      eventId: data.event_id,
      title: data.title,
      startTime: data.start_time,
      endTime: data.end_time,
      location: data.location,
      description: data.description,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
    
    return NextResponse.json({ data: timelineBlock });
  } catch (error) {
    console.error("Error in timeline block GET route:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id]/timeline/[blockId] - Delete a specific timeline block
export async function DELETE(
  request: Request,
  { params }: { params: { id: string, blockId: string } }
) {
  try {
    console.log("DELETE /api/events/[id]/timeline/[blockId] - Starting request");
    const eventId = params.id;
    const blockId = params.blockId;
    
    if (!eventId || !blockId) {
      return NextResponse.json(
        { error: "Event ID and Block ID are required" },
        { status: 400 }
      );
    }

    console.log(`Attempting to delete timeline block ${blockId} from event ${eventId}`);
    
    // Delete the timeline block
    const { error } = await serviceRoleClient
      .from("timeline_blocks")
      .delete()
      .eq("id", blockId)
      .eq("event_id", eventId);
      
    if (error) {
      console.error("Error deleting timeline block:", error);
      return NextResponse.json(
        { error: "Failed to delete timeline block: " + error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, message: "Timeline block deleted successfully" });
  } catch (error) {
    console.error("Error in timeline block DELETE route:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 