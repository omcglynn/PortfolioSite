
import { WindowManager } from './windowManager.js';
import { TaskbarManager } from './taskbar.js';
import { IconManager } from './icons.js';
import { DocViewer, setupDocViewerLinks } from './docviewer.js';
import { ContactFormManager } from './contactForm.js';
import { ExplorerManager } from './explorer.js';
import { XPImageViewer } from './xpImageViewer.js';
import { QuestManager } from './questManager.js';
import { DialogManager } from './dialogManager.js';
import { NotepadManager, setupNotepadLinks } from './notepadManager.js';

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
  // Storme image viewer
  const stormeContainer = document.getElementById('storme-image-viewer');
  if (stormeContainer) stormeContainer.classList.add('xp-image-viewer-float');
  const stormeAssets = [
    '/assets/images/projects/storme/homepage.png',
    '/assets/images/projects/storme/listing.png',
    '/assets/images/projects/storme/rentalList.png'
  ];
  new XPImageViewer({
    container: '#storme-image-viewer',
    assets: stormeAssets,
    docViewer: docViewer,
    borderColor: '#4A9EFF'
  });

  // Betabreak image viewer
  const betabreakContainer = document.getElementById('betabreak-image-viewer');
  if (betabreakContainer) betabreakContainer.classList.add('xp-image-viewer-float');
  const betabreakAssets = [
    '/assets/images/projects/betabreak/home.png',
    '/assets/images/projects/betabreak/editHold.png',
    '/assets/images/projects/betabreak/generateBeta.png',
    '/assets/images/projects/betabreak/viewMoves.png',
  ];
  new XPImageViewer({
    container: '#betabreak-image-viewer',
    assets: betabreakAssets,
    docViewer: docViewer,
    borderColor: '#4A9EFF'
  });
  // AI project image viewer
  const aiContainer = document.getElementById('ai-image-viewer');
  if (aiContainer) aiContainer.classList.add('xp-image-viewer-float');
  const aiAssets = [
    '/assets/images/projects/neuralnet/neuralcomplete.png',
    '/assets/images/projects/neuralnet/neuralcomplete2.png'
  ];
  new XPImageViewer({
    container: '#ai-image-viewer',
    assets: aiAssets,
    docViewer: docViewer,
    borderColor: '#4A9EFF'
  });
  const dialogManager = new DialogManager();
  const contactFormManager = new ContactFormManager();
  contactFormManager.setDialogManager(dialogManager);
  const notepadManager = new NotepadManager('#window-contactinfo', windowManager);
  
  // Recycle Bin explorer
  new ExplorerManager({
    explorerWindowId: 'window-recyclebin',
    listContainerId: 'recyclebin-list',
    backBtnId: 'recyclebin-back',
    forwardBtnId: 'recyclebin-forward',
    upBtnId: 'recyclebin-up',
    fileIndexPath: '/src/recycleBinIndex.json',
    docViewer: docViewer,
    notepadManager: notepadManager
  });
  const explorerManager = new ExplorerManager({ 
    docViewer: docViewer,
    notepadManager: notepadManager 
  });
  const questManager = new QuestManager({
    windowId: 'window-quest',
    projectWindowIds: ['project1', 'project2', 'project3', 'project4'],
    allWindowIds: [
      'about', 'project1', 'project2', 'project3', 'project4',
      'contact', 'contactinfo', 'explorer', 'recyclebin', 'docviewer', 'quest'
    ],
    resumeLinkSelector: 'a[href$="resume.pdf"]',
    docViewerWindowId: 'window-docviewer',
    bsodOverlayId: 'xp-bsod-overlay',
    bonziAudioId: 'bonzi-hello-audio',
    taskbarItemsId: 'taskbar-items',
  });

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
    // Get saved zOrder or default order
    let zOrder = [];
    try {
      const savedOrder = localStorage.getItem('xp-window-zorder');
      zOrder = savedOrder ? JSON.parse(savedOrder) : [];
    } catch (e) {
      zOrder = [];
    }
    // Open windows in zOrder, then the rest
    const opened = new Set();
    zOrder.forEach(winId => {
      const winElem = document.getElementById('window-' + winId);
      if (!winElem) return;
      let shouldOpen, shouldMinimize = false;
      if (windowStates.hasOwnProperty(winId)) {
        const state = windowStates[winId];
        shouldOpen = state.open;
        shouldMinimize = state.minimized || false;
      } else {
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
      opened.add(winId);
    });
    // Open any windows not in zOrder
    windows.forEach(winElem => {
      const winId = winElem.id.replace('window-', '');
      if (opened.has(winId)) return;
      let shouldOpen, shouldMinimize = false;
      if (windowStates.hasOwnProperty(winId)) {
        const state = windowStates[winId];
        shouldOpen = state.open;
        shouldMinimize = state.minimized || false;
      } else {
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
  // Restore taskbar order after all windows and taskbar items are created (defer to ensure DOM is ready)
  setTimeout(() => taskbarManager.restoreTaskbarOrder(), 0);

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


  // 4. Keyboard shortcut: Escape closes the frontmost window
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

  const contactInfoBtn = document.getElementById('open-contact-info');
  const contactInfoWindow = document.getElementById('window-contactinfo');
  if (contactInfoBtn && contactInfoWindow && contactInfoWindow.windowManager) {
    contactInfoBtn.addEventListener('click', () => {
      contactInfoWindow.windowManager.openWindow(contactInfoWindow, 'contactinfo');
    });
  }

  // Wire up DocViewer link interception
  setupDocViewerLinks(docViewer, windowManager);
  
  // Wire up Notepad link interception
  setupNotepadLinks(notepadManager, windowManager);

  // Patch: Ensure DocViewer.hide() is called when the window is closed
  const docViewerWindow = document.getElementById('window-docviewer');
  if (docViewerWindow) {
    const closeBtn = docViewerWindow.querySelector('.xp-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (docViewer && typeof docViewer.hide === 'function') {
          docViewer.hide();
        }
      });
    }
  }



  // BSOD for My Network Places
  const myNetworkPlacesIcon = Array.from(document.querySelectorAll('.desktop-icon')).find(icon => {
    const label = icon.querySelector('.icon-label');
    return label && label.textContent.trim() === 'My Network Places';
  });
  const bsodOverlay = document.getElementById('xp-bsod-overlay');
  const bsodEscapeBtn = document.getElementById('bsod-escape-btn');
  const bsodAudio = document.getElementById('bsod-error-audio');
  if (myNetworkPlacesIcon && bsodOverlay && bsodEscapeBtn) {
    myNetworkPlacesIcon.addEventListener('dblclick', () => {
      bsodOverlay.style.display = 'block';
      if (bsodAudio) {
        bsodAudio.currentTime = 0;
        bsodAudio.play();
      }
    });
    bsodEscapeBtn.addEventListener('click', () => {
      bsodOverlay.style.display = 'none';
      if (bsodAudio) {
        bsodAudio.pause();
        bsodAudio.currentTime = 0;
      }
    });
  }
}); 