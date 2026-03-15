#!/usr/bin/env node

/**
 * NexusOS Wrangler Foolproof Shim
 * Forcefully intercepts Calls to wrangler and corrects them.
 * This script is symlinked into node_modules/.bin/wrangler via postinstall.
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);

// Find the REALLY real wrangler
// In a monorepo, it might be in ./node_modules or ../node_modules
const possiblePaths = [
  path.join(__dirname, 'node_modules', 'wrangler', 'bin', 'wrangler.js'),
  path.join(__dirname, '..', 'node_modules', 'wrangler', 'bin', 'wrangler.js'),
  path.join(__dirname, '..', '..', 'node_modules', 'wrangler', 'bin', 'wrangler.js')
];

let realWranglerPath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    realWranglerPath = p;
    break;
  }
}

if (!realWranglerPath) {
  console.error('❌ NexusOS Shim: Could not find the real wrangler.js binary in node_modules.');
  process.exit(1);
}

// Check if we are running incorrect Workers commands
const isIncorrectDeploy = args[0] === 'deploy' && args[1] !== 'pages';
const isIncorrectVersions = args[0] === 'versions' && args[1] === 'upload';

if (isIncorrectDeploy || isIncorrectVersions) {
  console.log(`\n🚀 NexusOS Wrangler Shim: Intercepted "${args.join(' ')}".`);
  console.log('🔄 Redirecting to "wrangler pages deploy" for this project...\n');
  
  const result = spawnSync('node', [realWranglerPath, 'pages', 'deploy', ...args.slice(1)], {
    stdio: 'inherit',
    shell: true
  });
  
  process.exit(result.status || 0);
} else {
  // Pass through all other commands
  const result = spawnSync('node', [realWranglerPath, ...args], {
    stdio: 'inherit',
    shell: true
  });
  process.exit(result.status || 0);
}
