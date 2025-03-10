// Temporarily disable custom middleware to debug 500 errors
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This is a minimal middleware that does nothing but pass the request through
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

// Original middleware saved for reference
/*
import { updateSession } from "@v1/supabase/middleware";
import { createI18nMiddleware } from "next-international/middleware";
import { type NextRequest, NextResponse } from "next/server";

const I18nMiddleware = createI18nMiddleware({
  locales: ["en", "fr"],
  defaultLocale: "en",
  urlMappingStrategy: "rewrite",
});

export async function middleware(request: NextRequest) {
  try {
    // Check if the pathname already has a valid locale
    const pathname = request.nextUrl.pathname;
    const pathnameHasLocale = /^\/(?:en|fr)(?:\/|$)/.test(pathname);
    
    // Skip locale check for API routes, static files, etc.
    const shouldCheckLocale = 
      !pathname.startsWith('/_next') &&
      !pathname.startsWith('/api') &&
      !pathname.includes('.') &&
      !pathnameHasLocale;
    
    if (shouldCheckLocale) {
      // Redirect to the same URL but with default locale
      const defaultLocale = "en";
      const url = new URL(`/${defaultLocale}${pathname}`, request.url);
      // Preserve query parameters and hash
      url.search = request.nextUrl.search;
      url.hash = request.nextUrl.hash;
      return NextResponse.redirect(url);
    }
    
    // Process the request with the i18n middleware
    const i18nResult = I18nMiddleware(request);
    
    // Skip auth check for API routes to avoid potential issues
    if (pathname.startsWith('/api/')) {
      return i18nResult;
    }
    
    try {
      // Handle auth session
      const { response, user } = await updateSession(request, i18nResult);
      
      // Check for login paths with simplified logic
      const isLoginPath = pathname.includes("/login");
      
      // Handle API routes separately
      if (pathname.startsWith('/api/')) {
        return response;
      }
      
      // Redirect to events page if user is authenticated and trying to access login
      if (isLoginPath && user) {
        return NextResponse.redirect(new URL("/en/events", request.url));
      }
      
      // Redirect to login if user is not authenticated and not accessing login
      if (!isLoginPath && !user) {
        return NextResponse.redirect(new URL("/en/login", request.url));
      }
      
      return response;
    } catch (authError) {
      // If authentication fails, still allow the request to proceed
      // This prevents auth errors from breaking the entire app
      console.error("Auth middleware error:", authError);
      return i18nResult;
    }
  } catch (error) {
    // Global error handler - make sure the request still goes through
    console.error("Middleware error:", error);
    return NextResponse.next();
  }
}
*/

export const config = {
  matcher: [
    "/((?!_next/static|api|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
