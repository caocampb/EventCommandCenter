import { NextRequest, NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabase-service";
import { z } from "zod";
import { participantSchema } from "@/lib/validations/participant-schema";
import { ParticipantDbRow } from "@/types/participant";

/**
 * GET /api/participants
 * Get all participants
 */
export async function GET(req: NextRequest) {
  try {
    // No need to check auth status when using service role client
    // Service role bypasses RLS
    
    // Get all participants
    const { data, error } = await serviceClient
      .from("participants")
      .select("*")
      .order("name", { ascending: true });
    
    if (error) {
      console.error("Error fetching participants:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Map DB response to our app types
    const participants = data.map((row: ParticipantDbRow) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      organization: row.organization || undefined,
      role: row.role || undefined,
      dietaryRequirements: row.dietary_requirements || undefined,
      accessibilityNeeds: row.accessibility_needs || undefined,
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    
    return NextResponse.json({ data: participants }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error in GET /api/participants:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/participants
 * Create a new participant
 */
export async function POST(req: NextRequest) {
  try {
    // No need to check auth status when using service role client
    // Service role bypasses RLS
    
    // Parse and validate request body
    const body = await req.json();
    const validatedData = participantSchema.parse(body);
    
    // Convert to snake_case for the database
    const participantData = {
      name: validatedData.name,
      email: validatedData.email,
      organization: validatedData.organization || null,
      role: validatedData.role || null,
      dietary_requirements: validatedData.dietaryRequirements || null,
      accessibility_needs: validatedData.accessibilityNeeds || null,
      notes: validatedData.notes || null,
    };
    
    // Insert the new participant
    const { data, error } = await serviceClient
      .from("participants")
      .insert(participantData)
      .select("*")
      .single();
    
    if (error) {
      console.error("Error creating participant:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json(
        { error: "Failed to create participant" },
        { status: 500 }
      );
    }
    
    // Map DB response to our app types
    const participant = {
      id: data.id,
      name: data.name,
      email: data.email,
      organization: data.organization || undefined,
      role: data.role || undefined,
      dietaryRequirements: data.dietary_requirements || undefined,
      accessibilityNeeds: data.accessibility_needs || undefined,
      notes: data.notes || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
    
    return NextResponse.json({ data: participant }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in POST /api/participants:", error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 