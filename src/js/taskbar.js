// Taskbar logic for XP simulator
// Handles taskbar, task switching, drag/drop, etc.

export class TaskbarManager {
    constructor(taskbarItemsId = 'taskbar-items', windowManager = null) {
        this.taskbarItems = document.getElementById(taskbarItemsId);
        this.draggedTaskbarItem = null;
        this.draggedWindowId = null;
        this.windowManager = windowManager;
        this.isInitializing = true;
    }

    saveTaskbarOrder() {
        const order = Array.from(this.taskbarItems.children).map(item => item.dataset.windowId);
        console.log('[TaskbarManager] Saving taskbar order:', order);
        localStorage.setItem('xp-taskbar-order', JSON.stringify(order));
    }

    restoreTaskbarOrder() {
        const orderStr = localStorage.getItem('xp-taskbar-order');
        if (!orderStr) return;
        const order = JSON.parse(orderStr);
        console.log('[TaskbarManager] Restoring taskbar order:', order);

        // Build a map of current items
        const items = {};
        Array.from(this.taskbarItems.children).forEach(item => {
            items[item.dataset.windowId] = item;
        });

        // Remove all children
        while (this.taskbarItems.firstChild) {
            this.taskbarItems.removeChild(this.taskbarItems.firstChild);
        }

        // Re-append in saved order
        order.forEach(id => {
            if (items[id]) {
                this.taskbarItems.appendChild(items[id]);
                delete items[id]; // Remove from map so we know what's left
            }
        });

        // Append any new items not in saved order
        Object.values(items).forEach(item => {
            this.taskbarItems.appendChild(item);
        });

        // Debug: log current DOM order
        const currentOrder = Array.from(this.taskbarItems.children).map(item => item.dataset.windowId);
        console.log('[TaskbarManager] Current DOM taskbar order:', currentOrder);
        this.isInitializing = false; // Set to false after restoration
    }

    addToTaskbar(windowId, window) {
        const existing = this.taskbarItems.querySelector(`[data-window-id="${windowId}"]`);
        if (existing) {
            console.log(`[TaskbarManager] Taskbar item for '${windowId}' already exists, not re-appending.`);
            return;
        }
        const taskbarItem = document.createElement('div');
        taskbarItem.className = 'xp-taskbar-item active';
        taskbarItem.dataset.windowId = windowId;
        let taskbarText = 'Window';
        const desktopIcon = document.querySelector(`[data-window="${windowId}"]`);
        if (desktopIcon) {
            const iconLabel = desktopIcon.querySelector('.icon-label');
            if (iconLabel) {
                taskbarText = iconLabel.textContent;
            }
        }
        let iconImageUrl = '';
        switch(windowId) {
            case 'about': iconImageUrl = '/assets/images/windows/window-about.png'; break;
            case 'contact': iconImageUrl = '/assets/images/windows/window-contact.png'; break;
            case 'project1': iconImageUrl = '/assets/images/windows/betabreak.png'; break;
            case 'project2': iconImageUrl = '/assets/images/windows/storme.png'; break;
            case 'project3': iconImageUrl = '/assets/images/icons/ai-ico.png'; break;
            case 'contactinfo': iconImageUrl = '/assets/images/icons/txt.png'; break;
            case 'project4': iconImageUrl = '/assets/images/icons/cyberpaper.png'; break;
            case 'quest': iconImageUrl = '/assets/images/icons/my-computer.png'; break;
            case 'explorer': iconImageUrl = '/assets/images/icons/my-documents.png'; break;
            case 'recyclebin': iconImageUrl = '/assets/images/icons/recycle-bin.png'; break;
            case 'docviewer': iconImageUrl = '/assets/images/icons/docViewer.png'; break;
            default: iconImageUrl = '';
        }
        const iconStyle = iconImageUrl ? `background-image: url('${iconImageUrl}'); background-size: contain; background-repeat: no-repeat; background-position: center;` : '';
        taskbarItem.innerHTML = `
            <div style="width: 16px; height: 16px; ${iconImageUrl ? '' : 'background: linear-gradient(45deg, #4A9EFF, #0054E3);'} border-radius: 2px; display: flex; align-items: center; justify-content: center; color: white; font-size: 8px; ${iconStyle}">
                ${!iconImageUrl ? '🪟' : ''}
            </div>
            ${taskbarText}
        `;
        taskbarItem.draggable = true;
        taskbarItem.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', windowId);
            taskbarItem.style.opacity = '0';
            this.draggedTaskbarItem = taskbarItem;
            this.draggedWindowId = windowId;
            const dragImage = taskbarItem.cloneNode(true);
            dragImage.style.position = 'fixed';
            dragImage.style.top = '-1000px';
            dragImage.style.left = '-1000px';
            dragImage.style.zIndex = '9999';
            dragImage.style.pointerEvents = 'none';
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, 0, 0);
            setTimeout(() => { document.body.removeChild(dragImage); }, 0);
        });
        taskbarItem.addEventListener('dragend', () => {
            taskbarItem.style.opacity = '1';
            this.draggedTaskbarItem = null;
            this.draggedWindowId = null;
        });
        taskbarItem.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (this.draggedTaskbarItem && this.draggedTaskbarItem !== taskbarItem) {
                this.handleTaskbarDragOver(e, taskbarItem);
            }
        });
        taskbarItem.addEventListener('dragenter', (e) => {
            e.preventDefault();
            if (this.draggedTaskbarItem && this.draggedTaskbarItem !== taskbarItem) {
                this.handleTaskbarDragEnter(e, taskbarItem);
            }
        });
        taskbarItem.addEventListener('dragleave', (e) => {
            e.preventDefault();
            if (this.draggedTaskbarItem && this.draggedTaskbarItem !== taskbarItem) {
                this.handleTaskbarDragLeave(e, taskbarItem);
            }
        });
        taskbarItem.addEventListener('drop', (e) => {
            e.preventDefault();
            if (this.draggedTaskbarItem && this.draggedTaskbarItem !== taskbarItem) {
                this.handleTaskbarDrop(e, taskbarItem);
            }
        });
        taskbarItem.addEventListener('click', () => {
            if (this.windowManager) {
                this.windowManager.handleTaskbarClick(windowId);
            }
        });
        this.taskbarItems.appendChild(taskbarItem);
        console.log(`[TaskbarManager] Appended new taskbar item for '${windowId}'.`);
        if (!this.isInitializing) {
            this.saveTaskbarOrder();
        }
    }

    removeFromTaskbar(windowId) {
        const item = this.taskbarItems.querySelector(`[data-window-id="${windowId}"]`);
        if (item) {
            this.taskbarItems.removeChild(item);
            if (!this.isInitializing) {
                this.saveTaskbarOrder();
            }
        }
    }

    handleTaskbarDragOver(e, targetItem) {
        const rect = targetItem.getBoundingClientRect();
        const mouseX = e.clientX;
        const centerX = rect.left + rect.width / 2;
        if (mouseX < centerX) {
            targetItem.style.borderLeft = '2px solid #4A9EFF';
            targetItem.style.borderRight = '';
        } else {
            targetItem.style.borderRight = '2px solid #4A9EFF';
            targetItem.style.borderLeft = '';
        }
    }

    handleTaskbarDragEnter(e, targetItem) {
        targetItem.style.backgroundColor = 'rgba(74, 158, 255, 0.2)';
    }

    handleTaskbarDragLeave(e, targetItem) {
        targetItem.style.backgroundColor = '';
        targetItem.style.borderLeft = '';
        targetItem.style.borderRight = '';
    }

    handleTaskbarDrop(e, targetItem) {
        const draggedId = this.draggedWindowId;
        const targetId = targetItem.dataset.windowId;
        if (!draggedId || !targetId || draggedId === targetId) return;
        const draggedElem = this.taskbarItems.querySelector(`[data-window-id="${draggedId}"]`);
        if (!draggedElem) return;
        const rect = targetItem.getBoundingClientRect();
        const mouseX = e.clientX;
        const centerX = rect.left + rect.width / 2;
        if (mouseX < centerX) {
            this.taskbarItems.insertBefore(draggedElem, targetItem);
        } else {
            this.taskbarItems.insertBefore(draggedElem, targetItem.nextSibling);
        }
        targetItem.style.backgroundColor = '';
        targetItem.style.borderLeft = '';
        targetItem.style.borderRight = '';
        this.saveTaskbarOrder();
    }
} 