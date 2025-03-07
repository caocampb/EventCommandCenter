import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

// Using simple prefix-based identification to keep cookie handling clean
const AUTH_COOKIE_PREFIX = "sb-";

export const updateSession = async (
  request: NextRequest,
  response: NextResponse,
) => {
  console.log("Middleware: Processing request path:", request.nextUrl.pathname);
  
  // List all cookies for debugging
  const availableCookies = request.cookies.getAll().map(c => c.name);
  console.log("Middleware: Available cookies:", availableCookies.join(", "));
  
  // Check if we're handling an auth callback - special handling needed
  const isAuthCallback = request.nextUrl.pathname === '/api/auth/callback';
  
  if (isAuthCallback) {
    console.log("Middleware: Handling auth callback - preserving all auth cookies");
  }
  
  // Use createServerClient from @supabase/ssr for consistent cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          const cookie = request.cookies.get(name);
          if (cookie && name.startsWith(AUTH_COOKIE_PREFIX)) {
            console.log(`Middleware: Getting auth cookie ${name}`);
          }
          return cookie?.value;
        },
        set(name, value, options) {
          // Set the cookie in the response
          response.cookies.set({ name, value, ...options });
          
          if (name.startsWith(AUTH_COOKIE_PREFIX)) {
            console.log(`Middleware: Setting auth cookie ${name}`);
          }
        },
        remove(name, options) {
          // During auth callback, preserve all auth-related cookies
          if (isAuthCallback && name.startsWith(AUTH_COOKIE_PREFIX)) {
            console.log(`Middleware: Preserving auth cookie during callback: ${name}`);
            return; // Don't remove auth cookies during callback
          }
          
          console.log(`Middleware: Removing cookie: ${name}`);
          response.cookies.set({ name, value: "", ...options });
        },
      },
      cookieOptions: {
        // Use standard cookie naming and security options
        name: "sb-auth", 
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      }
    }
  );
  
  try {
    // Fetch and log the session status
    const { data: { session } } = await supabase.auth.getSession();
    console.log("Middleware: Session exists:", !!session);
    if (session) {
      console.log("Middleware: User is authenticated:", session.user.email);
    }

    // Get the user if available
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return { response, user };
  } catch (error) {
    console.error("Middleware: Error checking session:", error);
    return { response, user: null };
  }
}
