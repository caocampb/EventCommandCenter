import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-service";
import { createClient } from "@supabase/supabase-js";

// Set this to run in all environments
export const dynamic = "force-dynamic";

interface ErrorDetails {
  message: string;
  stack?: string;
  code?: string;
  details?: string;
}

type TestStatus = "pending" | "complete" | "failed";

// A more detailed database check
export async function GET() {
  try {
    const results = {
      timestamp: new Date().toISOString(),
      serviceClientTest: {
        status: "pending" as TestStatus,
        error: null as null | ErrorDetails,
        tables: {} as Record<string, any>
      },
      directClientTest: {
        status: "pending" as TestStatus,
        error: null as null | ErrorDetails,
        tables: {} as Record<string, any>
      },
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
          `${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).protocol}//${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname}` : 
          "Not set",
        keys: {
          serviceKey: process.env.SUPABASE_SERVICE_KEY ? `${process.env.SUPABASE_SERVICE_KEY.substring(0, 3)}...${process.env.SUPABASE_SERVICE_KEY.substring(process.env.SUPABASE_SERVICE_KEY.length - 3)}` : "Not set",
          serviceKeyLength: process.env.SUPABASE_SERVICE_KEY?.length || 0
        }
      }
    };

    // List of tables to test
    const tables = ["events", "budget_items", "users", "timeline_blocks"];

    // Test with service client
    try {
      console.log("Testing service client with detailed checks");
      const serviceClient = createServiceClient();
      
      for (const table of tables) {
        console.log(`Checking table: ${table}`);
        try {
          const { data, error } = await serviceClient.from(table).select("count(*)").limit(1);
          
          if (error) {
            results.serviceClientTest.tables[table] = {
              status: "error",
              error: {
                message: error.message,
                code: error.code,
                details: error.details
              }
            };
          } else {
            results.serviceClientTest.tables[table] = {
              status: "success",
              data
            };
          }
        } catch (tableError: any) {
          results.serviceClientTest.tables[table] = {
            status: "exception",
            error: {
              message: tableError?.message || "Unknown error",
              stack: tableError?.stack
            }
          };
        }
      }
      
      results.serviceClientTest.status = "complete";
    } catch (serviceError: any) {
      console.error("Service client setup error:", serviceError);
      results.serviceClientTest.status = "failed";
      results.serviceClientTest.error = {
        message: serviceError?.message || "Unknown error",
        stack: serviceError?.stack
      };
    }

    // Test with direct client
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
        throw new Error("Missing Supabase URL or Service Key");
      }
      
      console.log("Testing direct client with detailed checks");
      const directClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );
      
      for (const table of tables) {
        console.log(`Checking table with direct client: ${table}`);
        try {
          const { data, error } = await directClient.from(table).select("count(*)").limit(1);
          
          if (error) {
            results.directClientTest.tables[table] = {
              status: "error",
              error: {
                message: error.message,
                code: error.code,
                details: error.details
              }
            };
          } else {
            results.directClientTest.tables[table] = {
              status: "success",
              data
            };
          }
        } catch (tableError: any) {
          results.directClientTest.tables[table] = {
            status: "exception",
            error: {
              message: tableError?.message || "Unknown error",
              stack: tableError?.stack
            }
          };
        }
      }
      
      results.directClientTest.status = "complete";
    } catch (directError: any) {
      console.error("Direct client setup error:", directError);
      results.directClientTest.status = "failed";
      results.directClientTest.error = {
        message: directError?.message || "Unknown error",
        stack: directError?.stack
      };
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Database debug route error:", error);
    return NextResponse.json(
      {
        error: "Error in database diagnostics",
        message: error?.message || String(error),
        stack: error?.stack,
      },
      { status: 500 }
    );
  }
} 