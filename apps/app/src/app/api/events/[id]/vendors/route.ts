import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { eventVendorSchema } from "@/lib/validations/vendor-schema";
import { VendorDbRow } from "@/types/vendor";

// Supabase service role client for bypassing RLS
const SUPABASE_URL = "http://127.0.0.1:55321";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const serviceRoleClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY
);

// Define the type for the joined data
interface EventVendorJoinedRow {
  id: string;
  event_id: string;
  vendor_id: string;
  role: string | null;
  budget: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  vendors: VendorDbRow;
}

// GET /api/events/[id]/vendors - Get all vendors for an event
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`GET /api/events/${params.id}/vendors - Starting request`);
    
    if (!params.id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }
    
    // Fetch event_vendors for the event and join with vendors table
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
        vendors:vendor_id (*)
      `)
      .eq("event_id", params.id);
    
    if (error) {
      console.error("Error fetching event vendors:", error);
      return NextResponse.json(
        { error: "Failed to fetch event vendors: " + error.message },
        { status: 500 }
      );
    }
    
    // Map database rows to camelCase for frontend
    const eventVendors = data?.map((item: any) => {
      // Cast to our expected type for better type checking
      const typedItem = item as EventVendorJoinedRow;
      
      return {
        id: typedItem.id,
        eventId: typedItem.event_id,
        vendorId: typedItem.vendor_id,
        role: typedItem.role,
        budget: typedItem.budget,
        notes: typedItem.notes,
        createdAt: typedItem.created_at,
        updatedAt: typedItem.updated_at,
        vendor: typedItem.vendors ? {
          id: typedItem.vendors.id,
          name: typedItem.vendors.name,
          category: typedItem.vendors.category,
          priceTier: typedItem.vendors.price_tier,
          capacity: typedItem.vendors.capacity,
          rating: typedItem.vendors.rating,
          location: typedItem.vendors.location,
          contactName: typedItem.vendors.contact_name,
          contactEmail: typedItem.vendors.contact_email,
          contactPhone: typedItem.vendors.contact_phone,
          amenities: typedItem.vendors.amenities,
          website: typedItem.vendors.website,
          notes: typedItem.vendors.notes,
          isFavorite: typedItem.vendors.is_favorite,
          createdAt: typedItem.vendors.created_at,
          updatedAt: typedItem.vendors.updated_at,
        } : null
      };
    }) || [];
    
    return NextResponse.json({ data: eventVendors });
  } catch (error) {
    console.error("Error in event vendors GET route:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/vendors - Assign a vendor to an event
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`POST /api/events/${params.id}/vendors - Starting request`);
    
    if (!params.id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    console.log("Received event-vendor assignment data:", JSON.stringify(body, null, 2));
    
    // Add eventId from route parameter to the body
    body.eventId = params.id;
    
    const validationResult = eventVendorSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.format());
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const validatedData = validationResult.data;
    
    // Check if vendor exists
    const { data: vendorData, error: vendorError } = await serviceRoleClient
      .from("vendors")
      .select("id")
      .eq("id", validatedData.vendorId)
      .single();
    
    if (vendorError || !vendorData) {
      console.error("Vendor not found:", validatedData.vendorId);
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }
    
    // Check if event exists
    const { data: eventData, error: eventError } = await serviceRoleClient
      .from("events")
      .select("id")
      .eq("id", validatedData.eventId)
      .single();
    
    if (eventError || !eventData) {
      console.error("Event not found:", validatedData.eventId);
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }
    
    // Check if the assignment already exists
    const { data: existingData, error: existingError } = await serviceRoleClient
      .from("event_vendors")
      .select("id")
      .eq("event_id", validatedData.eventId)
      .eq("vendor_id", validatedData.vendorId);
    
    if (!existingError && existingData && existingData.length > 0) {
      console.log("Vendor already assigned to this event");
      return NextResponse.json(
        { error: "Vendor is already assigned to this event" },
        { status: 409 }
      );
    }
    
    // Create the event-vendor assignment
    const { data, error } = await serviceRoleClient
      .from("event_vendors")
      .insert({
        event_id: validatedData.eventId,
        vendor_id: validatedData.vendorId,
        role: validatedData.role || null,
        budget: validatedData.budget || null,
        notes: validatedData.notes || null,
      })
      .select();
    
    if (error) {
      console.error("Error assigning vendor to event:", error);
      return NextResponse.json(
        { error: "Failed to assign vendor to event: " + error.message },
        { status: 500 }
      );
    }
    
    if (!data || data.length === 0) {
      console.error("No data returned after insertion");
      return NextResponse.json(
        { error: "Failed to assign vendor to event" },
        { status: 500 }
      );
    }
    
    // Map response to camelCase for frontend
    const eventVendor = {
      id: data[0].id,
      eventId: data[0].event_id,
      vendorId: data[0].vendor_id,
      role: data[0].role,
      budget: data[0].budget,
      notes: data[0].notes,
      createdAt: data[0].created_at,
      updatedAt: data[0].updated_at,
    };
    
    return NextResponse.json({ data: eventVendor }, { status: 201 });
  } catch (error) {
    console.error("Error in event vendors POST route:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 