import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-service";
import { createClient } from "@supabase/supabase-js";

// Set this to run in all environments, including production
export const dynamic = "force-dynamic";

// Define proper types for test results
interface SupabaseTestResult {
  status: "pending" | "success" | "failed";
  error: null | {
    message: string;
    stack?: string;
    code?: string;
    details?: string;
  };
  serviceClientResult?: any;
  directClientResult?: any;
}

export async function GET() {
  try {
    // Basic debug info
    const debugInfo: {
      timestamp: string;
      environment: string;
      environmentVariables: Record<string, string>;
      packageVersions: Record<string, string>;
      nodeVersion: string;
      platform: string;
      arch: string;
      tests: {
        supabase: SupabaseTestResult;
      };
    } = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "unknown",
      environmentVariables: {
        nextPublicSupabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set",
        supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY ? "Set" : "Not set", 
        nextPublicApiUrl: process.env.NEXT_PUBLIC_API_URL ? "Set" : "Not set",
        databaseUrl: process.env.DATABASE_URL ? "Set" : "Not set",
        sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN ? "Set" : "Not set",
      },
      // Package versions
      packageVersions: {
        next: require("next/package.json").version,
        react: require("react/package.json").version,
        supabase: require("@supabase/auth-helpers-nextjs/package.json").version,
      },
      // System info
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      // Testing section
      tests: {
        supabase: {
          status: "pending",
          error: null
        }
      }
    };

    // Test Supabase connectivity
    try {
      console.log("Testing Supabase connectivity in debug route");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY || "";
      
      console.log(`Supabase URL length: ${supabaseUrl.length}, Key available: ${supabaseKey ? "Yes" : "No"}`);
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing Supabase URL or Service Key");
      }

      // Try to log partial URL to help with debugging without exposing full URL
      console.log(`Supabase domain: ${new URL(supabaseUrl).hostname}`);

      // Test with service client
      console.log("Testing with service client");
      const serviceClient = createServiceClient();
      const { data, error } = await serviceClient.from("events").select("id").limit(1);
      
      if (error) {
        throw error;
      }

      // Test basic connectivity with direct client
      console.log("Testing with direct client");
      const directClient = createClient(supabaseUrl, supabaseKey);
      const directResult = await directClient.from("events").select("id").limit(1);
      
      debugInfo.tests.supabase = {
        status: "success",
        error: null,
        serviceClientResult: data,
        directClientResult: directResult.data
      };
    } catch (supabaseError: any) {
      console.error("Supabase test error:", supabaseError);
      
      // Extract error details safely
      const errorDetails = {
        message: supabaseError?.message || "Unknown error",
        stack: supabaseError?.stack,
        code: supabaseError?.code,
        details: supabaseError?.details
      };
      
      // Also log full error object for server-side debugging
      console.error("Full Supabase error:", JSON.stringify(supabaseError, null, 2));

      debugInfo.tests.supabase = {
        status: "failed",
        error: errorDetails
      };
    }

    return NextResponse.json(debugInfo);
  } catch (error: any) {
    console.error("Debug route error:", error);
    return NextResponse.json(
      {
        error: "Error generating debug info",
        message: error?.message || String(error),
        stack: error?.stack,
      },
      { status: 500 }
    );
  }
} 