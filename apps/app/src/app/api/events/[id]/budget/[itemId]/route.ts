import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { budgetItemUpdateSchema } from "@/lib/validations/budget-schema";
import type { BudgetItemDbRow } from "@/types/budget";

// Supabase service role client for bypassing RLS during MVP development
const SUPABASE_URL = "http://127.0.0.1:54321";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const serviceRoleClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY
);

// GET /api/events/[id]/budget/[itemId] - Get a specific budget item
export async function GET(
  request: Request,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    console.log(`GET /api/events/${params.id}/budget/${params.itemId} - Starting request`);
    
    if (!params.id || !params.itemId) {
      return NextResponse.json(
        { error: "Event ID and Item ID are required" },
        { status: 400 }
      );
    }
    
    // Fetch the specific budget item
    const { data, error } = await serviceRoleClient
      .from("budget_items")
      .select("*")
      .eq("id", params.itemId)
      .eq("event_id", params.id)
      .single();
    
    if (error) {
      // Handle 404 specifically for better user experience
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: "Budget item not found" },
          { status: 404 }
        );
      }
      
      console.error("Error fetching budget item:", error);
      return NextResponse.json(
        { error: "Failed to fetch budget item: " + error.message },
        { status: 500 }
      );
    }
    
    // Transform to camelCase for frontend
    const item = data as BudgetItemDbRow;
    const budgetItem = {
      id: item.id,
      eventId: item.event_id,
      description: item.description,
      category: item.category,
      plannedAmount: item.planned_amount,
      actualAmount: item.actual_amount,
      vendorId: item.vendor_id,
      isPaid: item.is_paid,
      notes: item.notes,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    };
    
    return NextResponse.json({ data: budgetItem });
  } catch (error) {
    console.error("Error in budget item GET route:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// PATCH /api/events/[id]/budget/[itemId] - Update a budget item
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    console.log(`PATCH /api/events/${params.id}/budget/${params.itemId} - Starting request`);
    
    if (!params.id || !params.itemId) {
      return NextResponse.json(
        { error: "Event ID and Item ID are required" },
        { status: 400 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    console.log("Received update data:", JSON.stringify(body, null, 2));
    
    const validationResult = budgetItemUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.format());
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const validatedData = validationResult.data;
    
    // Prepare update data (only fields that are present)
    const updateData: Record<string, any> = {};
    
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.category !== undefined) updateData.category = validatedData.category;
    if (validatedData.plannedAmount !== undefined) updateData.planned_amount = validatedData.plannedAmount;
    if (validatedData.actualAmount !== undefined) updateData.actual_amount = validatedData.actualAmount;
    if (validatedData.vendorId !== undefined) updateData.vendor_id = validatedData.vendorId;
    if (validatedData.isPaid !== undefined) updateData.is_paid = validatedData.isPaid;
    if (validatedData.isPerAttendee !== undefined) updateData.is_per_attendee = validatedData.isPerAttendee;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;
    
    // Only perform update if there are fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }
    
    // Update the budget item
    const { data, error } = await serviceRoleClient
      .from("budget_items")
      .update(updateData)
      .eq("id", params.itemId)
      .eq("event_id", params.id)
      .select();
    
    if (error) {
      console.error("Error updating budget item:", error);
      return NextResponse.json(
        { error: "Failed to update budget item: " + error.message },
        { status: 500 }
      );
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Budget item not found" },
        { status: 404 }
      );
    }
    
    // Transform to camelCase for frontend
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
    
    return NextResponse.json({ data: budgetItem });
  } catch (error) {
    console.error("Error in budget item PATCH route:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id]/budget/[itemId] - Delete a budget item
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    console.log(`DELETE /api/events/${params.id}/budget/${params.itemId} - Starting request`);
    
    if (!params.id || !params.itemId) {
      return NextResponse.json(
        { error: "Event ID and Item ID are required" },
        { status: 400 }
      );
    }
    
    // Delete the budget item
    const { error } = await serviceRoleClient
      .from("budget_items")
      .delete()
      .eq("id", params.itemId)
      .eq("event_id", params.id);
    
    if (error) {
      console.error("Error deleting budget item:", error);
      return NextResponse.json(
        { error: "Failed to delete budget item: " + error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ message: "Budget item deleted successfully" });
  } catch (error) {
    console.error("Error in budget item DELETE route:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 