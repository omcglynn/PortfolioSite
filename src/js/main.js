console.log('main.js loaded');
import { WindowManager } from './windowManager.js';
import { TaskbarManager } from './taskbar.js';
import { IconManager } from './icons.js';
import { DocViewer, setupDocViewerLinks } from './docviewer.js';
import { ContactFormManager } from './contactForm.js';

document.addEventListener('DOMContentLoaded', () => {
  // Set desktop background image (XP look)
  document.body.style.background = '';
  document.body.style.backgroundImage = `url('/assets/images/backgrounds/desktop-background.png')`;
  document.body.style.backgroundSize = 'cover';
  document.body.style.backgroundPosition = 'center center';
  document.body.style.backgroundRepeat = 'no-repeat';
  document.body.style.backgroundAttachment = 'fixed';

  // Initialize managers
  const taskbarManager = new TaskbarManager('taskbar-items', null); // temp null
  const windows = document.querySelectorAll('.xp-window');
  const windowManager = new WindowManager(windows, taskbarManager);
  taskbarManager.windowManager = windowManager;
  const iconManager = new IconManager();
  const docViewer = new DocViewer(undefined, windowManager);
  const contactFormManager = new ContactFormManager();

  // Attach windowManager to each window for icon double-click integration
  windows.forEach(win => { win.windowManager = windowManager; });

  // Restore window open/minimized state from localStorage
  function restoreWindowStates() {
    let windowStates = {};
    try {
      const saved = localStorage.getItem('xp-window-states');
      windowStates = saved ? JSON.parse(saved) : {};
    } catch (e) {
      windowStates = {};
    }
    windows.forEach(winElem => {
      const winId = winElem.id.replace('window-', '');
      let shouldOpen;
      let shouldMinimize = false;
      if (windowStates.hasOwnProperty(winId)) {
        const state = windowStates[winId];
        shouldOpen = state.open;
        shouldMinimize = state.minimized || false;
      } else {
        // Default: About and Contact open, others closed
        shouldOpen = (winId === 'about' || winId === 'contact');
        shouldMinimize = false;
      }
      if (shouldOpen) {
        windowManager.openWindow(winElem, winId);
        if (shouldMinimize) {
          winElem.style.display = 'none';
          windowStates[winId] = { open: true, minimized: true };
        }
      } else {
        winElem.classList.remove('active');
        winElem.style.display = 'none';
        windowManager.openWindows.delete(winId);
      }
    });
  }
  restoreWindowStates();
  // Restore z-order after restoring window states
  windowManager.restoreZOrder();

  // 1. Taskbar clock (real-time updating)
  function updateClock() {
    const clock = document.getElementById('xp-clock');
    if (!clock) return;
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    clock.textContent = timeString;
  }
  updateClock();
  setInterval(updateClock, 1000);

  // 2. Start button (restart/clear state)
  const startButton = document.querySelector('.xp-start-button');
  if (startButton) {
    startButton.addEventListener('click', () => {
      localStorage.clear();
      location.reload();
    });
  }

  // 3. Contact Info button (Notepad-style window)
  const contactInfoBtn = document.getElementById('open-contact-info');
  const contactInfoWindow = document.getElementById('window-contactinfo');
  if (contactInfoBtn && contactInfoWindow) {
    contactInfoBtn.addEventListener('click', () => {
      windowManager.openWindow(contactInfoWindow, 'contactinfo');
    });
  }

  // 4. My Documents desktop icon opens explorer window
  const myDocumentsIcon = document.querySelector('.desktop-icon[data-window="my-documents"]');
  const explorerWindow = document.getElementById('window-explorer');
  if (myDocumentsIcon && explorerWindow) {
    myDocumentsIcon.addEventListener('dblclick', () => {
      windowManager.openWindow(explorerWindow, 'explorer');
    });
  }

  // 5. Explorer logic: load fileIndex.json and render
  async function loadFileIndex() {
    const res = await fetch('/src/fileIndex.json');
    return await res.json();
  }

  function getIconForEntry(entry) {
    if (entry.type === 'folder') return '/assets/images/icons/my-documents.png';
    if (entry.ext === 'pdf') return '/assets/images/icons/docViewer.png';
    if (entry.ext === 'txt') return '/assets/images/icons/txt.png';
    if (entry.ext === 'png' || entry.ext === 'jpg' || entry.ext === 'jpeg') return '/assets/images/icons/myPics.png';
    return '/assets/images/icons/txt.png';
  }

  // --- Explorer State ---
  let fileIndex = [];
  let explorerHistory = [];
  let explorerHistoryIndex = -1;
  let currentPath = [];

  // --- Main List Rendering ---
  function renderExplorerList(entries, container, path = []) {
    container.innerHTML = '';
    // XP: vertical list, folders first, then files
    // Do not render a root 'My Documents' icon/label
    const sorted = [
      ...entries.filter(e => e.type === 'folder'),
      ...entries.filter(e => e.type === 'file')
    ];
    sorted.forEach(entry => {
      const row = document.createElement('div');
      row.className = 'explorer-row';
      row.innerHTML = `<img src="${getIconForEntry(entry)}" alt="${entry.type}" /> <span>${entry.name}</span>`;
      row.addEventListener('dblclick', () => {
        if (entry.type === 'folder') {
          navigateTo(path.concat(entry.name), true);
        } else if (entry.type === 'file') {
          // Open in docviewer
          if (window.docViewer) {
            window.docViewer.openDoc('/assets/' + entry.path, entry.name);
            windowManager.openWindow(document.getElementById('window-docviewer'), 'docviewer');
          }
        }
      });
      container.appendChild(row);
    });
  }

  // --- Navigation Logic ---
  function getEntriesAtPath(path) {
    let entries = fileIndex;
    for (const part of path) {
      const folder = entries.find(e => e.type === 'folder' && e.name === part);
      if (!folder) return [];
      entries = folder.children || [];
    }
    return entries;
  }

  function navigateTo(path, pushHistory = false) {
    currentPath = path;
    // Update title bar with current directory
    const title = path.length === 0 ? 'My Documents' : 'My Documents / ' + path.join(' / ');
    document.getElementById('explorer-title').textContent = title;
    renderExplorerList(getEntriesAtPath(path), document.getElementById('explorer-list'), path);
    if (pushHistory) {
      explorerHistory = explorerHistory.slice(0, explorerHistoryIndex + 1);
      explorerHistory.push([...path]);
      explorerHistoryIndex = explorerHistory.length - 1;
    }
    updateToolbarButtons();
  }

  function updateToolbarButtons() {
    document.getElementById('explorer-back').disabled = explorerHistoryIndex <= 0;
    document.getElementById('explorer-forward').disabled = explorerHistoryIndex >= explorerHistory.length - 1;
    document.getElementById('explorer-up').disabled = currentPath.length === 0;
  }

  document.getElementById('explorer-back').onclick = () => {
    if (explorerHistoryIndex > 0) {
      explorerHistoryIndex--;
      navigateTo(explorerHistory[explorerHistoryIndex], false);
    }
  };
  document.getElementById('explorer-forward').onclick = () => {
    if (explorerHistoryIndex < explorerHistory.length - 1) {
      explorerHistoryIndex++;
      navigateTo(explorerHistory[explorerHistoryIndex], false);
    }
  };
  document.getElementById('explorer-up').onclick = () => {
    if (currentPath.length > 0) {
      navigateTo(currentPath.slice(0, -1), true);
    }
  };

  // --- Initial Load ---
  loadFileIndex().then(index => {
    fileIndex = index;
    navigateTo([], true);
  });

  // 4. Contact form (mailto: integration)
  // const contactForm = document.getElementById('contact-form');
  // if (contactForm) {
  //   contactForm.addEventListener('submit', (e) => {
  //     e.preventDefault();
  //     const formData = new FormData(contactForm);
  //     const name = formData.get('name');
  //     const email = formData.get('email');
  //     const subject = formData.get('subject');
  //     const message = formData.get('message');
  //     const mailtoLink = `mailto:oemcgl@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
  //       `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
  //     )}`;
  //     window.location.href = mailtoLink;
  //     alert('Opening your email client to send the message!');
  //     contactForm.reset();
  //   });
  // }

  // 5. Keyboard shortcut: Escape closes the frontmost window
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Close the frontmost active window
      const activeWindows = Array.from(windows).filter(w => w.classList.contains('active') && w.style.display !== 'none');
      if (activeWindows.length > 0) {
        // Find the one with the highest z-index
        const frontWindow = activeWindows.reduce((a, b) => {
          const zA = parseInt(a.style.zIndex || 0);
          const zB = parseInt(b.style.zIndex || 0);
          return zA > zB ? a : b;
        });
        windowManager.closeWindow(frontWindow);
      }
    }
  });

  // Wire up DocViewer link interception
  setupDocViewerLinks(docViewer, windowManager);
}); 