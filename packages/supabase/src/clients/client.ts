import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "../types";

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: "sb-auth", // Use a consistent, simple name
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      }
    }
  );
