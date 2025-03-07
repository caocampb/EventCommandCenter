'use client';

import { ReactNode } from 'react';

/**
 * This is a utility component to provide a clear client boundary.
 * It helps Next.js correctly generate client reference manifests during build.
 * 
 * Use this in layout files when you're experiencing issues with:
 * - client-reference-manifest.js errors
 * - unexpected hydration failures
 * - problems with route groups and dynamic routes
 */
export function ClientBoundary({ children }: { children: ReactNode }) {
  return <>{children}</>;
} 