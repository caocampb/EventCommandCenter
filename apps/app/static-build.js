/**
 * This file is a workaround for Next.js build issues with dynamic routes and route groups.
 * It ensures client reference manifests are properly generated during the build process.
 * 
 * Issue context: Next.js struggles with paths containing special characters like [locale] and (dashboard)
 * when generating client reference manifests during the build.
 */

const fs = require('fs');
const path = require('path');

// Only run this in production builds
if (process.env.NODE_ENV === 'production') {
  // Function to ensure directory exists
  const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  };

  // Create an empty client reference manifest file for problematic paths
  const createEmptyManifest = (routePath) => {
    const normalizedPath = path.normalize(routePath);
    const manifestPath = path.join(process.cwd(), '.next/server/app', normalizedPath, 'page_client-reference-manifest.js');
    
    console.log(`Ensuring manifest exists: ${manifestPath}`);
    
    // Ensure the directory exists
    const dir = path.dirname(manifestPath);
    ensureDirectoryExists(dir);
    
    // Create an empty manifest file if it doesn't exist
    if (!fs.existsSync(manifestPath)) {
      const content = `
self.__RSC_MANIFEST={};
self.__RSC_SERVER_MANIFEST={};
self.__RSC_CSS_MANIFEST={};
`;
      fs.writeFileSync(manifestPath, content, 'utf8');
      console.log(`Created empty manifest at ${manifestPath}`);
    }
  };

  // Add problematic paths here
  const paths = [
    '[locale]/(dashboard)',
    '[locale]/(dashboard)/events',
    '[locale]/(dashboard)/vendors',
    '[locale]/(dashboard)/budget'
  ];
  
  // Create manifests for all paths
  paths.forEach(createEmptyManifest);
} 