import { updateSession } from "@v1/supabase/middleware";
import { createI18nMiddleware } from "next-international/middleware";
import { type NextRequest, NextResponse } from "next/server";

const I18nMiddleware = createI18nMiddleware({
  locales: ["en", "fr"],
  defaultLocale: "en",
  urlMappingStrategy: "rewrite",
});

export async function middleware(request: NextRequest) {
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
  
  // Handle auth session
  const { response, user } = await updateSession(request, i18nResult);

  // Check for login paths - account for locale paths (both /login and /en/login should work)
  const isLoginPath = pathname === "/login" || 
                     pathname.endsWith("/login") ||
                     pathname === "/en/login" || 
                     pathname === "/fr/login";

  // Don't redirect for API routes and auth callback
  if (pathname.startsWith('/api/auth/callback') || 
      pathname.startsWith('/api/')) {
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
}

export const config = {
  matcher: [
    "/((?!_next/static|api|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
