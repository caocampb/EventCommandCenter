import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabase-service";
import { budgetItemSchema } from "@/lib/validations/budget-schema";
import type { BudgetItemDbRow } from "@/types/budget";

// GET /api/events/[id]/budget - Get all budget items for an event
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("Budget route - Starting GET request for event:", params.id);
    
    const eventId = params.id;
    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }
    
    // Debugging Supabase connection
    console.log("Budget route - About to query Supabase");
    
    // Fetch budget items for the event
    const { data, error } = await serviceClient
      .from("budget_items")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching budget items:", error);
      return NextResponse.json(
        { error: "Failed to fetch budget items", details: error },
        { status: 500 }
      );
    }
    
    console.log(`Budget route - Successfully retrieved ${data?.length || 0} budget items`);
    
    // Map database rows to our expected frontend format
    const budgetItems = data.map(item => ({
      id: item.id,
      eventId: item.event_id,
      description: item.description,
      category: item.category,
      vendorId: item.vendor_id,
      plannedAmount: item.planned_amount,
      actualAmount: item.actual_amount,
      isPaid: item.is_paid,
      notes: item.notes,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
    
    return NextResponse.json({ data: budgetItems });
  } catch (error) {
    console.error("Unexpected error in budget GET route:", error);
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { 
        error: "An unexpected error occurred", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/budget - Create a new budget item
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`POST /api/events/${params.id}/budget - Starting request`);
    
    if (!params.id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    
    // Add eventId from route parameter to the body
    body.eventId = params.id;
    
    console.log("Received budget item data:", JSON.stringify(body, null, 2));
    
    const validationResult = budgetItemSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.format());
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const validatedData = validationResult.data;
    
    // Map camelCase to snake_case for database columns
    const { data, error } = await serviceClient
      .from("budget_items")
      .insert({
        event_id: validatedData.eventId,
        description: validatedData.description,
        category: validatedData.category,
        planned_amount: validatedData.plannedAmount,
        actual_amount: validatedData.actualAmount,
        vendor_id: validatedData.vendorId,
        is_paid: validatedData.isPaid,
        is_per_attendee: validatedData.isPerAttendee,
        notes: validatedData.notes
      })
      .select();
    
    if (error) {
      console.error("Error creating budget item:", error);
      return NextResponse.json(
        { error: "Failed to create budget item: " + error.message },
        { status: 500 }
      );
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "No data returned after inserting budget item" },
        { status: 500 }
      );
    }
    
    // Map response to camelCase for frontend
    const item = data[0] as BudgetItemDbRow;
    const budgetItem = {
      id: item.id,
      eventId: item.event_id,
      description: item.description,
      category: item.category,
      plannedAmount: item.planned_amount,
      actualAmount: item.actual_amount,
      vendorId: item.vendor_id,
      isPaid: item.is_paid,
      isPerAttendee: item.is_per_attendee,
      notes: item.notes,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    };
    
    return NextResponse.json({ data: budgetItem }, { status: 201 });
  } catch (error) {
    console.error("Error in budget items POST route:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 