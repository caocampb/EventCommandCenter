import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { vendorSchema } from "@/lib/validations/vendor-schema";
import { VendorDbRow } from "@/types/vendor";

// Ensure this route is always handled at runtime, not during build
export const dynamic = 'force-dynamic';

// Supabase service role client for bypassing RLS
// Use hardcoded values directly from .env for development
const SUPABASE_URL = "http://127.0.0.1:54321";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const serviceRoleClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY
);

// GET /api/vendors - Get all vendors with optional filtering
export async function GET(request: Request) {
  try {
    console.log("GET /api/vendors - Starting request");
    
    // Get URL parameters for filtering
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const minCapacity = url.searchParams.get('minCapacity');
    const maxPriceTier = url.searchParams.get('maxPriceTier');
    const minRating = url.searchParams.get('minRating');
    const location = url.searchParams.get('location');
    const isFavorite = url.searchParams.get('isFavorite');
    
    // Start building query
    let query = serviceRoleClient
      .from("vendors")
      .select("*")
      .order("name", { ascending: true });
    
    // Apply filters if provided
    if (category) {
      query = query.eq("category", category);
    }
    
    if (minCapacity) {
      query = query.gte("capacity", parseInt(minCapacity));
    }
    
    if (maxPriceTier) {
      query = query.lte("price_tier", parseInt(maxPriceTier));
    }
    
    if (minRating) {
      query = query.gte("rating", parseInt(minRating));
    }
    
    if (location) {
      query = query.ilike("location", `%${location}%`);
    }
    
    if (isFavorite === 'true') {
      query = query.eq("is_favorite", true);
    }
    
    // Execute query
    const { data, error } = await query;
    
    console.log("GET vendors response:", { count: data?.length, error });
    
    if (error) {
      console.error("Error fetching vendors:", error);
      return NextResponse.json(
        { error: "Failed to fetch vendors: " + error.message },
        { status: 500 }
      );
    }
    
    // Return empty array if no data
    if (!data || data.length === 0) {
      return NextResponse.json({ data: [] });
    }
    
    // Map database rows to camelCase for frontend
    const vendors = data.map((vendor: VendorDbRow) => ({
      id: vendor.id,
      name: vendor.name,
      category: vendor.category,
      priceTier: vendor.price_tier,
      capacity: vendor.capacity,
      rating: vendor.rating,
      location: vendor.location,
      contactName: vendor.contact_name,
      contactEmail: vendor.contact_email,
      contactPhone: vendor.contact_phone,
      amenities: vendor.amenities,
      website: vendor.website,
      notes: vendor.notes,
      isFavorite: vendor.is_favorite,
      createdAt: vendor.created_at,
      updatedAt: vendor.updated_at,
    }));
    
    return NextResponse.json({ data: vendors });
  } catch (error) {
    console.error("Error in vendors GET route:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// POST /api/vendors - Create a new vendor
export async function POST(request: Request) {
  try {
    console.log("POST /api/vendors - Starting request");
    
    // Parse and validate request body
    const body = await request.json();
    console.log("Received vendor data:", JSON.stringify(body, null, 2));
    
    const validationResult = vendorSchema.safeParse(body);
    
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
      .from("vendors")
      .insert({
        name: validatedData.name,
        category: validatedData.category,
        price_tier: validatedData.priceTier,
        capacity: validatedData.capacity || null,
        rating: validatedData.rating || null,
        location: validatedData.location || null,
        contact_name: validatedData.contactName || null,
        contact_email: validatedData.contactEmail || null,
        contact_phone: validatedData.contactPhone || null,
        amenities: validatedData.amenities || null,
        website: validatedData.website || null,
        notes: validatedData.notes || null,
        is_favorite: validatedData.isFavorite || false,
      })
      .select();
    
    console.log("Insert response:", { data, error });
    
    if (error) {
      console.error("Error creating vendor:", error);
      return NextResponse.json(
        { error: "Failed to create vendor: " + error.message },
        { status: 500 }
      );
    }
    
    if (!data || data.length === 0) {
      console.error("No data returned after insert");
      return NextResponse.json(
        { error: "Failed to create vendor" },
        { status: 500 }
      );
    }
    
    // Map response to camelCase for frontend
    const createdVendor = {
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
    
    return NextResponse.json({ data: createdVendor }, { status: 201 });
  } catch (error) {
    console.error("Error in vendors POST route:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 