console.log('main.js loaded');
import { WindowManager } from './windowManager.js';
import { TaskbarManager } from './taskbar.js';
import { IconManager } from './icons.js';
import { DocViewer, setupDocViewerLinks } from './docviewer.js';
import { ContactFormManager } from './contactForm.js';
import { ExplorerManager } from './explorer.js';
import { XPImageViewer } from './xpImageViewer.js';

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
  const explorerManager = new ExplorerManager({ docViewer });
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

  // 3. Contact form (mailto: integration)
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
}); 