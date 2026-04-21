import { access, copyFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(rootDir, 'dist');

const requiredFiles = [
  'index.html',
  'style.css',
  'app.js',
  'ambience-sim.js',
  'ambience-client.js',
  'fzt-terminal.js',
  'fzt-terminal.css',
  'fzt-web.js',
  'wasm_exec.js',
  'fzt.wasm',
  'SymbolsNerdFontMono-Regular.ttf',
  'PerfectDOSVGA437.ttf',
];

const optionalFiles = ['version.json'];

async function exists(fileName) {
  try {
    await access(path.join(rootDir, fileName));
    return true;
  } catch {
    return false;
  }
}

async function copyIntoDist(fileName) {
  const source = path.join(rootDir, fileName);
  const target = path.join(distDir, fileName);
  await copyFile(source, target);
}

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

for (const fileName of requiredFiles) {
  if (!(await exists(fileName))) {
    throw new Error(`Missing required build asset: ${fileName}`);
  }
  await copyIntoDist(fileName);
}

for (const fileName of optionalFiles) {
  if (await exists(fileName)) {
    await copyIntoDist(fileName);
  }
}

console.log(`Copied ${requiredFiles.length} required assets into ${distDir}`);
