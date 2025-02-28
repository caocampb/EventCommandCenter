import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Event, EventStatus } from "@/types/events";

// Define the database row structure that matches our query
interface EventVendorWithEvent {
  id: string;
  event_id: string;
  vendor_id: string;
  role: string | null;
  budget: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  events: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    location: string | null;
    description: string | null;
    attendee_count: number | null;
    status: string;
    created_at: string;
    updated_at: string;
  };
}

// Define event shape for our frontend response
interface EventResponse {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  status: EventStatus;
  attendeeCount: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Typed response for frontend
interface EventAssignment {
  id: string;
  eventId: string;
  vendorId: string;
  role?: string | null;
  budget?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  event: EventResponse;
}

// Supabase service role client for bypassing RLS
const SUPABASE_URL = "http://127.0.0.1:54321";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const serviceRoleClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY
);

// GET /api/vendors/[id]/events - Get all events assigned to a vendor
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`GET /api/vendors/${params.id}/events - Starting request`);
    
    if (!params.id) {
      return NextResponse.json(
        { error: "Vendor ID is required" },
        { status: 400 }
      );
    }
    
    // Fetch event_vendors for the vendor and join with events table
    const { data, error } = await serviceRoleClient
      .from("event_vendors")
      .select(`
        id,
        event_id,
        vendor_id,
        role,
        budget,
        notes,
        created_at,
        updated_at,
        events:event_id (
          id,
          name,
          start_date,
          end_date,
          location,
          description,
          attendee_count,
          status,
          created_at,
          updated_at
        )
      `)
      .eq("vendor_id", params.id)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching events for vendor:", error);
      return NextResponse.json(
        { error: "Failed to fetch events: " + error.message },
        { status: 500 }
      );
    }
    
    // Map database rows to camelCase for frontend
    // Explicitly cast the data to the correct type to help TypeScript
    const typedData = data as unknown as EventVendorWithEvent[];
    const mappedData: EventAssignment[] = typedData.map(row => {
      // Build the event object while properly handling null values
      const eventObj: EventResponse = {
        id: row.events.id,
        name: row.events.name,
        startDate: row.events.start_date,
        endDate: row.events.end_date,
        location: row.events.location || "", // Handle potentially null location
        attendeeCount: row.events.attendee_count || 0, // Default to 0 if null
        status: row.events.status as EventStatus, // Cast to EventStatus
        createdAt: row.events.created_at,
        updatedAt: row.events.updated_at
      };
      
      // Add description if it exists
      if (row.events.description) {
        eventObj.description = row.events.description;
      }
      
      return {
        id: row.id,
        eventId: row.event_id,
        vendorId: row.vendor_id,
        role: row.role,
        budget: row.budget,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        event: eventObj
      };
    });
    
    return NextResponse.json({ data: mappedData });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 