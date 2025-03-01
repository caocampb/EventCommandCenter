import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { formatDateForDisplay } from "@/utils/timezone-utils";

// Supabase service role client for bypassing RLS
const SUPABASE_URL = "http://127.0.0.1:54321";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const serviceRoleClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY
);

// GET /api/budget - Get aggregated budget data
export async function GET() {
  try {
    console.log("GET /api/budget - Starting request");

    // Fetch all events with budget data
    const { data: events, error: eventsError } = await serviceRoleClient
      .from("events")
      .select("id, name, start_date, total_budget")
      .order("start_date", { ascending: false });
    
    if (eventsError) {
      console.error("Error fetching events:", eventsError);
      return NextResponse.json(
        { error: "Failed to fetch events: " + eventsError.message },
        { status: 500 }
      );
    }

    // Prepare arrays to store aggregated data
    let totalBudget = 0;
    let totalAllocated = 0;
    let totalSpent = 0;
    const eventBudgets = [];
    const categories = new Map();
    const vendors = new Map();

    // Fetch budget items for each event
    for (const event of events) {
      // Get event's budget items
      const { data: budgetItems, error: budgetError } = await serviceRoleClient
        .from("budget_items")
        .select(`
          id, 
          description, 
          category, 
          planned_amount, 
          actual_amount, 
          vendor_id, 
          is_paid
        `)
        .eq("event_id", event.id);
      
      if (budgetError) {
        console.error(`Error fetching budget items for event ${event.id}:`, budgetError);
        continue; // Skip this event but continue with others
      }

      // Calculate event totals
      const eventBudget = event.total_budget || 0;
      const eventPlanned = budgetItems.reduce((sum, item) => sum + (item.planned_amount || 0), 0);
      const eventSpent = budgetItems.reduce((sum, item) => sum + (item.actual_amount || 0), 0);
      
      // Update global totals
      totalBudget += eventBudget;
      totalAllocated += eventPlanned;
      totalSpent += eventSpent;
      
      // Add to event budgets array
      eventBudgets.push({
        id: event.id,
        name: event.name,
        date: formatDateForDisplay(event.start_date),
        budget: eventPlanned,
        spent: eventSpent,
        remaining: eventPlanned - eventSpent,
        totalBudget: eventBudget
      });

      // Aggregate by category
      budgetItems.forEach(item => {
        const category = item.category;
        const planned = item.planned_amount || 0;
        const actual = item.actual_amount || 0;
        
        if (!categories.has(category)) {
          categories.set(category, { budget: 0, spent: 0 });
        }
        
        const categoryData = categories.get(category);
        categoryData.budget += planned;
        categoryData.spent += actual;
      });

      // Get vendor information for items with vendor_id
      const vendorIds = budgetItems
        .filter(item => item.vendor_id)
        .map(item => item.vendor_id);
      
      if (vendorIds.length > 0) {
        const { data: vendorData, error: vendorError } = await serviceRoleClient
          .from("vendors")
          .select("id, name")
          .in("id", vendorIds);
        
        if (vendorError) {
          console.error("Error fetching vendors:", vendorError);
        } else if (vendorData) {
          // Create a map for quick vendor lookup
          const vendorMap = new Map(vendorData.map(v => [v.id, v]));
          
          // Aggregate by vendor
          budgetItems.forEach(item => {
            if (!item.vendor_id) return;
            
            const vendorId = item.vendor_id;
            const vendor = vendorMap.get(vendorId);
            
            if (!vendor) return;
            
            const actual = item.actual_amount || 0;
            
            if (!vendors.has(vendorId)) {
              vendors.set(vendorId, {
                id: vendorId,
                name: vendor.name,
                total: 0,
                events: []
              });
            }
            
            const vendorData = vendors.get(vendorId);
            vendorData.total += actual;
            
            // Check if this event is already in the vendor's events
            const existingEvent = vendorData.events.find((e: { eventId: string }) => e.eventId === event.id);
            
            if (existingEvent) {
              existingEvent.amount += actual;
            } else {
              vendorData.events.push({
                eventId: event.id,
                eventName: event.name,
                amount: actual
              });
            }
          });
        }
      }
    }

    // Prepare response data
    const categoryTotals = Array.from(categories.entries()).map(([category, data]) => ({
      category,
      budget: data.budget,
      spent: data.spent,
      percentage: data.budget > 0 ? (data.spent / data.budget) * 100 : 0
    }));

    const vendorTotals = Array.from(vendors.values())
      .sort((a, b) => b.total - a.total); // Sort by total spent

    // Return aggregated data
    return NextResponse.json({
      data: {
        totalBudget,
        totalAllocated,
        totalSpent,
        totalRemaining: totalBudget - totalSpent,
        eventBudgets,
        categoryTotals,
        vendorTotals
      }
    });
  } catch (error) {
    console.error("Error in budget GET route:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 