import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabase-service";

// PUT /api/vendors/[id]/favorite - Update favorite status of a vendor
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`PUT /api/vendors/${params.id}/favorite - Starting request`);
    
    if (!params.id) {
      return NextResponse.json(
        { error: "Vendor ID is required" },
        { status: 400 }
      );
    }
    
    // Parse request body to get favorite status
    const body = await request.json();
    console.log("Received favorite update data:", JSON.stringify(body, null, 2));
    
    // Validate that isFavorite is a boolean
    if (typeof body.isFavorite !== 'boolean') {
      return NextResponse.json(
        { error: "isFavorite must be a boolean" },
        { status: 400 }
      );
    }
    
    // Update the vendor's favorite status
    const { data, error } = await serviceClient
      .from("vendors")
      .update({ is_favorite: body.isFavorite })
      .eq("id", params.id)
      .select();
    
    if (error) {
      console.error("Error updating vendor favorite status:", error);
      return NextResponse.json(
        { error: "Failed to update favorite status: " + error.message },
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
      isFavorite: data[0].is_favorite,
    };
    
    return NextResponse.json({ data: updatedVendor });
  } catch (error) {
    console.error("Error in vendor favorite PUT route:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 