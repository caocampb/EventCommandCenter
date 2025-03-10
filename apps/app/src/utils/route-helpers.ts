/**
 * Routing utilities to ensure type safety with Next.js App Router
 */

/**
 * Safely creates a route object from a string path for use with Next.js Link component
 * 
 * @param path - The path/URL to navigate to
 * @param locale - Optional locale to include in the path (will be prefixed if not already present)
 * @returns A route object compatible with Next.js Link href
 * 
 * @example
 * // In a component
 * import { createSafeRoute } from '@/utils/route-helpers';
 * 
 * // With Link
 * <Link href={createSafeRoute(`/events/${eventId}`)} />
 */
export function createSafeRoute(path: string, locale?: string) {
  // If locale is provided and path doesn't already start with the locale, add it
  if (locale && !path.startsWith(`/${locale}/`)) {
    return { pathname: `/${locale}${path.startsWith('/') ? path : `/${path}`}` };
  }
  
  // Otherwise, create a route object with the original path
  return { pathname: path };
}

/**
 * Creates a localized path with the locale prefixed if not already present
 * 
 * @param path - The path to localize
 * @param locale - The locale to include
 * @returns A string with locale prefixed
 * 
 * @example
 * import { createLocalePath } from '@/utils/route-helpers';
 * 
 * const path = createLocalePath('/events', 'en');
 * // Returns: '/en/events'
 */
export function createLocalePath(path: string, locale: string): string {
  if (path.startsWith(`/${locale}/`)) {
    return path;
  }
  
  return `/${locale}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Safely navigates using the Next.js router while handling type inconsistencies
 * 
 * @param router - The Next.js router instance from useRouter()
 * @param path - The path to navigate to
 * @param locale - Optional locale to include
 * 
 * @example
 * import { useRouter, useParams } from 'next/navigation';
 * import { safeNavigate } from '@/utils/route-helpers';
 * 
 * // In your component
 * const router = useRouter();
 * const params = useParams();
 * const locale = params.locale as string;
 * 
 * // Navigate safely
 * safeNavigate(router, '/events', locale);
 */
export function safeNavigate(router: any, path: string, locale?: string): void {
  let targetPath = path;
  
  // Add locale if provided and not already in the path
  if (locale && !path.startsWith(`/${locale}/`)) {
    targetPath = `/${locale}${path.startsWith('/') ? path : `/${path}`}`;
  }
  
  // Use type assertion to work around Next.js type inconsistencies
  router.push(targetPath as any);
} 