#!/usr/bin/env node

/**
 * Development optimization script
 * Helps optimize the development environment for faster loading
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Optimizing development environment...\n');

// 1. Clear Vite cache
console.log('1. Clearing Vite cache...');
try {
  const viteCachePath = path.join(__dirname, '..', 'node_modules', '.vite');
  if (fs.existsSync(viteCachePath)) {
    fs.rmSync(viteCachePath, { recursive: true, force: true });
    console.log('   ✅ Vite cache cleared');
  } else {
    console.log('   ℹ️  No Vite cache found');
  }
} catch (error) {
  console.log('   ⚠️  Could not clear Vite cache:', error.message);
}

// 2. Clear node_modules/.cache if it exists
console.log('2. Clearing other caches...');
try {
  const cachePath = path.join(__dirname, '..', 'node_modules', '.cache');
  if (fs.existsSync(cachePath)) {
    fs.rmSync(cachePath, { recursive: true, force: true });
    console.log('   ✅ Node modules cache cleared');
  }
} catch (error) {
  console.log('   ⚠️  Could not clear node_modules cache:', error.message);
}

// 3. Check for large files that might slow down the build
console.log('3. Checking for optimization opportunities...');
try {
  const srcPath = path.join(__dirname, '..', 'src');
  const checkLargeFiles = (dir) => {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        checkLargeFiles(filePath);
      } else if (stat.isFile() && stat.size > 100000) { // Files larger than 100KB
        console.log(`   ⚠️  Large file detected: ${path.relative(srcPath, filePath)} (${Math.round(stat.size / 1024)}KB)`);
      }
    });
  };
  
  if (fs.existsSync(srcPath)) {
    checkLargeFiles(srcPath);
  }
} catch (error) {
  console.log('   ⚠️  Could not check file sizes:', error.message);
}

console.log('\n✨ Development environment optimized!');
console.log('\n💡 Tips for faster development:');
console.log('   • Use npm run dev:fast for fastest startup (skips dependency optimization)');
console.log('   • Use npm run clean:cache to clear Vite cache when needed');
console.log('   • Consider using --no-optimize-deps flag for very fast startup');
console.log('   • Keep your node_modules updated with npm update');
