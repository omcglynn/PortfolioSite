// Icon logic for XP simulator
// Handles icon drag/drop, double-click, grid, selection, position memory

export class IconManager {
    constructor(desktopSelector = '#desktop') {
        this.desktop = document.querySelector(desktopSelector);
        this.desktopIcons = this.desktop.querySelectorAll('.desktop-icon');
        this.isDraggingIcon = false;
        this.currentIcon = null;
        this.iconOffset = { x: 0, y: 0 };
        this.gridOrigin = { x: 20, y: 20 };
        this.gridSize = 100;
        this.iconPositions = {};
        this.init();
    }

    init() {
        this.loadIconPositions();
        this.desktopIcons.forEach((icon, index) => {
            this.restoreIconPosition(icon);
            icon.addEventListener('click', () => this.selectIcon(icon));
            icon.addEventListener('dblclick', () => this.handleIconDoubleClick(icon));
            icon.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return;
                let dragStarted = false;
                const dragDelay = setTimeout(() => {
                    dragStarted = true;
                    this.startIconDrag(e, icon);
                }, 180);
                const onMouseUp = () => {
                    clearTimeout(dragDelay);
                    window.removeEventListener('mouseup', onMouseUp);
                };
                window.addEventListener('mouseup', onMouseUp);
            });
            icon.style.cursor = 'pointer';
            icon.style.userSelect = 'none';
        });
        document.addEventListener('mousemove', (e) => this.dragIcon(e));
        document.addEventListener('mouseup', () => this.endIconDrag());
    }

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
        } catch (e) {}
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
        const relativeX = x - this.gridOrigin.x;
        const relativeY = y - this.gridOrigin.y;
        const snappedRelativeX = Math.round(relativeX / this.gridSize) * this.gridSize;
        const snappedRelativeY = Math.round(relativeY / this.gridSize) * this.gridSize;
        return {
            x: snappedRelativeX + this.gridOrigin.x,
            y: snappedRelativeY + this.gridOrigin.y
        };
    }

    startIconDrag(e, icon) {
        this.isDraggingIcon = true;
        this.currentIcon = icon;
        const rect = icon.getBoundingClientRect();
        const desktopRect = this.desktop.getBoundingClientRect();
        this.iconOffset.x = e.clientX - rect.left;
        this.iconOffset.y = e.clientY - rect.top;
        icon.style.opacity = '0.7';
        icon.style.zIndex = '1000';
        icon.classList.add('dragging');
        this.selectIcon(icon);
        e.preventDefault();
    }

    dragIcon(e) {
        if (!this.isDraggingIcon || !this.currentIcon) return;
        const desktopRect = this.desktop.getBoundingClientRect();
        let x = e.clientX - this.iconOffset.x - desktopRect.left;
        let y = e.clientY - this.iconOffset.y - desktopRect.top;
        x = Math.max(0, Math.min(x, this.desktop.clientWidth - 72));
        y = Math.max(0, Math.min(y, this.desktop.clientHeight - 72));
        this.currentIcon.style.left = x + 'px';
        this.currentIcon.style.top = y + 'px';
    }

    endIconDrag() {
        if (!this.isDraggingIcon || !this.currentIcon) return;
        const icon = this.currentIcon;
        const x = parseInt(icon.style.left) || 0;
        const y = parseInt(icon.style.top) || 0;
        const snapped = this.snapToGrid(x, y);
        icon.style.left = snapped.x + 'px';
        icon.style.top = snapped.y + 'px';
        const iconId = icon.dataset.window || icon.textContent;
        this.saveIconPosition(iconId, snapped);
        icon.style.opacity = '';
        icon.style.zIndex = '';
        icon.classList.remove('dragging');
        this.isDraggingIcon = false;
        this.currentIcon = null;
    }

    selectIcon(icon) {
        this.desktopIcons.forEach(i => i.classList.remove('selected'));
        icon.classList.add('selected');
    }

    handleIconDoubleClick(icon) {
        const windowId = icon.dataset.window;
        // Special case: My Computer icon opens Portfolio Quest
        if (icon.classList.contains('desktop-shortcut') && icon.querySelector('.icon-label')?.textContent.trim() === 'My Computer') {
            const questWindow = document.getElementById('window-quest');
            if (questWindow && questWindow.windowManager) {
                questWindow.windowManager.openWindow(questWindow, 'quest');
            }
            return;
        }
        const windowElem = document.getElementById(`window-${windowId}`);
        if (windowElem && windowElem.windowManager) {
            windowElem.windowManager.openWindow(windowElem, windowId);
        }
    }
} 