import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "../types";
import type { CookieOptions } from "@supabase/ssr";

export const createClient = () => {
  // Verify environment variables are available and log debug info
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables:', { 
      hasUrl: !!supabaseUrl, 
      hasAnonKey: !!supabaseAnonKey 
    });
  }
  
  // Use the standard Supabase server client with default cookie configuration
  return createServerClient<Database>(
    supabaseUrl || '',
    supabaseAnonKey || '',
    {
      cookies: {
        // Use the standard Next.js cookie methods with better error handling
        get(name) {
          try {
            return cookies().get(name)?.value;
          } catch (error) {
            console.error(`Error getting cookie '${name}':`, error);
            return undefined;
          }
        },
        set(name, value, options) {
          try {
            cookies().set(name, value, options);
          } catch (error) {
            console.error(`Error setting cookie '${name}':`, error);
          }
        },
        remove(name, options) {
          try {
            cookies().delete(name);
          } catch (error) {
            console.error(`Error removing cookie '${name}':`, error);
          }
        }
      },
      cookieOptions: {
        name: "sb-auth",
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    }
  );
};
