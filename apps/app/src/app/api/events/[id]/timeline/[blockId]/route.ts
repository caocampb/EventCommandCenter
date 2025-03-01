import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timelineBlockSchema, updateTimelineBlockSchema } from "../../../../../../lib/validations/timeline-block-schema";

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
      personnel: data.personnel,
      equipment: data.equipment,
      notes: data.notes,
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

// PATCH /api/events/[id]/timeline/[blockId] - Update a specific timeline block
export async function PATCH(
  request: Request,
  { params }: { params: { id: string, blockId: string } }
) {
  try {
    console.log("PATCH /api/events/[id]/timeline/[blockId] - Starting request");
    const eventId = params.id;
    const blockId = params.blockId;
    
    if (!eventId || !blockId) {
      return NextResponse.json(
        { error: "Event ID and Block ID are required" },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    
    console.log("Received update data:", JSON.stringify(body, null, 2));
    
    // Add eventId from route parameter to the body if not present
    if (!body.eventId) {
      body.eventId = eventId;
    }
    
    // Validate the request body using the update schema
    const validationResult = updateTimelineBlockSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.format());
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const validatedData = validationResult.data;
    
    // Prepare update data with snake_case keys
    const updateData: Record<string, any> = {};
    
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.startTime !== undefined) updateData.start_time = validatedData.startTime;
    if (validatedData.endTime !== undefined) updateData.end_time = validatedData.endTime;
    if (validatedData.location !== undefined) updateData.location = validatedData.location;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;
    // Add the new fields
    if (validatedData.personnel !== undefined) updateData.personnel = validatedData.personnel;
    if (validatedData.equipment !== undefined) updateData.equipment = validatedData.equipment;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;
    
    console.log("Update data:", updateData);
    
    // Only perform update if there are fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }
    
    // Update the timeline block
    const { data, error } = await serviceRoleClient
      .from("timeline_blocks")
      .update(updateData)
      .eq("id", blockId)
      .eq("event_id", eventId)
      .select();
    
    if (error) {
      console.error("Error updating timeline block:", error);
      return NextResponse.json(
        { error: "Failed to update timeline block: " + error.message },
        { status: 500 }
      );
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Timeline block not found" },
        { status: 404 }
      );
    }
    
    // Map response to camelCase for frontend
    const updatedBlock = {
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
    
    return NextResponse.json({ data: updatedBlock });
  } catch (error) {
    console.error("Error in timeline block PATCH route:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 