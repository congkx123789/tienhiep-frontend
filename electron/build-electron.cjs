#!/usr/bin/env node
/**
 * build-electron.js
 * Bundle electron/src/main.ts → electron/main.cjs using esbuild
 */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const electronDir = __dirname;
const entryPoint = path.join(electronDir, 'src', 'main.ts');
const outFile = path.join(electronDir, 'main.cjs');

async function build() {
  console.log('🔨 Building Electron main process...');
  console.log(`   Entry: ${entryPoint}`);
  console.log(`   Output: ${outFile}`);

  try {
    await esbuild.build({
      entryPoints: [entryPoint],
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'cjs',
      outfile: outFile,
      external: [
        'electron',
        'electron-store',
        'jszip',
        'node-fetch',
        'form-data',
      ],
      // Keep native node modules external
      packages: 'external',
      minify: false,
      sourcemap: false,
      logLevel: 'info',
    });
    console.log('✅ Electron build complete!');
  } catch (err) {
    console.error('❌ Build failed:', err);
    process.exit(1);
  }
}

build();
