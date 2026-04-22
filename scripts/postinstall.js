/**
 * Post-install script for @serialport/bindings-cpp
 * 
 * This script copies the compiled bindings to /ROOT/node_modules/ directory
 * to ensure the native addon is available for the production server.
 */

const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules
      if (entry.name === 'node_modules') continue;
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function setupBindings() {
  const rootNodeModules = '/ROOT/node_modules';
  
  // Source bindings-cpp path (in pnpm store)
  const srcPath = path.join(process.cwd(), 'node_modules/.pnpm/@serialport+bindings-cpp@13.0.0/node_modules/@serialport/bindings-cpp');
  
  // Destination path in /ROOT/node_modules
  const destPath = path.join(rootNodeModules, '.pnpm/@serialport+bindings-cpp@13.0.0/node_modules/@serialport/bindings-cpp');

  // Check if source exists
  if (!fs.existsSync(srcPath)) {
    console.log('[postinstall] @serialport/bindings-cpp source not found, skipping...');
    return;
  }

  // Create destination directory structure
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Copy the bindings-cpp directory
  try {
    copyDir(srcPath, destPath);
    console.log('[postinstall] @serialport/bindings-cpp copied to /ROOT/node_modules/');
  } catch (err) {
    console.error('[postinstall] Failed to copy @serialport/bindings-cpp:', err.message);
  }
}

// Run the setup
setupBindings();
