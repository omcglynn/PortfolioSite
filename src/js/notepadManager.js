// NotepadManager logic for XP simulator
// Handles text file viewing in the notepad window

export class NotepadManager {
    constructor(windowSelector = '#window-contactinfo', windowManager = null) {
        this.window = document.querySelector(windowSelector);
        this.tabsContainer = this.window ? this.window.querySelector('#notepad-tabs') : null;
        this.contentContainer = this.window ? this.window.querySelector('#notepad-content') : null;
        this.windowManager = windowManager;
        this.tabs = [];
        this.activeTab = null;
        this.setupEvents();
        this.restoreTabsFromStorage();
        
        // REMOVE: If no tabs were restored, create a default contact info tab
        // if (this.tabs.length === 0) {
        //     this.createDefaultContactInfoTab();
        // }
    }

    saveTabsToStorage() {
        const tabsToSave = this.tabs.map(tab => ({ id: tab.id, url: tab.url, name: tab.name, ext: tab.ext, isDefault: tab.isDefault || false }));
        const activeTabId = this.activeTab ? this.activeTab.id : null;
        localStorage.setItem('notepad-tabs', JSON.stringify(tabsToSave));
        localStorage.setItem('notepad-active-tab', activeTabId);
    }

    restoreTabsFromStorage() {
        const tabsJson = localStorage.getItem('notepad-tabs');
        const activeTabId = localStorage.getItem('notepad-active-tab');
        console.log('Restoring tabs from storage:', { tabsJson, activeTabId });
        if (tabsJson) {
            try {
                const tabsArr = JSON.parse(tabsJson);
                console.log('Parsed tabs:', tabsArr);
                this.tabs = tabsArr.map(tab => ({
                    id: tab.id, // Use the saved ID, don't generate new ones
                    url: tab.url,
                    name: tab.name,
                    ext: tab.ext,
                    isDefault: tab.isDefault || false
                }));
                console.log('Restored tabs:', this.tabs);
                if (this.tabs.length > 0) {
                    let toActivate = this.tabs[0].id;
                    if (activeTabId) {
                        const found = this.tabs.find(tab => tab.id === activeTabId);
                        console.log('Looking for active tab:', activeTabId, 'Found:', found);
                        if (found) toActivate = found.id;
                    }
                    console.log('Activating tab:', toActivate);
                    this.setActiveTab(toActivate);
                }
                this.renderTabs();
            } catch (e) {
                console.error('Error restoring tabs:', e);
            }
        }
    }

    setupEvents() {
        // Add new tab button
        const addTabBtn = document.getElementById('notepad-add-tab');
        if (addTabBtn) {
            addTabBtn.addEventListener('click', () => this.addNewTab());
        }
    }

    openTextFile(url, name, skipOpenWindow = false) {
        // If already open, switch to tab
        const existing = this.tabs.find(tab => tab.url === url);
        if (existing) {
            this.setActiveTab(existing.id);
            if (!skipOpenWindow) this.bringToFront();
            return;
        }
        // Always use the filename for the tab name
        const filename = url.split('/').pop();
        const id = 'tab-' + Date.now() + '-' + Math.random().toString(36).slice(2);
        const ext = url.split('.').pop().toLowerCase();
        const tab = { id, url, name: filename, ext };
        this.tabs.push(tab);
        this.renderTabs();
        this.setActiveTab(id);
        this.saveTabsToStorage();
        if (!skipOpenWindow) this.bringToFront();
    }

    setActiveTab(id) {
        this.activeTab = this.tabs.find(tab => tab.id === id);
        this.renderContent();
        this.renderTabs();
        this.saveTabsToStorage(); // Save state when active tab changes
    }

    closeTab(id) {
        const index = this.tabs.findIndex(tab => tab.id === id);
        if (index === -1) return;

        this.tabs.splice(index, 1);
        this.saveTabsToStorage();

        if (this.activeTab && this.activeTab.id === id) {
            if (this.tabs.length > 0) {
                this.setActiveTab(this.tabs[0].id);
            } else {
                this.activeTab = null;
                this.renderContent();
            }
        }

        this.renderTabs();
    }

    renderTabs() {
        if (!this.tabsContainer) return;
        this.tabsContainer.innerHTML = '';
        
        this.tabs.forEach(tab => {
            const tabElement = document.createElement('div');
            tabElement.className = 'notepad-tab';
            if (this.activeTab && this.activeTab.id === tab.id) {
                tabElement.classList.add('active');
            }

            const tabName = document.createElement('span');
            tabName.textContent = tab.name;
            tabElement.appendChild(tabName);

            const closeBtn = document.createElement('span');
            closeBtn.className = 'notepad-tab-close';
            closeBtn.innerHTML = '×';
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeTab(tab.id);
            });
            tabElement.appendChild(closeBtn);

            tabElement.addEventListener('click', () => this.setActiveTab(tab.id));
            this.tabsContainer.appendChild(tabElement);
        });
    }

    renderContent() {
        if (!this.contentContainer) return;
        if (!this.activeTab) {
            this.contentContainer.innerHTML = '<div class="notepad-empty">No file open</div>';
            return;
        }
        if (!this.activeTab.url) {
            if (this.activeTab.isDefault) {
                // Default contact info tab
                this.contentContainer.innerHTML = `
                    <pre class="notepad-content">
Email: oemcgl@gmail.com
Phone: (913) 424-2420
Home Locale: Overland Park, KS
School Locale: Amherst, MA

LinkedIn: linkedin.com/in/owen-mcglynn-1063ba257
GitHub: github.com/omcglynn
                    </pre>
                `;
            } else {
                // REMOVE: New tab - show empty editor
                this.contentContainer.innerHTML = '<div class="notepad-empty">No file open</div>';
            }
            return;
        }
        // Load text file content
        fetch(this.activeTab.url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(text => {
                this.contentContainer.innerHTML = `
                    <pre class="notepad-content">${this.escapeHtml(text)}</pre>
                `;
            })
            .catch(error => {
                console.error('Error loading text file:', error);
                this.contentContainer.innerHTML = `
                    <div class="notepad-error">
                        Error loading file: ${this.activeTab.name}<br>
                        ${error.message}
                    </div>
                `;
            });
    }

    renderError(errorMessage) {
        if (!this.contentContainer) return;

        this.contentContainer.innerHTML = `
            <div style="color: #d32f2f; font-family: 'FSTahoma8px', 'Tahoma', 'MS Sans Serif', sans-serif; font-size: 13px; padding: 8px;">
                Error loading file: ${this.activeTab ? this.activeTab.name : 'Unknown'}<br>
                ${errorMessage}
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    bringToFront() {
        if (this.windowManager) {
            this.windowManager.bringWindowToFront(this.window);
        } else {
            this.window.style.display = 'block';
            this.window.style.zIndex = 1000;
        }
    }

    hide() {
        if (this.window) {
            this.window.style.display = 'none';
        }
    }

    show() {
        if (this.window) {
            this.window.style.display = 'block';
        }
    }

    // REMOVE: createDefaultContactInfoTab() method
    // REMOVE: resetToContactInfo() method
}

// Setup function for notepad links
export function setupNotepadLinks(notepadInstance, windowManager) {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('notepad-link')) {
            const href = e.target.getAttribute('href');
            if (href && /\.(txt|md|log|ini|cfg|conf)$/i.test(href)) {
                e.preventDefault();
                e.stopPropagation();
                const name = e.target.textContent.trim() || href.split('/').pop();
                notepadInstance.openTextFile(href, name);
                // Ensure the notepad window is open
                if (windowManager && notepadInstance.window) {
                    windowManager.openWindow(notepadInstance.window, 'contactinfo');
                }
            }
        }
    }, true); // Use capture phase to handle before other listeners
} 