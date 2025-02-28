import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Supabase service role client for bypassing RLS
const SUPABASE_URL = "http://127.0.0.1:54321";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const serviceRoleClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY
);

// DELETE /api/events/[id]/vendors/[vendorId] - Remove a vendor from an event
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; vendorId: string } }
) {
  try {
    console.log(`DELETE /api/events/${params.id}/vendors/${params.vendorId} - Starting request`);
    
    // Validate params
    if (!params.id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }
    
    if (!params.vendorId) {
      return NextResponse.json(
        { error: "Vendor ID is required" },
        { status: 400 }
      );
    }
    
    // Check if the assignment exists
    const { data: existingData, error: checkError } = await serviceRoleClient
      .from("event_vendors")
      .select("id")
      .eq("event_id", params.id)
      .eq("vendor_id", params.vendorId);
    
    if (checkError) {
      console.error("Error checking event-vendor assignment:", checkError);
      return NextResponse.json(
        { error: "Failed to check assignment: " + checkError.message },
        { status: 500 }
      );
    }
    
    if (!existingData || existingData.length === 0) {
      return NextResponse.json(
        { error: "Vendor is not assigned to this event" },
        { status: 404 }
      );
    }
    
    // Delete the event-vendor assignment
    const { error } = await serviceRoleClient
      .from("event_vendors")
      .delete()
      .eq("event_id", params.id)
      .eq("vendor_id", params.vendorId);
    
    if (error) {
      console.error("Error removing vendor from event:", error);
      return NextResponse.json(
        { error: "Failed to remove vendor from event: " + error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in remove vendor from event route:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 