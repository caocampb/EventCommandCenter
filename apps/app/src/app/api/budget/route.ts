import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabase-service";
import { formatDateForDisplay } from "@/utils/timezone-utils";

// GET /api/budget - Get aggregated budget data
export async function GET(request: Request) {
  try {
    console.log("GET /api/budget - Starting request");

    // Fetch all events with budget data
    const { data: events, error: eventsError } = await serviceClient
      .from("events")
      .select("id, name, start_date")
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
      const { data: budgetItems, error: budgetError } = await serviceClient
        .from("budget_items")
        .select("*")
        .eq("event_id", event.id);
      
      if (budgetError) {
        console.error(`Error fetching budget items for event ${event.id}:`, budgetError);
        continue; // Skip this event but continue with others
      }

      // Calculate event totals - note total_budget no longer exists
      const eventPlanned = budgetItems.reduce((sum, item) => sum + (item.planned_amount || 0), 0);
      const eventSpent = budgetItems.reduce((sum, item) => sum + (item.actual_amount || 0), 0);
      
      // Update global totals - use planned as the budget since we don't have total_budget
      totalAllocated += eventPlanned;
      totalSpent += eventSpent;
      totalBudget += eventPlanned; // Use planned as budget since total_budget was removed
      
      // Add to event budgets array
      eventBudgets.push({
        id: event.id,
        name: event.name,
        date: formatDateForDisplay(event.start_date),
        budget: eventPlanned,
        spent: eventSpent,
        remaining: eventPlanned - eventSpent,
        totalBudget: eventPlanned // Use planned amount as the total budget since we don't have a dedicated column
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
        const { data: vendorData, error: vendorError } = await serviceClient
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