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
    console.error("Missing required Supabase environment variables for service client:", {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });
  }
  
  // Create and return the client
  return createClient<Database>(
    supabaseUrl || '',
    supabaseServiceKey || '',
    {
      auth: {
        persistSession: false
      }
    }
  );
}

// Export a singleton instance for direct imports
export const serviceClient = createServiceClient(); 