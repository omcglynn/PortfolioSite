const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '../public/assets');
const OUTPUT_FILE = path.join(__dirname, '../public/src/fileIndex.json');
const RECYCLE_BIN_OUTPUT_FILE = path.join(__dirname, '../public/src/recycleBinIndex.json');

function scanDir(baseDir, relPath = '', excludeDirs = []) {
  const absDir = path.join(baseDir, relPath);
  if (!fs.existsSync(absDir)) return [];
  const entries = fs.readdirSync(absDir, { withFileTypes: true });
  return entries
    .filter(entry => !excludeDirs.includes(entry.name))
    .map(entry => {
      const entryPath = path.join(relPath, entry.name).replace(/\\/g, '/');
      if (entry.isDirectory()) {
        return {
          type: 'folder',
          name: entry.name,
          path: entryPath,
          children: scanDir(baseDir, entryPath, excludeDirs)
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

// Main index: everything in assets except 'trash'
const fileIndex = {
  type: 'folder',
  name: 'assets',
  path: '',
  children: scanDir(ASSETS_DIR, '', ['trash'])
};
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fileIndex, null, 2));
console.log('fileIndex.json generated successfully!');

// Recycle Bin index: only assets/trash
const trashDir = path.join(ASSETS_DIR, 'trash');
let recycleBinIndex = { type: 'folder', name: 'trash', path: 'trash', children: [] };
if (fs.existsSync(trashDir)) {
  recycleBinIndex.children = scanDir(trashDir, '', []).map(item => {
    // Recursively prefix 'trash/' to all paths
    function prefixPath(node) {
      node.path = path.posix.join('trash', node.path);
      if (node.children) node.children = node.children.map(prefixPath);
      return node;
    }
    return prefixPath(item);
  });
}
fs.writeFileSync(RECYCLE_BIN_OUTPUT_FILE, JSON.stringify(recycleBinIndex, null, 2));
console.log('recycleBinIndex.json generated successfully!'); 