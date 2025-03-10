import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Default development values as fallbacks - these match what was hardcoded before
const DEV_SUPABASE_URL = "http://127.0.0.1:54321";
const DEV_SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

/**
 * Creates a Supabase client with the service role key that bypasses RLS policies
 * IMPORTANT: This should ONLY be used in trusted server-side contexts (API routes)
 * and never exposed to the client side.
 * 
 * @returns A typed Supabase client with service role permissions
 */
export function createServiceRoleClient() {
  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  
  // Check if required variables are present
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Missing required Supabase environment variables for service role client. Using development fallbacks:", {
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

// Singleton service client instance for direct import
// This allows importing the client directly without creating
// multiple instances across the codebase
export const serviceClient = createServiceRoleClient(); 