/**
 * html2pdf.js embeds a sourceMappingURL for es6-promise.map relative to its
 * own dist/ folder, but the file only ships under es6-promise/dist/. Copy it
 * so CRA's source-map-loader doesn't warn on every compile.
 */
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'node_modules', 'es6-promise', 'dist', 'es6-promise.map');
const destDir = path.join(__dirname, '..', 'node_modules', 'html2pdf.js', 'dist');
const dest = path.join(destDir, 'es6-promise.map');

if (!fs.existsSync(src) || !fs.existsSync(destDir)) {
  process.exit(0);
}

if (!fs.existsSync(dest)) {
  fs.copyFileSync(src, dest);
}
