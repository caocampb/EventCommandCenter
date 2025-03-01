import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { budgetItemSchema } from "@/lib/validations/budget-schema";
import type { BudgetItemDbRow } from "@/types/budget";

// Supabase service role client for bypassing RLS during MVP development
const SUPABASE_URL = "http://127.0.0.1:54321";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const serviceRoleClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY
);

// GET /api/events/[id]/budget - Get all budget items for an event
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`GET /api/events/${params.id}/budget - Starting request`);
    
    if (!params.id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }
    
    // Fetch budget items for the event
    const { data, error } = await serviceRoleClient
      .from("budget_items")
      .select("*")
      .eq("event_id", params.id)
      .order("category", { ascending: true })
      .order("created_at", { ascending: true });
    
    if (error) {
      console.error("Error fetching budget items:", error);
      return NextResponse.json(
        { error: "Failed to fetch budget items: " + error.message },
        { status: 500 }
      );
    }
    
    // Transform database rows to camelCase for frontend
    const budgetItems = data?.map((item: BudgetItemDbRow) => ({
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
    })) || [];
    
    // Calculate totals
    const totals = {
      plannedTotal: budgetItems.reduce((sum, item) => sum + item.plannedAmount, 0),
      actualTotal: budgetItems.reduce((sum, item) => sum + (item.actualAmount || 0), 0),
      // Group by category
      categories: Object.entries(
        budgetItems.reduce((acc: { [key: string]: { planned: number, actual: number } }, item) => {
          const category = item.category || 'Uncategorized';
          if (!acc[category]) {
            acc[category] = { planned: 0, actual: 0 };
          }
          acc[category].planned += item.plannedAmount || 0;
          acc[category].actual += item.actualAmount || 0;
          return acc;
        }, {})
      ).map(([category, amounts]) => ({
        category,
        plannedAmount: amounts.planned,
        actualAmount: amounts.actual
      }))
    };
    
    return NextResponse.json({ 
      data: budgetItems, 
      totals 
    });
  } catch (error) {
    console.error("Error in budget items GET route:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
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
    const { data, error } = await serviceRoleClient
      .from("budget_items")
      .insert({
        event_id: validatedData.eventId,
        description: validatedData.description,
        category: validatedData.category,
        planned_amount: validatedData.plannedAmount,
        actual_amount: validatedData.actualAmount,
        vendor_id: validatedData.vendorId,
        is_paid: validatedData.isPaid,
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