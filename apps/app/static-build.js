/**
 * This file is a workaround for Next.js build issues with dynamic routes and route groups.
 * It ensures client reference manifests are properly generated during the build process.
 * 
 * Issue context: Next.js struggles with paths containing special characters like [locale] and (dashboard)
 * when generating client reference manifests during the build.
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Post-build script starting...');
console.log('📂 Current working directory:', process.cwd());
console.log('🧪 Environment:', process.env.VERCEL ? 'Vercel' : 'Not Vercel');
console.log('📋 Directory contents:', fs.readdirSync(process.cwd()));

// Special handling for Vercel environment
const isVercel = !!process.env.VERCEL;
console.log('🔍 Is Vercel environment:', isVercel);
console.log('🔍 VERCEL_ENV:', process.env.VERCEL_ENV);
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);

// Additional Vercel-specific logging
if (isVercel) {
  console.log('🔍 VERCEL_REGION:', process.env.VERCEL_REGION);
  console.log('🔍 VERCEL_URL:', process.env.VERCEL_URL);
  console.log('🔍 VERCEL_GIT_COMMIT_SHA:', process.env.VERCEL_GIT_COMMIT_SHA);
}

try {
  // Find the .next directory
  const buildDir = path.join(process.cwd(), '.next');
  console.log('🔍 Looking for build directory at:', buildDir);
  
  if (!fs.existsSync(buildDir)) {
    console.error('❌ Build directory not found! Current files in cwd:', fs.readdirSync(process.cwd()));
    // Don't exit with error to allow build to continue
    console.log('⚠️ Continuing without build directory...');
    return;
  }
  
  console.log('✅ Build directory found');
  console.log('📋 Build directory contents:', fs.readdirSync(buildDir));
  
  // Ensure server/app directory exists
  const serverDir = path.join(buildDir, 'server');
  if (!fs.existsSync(serverDir)) {
    console.log('⚠️ Server directory not found, creating it...');
    fs.mkdirSync(serverDir, { recursive: true });
  }
  console.log('📋 Server directory contents:', fs.existsSync(serverDir) ? fs.readdirSync(serverDir) : 'directory does not exist');
  
  const appDir = path.join(serverDir, 'app');
  if (!fs.existsSync(appDir)) {
    console.log('⚠️ App directory not found, creating it...');
    fs.mkdirSync(appDir, { recursive: true });
  }
  
  console.log('📁 App directory path:', appDir);
  console.log('📋 Contents of app directory:', fs.existsSync(appDir) ? fs.readdirSync(appDir) : 'directory does not exist');
  
  // Function to ensure directory exists
  const ensureDirectoryExists = (dirPath) => {
    console.log(`🔧 Ensuring directory exists: ${dirPath}`);
    if (!fs.existsSync(dirPath)) {
      try {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✅ Created directory: ${dirPath}`);
      } catch (err) {
        console.error(`❌ Error creating directory ${dirPath}:`, err);
      }
    } else {
      console.log(`✅ Directory already exists: ${dirPath}`);
    }
  };

  // Create an empty client reference manifest file for problematic paths
  const createEmptyManifest = (routePath) => {
    try {
      console.log(`🔧 Processing route: ${routePath}`);
      
      // Create path to the route directory
      let routeDir = path.join(appDir, routePath);
      console.log(`📁 Route directory path: ${routeDir}`);
      
      // Replace bracket notation with actual bracket characters for the file system
      if (routeDir.includes('[locale]')) {
        routeDir = routeDir.replace(/\[locale\]/g, '[locale]');
        console.log(`📁 Normalized route directory: ${routeDir}`);
      }
      
      // Ensure the directory exists
      ensureDirectoryExists(routeDir);
      
      // Create manifest file path
      const manifestPath = path.join(routeDir, 'page_client-reference-manifest.js');
      console.log(`📄 Manifest file path: ${manifestPath}`);
      
      // Create an empty manifest file
      const content = `
self.__RSC_MANIFEST={};
self.__RSC_SERVER_MANIFEST={};
self.__RSC_CSS_MANIFEST={};
`;
      try {
        fs.writeFileSync(manifestPath, content, 'utf8');
        console.log(`✅ Created manifest file: ${manifestPath}`);
        
        // Verify file exists and show contents
        if (fs.existsSync(manifestPath)) {
          console.log(`✅ Verified manifest file exists: ${manifestPath}`);
          console.log(`📋 File contents: ${fs.readFileSync(manifestPath, 'utf8')}`);
        } else {
          console.error(`❌ Failed to create manifest file: ${manifestPath}`);
        }
      } catch (writeErr) {
        console.error(`❌ Error writing manifest file ${manifestPath}:`, writeErr);
      }
    } catch (err) {
      console.error(`❌ Error processing route ${routePath}:`, err);
    }
  };

  // Add problematic paths here - try both formats
  const paths = [
    '[locale]/(dashboard)',
    '[locale]/(dashboard)/events',
    '[locale]/(dashboard)/vendors',
    '[locale]/(dashboard)/budget',
    '[locale]/not-found',
    // Add more paths for all potential routes
    '[locale]/(dashboard)/events/[id]',
    '[locale]/(dashboard)/events/new',
    '[locale]/(dashboard)/login'
  ];
  
  // Try different escape methods for paths with special characters
  console.log('🔄 Trying different path formats...');
  
  // This tries direct string paths
  paths.forEach(createEmptyManifest);
  
  // Try escaped versions of paths
  console.log('🔄 Trying escaped path format...');
  const escapedPaths = paths.map(p => p.replace(/\[/g, '\\[').replace(/\]/g, '\\]'));
  console.log('📋 Escaped paths:', escapedPaths);
  escapedPaths.forEach(createEmptyManifest);
  
  // Also try with explicit format
  console.log('🔄 Trying alternative path format...');
  
  // Try creating the file directly with explicit paths
  const explicitPaths = [
    // Try with various formats to catch the right one
    path.join(buildDir, 'server', 'app', '[locale]', '(dashboard)', 'page_client-reference-manifest.js'),
    path.join(buildDir, 'server', 'app', '[locale]/(dashboard)', 'page_client-reference-manifest.js'),
    path.join(buildDir, 'server', 'app/[locale]/(dashboard)', 'page_client-reference-manifest.js'),
    path.join(buildDir, 'server/app/[locale]/(dashboard)', 'page_client-reference-manifest.js')
  ];
  
  // Create all the different path formats
  explicitPaths.forEach(explicitManifestPath => {
    console.log(`📄 Creating explicit manifest at: ${explicitManifestPath}`);
    
    // Ensure parent directory exists
    const explicitDirPath = path.dirname(explicitManifestPath);
    ensureDirectoryExists(explicitDirPath);
    
    // Create the manifest with the same content
    const content = `
self.__RSC_MANIFEST={};
self.__RSC_SERVER_MANIFEST={};
self.__RSC_CSS_MANIFEST={};
`;
    try {
      fs.writeFileSync(explicitManifestPath, content, 'utf8');
      console.log(`✅ Created explicit manifest file: ${explicitManifestPath}`);
    } catch (writeErr) {
      console.error(`❌ Error writing explicit manifest file ${explicitManifestPath}:`, writeErr);
    }
  });
  
  console.log('✅ Post-build script completed successfully');
} catch (err) {
  console.error('❌ Post-build script error:', err);
  // Don't exit with error so the build can continue
  console.error('⚠️ Continuing despite error...');
} 