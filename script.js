// Portfolio Desktop Interactive Script
class WindowsXPSimulator {
    constructor() {
        this.isDragging = false;
        this.currentWindow = null;
        this.offset = { x: 0, y: 0 };
        this.zIndexCounter = 100;
        this.openWindows = new Set();
        this.isMobile = false;
        this.soundsEnabled = true;
        this.sounds = {};
        this.windowPositions = {};
        this.windowStates = {};
        
        // Icon dragging properties
        this.isDraggingIcon = false;
        this.currentIcon = null;
        this.iconOffset = { x: 0, y: 0 };
        // Natural grid based on current icon positions
        this.gridOrigin = { x: 20, y: 20 }; // Starting position of first icon
        this.gridSize = 100; // 100px grid to match current spacing
        this.iconPositions = {};

        // Window resizing properties
        this.isResizing = false;
        this.currentResizeWindow = null;
        this.resizeStartSize = { width: 0, height: 0 };
        this.resizeStartMouse = { x: 0, y: 0 };

        // Bind methods for proper event listener management
        this.handleIconDoubleClick = this.handleIconDoubleClick.bind(this);
        this.startIconDrag = this.startIconDrag.bind(this);
        this.dragIcon = this.dragIcon.bind(this);
        this.endIconDrag = this.endIconDrag.bind(this);
        this.startResize = this.startResize.bind(this);
        this.doResize = this.doResize.bind(this);
        this.endResize = this.endResize.bind(this);

        this.init();
        window.addEventListener('resize', () => this.handleViewportResize());
    }

    init() {
        // Initialize DOM elements after page load
        this.desktopIcons = document.querySelectorAll('.desktop-icon');
        this.windows = document.querySelectorAll('.xp-window');
        
        console.log('Found', this.desktopIcons.length, 'desktop icons');
        console.log('Found', this.windows.length, 'windows');
        console.log(window.innerWidth);  // e.g., 1920
        console.log(window.innerHeight); // e.g., 969
        // Wait a moment for DOM to be fully ready, then load background
        setTimeout(() => {
            this.loadBackgroundImage();
        }, 100);
        
        // this.loadSounds(); // Sounds disabled for now
        this.loadWindowPositions();
        this.loadWindowStates();
        this.setupMobileSupport();
        this.setupDesktopIcons();
        this.setupWindowManagement();
        this.setupTaskbar();
        this.setupClock();
        this.setupContactForm();
        this.setupGitHubIntegration();
        // this.playStartupSound(); // Sounds disabled for now
        
        // Restore window open/closed state for all windows
        setTimeout(() => {
            this.windows.forEach(winElem => {
                const winId = winElem.id.replace('window-', '');
                let shouldOpen;
                if (this.windowStates.hasOwnProperty(winId)) {
                    shouldOpen = this.windowStates[winId].open;
                } else {
                    // Default: About and Contact open, others closed
                    shouldOpen = (winId === 'about' || winId === 'contact');
                }
                if (shouldOpen) {
                    this.openWindow(winElem, winId);
                } else {
                    winElem.classList.remove('active');
                    winElem.style.display = 'none';
                    this.openWindows.delete(winId);
                }
            });
        }, 500);

        console.log('WindowsXPSimulator initialization complete');
    }

    // Background Image Loading
    loadBackgroundImage() {
        console.log('=== loadBackgroundImage called ===');
        
        const debugStatus = document.getElementById('bg-status');
        console.log('Debug status element:', debugStatus);
        
        if (debugStatus) {
            debugStatus.textContent = 'Checking...';
            console.log('Set debug status to Checking...');
        }
        
        // Force apply background immediately - no conditions, no checks
        const imageUrl = './assets/images/backgrounds/desktop-background.png';
        console.log('Applying background image:', imageUrl);
        
        // Clear any existing background first
        document.body.style.background = '';
        
        // Apply new background
        document.body.style.backgroundImage = `url('${imageUrl}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center center';
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundAttachment = 'fixed';
        
        console.log('Background styles applied:');
        console.log('- backgroundImage:', document.body.style.backgroundImage);
        console.log('- backgroundSize:', document.body.style.backgroundSize);
        console.log('- backgroundPosition:', document.body.style.backgroundPosition);
        
        if (debugStatus) {
            debugStatus.textContent = 'Force Applied ✓';
            debugStatus.style.backgroundColor = 'green';
            console.log('Updated debug status to Force Applied');
        }
        
        // Also try adding the class for good measure
        document.body.classList.add('background-loaded');
        console.log('Added background-loaded class');
        
        console.log('=== loadBackgroundImage complete ===');
    }

    // Icon Position Management
    loadIconPositions() {
        try {
            const saved = localStorage.getItem('xp-icon-positions');
            this.iconPositions = saved ? JSON.parse(saved) : {};
        } catch (e) {
            this.iconPositions = {};
        }
    }

    saveIconPosition(iconId, position) {
        this.iconPositions[iconId] = position;
        try {
            localStorage.setItem('xp-icon-positions', JSON.stringify(this.iconPositions));
        } catch (e) {
            console.log('Could not save icon positions');
        }
    }

    restoreIconPosition(icon) {
        const iconId = icon.dataset.window || icon.textContent;
        if (this.iconPositions[iconId]) {
            const pos = this.iconPositions[iconId];
            icon.style.left = pos.x + 'px';
            icon.style.top = pos.y + 'px';
        }
    }

    snapToGrid(x, y) {
        // Calculate position relative to grid origin
        const relativeX = x - this.gridOrigin.x;
        const relativeY = y - this.gridOrigin.y;
        
        // Snap to nearest grid position
        const snappedRelativeX = Math.round(relativeX / this.gridSize) * this.gridSize;
        const snappedRelativeY = Math.round(relativeY / this.gridSize) * this.gridSize;
        
        // Convert back to absolute position
        return {
            x: snappedRelativeX + this.gridOrigin.x,
            y: snappedRelativeY + this.gridOrigin.y
        };
    }

    // Icon Dragging
    startIconDrag(e, icon) {
        if (this.isMobile) return; // Disable on mobile
        
        this.isDraggingIcon = true;
        this.currentIcon = icon;
        
        // Get current position
        const rect = icon.getBoundingClientRect();
        const desktop = document.getElementById('desktop');
        const desktopRect = desktop.getBoundingClientRect();
        
        // Calculate offset from mouse to icon top-left
        this.iconOffset.x = e.clientX - rect.left;
        this.iconOffset.y = e.clientY - rect.top;
        
        // Visual feedback
        icon.style.opacity = '0.7';
        icon.style.zIndex = '1000';
        icon.classList.add('dragging');
        
        // Select the icon being dragged
        this.selectIcon(icon);
        
        e.preventDefault();
        console.log('Started dragging icon:', icon.dataset.window);
    }

    dragIcon(e) {
        if (!this.isDraggingIcon || !this.currentIcon) return;
        
        const desktop = document.getElementById('desktop');
        const desktopRect = desktop.getBoundingClientRect();
        
        // Calculate new position
        let x = e.clientX - this.iconOffset.x - desktopRect.left;
        let y = e.clientY - this.iconOffset.y - desktopRect.top;
        
        // Keep icon within desktop bounds
        x = Math.max(0, Math.min(x, desktop.clientWidth - 72));
        y = Math.max(0, Math.min(y, desktop.clientHeight - 72));
        
        // Apply position
        this.currentIcon.style.left = x + 'px';
        this.currentIcon.style.top = y + 'px';
    }

    endIconDrag() {
        if (!this.isDraggingIcon || !this.currentIcon) return;
        
        const icon = this.currentIcon;
        
        // Get current position
        const x = parseInt(icon.style.left) || 0;
        const y = parseInt(icon.style.top) || 0;
        
        // Snap to grid
        const snapped = this.snapToGrid(x, y);
        icon.style.left = snapped.x + 'px';
        icon.style.top = snapped.y + 'px';
        
        // Save position
        const iconId = icon.dataset.window || icon.textContent;
        this.saveIconPosition(iconId, snapped);
        
        // Reset visual state
        icon.style.opacity = '';
        icon.style.zIndex = '';
        icon.classList.remove('dragging');
        
        console.log('Ended dragging icon:', iconId, 'at position:', snapped);
        
        // Reset drag state
        this.isDraggingIcon = false;
        this.currentIcon = null;
    }

    // Sound System
    loadSounds() {
        const soundFiles = {
            startup: 'assets/sounds/startup.wav',
            windowOpen: 'assets/sounds/window-open.wav',
            windowClose: 'assets/sounds/window-close.wav',
            buttonClick: 'assets/sounds/button-click.wav',
            minimize: 'assets/sounds/minimize.wav',
            maximize: 'assets/sounds/maximize.wav'
        };

        Object.keys(soundFiles).forEach(key => {
            this.sounds[key] = new Audio(soundFiles[key]);
            this.sounds[key].volume = 0.3;
            this.sounds[key].preload = 'auto';
        });
    }

    playSound(soundName) {
        // Sounds disabled for now
        return;
        // if (this.soundsEnabled && this.sounds[soundName]) {
        //     this.sounds[soundName].currentTime = 0;
        //     this.sounds[soundName].play().catch(e => {
        //         // Ignore audio play errors (user interaction required)
        //     });
        // }
    }

    playStartupSound() {
        // Delay startup sound to feel more authentic
        setTimeout(() => {
            this.playSound('startup');
        }, 500);
    }

    // Window Position Memory
    loadWindowPositions() {
        try {
            const saved = localStorage.getItem('xp-window-positions');
            this.windowPositions = saved ? JSON.parse(saved) : {};
        } catch (e) {
            this.windowPositions = {};
        }
    }

    saveWindowPosition(windowId, position) {
        this.windowPositions[windowId] = position;
        try {
            localStorage.setItem('xp-window-positions', JSON.stringify(this.windowPositions));
        } catch (e) {
            console.log('Could not save window positions');
        }
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

    loadWindowStates() {
        try {
            const saved = localStorage.getItem('xp-window-states');
            this.windowStates = saved ? JSON.parse(saved) : {};
        } catch (e) {
            this.windowStates = {};
        }
    }

    saveWindowState(windowId, state) {
        this.windowStates[windowId] = state;
        try {
            localStorage.setItem('xp-window-states', JSON.stringify(this.windowStates));
        } catch (e) {
            console.log('Could not save window states');
        }
    }

    // Setup desktop icons interaction
    setupDesktopIcons() {
        console.log('Setting up desktop icons...');
        this.loadIconPositions();
        
        this.desktopIcons.forEach((icon, index) => {
            console.log(`Setting up icon ${index}:`, icon.dataset.window);
            
            // Restore saved position or keep current position
            this.restoreIconPosition(icon);
            
            // Click to select
            icon.addEventListener('click', () => {
                console.log('Icon clicked:', icon.dataset.window);
                this.selectIcon(icon);
                this.playSound('buttonClick');
            });
            
            // Double-click to open
            icon.addEventListener('dblclick', () => {
                console.log('Icon double-clicked:', icon.dataset.window);
                this.handleIconDoubleClick(icon);
                this.playSound('buttonClick');
            });
            
            // Drag functionality
            icon.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return; // Only left mouse
                let dragStarted = false;
                const dragDelay = setTimeout(() => {
                  dragStarted = true;
                  this.startIconDrag(e, icon);
                }, 180); // 180ms hold to start drag
              
                const onMouseUp = () => {
                  clearTimeout(dragDelay);
                  window.removeEventListener('mouseup', onMouseUp);
                };
                window.addEventListener('mouseup', onMouseUp);
              });
            
            // Make icon draggable
            icon.style.cursor = 'pointer';
            icon.style.userSelect = 'none';
        });
        
        // Global icon drag events
        document.addEventListener('mousemove', this.dragIcon);
        document.addEventListener('mouseup', this.endIconDrag);
        
        console.log('Desktop icons setup complete');
    }

    // Setup window management
    setupWindowManagement() {
        console.log('Setting up window management...');
        this.windows.forEach((window, index) => {
            console.log(`Setting up window ${index}:`, window.id);
            
            const titleBar = window.querySelector('.xp-title-bar');
            const closeBtn = window.querySelector('.xp-close-btn');
            const minimizeBtn = window.querySelector('.xp-minimize-btn');
            const maximizeBtn = window.querySelector('.xp-maximize-btn');
            const resizeHandle = window.querySelector('.xp-resize-handle');

            console.log('Close button found:', closeBtn);
            console.log('Resize handle found:', resizeHandle);

            // Window dragging
            if (titleBar) {
            titleBar.addEventListener('mousedown', (e) => this.startWindowDrag(e, window));
            }
            
            // Window controls
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    console.log('Close button clicked for window:', window.id);
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
            
            // Window resizing
            if (resizeHandle) {
                resizeHandle.addEventListener('mousedown', (e) => this.startResize(e, window));
            }

            window.addEventListener('mousedown', (e) => {
                if (!e.target.classList.contains('xp-control-btn')) {
                  this.bringWindowToFront(window);
                }
            });
        });

        // Global drag and resize events
        document.addEventListener('mousemove', (e) => {
            this.dragWindow(e);
            this.doResize(e);
        });
        document.addEventListener('mouseup', () => {
            this.endWindowDrag();
            this.endResize();
        });
        
        console.log('Window management setup complete');
    }

    // Desktop icon selection
    selectIcon(icon) {
        this.desktopIcons.forEach(i => i.classList.remove('selected'));
        icon.classList.add('selected');
    }

    // Handle double-click to open windows
    handleIconDoubleClick(icon) {
        const windowId = icon.dataset.window;
        console.log('Looking for window with ID:', `window-${windowId}`);
        const window = document.getElementById(`window-${windowId}`);
        console.log('Found window:', window);
        if (window) {
            console.log('Opening window:', windowId);
            this.openWindow(window, windowId);
        } else {
            console.error('Window not found for ID:', windowId);
        }
    }

    // Open a window with enhanced functionality
    openWindow(window, windowId) {
        console.log('openWindow called with:', windowId, window);
        
        if (this.openWindows.has(windowId)) {
            console.log('Window already open, bringing to front');
            this.bringWindowToFront(window);
            return;
        }

        console.log('Adding active class to window');
        window.classList.add('active');
        console.log('Window classes after adding active:', window.className);
        console.log('Window display style:', window.style.display);
        
        this.openWindows.add(windowId);
        this.bringWindowToFront(window);
        this.addToTaskbar(windowId, window);
        
        // Set position/size: use saved if exists, else default (no clamping)
        if (this.windowPositions[windowId]) {
            this.restoreWindowPosition(window, windowId);
        } else {
            // Default size/position config per window
            const defaults = {
                about:  { width: 750, height: 800, left: 300,  top: 20 },
                contact: { width: 500, height: 550, left: 950, top: 120 },
                project1: { width: 600, height: 420, left: 180, top: 80 },
                project2: { width: 600, height: 420, left: 220, top: 120 },
                project3: { width: 600, height: 420, left: 260, top: 160 },
                // Add more as needed
            };
            const def = defaults[windowId] || { width: 500, height: 400, left: 100, top: 100 };
            
            // Clamp to desktop like resizing
            const margin = 20;
            const taskbar = document.querySelector('.xp-taskbar, .taskbar');
            const taskbarHeight = taskbar ? taskbar.offsetHeight : 20;
            const maxWidth = globalThis.innerWidth - margin;
            const maxHeight = globalThis.innerHeight - margin - taskbarHeight;
            const finalWidth = def.width > maxWidth ? maxWidth : def.width;
            const finalHeight = def.height > maxHeight ? maxHeight : def.height;
            window.style.width = finalWidth + 'px';
            window.style.height = finalHeight + 'px';
            window.style.left = def.left + 'px';
            window.style.top = def.top + 'px';
        }

        // Force display just in case
        window.style.display = 'flex';
        console.log('Forced window display to flex');

        this.playSound('windowOpen');
        // Save open state
        this.saveWindowState(windowId, { open: true });
    }

    // Close a window with position saving
    closeWindow(window) {
        const windowId = window.id.replace('window-', '');
        
        console.log('Closing window:', windowId);
        
        // Save window position before closing
        const rect = window.getBoundingClientRect();
        this.saveWindowPosition(windowId, {
            x: parseInt(window.style.left) || rect.left,
            y: parseInt(window.style.top) || rect.top,
            width: parseInt(window.style.width) || rect.width,
            height: parseInt(window.style.height) || rect.height
        });

        // Hide the window
        window.classList.remove('active');
        window.style.display = 'none';
        
        // Clean up tracking
        this.openWindows.delete(windowId);
        this.removeFromTaskbar(windowId);
        this.playSound('windowClose');
        // Save closed state
        this.saveWindowState(windowId, { open: false });
        
        console.log('Window closed:', windowId);
    }

    // Minimize window
    minimizeWindow(window) {
        window.style.display = 'none';
        this.playSound('minimize');
    }

    // Maximize/restore window
    maximizeWindow(window) {
        if (window.dataset.maximized === 'true') {
            // Restore
            window.style.top = window.dataset.originalTop || '100px';
            window.style.left = window.dataset.originalLeft || '100px';
            window.style.width = window.dataset.originalWidth || '600px';
            window.style.height = window.dataset.originalHeight || '400px';
            window.dataset.maximized = 'false';
        } else {
            // Maximize
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
        this.playSound('maximize');
    }

    // Window dragging
    startWindowDrag(e, window) {
        if (window.dataset.maximized === 'true' || this.isMobile) return;
        
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
            // Save position after dragging
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
    }

    // Window resizing
    startResize(e, window) {
        if (window.dataset.maximized === 'true' || this.isMobile) return;
        
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
        // Clamp to viewport size minus margin and taskbar
        const margin = 20;
        const taskbarHeight = 20    ;
        newWidth = Math.max(200, Math.min(newWidth, window.innerWidth - margin));
        newHeight = Math.max(100, Math.min(newHeight, window.innerHeight - margin - taskbarHeight));
        windowElem.style.width = newWidth + 'px';
        windowElem.style.height = newHeight + 'px';
    }

    endResize() {
        if (this.isResizing && this.currentResizeWindow) {
            // Save new size after resizing
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
    }

    // Bring window to front
    bringWindowToFront(window) {
        window.style.zIndex = ++this.zIndexCounter;
        
        // Update title bar active state
        this.windows.forEach(w => {
            const titleBar = w.querySelector('.xp-title-bar');
            titleBar.classList.toggle('inactive', w !== window);
        });
    }

    // Center window on screen
    centerWindow(window) {
        const rect = window.getBoundingClientRect();
        const x = (window.innerWidth - rect.width) / 2;
        const y = (window.innerHeight - rect.height) / 2;
        
        window.style.left = Math.max(0, x) + 'px';
        window.style.top = Math.max(0, y) + 'px';
    }

    // Taskbar management
    setupTaskbar() {
        const taskbarItems = document.getElementById('taskbar-items');
        this.taskbarItems = taskbarItems;
    }

    addToTaskbar(windowId, window) {
        const taskbarItem = document.createElement('div');
        taskbarItem.className = 'xp-taskbar-item active';
        taskbarItem.dataset.windowId = windowId;
        
        const icon = window.querySelector('.xp-window-icon');
        const title = window.querySelector('.xp-window-title span');
        
        taskbarItem.innerHTML = `
            <div style="width: 16px; height: 16px; background: linear-gradient(45deg, #4A9EFF, #0054E3); border-radius: 2px; display: flex; align-items: center; justify-content: center; color: white; font-size: 8px;">
                ${icon ? icon.textContent : '🪟'}
            </div>
            ${title ? title.textContent : 'Window'}
        `;
        
        taskbarItem.addEventListener('click', () => {
            if (window.style.display === 'none') {
                window.style.display = 'flex';
                this.bringWindowToFront(window);
            } else if (window.style.zIndex == this.zIndexCounter) {
                this.minimizeWindow(window);
            } else {
                this.bringWindowToFront(window);
            }
        });
        
        this.taskbarItems.appendChild(taskbarItem);
    }

    removeFromTaskbar(windowId) {
        const taskbarItem = this.taskbarItems.querySelector(`[data-window-id="${windowId}"]`);
        if (taskbarItem) {
            taskbarItem.remove();
        }
    }

    // Clock setup
    setupClock() {
        const clock = document.getElementById('xp-clock');
        
        function updateClock() {
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
    }

    // Contact Form Setup
    setupContactForm() {
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleContactFormSubmit(e);
            });
        }
    }

    handleContactFormSubmit(e) {
        const formData = new FormData(e.target);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message')
        };

        // Create mailto link with form data
        const mailtoLink = `mailto:oemcgl@gmail.com?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(
            `Name: ${data.name}\nEmail: ${data.email}\n\nMessage:\n${data.message}`
        )}`;

        window.location.href = mailtoLink;
        
        // Show success message
        alert('Opening your email client to send the message!');
        e.target.reset();
    }

    // GitHub Integration
    async setupGitHubIntegration() {
        const projectsContainer = document.getElementById('github-projects');
        if (!projectsContainer) return;

        try {
            const username = 'omcglynn';
            const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=6`);
            
            if (!response.ok) {
                throw new Error('GitHub API request failed');
            }

            const repos = await response.json();
            this.renderGitHubProjects(repos, projectsContainer);
        } catch (error) {
            console.log('GitHub integration disabled:', error.message);
        }
    }

    renderGitHubProjects(repos, container) {
        container.innerHTML = '';

        repos.slice(0, 4).forEach(repo => {
            const projectItem = document.createElement('div');
            projectItem.className = 'project-item';
            
            const language = repo.language || 'Code';
            
            projectItem.innerHTML = `
                <h4>${repo.name}</h4>
                <p>${language} • ${repo.stargazers_count} ⭐</p>
                <a href="${repo.html_url}" target="_blank" class="project-link">View on GitHub →</a>
            `;
            
            container.appendChild(projectItem);
        });
    }

    // Mobile Support
    setupMobileSupport() {
        this.isMobile = this.checkIfMobile();
        
        if (this.isMobile) {
            this.disableDragOnMobile();
        }

        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.isMobile = this.checkIfMobile();
            
            if (this.isMobile && !wasMobile) {
                this.disableDragOnMobile();
            } else if (!this.isMobile && wasMobile) {
                this.enableDragOnDesktop();
            }
        });
    }

    checkIfMobile() {
        return window.innerWidth <= 768 || 'ontouchstart' in window;
    }

    disableDragOnMobile() {
        document.body.classList.add('mobile');
        this.isMobile = true;
    }

    enableDragOnDesktop() {
        document.body.classList.remove('mobile');
        this.isMobile = false;
    }

    handleViewportResize() {
        const margin = 20;
        const taskbar = document.querySelector('.xp-taskbar, .taskbar');
        const taskbarHeight = taskbar ? taskbar.offsetHeight : 20;
        const maxWidth = globalThis.innerWidth - margin;
        const maxHeight = globalThis.innerHeight - margin - taskbarHeight;
        this.windows.forEach(winElem => {
            if (!winElem.classList.contains('active')) return;
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
            // Optionally, clamp position so window is not off-screen
            if (left + winElem.offsetWidth > globalThis.innerWidth - margin) {
                winElem.style.left = Math.max(0, globalThis.innerWidth - margin - winElem.offsetWidth) + 'px';
                resized = true;
            }
            if (top + winElem.offsetHeight > globalThis.innerHeight - margin - taskbarHeight) {
                winElem.style.top = Math.max(0, globalThis.innerHeight - margin - taskbarHeight - winElem.offsetHeight) + 'px';
                resized = true;
            }
            // Optionally, save new size/position if changed
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

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const xpSimulator = new WindowsXPSimulator();
    
    // Make instance globally available for debugging
    window.xpSimulator = xpSimulator;
    
    console.log('Windows XP Simulator initialized! 🪟');
    console.log('Double-click desktop icons to open windows!');
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Press 'Escape' to close all windows (like Alt+F4)
    if (e.key === 'Escape') {
        if (window.xpSimulator) {
            // Close the frontmost window
            const frontWindow = [...window.xpSimulator.windows]
                .filter(w => w.classList.contains('active'))
                .sort((a, b) => parseInt(b.style.zIndex || 0) - parseInt(a.style.zIndex || 0))[0];
            if (frontWindow) {
                window.xpSimulator.closeWindow(frontWindow);
            }
        }
    }
}); 