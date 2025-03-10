/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Output standalone build for better Vercel compatibility
  output: 'standalone',
  // Disable static image optimization to avoid build issues
  images: {
    disableStaticImages: true,
  },
  // Disable static page generation for dynamic routes
  experimental: {
    // Force all pages to be server-side rendered to avoid client reference manifest issues
    appDir: true,
    serverComponentsExternalPackages: [],
    // Disable incrementality completely - this is a key fix for the client reference manifest issue
    incrementalCacheHandlerPath: false,
    // Disable static generation for dynamic routes
    staticPageGenerationTimeout: 0,
    // Workaround for clientModules issues in Next.js 14.x
    optimizePackageImports: ['@v1/ui'],
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
  
  // Critical setting for Vercel deployment with dynamic routes
  // This tells Next.js to generate the manifest files during build time
  webpack: (config, { dev, isServer }) => {
    // Only in production builds
    if (!dev && !isServer) {
      // Ensure client reference manifests are generated properly
      config.optimization.splitChunks = {
        cacheGroups: {
          default: false,
          vendors: false,
        },
      };
    }
    
    return config;
  },
}

module.exports = nextConfig 