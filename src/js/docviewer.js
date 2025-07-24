// DocViewer logic for XP simulator
// Handles PDF/doc viewing

export class DocViewer {
    constructor(windowSelector = '#window-docviewer', windowManager = null) {
        this.window = document.querySelector(windowSelector);
        this.tabsBar = document.getElementById('docviewer-tabs');
        this.contentArea = document.getElementById('docviewer-content');
        this.zoomInBtn = document.getElementById('docviewer-zoom-in');
        this.zoomOutBtn = document.getElementById('docviewer-zoom-out');
        this.downloadBtn = document.getElementById('docviewer-download');
        this.tabs = [];
        this.activeTab = null;
        this.zoom = 1.0;
        this.windowManager = windowManager;
        this.setupEvents();
        this.restoreTabsFromStorage();
    }

    saveTabsToStorage() {
        const tabsToSave = this.tabs.map(tab => ({ url: tab.url, name: tab.name, ext: tab.ext }));
        const activeTabUrl = this.activeTab ? this.activeTab.url : null;
        localStorage.setItem('docviewer-tabs', JSON.stringify(tabsToSave));
        localStorage.setItem('docviewer-active-tab', activeTabUrl);
    }

    restoreTabsFromStorage() {
        const tabsJson = localStorage.getItem('docviewer-tabs');
        const activeTabUrl = localStorage.getItem('docviewer-active-tab');
        if (tabsJson) {
            try {
                const tabsArr = JSON.parse(tabsJson);
                this.tabs = tabsArr.map(tab => {
                    const id = 'tab-' + Date.now() + '-' + Math.random().toString(36).slice(2);
                    return { id, ...tab };
                });
                this.renderTabs();
                if (this.tabs.length > 0) {
                    let toActivate = this.tabs[0].id;
                    if (activeTabUrl) {
                        const found = this.tabs.find(tab => tab.url === activeTabUrl);
                        if (found) toActivate = found.id;
                    }
                    this.setActiveTab(toActivate);
                }
            } catch (e) {
                // Ignore parse errors
            }
        }
    }

    setupEvents() {
        this.zoomInBtn.addEventListener('click', () => this.setZoom(this.zoom * 1.2));
        this.zoomOutBtn.addEventListener('click', () => this.setZoom(this.zoom / 1.2));
        this.downloadBtn.addEventListener('click', () => {
            if (this.activeTab) {
                window.open(this.activeTab.url, '_blank');
            }
        });
    }

    openDoc(url, name, skipOpenWindow = false) {
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
        this.renderTabs();
        this.renderContent();
        this.saveTabsToStorage();
    }

    closeTab(id) {
        const idx = this.tabs.findIndex(tab => tab.id === id);
        if (idx !== -1) {
            this.tabs.splice(idx, 1);
            if (this.activeTab && this.activeTab.id === id) {
                if (this.tabs.length > 0) {
                    this.setActiveTab(this.tabs[Math.max(0, idx - 1)].id);
                } else {
                    this.activeTab = null;
                    this.renderTabs();
                    this.renderContent();
                    this.hide();
                }
            } else {
                this.renderTabs();
            }
            this.saveTabsToStorage();
        }
    }

    renderTabs() {
        this.tabsBar.innerHTML = '';
        this.tabs.forEach(tab => {
            const tabEl = document.createElement('div');
            tabEl.className = 'docviewer-tab' + (this.activeTab && tab.id === this.activeTab.id ? ' active' : '');
            tabEl.textContent = tab.name;
            tabEl.title = tab.url;
            tabEl.style.padding = '4px 12px';
            tabEl.style.cursor = 'pointer';
            tabEl.style.borderRight = '1px solid #b5b5b5';
            tabEl.style.background = (this.activeTab && tab.id === this.activeTab.id) ? '#fff' : '#e5e5e5';
            tabEl.addEventListener('click', () => this.setActiveTab(tab.id));
            // Close button
            const closeBtn = document.createElement('span');
            closeBtn.textContent = ' ×';
            closeBtn.style.marginLeft = '8px';
            closeBtn.style.color = '#888';
            closeBtn.style.cursor = 'pointer';
            closeBtn.addEventListener('click', e => {
                e.stopPropagation();
                this.closeTab(tab.id);
            });
            tabEl.appendChild(closeBtn);
            this.tabsBar.appendChild(tabEl);
        });
    }

    renderContent() {
        this.contentArea.innerHTML = '';
        this.zoom = 1.0;
        if (!this.activeTab) return;
        const { url, ext } = this.activeTab;
        if (['pdf'].includes(ext)) {
            // PDF.js rendering
            const pdfContainer = document.createElement('div');
            pdfContainer.id = 'docviewer-pdf-container';
            pdfContainer.style.width = '100%';
            pdfContainer.style.height = '100%';
            this.contentArea.appendChild(pdfContainer);
            this.renderPDF(url, this.zoom);
        } else if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) {
            // Image rendering
            const img = document.createElement('img');
            img.src = url;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '100%';
            img.style.transform = `scale(${this.zoom})`;
            img.onload = () => { img.style.display = 'block'; };
            this.contentArea.appendChild(img);
        } else {
            // Fallback: download link
            const link = document.createElement('a');
            link.href = url;
            link.textContent = 'Download ' + this.activeTab.name;
            link.className = 'xp-button';
            link.download = this.activeTab.name;
            this.contentArea.appendChild(link);
        }
    }

    setZoom(zoom) {
        this.zoom = Math.max(0.2, Math.min(zoom, 5));
        if (!this.activeTab) return;
        const { ext } = this.activeTab;
        if (['pdf'].includes(ext)) {
            this.renderPDF(this.activeTab.url, this.zoom);
        } else if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) {
            const img = this.contentArea.querySelector('img');
            if (img) {
                img.style.transform = `scale(${this.zoom})`;
            }
        }
    }

    renderPDF(url, zoom) {
        if (!window.pdfjsLib) {
            this.contentArea.innerHTML = '<div style="color: #888;">PDF.js not loaded</div>';
            return;
        }
        const container = this.contentArea.querySelector('#docviewer-pdf-container');
        container.innerHTML = '';
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js';
        window.pdfjsLib.getDocument(url).promise.then(pdf => {
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                pdf.getPage(pageNum).then(page => {
                    const viewport = page.getViewport({ scale: zoom });
                    const canvas = document.createElement('canvas');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    const ctx = canvas.getContext('2d');
                    page.render({ canvasContext: ctx, viewport }).promise.then(() => {
                        container.appendChild(canvas);
                    });
                });
            }
        }).catch(err => {
            container.innerHTML = '<div style="color: #c00;">Failed to load PDF: ' + err.message + '</div>';
        });
    }

    bringToFront() {
        if (this.windowManager) {
            this.windowManager.openWindow(this.window, 'docviewer');
        } else {
            this.window.style.display = 'flex';
            this.window.style.zIndex = 1000;
        }
    }

    hide() {
        this.window.style.display = 'none';
    }
}

// Intercept document links to open in DocViewer
export function setupDocViewerLinks(docViewerInstance, windowManager) {
    document.querySelectorAll('a.xp-button, a.docviewer-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href && /\.(pdf|png|jpg|jpeg|gif|svg)$/i.test(href)) {
            link.addEventListener('click', e => {
                e.preventDefault();
                const name = link.textContent.trim() || href.split('/').pop();
                docViewerInstance.openDoc(href, name);
                if (windowManager) {
                    windowManager.openWindow(docViewerInstance.window, 'docviewer');
                } else {
                    docViewerInstance.bringToFront();
                }
            });
        }
    });
} 