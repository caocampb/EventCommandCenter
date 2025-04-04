import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { eventSchema } from "@/lib/validations/event-schema";

// Supabase service role client for bypassing RLS
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

const serviceRoleClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY
);

// GET /api/events/[id] - Get a single event
export async function GET(
  request: Request, 
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }
    
    const { data, error } = await serviceRoleClient
      .from("events")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) {
      console.error("Error fetching event:", error);
      return NextResponse.json(
        { error: "Failed to fetch event: " + error.message },
        { status: 500 }
      );
    }
    
    if (!data) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }
    
    // Map response to camelCase for frontend
    const event = {
      id: data.id,
      name: data.name,
      startDate: data.start_date,
      endDate: data.end_date,
      location: data.location,
      status: data.status,
      attendeeCount: data.attendee_count,
      description: data.description,
      type: data.type,
      parentEventId: data.parent_event_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
    
    return NextResponse.json({ data: event });
  } catch (error) {
    console.error("Error in event GET route:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// PATCH /api/events/[id] - Update an event
export async function PATCH(
  request: Request, 
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log("PATCH request received for event ID:", id);
    
    if (!id) {
      console.error("No event ID provided in params");
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    console.log("PATCH: Received event data:", JSON.stringify(body, null, 2));
    
    // Special case for total_budget - we don't need full validation
    if (body.total_budget !== undefined && Object.keys(body).length === 1) {
      console.log("PATCH: Updating total_budget to:", body.total_budget);
      
      const { data, error } = await serviceRoleClient
        .from("events")
        .update({
          total_budget: body.total_budget,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select();
      
      if (error) {
        console.error("PATCH: Error updating event budget:", error);
        return NextResponse.json(
          { error: "Failed to update event budget: " + error.message },
          { status: 500 }
        );
      }
      
      if (!data || data.length === 0) {
        console.error("PATCH: No data returned after budget update");
        return NextResponse.json(
          { error: "Event not found" },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ 
        data: {
          id: data[0].id,
          totalBudget: data[0].total_budget
        },
        success: true
      });
    }
    
    // Special case for status-only update - we don't need full validation
    if (body.status !== undefined && Object.keys(body).length === 1) {
      console.log("PATCH: Updating status to:", body.status);
      
      // Validate that status is one of the allowed values
      const validStatus = ['draft', 'confirmed', 'in-progress', 'completed', 'cancelled'].includes(body.status);
      
      if (!validStatus) {
        console.error("PATCH: Invalid status value:", body.status);
        return NextResponse.json(
          { error: "Invalid status value. Allowed values are: draft, confirmed, in-progress, completed, cancelled" },
          { status: 400 }
        );
      }
      
      const { data, error } = await serviceRoleClient
        .from("events")
        .update({
          status: body.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select();
      
      if (error) {
        console.error("PATCH: Error updating event status:", error);
        return NextResponse.json(
          { error: "Failed to update event status: " + error.message },
          { status: 500 }
        );
      }
      
      if (!data || data.length === 0) {
        console.error("PATCH: No data returned after status update");
        return NextResponse.json(
          { error: "Event not found" },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ 
        data: {
          id: data[0].id,
          status: data[0].status
        },
        success: true
      });
    }
    
    // For all other updates, continue with full validation
    const validationResult = eventSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error("PATCH: Validation error:", validationResult.error.format());
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const validatedData = validationResult.data;
    console.log("PATCH: Validated data:", validatedData);
    
    // Map camelCase to snake_case for database columns
    console.log("PATCH: About to update database record");
    const { data, error } = await serviceRoleClient
      .from("events")
      .update({
        name: validatedData.name,
        start_date: validatedData.startDate,
        end_date: validatedData.endDate,
        location: validatedData.location,
        status: validatedData.status,
        attendee_count: validatedData.attendeeCount,
        description: validatedData.description,
        type: validatedData.type,
        parent_event_id: validatedData.parentEventId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select();
    
    console.log("PATCH: Database response:", { data, error });
    
    if (error) {
      console.error("PATCH: Error updating event:", error);
      return NextResponse.json(
        { error: "Failed to update event: " + error.message },
        { status: 500 }
      );
    }
    
    if (!data || data.length === 0) {
      console.error("PATCH: No data returned after update");
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }
    
    // Map response to camelCase for frontend
    const updatedEvent = {
      id: data[0].id,
      name: data[0].name,
      startDate: data[0].start_date,
      endDate: data[0].end_date,
      location: data[0].location,
      status: data[0].status,
      attendeeCount: data[0].attendee_count,
      description: data[0].description,
      type: data[0].type,
      parentEventId: data[0].parent_event_id,
      createdAt: data[0].created_at,
      updatedAt: data[0].updated_at,
    };
    
    console.log("PATCH: Successfully updated event, returning:", updatedEvent.id);
    return NextResponse.json({ data: updatedEvent });
  } catch (error) {
    console.error("Error in event PATCH route:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id] - Delete an event
export async function DELETE(
  request: Request, 
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }
    
    const { error } = await serviceRoleClient
      .from("events")
      .delete()
      .eq("id", id);
    
    if (error) {
      console.error("Error deleting event:", error);
      return NextResponse.json(
        { error: "Failed to delete event: " + error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in event DELETE route:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 