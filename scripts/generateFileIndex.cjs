const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '../public/assets');
const OUTPUT_FILE = path.join(__dirname, '../public/src/fileIndex.json');

function scanDir(dir, relPath = '') {
  const absDir = path.join(ASSETS_DIR, relPath);
  const entries = fs.readdirSync(absDir, { withFileTypes: true });
  return entries.map(entry => {
    const entryPath = path.join(relPath, entry.name).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      return {
        type: 'folder',
        name: entry.name,
        path: entryPath,
        children: scanDir(dir, entryPath)
      };
    } else {
      return {
        type: 'file',
        name: entry.name,
        path: entryPath,
        ext: path.extname(entry.name).slice(1).toLowerCase()
      };
    }
  });
}

// Create a root node representing the assets directory
const fileIndex = {
  type: 'folder',
  name: 'assets',
  path: '',
  children: scanDir(ASSETS_DIR, '')
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fileIndex, null, 2));
console.log('fileIndex.json generated successfully!'); 