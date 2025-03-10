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
    optimizePackageImports: ['@v1/ui']
  },
  // Fix module resolution errors
  transpilePackages: ['@v1/ui'],
  // Internationalization settings
  i18n: {
    locales: ['en'],
    defaultLocale: 'en',
  },
}

module.exports = nextConfig 