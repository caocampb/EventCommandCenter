import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "../types";
import type { CookieOptions } from "@supabase/ssr";

export const createClient = () => {
  // Use the standard Supabase server client with default cookie configuration
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Use the standard Next.js cookie methods
        get(name) {
          return cookies().get(name)?.value;
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
