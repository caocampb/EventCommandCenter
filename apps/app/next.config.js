/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Output standalone build for better Vercel compatibility
  output: 'standalone',
  experimental: {
    // Prevent problematic builds on Vercel
    serverComponentsExternalPackages: [],
    // Disable incremental caching in production to avoid stale artifacts
    incrementalCacheHandlerPath: false,
    // Workaround for clientModules issues in Next.js 14.x
    optimizePackageImports: ['@v1/ui'],
    // Enable proper handling of locale routes
    typedRoutes: true
  },
  // Fix module resolution errors
  transpilePackages: ['@v1/ui'],
  // Handle locales the App Router way using route groups instead of i18n config
  // This removes the need for the older i18n config which can cause build issues
  async redirects() {
    return [
      {
        source: '/',
        destination: '/en',
        permanent: true,
      },
    ];
  },
}

module.exports = nextConfig 