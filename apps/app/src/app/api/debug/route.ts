import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-service";
import { createClient } from "@supabase/supabase-js";

// Set this to run in all environments, including production
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Basic debug info
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
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
      
      console.log(`Supabase URL length: ${supabaseUrl.length}, Key length: ${supabaseKey.length}`);
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing Supabase URL or Service Key");
      }

      // Test with service client
      console.log("Testing with service client");
      const serviceClient = createServiceClient();
      const { data, error } = await serviceClient.from("events").select("count(*)").limit(1);
      
      if (error) {
        throw error;
      }

      // Test basic connectivity with direct client
      console.log("Testing with direct client");
      const directClient = createClient(supabaseUrl, supabaseKey);
      const directResult = await directClient.from("events").select("count(*)").limit(1);
      
      debugInfo.tests.supabase = {
        status: "success",
        error: null,
        serviceClientResult: data,
        directClientResult: directResult.data
      };
    } catch (supabaseError) {
      console.error("Supabase test error:", supabaseError);
      debugInfo.tests.supabase = {
        status: "failed",
        error: supabaseError instanceof Error ? 
               { message: supabaseError.message, stack: supabaseError.stack } : 
               String(supabaseError)
      };
    }

    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error("Debug route error:", error);
    return NextResponse.json(
      {
        error: "Error generating debug info",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
} 