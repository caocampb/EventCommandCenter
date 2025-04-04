import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { eventSchema } from "@/lib/validations/event-schema";
import { createClient } from "@supabase/supabase-js";
import { EventStatus } from "@/types/events";

// Get environment variables - debugging output
console.log("SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("SUPABASE SERVICE KEY LENGTH:", process.env.SUPABASE_SERVICE_KEY ? process.env.SUPABASE_SERVICE_KEY.length : 0);

// Supabase service role client for bypassing RLS
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

const serviceRoleClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY
);

// Type for the event data returned from Supabase
type EventDbRow = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  location: string;
  status: string;
  attendee_count: number;
  description?: string;
  type?: string;
  parent_event_id?: string;
  created_at: string;
  updated_at: string;
};

// GET /api/events - Get all events
export async function GET(request: Request) {
  try {
    console.log("GET /api/events - Starting request");
    
    // Get URL params for filtering
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const exclude = url.searchParams.get('exclude') || '';
    
    console.log(`Search param: ${search}, Exclude param: ${exclude}`);
    
    // TEMPORARY FOR MVP DEVELOPMENT:
    // Use service role client to bypass RLS policies during development
    // TODO: Implement proper authentication before production
    
    // Start the query
    let query = serviceRoleClient
      .from("events")
      .select("*");
    
    // Apply filters if present
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    // Exclude events if IDs are provided
    if (exclude) {
      const excludeIds = exclude.split(',').filter(id => id.trim() !== '');
      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }
    }
    
    // Order the results
    query = query.order("created_at", { ascending: false });
    
    // Execute the query
    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching events:", error);
      return NextResponse.json(
        { error: "Failed to fetch events" },
        { status: 500 }
      );
    }
    
    // Transform database model to API response (camelCase)
    const transformedData = (data || []).map((event: EventDbRow) => ({
      id: event.id,
      name: event.name,
      startDate: event.start_date,
      endDate: event.end_date,
      location: event.location,
      status: event.status,
      attendeeCount: event.attendee_count,
      description: event.description,
      type: event.type,
      parentEventId: event.parent_event_id,
      createdAt: event.created_at,
      updatedAt: event.updated_at
    }));
    
    return NextResponse.json({ data: transformedData });
  } catch (error) {
    console.error("Error in GET /api/events:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// POST /api/events - Create a new event
export async function POST(request: Request) {
  try {
    console.log("POST /api/events - Starting request");
    // TEMPORARY FOR MVP DEVELOPMENT: 
    // Use service role client to bypass RLS policies during development
    // This is a common pattern for server-side operations
    // TODO: Implement proper authentication before production
    
    // Parse and validate request body
    const body = await request.json();
    
    console.log("Received event data:", JSON.stringify(body, null, 2));
    
    const validationResult = eventSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.format());
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const validatedData = validationResult.data;
    
    // Map camelCase to snake_case for database columns
    // Use the service role client which bypasses RLS
    const { data, error } = await serviceRoleClient
      .from("events")
      .insert({
        name: validatedData.name,
        start_date: validatedData.startDate,
        end_date: validatedData.endDate,
        location: validatedData.location,
        status: validatedData.status,
        attendee_count: validatedData.attendeeCount,
        description: validatedData.description,
        type: validatedData.type,
        parent_event_id: validatedData.parentEventId,
      })
      .select();
    
    console.log("Insert response:", { data, error });
      
    if (error) {
      console.error("Error creating event:", error);
      return NextResponse.json(
        { error: "Failed to create event. Database error: " + error.message },
        { status: 500 }
      );
    }
    
    // Map response to camelCase for frontend
    const createdEvent = {
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
    
    return NextResponse.json({ data: createdEvent }, { status: 201 });
  } catch (error) {
    console.error("Error in events POST route:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 