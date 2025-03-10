#!/bin/bash
set -e

# Print debugging information
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Check if apps/app exists
if [ -d "apps/app" ]; then
  echo "✅ Found apps/app directory"
  cd apps/app
elif [ -d "app" ]; then
  echo "⚠️ Found app directory at root level"
  cd app
else
  echo "❌ Could not find app directory"
  echo "Searching for app directories:"
  find . -name "app" -type d
  echo "Showing all directories for debugging:"
  find . -type d -maxdepth 3
  exit 1
fi

# Now we're in the app directory
echo "Installing dependencies..."
npm install

echo "Building the app..."
npm run build

echo "Build completed successfully!" 