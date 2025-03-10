/**
 * Service role client for server-side API routes
 * 
 * This provides access to the Supabase service role client for API routes.
 * The client bypasses Row Level Security (RLS) and should ONLY be used
 * in trusted server-side contexts like API routes.
 * 
 * IMPORTANT: Never use this client in client components or browser code!
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@v1/supabase/types";

// Default development values as fallbacks - these match what was hardcoded before
const DEV_SUPABASE_URL = "http://127.0.0.1:54321";
const DEV_SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

/**
 * Creates a Supabase client with the service role key
 * This bypasses Row Level Security (RLS) policies
 */
export function createServiceClient() {
  // Get environment variables with better error handling
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  
  // Check if required variables are present
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Missing required Supabase environment variables for service client. Using development fallbacks:", {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });
  }
  
  // Create and return the client with a more flexible type
  // Using 'any' here is pragmatic for API routes where we know the tables exist
  return createClient<any>(
    supabaseUrl || DEV_SUPABASE_URL,
    supabaseServiceKey || DEV_SUPABASE_SERVICE_KEY,
    {
      auth: {
        persistSession: false
      }
    }
  );
}

// Export a singleton instance for direct imports
export const serviceClient = createServiceClient(); 