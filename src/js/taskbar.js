// Taskbar logic for XP simulator
// Handles taskbar, task switching, drag/drop, etc.

export class TaskbarManager {
    constructor(taskbarItemsId = 'taskbar-items', windowManager = null) {
        this.taskbarItems = document.getElementById(taskbarItemsId);
        this.draggedTaskbarItem = null;
        this.draggedWindowId = null;
        this.windowManager = windowManager;
    }

    addToTaskbar(windowId, window) {
        if (this.taskbarItems.querySelector(`[data-window-id="${windowId}"]`)) {
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
            case 'about': iconImageUrl = '${import.meta.env.BASE_URL}/assets/images/windows/window-about.png'; break;
            case 'contact': iconImageUrl = '${import.meta.env.BASE_URL}/assets/images/windows/window-contact.png'; break;
            case 'project1': iconImageUrl = '${import.meta.env.BASE_URL}/assets/images/windows/betabreak.png'; break;
            case 'project2': iconImageUrl = '${import.meta.env.BASE_URL}/assets/images/windows/storme.png'; break;
            case 'project3': iconImageUrl = '${import.meta.env.BASE_URL}/assets/images/icons/ai-ico.png'; break;
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
    }

    removeFromTaskbar(windowId) {
        const item = this.taskbarItems.querySelector(`[data-window-id="${windowId}"]`);
        if (item) this.taskbarItems.removeChild(item);
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
    }
} 