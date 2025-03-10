import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabase-service";
import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";

// GET /api/debug/verbose - Detailed system status and environment check
export async function GET(request: Request) {
  const timestamp = new Date().toISOString();
  const errors: Record<string, string> = {};
  const results: Record<string, any> = {};
  const startTime = Date.now();

  try {
    // Get system info
    const nodeVersion = process.version;
    const platform = process.platform;
    const arch = process.arch;
    const environment = process.env.NODE_ENV || 'unknown';
    
    // Check important environment variables (without revealing values)
    const envVars = {
      nextPublicSupabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
      supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY ? 'Set' : 'Not set',
      nextPublicApiUrl: process.env.NEXT_PUBLIC_API_URL ? 'Set' : 'Not set',
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
      sentryDsn: process.env.SENTRY_DSN ? 'Set' : 'Not set'
    };
    
    // Get package.json versions
    let packageVersions;
    try {
      const nextVersion = require('next/package.json').version;
      const reactVersion = require('react/package.json').version;
      const supabaseVersion = require('@supabase/supabase-js/package.json').version;
      packageVersions = { next: nextVersion, react: reactVersion, supabase: supabaseVersion };
    } catch (e) {
      packageVersions = { error: 'Could not load package versions' };
    }
    
    // Basic Supabase checks
    try {
      // Test service client connection (admin)
      const serviceTest = await testSupabaseServiceClient();
      
      // Test direct client connection with URL/Key 
      const directTest = await testSupabaseDirect();
      
      results.supabase = {
        status: 'success',
        error: null,
        serviceClientResult: serviceTest,
        directClientResult: directTest
      };
    } catch (e) {
      errors.supabase = e instanceof Error ? e.message : String(e);
      results.supabase = {
        status: 'error',
        error: errors.supabase,
        serviceClientResult: null,
        directClientResult: null
      };
    }
    
    // Detailed database table tests
    try {
      // Get the request headers
      const headersList = headers();
      const userAgent = headersList.get('user-agent') || 'Unknown';
      const referer = headersList.get('referer') || 'None';
      const xForwardedFor = headersList.get('x-forwarded-for') || 'None';
      
      // Test access to specific tables using service client
      const serviceClientResults = await testDatabaseTables(serviceClient);
      
      // Test with direct client too for comparison
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
      const directClient = createClient(supabaseUrl, supabaseKey);
      const directClientResults = await testDatabaseTables(directClient);
      
      // Examine database connection info (safely)
      const supabaseUrlInfo = process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set';
      const keyInfo = process.env.SUPABASE_SERVICE_KEY 
        ? { 
            serviceKey: process.env.SUPABASE_SERVICE_KEY.substring(0, 3) + '...' + 
                      process.env.SUPABASE_SERVICE_KEY.substring(process.env.SUPABASE_SERVICE_KEY.length - 3),
            serviceKeyLength: process.env.SUPABASE_SERVICE_KEY.length
          }
        : { serviceKey: 'Not set', serviceKeyLength: 0 };
      
      // Create the detailed test results
      results.detailedTests = {
        timestamp,
        serviceClientTest: {
          status: 'complete',
          error: null,
          tables: serviceClientResults
        },
        directClientTest: {
          status: 'complete',
          error: null,
          tables: directClientResults
        },
        environment: {
          supabaseUrl: supabaseUrlInfo,
          keys: keyInfo
        },
        request: {
          userAgent,
          referer,
          clientIp: xForwardedFor
        }
      };
    } catch (e) {
      errors.detailedTests = e instanceof Error ? e.message : String(e);
      results.detailedTests = {
        status: 'error',
        error: errors.detailedTests
      };
    }
    
    // API and network tests
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      
      results.networkTests = {
        apiUrl: apiUrl || 'Not configured',
        baseUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'Not in Vercel'
      };
    } catch (e) {
      errors.networkTests = e instanceof Error ? e.message : String(e);
      results.networkTests = {
        status: 'error',
        error: errors.networkTests
      };
    }
    
    // Response time measurement
    const endTime = Date.now();
    const executionTimeMs = endTime - startTime;
    
    // Building the complete response object
    const response = {
      timestamp,
      environment,
      environmentVariables: envVars,
      packageVersions,
      nodeVersion,
      platform,
      arch,
      tests: results,
      errors: Object.keys(errors).length > 0 ? errors : null,
      executionTimeMs
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Verbose debug endpoint error:", error);
    return NextResponse.json({
      timestamp,
      status: "error",
      error: error instanceof Error ? error.message : String(error),
      stackTrace: error instanceof Error ? error.stack : "No stack trace available"
    }, { status: 500 });
  }
}

// Helper function to test Supabase service client
async function testSupabaseServiceClient() {
  try {
    const { data, error } = await serviceClient
      .from('users')
      .select('id')
      .limit(1);
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Service client test error:", error);
    throw error;
  }
}

// Helper function to test Supabase with direct credentials
async function testSupabaseDirect() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      throw new Error('Missing Supabase credentials for direct test');
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Direct client test error:", error);
    throw error;
  }
}

// Helper to test specific tables in the database
async function testDatabaseTables(client: any) {
  const tables = {
    events: null,
    budget_items: null,
    users: null,
    timeline_blocks: null
  };
  
  const results: Record<string, any> = {};
  
  for (const table of Object.keys(tables)) {
    try {
      const { data, error } = await client
        .from(table)
        .select('id')
        .limit(1);
        
      if (error) {
        results[table] = {
          status: 'error',
          error: error.message,
          data: null
        };
      } else {
        results[table] = {
          status: 'success',
          data: data || []
        };
      }
    } catch (e) {
      results[table] = {
        status: 'error',
        error: e instanceof Error ? e.message : String(e),
        data: null
      };
    }
  }
  
  return results;
} 