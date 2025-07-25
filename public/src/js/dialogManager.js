// Dialog Manager for XP-style system dialogs
// Handles creation, display, and management of modal dialogs

export class DialogManager {
    constructor() {
        this.activeDialog = null;
        this.dialogContainer = null;
        this.init();
    }

    init() {
        // Create dialog container if it doesn't exist
        if (!document.getElementById('xp-dialog-container')) {
            this.dialogContainer = document.createElement('div');
            this.dialogContainer.id = 'xp-dialog-container';
            this.dialogContainer.style.display = 'none';
            document.body.appendChild(this.dialogContainer);
        } else {
            this.dialogContainer = document.getElementById('xp-dialog-container');
        }
    }

    showDialog(options = {}) {
        const {
            title = 'System Message',
            message = '',
            type = 'info', // 'info', 'success', 'error', 'warning'
            buttons = ['OK'],
            onButtonClick = null,
            icon = null
        } = options;

        // Remove any existing dialog
        if (this.activeDialog) {
            this.activeDialog.remove();
        }

        // Create dialog element
        const dialog = document.createElement('div');
        dialog.className = 'xp-dialog';
        dialog.id = 'xp-dialog-' + Date.now();
        dialog.setAttribute('data-type', type);

        // Set dialog content
        dialog.innerHTML = `
            <div class="xp-dialog-title-bar">
                <div class="xp-dialog-icon">
                    ${this.getIconHTML(type, icon)}
                </div>
                <span class="xp-dialog-title">${title}</span>
                <div class="xp-dialog-close-btn" role="button" tabindex="0" aria-label="Close">×</div>
            </div>
            <div class="xp-dialog-content">
                <div class="xp-dialog-message">${message}</div>
            </div>
            <div class="xp-dialog-buttons">
                ${buttons.map(button => `<button class="xp-dialog-btn" data-button="${button}">${button}</button>`).join('')}
            </div>
        `;

        // Add event listeners
        const closeBtn = dialog.querySelector('.xp-dialog-close-btn');
        closeBtn.addEventListener('click', () => this.closeDialog());

        const dialogBtns = dialog.querySelectorAll('.xp-dialog-btn');
        dialogBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const buttonText = e.target.dataset.button;
                if (onButtonClick) {
                    onButtonClick(buttonText);
                }
                this.closeDialog();
            });
        });

        // Add to container and show
        this.dialogContainer.appendChild(dialog);
        this.activeDialog = dialog;
        this.dialogContainer.style.display = 'flex';

        // Focus the first button
        const firstBtn = dialog.querySelector('.xp-dialog-btn');
        if (firstBtn) {
            firstBtn.focus();
        }

        // Add keyboard support
        dialog.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeDialog();
            } else if (e.key === 'Enter') {
                const focusedBtn = dialog.querySelector('.xp-dialog-btn:focus');
                if (focusedBtn) {
                    focusedBtn.click();
                }
            }
        });

        return dialog;
    }

    closeDialog() {
        if (this.activeDialog) {
            this.activeDialog.remove();
            this.activeDialog = null;
        }
        this.dialogContainer.style.display = 'none';
    }

    getIconHTML(type, customIcon) {
        if (customIcon) {
            return `<img src="${customIcon}" alt="" style="width: 32px; height: 32px;">`;
        }

        const icons = {
            info: 'ℹ️',
            success: '✅',
            error: '❌',
            warning: '⚠️'
        };

        return `<div class="xp-dialog-icon-char">${icons[type] || icons.info}</div>`;
    }

    // Convenience methods for common dialog types
    showInfo(title, message, buttons = ['OK']) {
        return this.showDialog({
            title,
            message,
            type: 'info',
            buttons
        });
    }

    showSuccess(title, message, buttons = ['OK']) {
        return this.showDialog({
            title,
            message,
            type: 'success',
            buttons
        });
    }

    showError(title, message, buttons = ['OK']) {
        return this.showDialog({
            title,
            message,
            type: 'error',
            buttons
        });
    }

    showWarning(title, message, buttons = ['OK']) {
        return this.showDialog({
            title,
            message,
            type: 'warning',
            buttons
        });
    }
} 