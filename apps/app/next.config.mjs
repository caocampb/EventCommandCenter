import "./src/env.mjs";
import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@v1/supabase"],
  experimental: {
    instrumentationHook: process.env.NODE_ENV === "production",
    optimizePackageImports: ['@v1/ui'],
    serverComponentsExternalPackages: ['@supabase/ssr', '@supabase/auth-helpers-nextjs'],
  },
  output: "standalone",
  reactStrictMode: true,
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  modularizeImports: {
    '@v1/ui': {
      transform: '@v1/ui/{{member}}',
    },
  },
  poweredByHeader: false,
  serverComponentsExternalPackages: process.env.NODE_ENV === "production" 
    ? ['@supabase/auth-helpers-nextjs'] 
    : [],
};

export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  telemetry: false,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  tunnelRoute: "/monitoring",
});
