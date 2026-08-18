// Expo web export stores fonts/images under dist/assets/node_modules.
// Wrangler Pages skips any nested node_modules path, so those files 404 in
// production (SPA _redirects returns index.html). Flatten to dist/assets/.
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const assetsDir = path.join(distDir, 'assets');
const nestedDir = path.join(assetsDir, 'node_modules');

function walkFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, acc);
    else acc.push(full);
  }
  return acc;
}

function toUrlPath(filePath) {
  return `/${path.relative(distDir, filePath).split(path.sep).join('/')}`;
}

if (!fs.existsSync(nestedDir)) {
  console.log('flatten-web-assets: no dist/assets/node_modules; skip');
  process.exit(0);
}

const files = walkFiles(nestedDir);
if (files.length === 0) {
  console.log('flatten-web-assets: nothing to flatten');
  process.exit(0);
}

const replacements = [];
for (const file of files) {
  const destName = path.basename(file);
  const dest = path.join(assetsDir, destName);
  fs.copyFileSync(file, dest);
  replacements.push({ from: toUrlPath(file), to: `/assets/${destName}` });
}

const rewriteTargets = [path.join(distDir, 'index.html')];
const jsDir = path.join(distDir, '_expo', 'static', 'js', 'web');
if (fs.existsSync(jsDir)) {
  for (const name of fs.readdirSync(jsDir)) {
    if (name.endsWith('.js')) rewriteTargets.push(path.join(jsDir, name));
  }
}

for (const target of rewriteTargets) {
  if (!fs.existsSync(target)) continue;
  let contents = fs.readFileSync(target, 'utf8');
  let next = contents;
  for (const { from, to } of replacements) {
    next = next.split(from).join(to);
  }
  if (next !== contents) fs.writeFileSync(target, next);
}

fs.rmSync(nestedDir, { recursive: true, force: true });
console.log(`flatten-web-assets: moved ${replacements.length} files to dist/assets/`);
