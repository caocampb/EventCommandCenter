import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { vendorSchema } from "@/lib/validations/vendor-schema";
import { VendorDbRow } from "@/types/vendor";

// Supabase service role client for bypassing RLS
const SUPABASE_URL = "http://127.0.0.1:55321";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const serviceRoleClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY
);

// GET /api/vendors/[id] - Get a single vendor by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`GET /api/vendors/${params.id} - Starting request`);
    
    if (!params.id) {
      return NextResponse.json(
        { error: "Vendor ID is required" },
        { status: 400 }
      );
    }
    
    // Fetch the vendor by ID
    const { data, error } = await serviceRoleClient
      .from("vendors")
      .select("*")
      .eq("id", params.id)
      .single();
    
    if (error) {
      console.error("Error fetching vendor:", error);
      
      if (error.code === "PGRST116") {
        // PGRST116 is the PostgreSQL error code for "not found"
        return NextResponse.json(
          { error: "Vendor not found" },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: "Failed to fetch vendor: " + error.message },
        { status: 500 }
      );
    }
    
    if (!data) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }
    
    // Map database row to camelCase for frontend
    const vendor = {
      id: data.id,
      name: data.name,
      category: data.category,
      priceTier: data.price_tier,
      capacity: data.capacity,
      rating: data.rating,
      location: data.location,
      contactName: data.contact_name,
      contactEmail: data.contact_email,
      contactPhone: data.contact_phone,
      amenities: data.amenities,
      website: data.website,
      notes: data.notes,
      isFavorite: data.is_favorite,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
    
    return NextResponse.json({ data: vendor });
  } catch (error) {
    console.error("Error in vendor GET route:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// PATCH /api/vendors/[id] - Update a vendor
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`PATCH /api/vendors/${params.id} - Starting request`);
    
    if (!params.id) {
      return NextResponse.json(
        { error: "Vendor ID is required" },
        { status: 400 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    console.log("Received vendor update data:", JSON.stringify(body, null, 2));
    
    const validationResult = vendorSchema.partial().safeParse(body);
    
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.format());
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const validatedData = validationResult.data;
    
    // Prepare update object by mapping camelCase to snake_case for database columns
    const updateData: Partial<Record<keyof VendorDbRow, any>> = {};
    
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.category !== undefined) updateData.category = validatedData.category;
    if (validatedData.priceTier !== undefined) updateData.price_tier = validatedData.priceTier;
    if (validatedData.capacity !== undefined) updateData.capacity = validatedData.capacity;
    if (validatedData.rating !== undefined) updateData.rating = validatedData.rating;
    if (validatedData.location !== undefined) updateData.location = validatedData.location;
    if (validatedData.contactName !== undefined) updateData.contact_name = validatedData.contactName;
    if (validatedData.contactEmail !== undefined) updateData.contact_email = validatedData.contactEmail;
    if (validatedData.contactPhone !== undefined) updateData.contact_phone = validatedData.contactPhone;
    if (validatedData.amenities !== undefined) updateData.amenities = validatedData.amenities;
    if (validatedData.website !== undefined) updateData.website = validatedData.website;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;
    if (validatedData.isFavorite !== undefined) updateData.is_favorite = validatedData.isFavorite;
    
    // Update the vendor
    const { data, error } = await serviceRoleClient
      .from("vendors")
      .update(updateData)
      .eq("id", params.id)
      .select();
    
    if (error) {
      console.error("Error updating vendor:", error);
      return NextResponse.json(
        { error: "Failed to update vendor: " + error.message },
        { status: 500 }
      );
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }
    
    // Map response to camelCase for frontend
    const updatedVendor = {
      id: data[0].id,
      name: data[0].name,
      category: data[0].category,
      priceTier: data[0].price_tier,
      capacity: data[0].capacity,
      rating: data[0].rating,
      location: data[0].location,
      contactName: data[0].contact_name,
      contactEmail: data[0].contact_email,
      contactPhone: data[0].contact_phone,
      amenities: data[0].amenities,
      website: data[0].website,
      notes: data[0].notes,
      isFavorite: data[0].is_favorite,
      createdAt: data[0].created_at,
      updatedAt: data[0].updated_at,
    };
    
    return NextResponse.json({ data: updatedVendor });
  } catch (error) {
    console.error("Error in vendor PATCH route:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// DELETE /api/vendors/[id] - Delete a vendor
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`DELETE /api/vendors/${params.id} - Starting request`);
    
    if (!params.id) {
      return NextResponse.json(
        { error: "Vendor ID is required" },
        { status: 400 }
      );
    }
    
    // Delete the vendor
    const { error } = await serviceRoleClient
      .from("vendors")
      .delete()
      .eq("id", params.id);
    
    if (error) {
      console.error("Error deleting vendor:", error);
      return NextResponse.json(
        { error: "Failed to delete vendor: " + error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in vendor DELETE route:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 