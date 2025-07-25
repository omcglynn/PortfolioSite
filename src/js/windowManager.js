// Window management logic for XP simulator
// Handles open/close/minimize/maximize/drag/resize

export class WindowManager {
    constructor(windows, taskbarManager) {
        console.log('WindowManager constructor called');
        this.windows = windows;
        this.zIndexCounter = 100;
        this.isDragging = false;
        this.currentWindow = null;
        this.offset = { x: 0, y: 0 };
        this.isResizing = false;
        this.currentResizeWindow = null;
        this.resizeStartSize = { width: 0, height: 0 };
        this.resizeStartMouse = { x: 0, y: 0 };
        this.windowPositions = {};
        this.windowStates = {};
        this.zOrder = [];
        this.taskbarManager = taskbarManager;
        this.openWindows = new Set();
        this.restoreAllState();
        this.init();
        this.handleViewportResize = this.handleViewportResize.bind(this);
        window.addEventListener('resize', this.handleViewportResize);
    }

    // Save all window state to localStorage
    saveAllState() {
        // console.log('[WindowManager] Saving state. zOrder:', this.zOrder);
        localStorage.setItem('xp-window-positions', JSON.stringify(this.windowPositions));
        localStorage.setItem('xp-window-states', JSON.stringify(this.windowStates));
        localStorage.setItem('xp-window-zorder', JSON.stringify(this.zOrder));
    }

    // Restore all window state from localStorage
    restoreAllState() {
        try {
            const pos = localStorage.getItem('xp-window-positions');
            this.windowPositions = pos ? JSON.parse(pos) : {};
        } catch (e) { this.windowPositions = {}; }
        try {
            const states = localStorage.getItem('xp-window-states');
            this.windowStates = states ? JSON.parse(states) : {};
        } catch (e) { this.windowStates = {}; }
        try {
            const zorder = localStorage.getItem('xp-window-zorder');
            this.zOrder = zorder ? JSON.parse(zorder) : [];
        } catch (e) { this.zOrder = []; }
    }

    // Save z-order to localStorage
    saveZOrder() {
        // Save the current z-order of window IDs
        const ordered = Array.from(this.windows)
            .filter(w => w.classList.contains('active') && w.style.display !== 'none')
            .sort((a, b) => parseInt(a.style.zIndex || 0) - parseInt(b.style.zIndex || 0))
            .map(w => w.id.replace('window-', ''));
        this.zOrder = ordered;
        this.saveAllState();
    }

    // Restore z-order from localStorage
    restoreZOrder() {
        if (!this.zOrder || !this.zOrder.length) return;
        let z = 100;
        this.zOrder.forEach(winId => {
            const win = document.getElementById('window-' + winId);
            if (win && win.classList.contains('active') && win.style.display !== 'none') {
                win.style.zIndex = ++z;
            }
        });
        this.zIndexCounter = z;
        // Debug: log current z-indices
        // Array.from(this.windows).forEach(w => {
        //     if (w.classList.contains('active') && w.style.display !== 'none') {
        //         console.log(`[WindowManager] ${w.id} zIndex:`, w.style.zIndex);
        //     }
        // });
    }

    init() {
        this.windows.forEach((window, index) => {
            const titleBar = window.querySelector('.xp-title-bar');
            const closeBtn = window.querySelector('.xp-close-btn');
            const minimizeBtn = window.querySelector('.xp-minimize-btn');
            const maximizeBtn = window.querySelector('.xp-maximize-btn');
            const resizeHandle = window.querySelector('.xp-resize-handle');

            if (titleBar) {
                titleBar.addEventListener('mousedown', (e) => this.startWindowDrag(e, window));
            }
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.closeWindow(window);
                });
            }
            if (minimizeBtn) {
                minimizeBtn.addEventListener('click', () => this.minimizeWindow(window));
            }
            if (maximizeBtn) {
                maximizeBtn.addEventListener('click', () => this.maximizeWindow(window));
            }
            if (resizeHandle) {
                resizeHandle.addEventListener('mousedown', (e) => this.startResize(e, window));
            }
            window.addEventListener('mousedown', (e) => {
                if (!e.target.classList.contains('xp-control-btn')) {
                    this.bringWindowToFront(window);
                }
            });
        });
        document.addEventListener('mousemove', (e) => {
            this.dragWindow(e);
            this.doResize(e);
        });
        document.addEventListener('mouseup', () => {
            this.endWindowDrag();
            this.endResize();
        });
    }

    openWindow(window, windowId) {
        // Always show and bring to front, even if already open/minimized
        window.classList.add('active');
        window.style.display = 'flex';
        this.openWindows.add(windowId);
        this.windowStates[windowId] = { open: true, minimized: false };
        this.bringWindowToFront(window);
        if (this.taskbarManager) this.taskbarManager.addToTaskbar(windowId, window);
        if (this.windowPositions[windowId]) {
            this.restoreWindowPosition(window, windowId);
        } else {
            const defaults = {
                about:  { width: 780, height: 800, left: 300,  top: 20 },
                contact: { width: 525, height: 550, left: 950, top: 120 },
                project1: { width: 550, height: 735, left: 180, top: 80 },
                project2: { width: 1000, height: 425, left: 220, top: 120 },
                project3: { width: 925, height: 630, left: 260, top: 160 },
                project4: { width: 250, height: 500, left: 300, top: 200 },
                quest: { width: 410, height: 560, left: 515, top: 150 },
            };
            const def = defaults[windowId] || { width: 500, height: 400, left: 100, top: 100 };
            const margin = 20;
            const taskbar = document.querySelector('.xp-taskbar, .taskbar');
            const taskbarHeight = taskbar ? taskbar.offsetHeight : 20;
            const maxWidth = window.innerWidth - margin;
            const maxHeight = window.innerHeight - margin - taskbarHeight;
            const finalWidth = def.width > maxWidth ? maxWidth : def.width;
            const finalHeight = def.height > maxHeight ? maxHeight : def.height;
            window.style.width = finalWidth + 'px';
            window.style.height = finalHeight + 'px';
            window.style.left = def.left + 'px';
            window.style.top = def.top + 'px';
        }
        this.saveAllState();
        // Dispatch custom 'show' event for quest tracking
        window.dispatchEvent(new CustomEvent('show'));
    }

    closeWindow(window) {
        const windowId = window.id.replace('window-', '');
        const rect = window.getBoundingClientRect();
        this.saveWindowPosition(windowId, {
            x: parseInt(window.style.left) || rect.left,
            y: parseInt(window.style.top) || rect.top,
            width: parseInt(window.style.width) || rect.width,
            height: parseInt(window.style.height) || rect.height
        });
        window.classList.remove('active');
        window.style.display = 'none';
        this.openWindows.delete(windowId);
        if (this.taskbarManager) this.taskbarManager.removeFromTaskbar(windowId);
        this.windowStates[windowId] = { open: false, minimized: false };
        this.saveAllState();
    }

    minimizeWindow(window) {
        const windowId = window.id.replace('window-', '');
        window.style.display = 'none';
        this.windowStates[windowId] = { open: true, minimized: true };
        this.saveAllState();
    }

    restoreWindow(window) {
        window.style.display = 'flex';
        this.bringWindowToFront(window);
        const windowId = window.id.replace('window-', '');
        this.windowStates[windowId] = { open: true, minimized: false };
        this.saveAllState();
    }

    maximizeWindow(window) {
        if (window.dataset.maximized === 'true') {
            window.style.top = window.dataset.originalTop || '100px';
            window.style.left = window.dataset.originalLeft || '100px';
            window.style.width = window.dataset.originalWidth || '600px';
            window.style.height = window.dataset.originalHeight || '400px';
            window.dataset.maximized = 'false';
        } else {
            window.dataset.originalTop = window.style.top;
            window.dataset.originalLeft = window.style.left;
            window.dataset.originalWidth = window.style.width;
            window.dataset.originalHeight = window.style.height;
            window.style.top = '0px';
            window.style.left = '0px';
            window.style.width = '100vw';
            window.style.height = 'calc(100vh - 40px)';
            window.dataset.maximized = 'true';
        }
        const windowId = window.id.replace('window-', '');
        this.windowStates[windowId] = {
            ...this.windowStates[windowId],
            maximized: window.dataset.maximized === 'true'
        };
        this.saveAllState();
    }

    startWindowDrag(e, window) {
        if (window.dataset.maximized === 'true') return;
        this.isDragging = true;
        this.currentWindow = window;
        this.bringWindowToFront(window);
        const rect = window.getBoundingClientRect();
        this.offset.x = e.clientX - rect.left;
        this.offset.y = e.clientY - rect.top;
        e.preventDefault();
    }

    dragWindow(e) {
        if (!this.isDragging || !this.currentWindow) return;
        const x = e.clientX - this.offset.x;
        const y = Math.max(0, e.clientY - this.offset.y);
        this.currentWindow.style.left = x + 'px';
        this.currentWindow.style.top = y + 'px';
    }

    endWindowDrag() {
        if (this.isDragging && this.currentWindow) {
            const windowId = this.currentWindow.id.replace('window-', '');
            const rect = this.currentWindow.getBoundingClientRect();
            this.saveWindowPosition(windowId, {
                x: parseInt(this.currentWindow.style.left),
                y: parseInt(this.currentWindow.style.top),
                width: rect.width,
                height: rect.height
            });
        }
        this.isDragging = false;
        this.currentWindow = null;
        this.saveAllState();
    }

    startResize(e, window) {
        if (window.dataset.maximized === 'true') return;
        this.isResizing = true;
        this.currentResizeWindow = window;
        this.bringWindowToFront(window);
        const rect = window.getBoundingClientRect();
        this.resizeStartSize.width = rect.width;
        this.resizeStartSize.height = rect.height;
        this.resizeStartMouse.x = e.clientX;
        this.resizeStartMouse.y = e.clientY;
        e.preventDefault();
        e.stopPropagation();
    }

    doResize(e) {
        if (!this.isResizing || !this.currentResizeWindow) return;
        const windowElem = this.currentResizeWindow;
        const dx = e.clientX - this.resizeStartMouse.x;
        const dy = e.clientY - this.resizeStartMouse.y;
        let newWidth = this.resizeStartSize.width + dx;
        let newHeight = this.resizeStartSize.height + dy;
        const margin = 20;
        const taskbarHeight = 20;
        newWidth = Math.max(200, Math.min(newWidth, window.innerWidth - margin));
        newHeight = Math.max(100, Math.min(newHeight, window.innerHeight - margin - taskbarHeight));
        windowElem.style.width = newWidth + 'px';
        windowElem.style.height = newHeight + 'px';
    }

    endResize() {
        if (this.isResizing && this.currentResizeWindow) {
            const windowId = this.currentResizeWindow.id.replace('window-', '');
            const rect = this.currentResizeWindow.getBoundingClientRect();
            this.saveWindowPosition(windowId, {
                x: parseInt(this.currentResizeWindow.style.left),
                y: parseInt(this.currentResizeWindow.style.top),
                width: rect.width,
                height: rect.height
            });
        }
        this.isResizing = false;
        this.currentResizeWindow = null;
        this.saveAllState();
    }

    bringWindowToFront(window) {
        window.style.zIndex = ++this.zIndexCounter;
        this.windows.forEach(w => {
            const titleBar = w.querySelector('.xp-title-bar');
            titleBar.classList.toggle('inactive', w !== window);
        });
        // Update zOrder to move this window to the front
        const winId = window.id.replace('window-', '');
        this.zOrder = this.zOrder.filter(id => id !== winId);
        this.zOrder.push(winId);
        this.saveAllState();
        // Notify taskbar manager to update active item
        if (this.taskbarManager && typeof this.taskbarManager.setActiveTaskbarItem === 'function') {
            this.taskbarManager.setActiveTaskbarItem(winId);
        }
    }

    centerWindow(window) {
        const rect = window.getBoundingClientRect();
        const x = (window.innerWidth - rect.width) / 2;
        const y = (window.innerHeight - rect.height) / 2;
        window.style.left = Math.max(0, x) + 'px';
        window.style.top = Math.max(0, y) + 'px';
        this.saveAllState();
    }

    saveWindowPosition(windowId, position) {
        this.windowPositions[windowId] = position;
        this.saveAllState();
    }

    restoreWindowPosition(window, windowId) {
        if (this.windowPositions[windowId]) {
            const pos = this.windowPositions[windowId];
            window.style.left = pos.x + 'px';
            window.style.top = pos.y + 'px';
            if (pos.width) window.style.width = pos.width + 'px';
            if (pos.height) window.style.height = pos.height + 'px';
            window.classList.add('remembered-position');
        }
    }

    // Add this method to be called after restoring window states on load
    restoreZOrderAndBringToFront() {
        if (!this.zOrder || !this.zOrder.length) return;
        let z = 100;
        this.zOrder.forEach(winId => {
            const win = document.getElementById('window-' + winId);
            if (win && win.classList.contains('active') && win.style.display !== 'none') {
                win.style.zIndex = ++z;
            }
        });
        this.zIndexCounter = z;
    }

    // Update taskbar click handler logic (to be called from TaskbarManager)
    handleTaskbarClick(windowId) {
        const win = document.getElementById('window-' + windowId);
        if (!win) return;
        // If minimized, restore
        if (win.style.display === 'none') {
            this.restoreWindow(win);
        }
        // Always bring to front and select
        this.bringWindowToFront(win);
    }

    handleViewportResize() {
        console.log('handleViewportResize called');
        const margin = 20;
        const taskbar = document.querySelector('.xp-taskbar, .taskbar');
        const taskbarHeight = taskbar ? taskbar.offsetHeight : 20;
        const maxWidth = globalThis.innerWidth - margin;
        const maxHeight = globalThis.innerHeight - margin - taskbarHeight;
        this.windows.forEach(winElem => {
            if (!winElem.classList.contains('active')) return;
            console.log('Resizing window:', winElem.id);
            let width = winElem.offsetWidth;
            let height = winElem.offsetHeight;
            let left = parseInt(winElem.style.left) || 0;
            let top = parseInt(winElem.style.top) || 0;
            let resized = false;
            if (width > maxWidth) {
                winElem.style.width = maxWidth + 'px';
                resized = true;
            }
            if (height > maxHeight) {
                winElem.style.height = maxHeight + 'px';
                resized = true;
            }
            if (left + winElem.offsetWidth > globalThis.innerWidth - margin) {
                winElem.style.left = Math.max(0, globalThis.innerWidth - margin - winElem.offsetWidth) + 'px';
                resized = true;
            }
            if (top + winElem.offsetHeight > globalThis.innerHeight - margin - taskbarHeight) {
                winElem.style.top = Math.max(0, globalThis.innerHeight - margin - taskbarHeight - winElem.offsetHeight) + 'px';
                resized = true;
            }
            if (resized) {
                const windowId = winElem.id.replace('window-', '');
                const rect = winElem.getBoundingClientRect();
                this.saveWindowPosition(windowId, {
                    x: parseInt(winElem.style.left) || rect.left,
                    y: parseInt(winElem.style.top) || rect.top,
                    width: winElem.offsetWidth,
                    height: winElem.offsetHeight
                });
            }
        });
    }
} 