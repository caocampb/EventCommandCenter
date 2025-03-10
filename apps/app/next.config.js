/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    // Prevent problematic builds on Vercel
    serverComponentsExternalPackages: [],
    // Disable incrementality in production
    incrementalCacheHandlerPath: process.env.NODE_ENV === 'production' 
      ? false 
      : undefined,
  },
  // Fix module resolution errors
  transpilePackages: ['@v1/ui'],
  // Workaround for the clientModules issue
  webpack: (config, { isServer }) => {
    // Add a plugin to reset problematic caching
    if (!isServer) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
    }
    return config;
  },
  // Internationalization settings
  i18n: {
    locales: ['en'],
    defaultLocale: 'en',
  },
}

module.exports = nextConfig 