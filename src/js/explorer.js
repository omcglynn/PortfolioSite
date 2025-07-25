import { DocViewer } from './docviewer.js';

const EXPLORER_PATH_KEY = 'xp-explorer-path';

export class ExplorerManager {
  constructor({
    explorerWindowId = 'window-explorer',
    listContainerId = 'explorer-list',
    titleId = 'explorer-title',
    toolbarTitleClass = 'explorer-toolbar-title',
    backBtnId = 'explorer-back',
    forwardBtnId = 'explorer-forward',
    upBtnId = 'explorer-up',
    fileIndexPath = '/src/fileIndex.json',
    docViewer = null,
  } = {}) {
    this.window = document.getElementById(explorerWindowId);
    this.listContainer = document.getElementById(listContainerId);
    this.titleElem = document.getElementById(titleId);
    this.toolbarTitleElem = document.querySelector('.' + toolbarTitleClass);
    this.backBtn = document.getElementById(backBtnId);
    this.forwardBtn = document.getElementById(forwardBtnId);
    this.upBtn = document.getElementById(upBtnId);
    this.fileIndexPath = fileIndexPath;
    this.docViewer = docViewer;
    this.history = [];
    this.historyIndex = -1;
    this.currentDir = [];
    this.root = null;
    this.init();
  }

  async init() {
    try {
      const res = await fetch(this.fileIndexPath);
      this.root = await res.json();
      // Restore last path from localStorage if available
      let lastPath = [];
      try {
        const stored = localStorage.getItem(EXPLORER_PATH_KEY);
        if (stored) lastPath = JSON.parse(stored);
      } catch (e) { lastPath = []; }
      this.setDir(lastPath); // Start at last path or root
      this.backBtn.addEventListener('click', () => this.goBack());
      this.forwardBtn.addEventListener('click', () => this.goForward());
      this.upBtn.addEventListener('click', () => this.goUp());
    } catch (error) {
      console.error('Failed to load file index:', error);
    }
  }

  setDir(pathArr, pushHistory = true) {
    this.currentDir = pathArr;
    // Save current path to localStorage
    try {
      localStorage.setItem(EXPLORER_PATH_KEY, JSON.stringify(this.currentDir));
    } catch (e) {}
    if (pushHistory) {
      this.history = this.history.slice(0, this.historyIndex + 1);
      this.history.push([...pathArr]);
      this.historyIndex++;
    }
    
    // Navigate to the correct node
    let node = this.root;
    for (const part of pathArr) {
      if (node && node.children) {
        node = node.children.find(e => e.name === part && e.type === 'folder');
      } else {
        node = null;
        break;
      }
    }
    
    this.renderDir(node || this.root);
    this.updateTitles(pathArr);
  }

  goBack() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.setDir(this.history[this.historyIndex], false);
    }
  }

  goForward() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.setDir(this.history[this.historyIndex], false);
    }
  }

  goUp() {
    if (this.currentDir.length > 0) {
      this.setDir(this.currentDir.slice(0, -1));
    }
  }

  renderDir(node) {
    if (!node || !node.children) return;
    
    this.listContainer.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'explorer-grid';
    
    node.children.forEach(item => {
      const iconDiv = document.createElement('div');
      iconDiv.className = 'explorer-grid-item';
      iconDiv.tabIndex = 0;
      iconDiv.title = item.name;
      
      let iconImg;
      if (item.type === 'folder') {
        iconImg = document.createElement('div');
        iconImg.className = 'explorer-grid-icon';
        iconImg.style.backgroundImage = "url('/assets/images/icons/my-documents.png')";
      } else if (["png","jpg","jpeg","gif","svg"].includes(item.ext)) {
        iconImg = document.createElement('img');
        iconImg.className = 'explorer-grid-icon explorer-grid-thumb';
        iconImg.src = '/assets/' + item.path;
        iconImg.alt = item.name;
        iconImg.loading = 'lazy';
        iconImg.style.objectFit = 'cover';
        iconImg.style.background = '#fff';
        iconImg.style.border = '1px solid #d4d4c9';
      } else {
        iconImg = document.createElement('div');
        iconImg.className = 'explorer-grid-icon';
        if (["pdf"].includes(item.ext)) {
          iconImg.style.backgroundImage = "url('/assets/images/icons/docViewer.png')";
        } else if (["txt","md"].includes(item.ext)) {
          iconImg.style.backgroundImage = "url('/assets/images/icons/txt.png')";
        } else {
          iconImg.style.backgroundImage = "url('/assets/images/icons/projects.png')";
        }
      }
      
      iconDiv.appendChild(iconImg);
      
      const label = document.createElement('div');
      label.className = 'explorer-grid-label';
      label.textContent = item.name;
      iconDiv.appendChild(label);
      
      // Add double-click event listener
      iconDiv.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (item.type === 'folder') {
          this.setDir([...this.currentDir, item.name]);
        } else if (item.type === 'file' && this.docViewer) {
          const assetPath = '/assets/' + item.path;
          this.docViewer.openDoc(assetPath, item.name);
        }
      });
      
      // Add single-click for selection (optional)
      iconDiv.addEventListener('click', (e) => {
        // Remove selection from other items
        this.listContainer.querySelectorAll('.explorer-grid-item').forEach(el => {
          el.classList.remove('selected');
        });
        // Add selection to clicked item
        iconDiv.classList.add('selected');
      });
      
      grid.appendChild(iconDiv);
    });
    
    this.listContainer.appendChild(grid);
  }

  updateTitles(pathArr) {
    // Show full path from My Documents, separated by backslashes
    let fullPath = 'My Documents';
    if (pathArr.length > 0) {
      fullPath += '\\' + pathArr.join('\\');
    }
    if (this.titleElem) this.titleElem.textContent = fullPath;
    if (this.toolbarTitleElem) this.toolbarTitleElem.textContent = fullPath;
  }
} 