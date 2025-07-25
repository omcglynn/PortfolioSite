export class QuestManager {
  constructor({
    windowId,
    projectWindowIds,
    allWindowIds,
    resumeLinkSelector,
    docViewerWindowId,
    bsodOverlayId,
    bonziAudioId,
    taskbarItemsId,
  }) {
    this.window = document.getElementById(windowId);
    this.projectWindowIds = projectWindowIds;
    this.allWindowIds = allWindowIds;
    this.resumeLinkSelector = resumeLinkSelector;
    this.docViewerWindowId = docViewerWindowId;
    this.bsodOverlay = document.getElementById(bsodOverlayId);
    this.bonziAudio = document.getElementById(bonziAudioId);
    this.taskbarItems = document.getElementById(taskbarItemsId);
    this.questState = this.loadQuestState();
    this.questList = this.getQuestList();
    this.render();
    this.setupEventHooks();
  }

  getQuestList() {
    return [
      {
        id: 'view_all_projects',
        label: 'View all projects',
        type: 'count',
        total: this.projectWindowIds.length,
      },
      {
        id: 'open_all_windows',
        label: 'Open all windows at least once',
        type: 'count',
        total: this.allWindowIds.length,
      },
      {
        id: 'open_docviewer_file',
        label: 'Open a file in DocViewer',
        type: 'bool',
      },
      {
        id: 'download_resume',
        label: 'Download my resume',
        type: 'bool',
      },
      {
        id: 'reorder_taskbar',
        label: 'Reorder the taskbar',
        type: 'bool',
      },
      {
        id: 'trigger_bsod',
        label: 'Trigger the BSOD',
        type: 'bool',
      },
      {
        id: 'find_buddy',
        label: 'Find a Buddy',
        type: 'bool',
      },
    ];
  }

  loadQuestState() {
    try {
      return JSON.parse(localStorage.getItem('portfolio-quest-state')) || {};
    } catch {
      return {};
    }
  }

  saveQuestState() {
    localStorage.setItem('portfolio-quest-state', JSON.stringify(this.questState));
  }

  render() {
    if (!this.window) return;
    const content = this.window.querySelector('#quest-content');
    if (!content) return;
    // Calculate progress
    let completed = 0;
    let total = this.questList.length;
    // Render checklist
    content.innerHTML = '';
    const title = document.createElement('div');
    title.className = 'quest-title';
    title.textContent = 'Portfolio Quest';
    content.appendChild(title);
    const ul = document.createElement('ul');
    ul.className = 'quest-list';
    this.questList.forEach((q, i) => {
      let checked = false;
      let label = q.label;
      if (q.type === 'count') {
        const count = (this.questState[q.id] && this.questState[q.id].length) || 0;
        label += ` (${count}/${q.total})`;
        checked = count >= q.total;
      } else {
        checked = !!this.questState[q.id];
      }
      if (checked) completed++;
      const li = document.createElement('li');
      li.className = 'quest-list-item' + (checked ? ' checked' : '');
      // XP-style checkbox
      const checkbox = document.createElement('span');
      checkbox.className = 'quest-checkbox' + (checked ? ' checked' : '');
      if (checked) {
        checkbox.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18"></svg>';
      }
      li.appendChild(checkbox);
      // Label
      const labelSpan = document.createElement('span');
      labelSpan.className = 'quest-label';
      labelSpan.textContent = label;
      li.appendChild(labelSpan);
      ul.appendChild(li);
    });
    content.appendChild(ul);
    // Progress bar
    const percent = Math.round((completed / total) * 100);
    const barWrap = document.createElement('div');
    barWrap.className = 'quest-progress-wrap';
    const bar = document.createElement('div');
    bar.className = 'quest-progress-bar' + (percent === 100 ? ' complete' : '');
    bar.style.width = percent + '%';
    barWrap.appendChild(bar);
    // Progress text overlay
    const progressText = document.createElement('div');
    progressText.className = 'quest-progress-text';
    progressText.textContent = `${percent}% complete`;
    barWrap.appendChild(progressText);
    content.appendChild(barWrap);
    // Completion message and effects
    if (completed === total) {
      const msg = document.createElement('div');
      msg.className = 'quest-complete-msg';
      msg.textContent = 'Quest Complete!';
      content.appendChild(msg);
      // Only trigger effects if not already triggered
      if (!this.questState.__questCompleteTriggered) {
        this.questState.__questCompleteTriggered = true;
        this.saveQuestState();
        // Bring quest window to front
        if (this.window.windowManager) {
          this.window.windowManager.openWindow(this.window, 'quest');
        } else {
          this.window.style.display = 'flex';
          this.window.style.zIndex = 1000;
        }
        // Play tada sound
        const tada = document.getElementById('quest-tada-audio');
        if (tada) {
          tada.currentTime = 0;
          tada.play();
        }
      }
    } else {
      // Reset trigger if not complete
      if (this.questState.__questCompleteTriggered) {
        this.questState.__questCompleteTriggered = false;
        this.saveQuestState();
      }
    }
  }

  setupEventHooks() {
    // Project windows
    this.projectWindowIds.forEach(pid => {
      const win = document.getElementById(`window-${pid}`);
      if (win) {
        win.addEventListener('show', () => this.markProjectViewed(pid));
      }
    });
    // All windows
    this.allWindowIds.forEach(wid => {
      const win = document.getElementById(`window-${wid}`);
      if (win) {
        win.addEventListener('show', () => this.markWindowOpened(wid));
      }
    });
    // DocViewer file open
    document.addEventListener('docviewer:fileopen', () => this.markQuest('open_docviewer_file'));
    // Resume download (from DocViewer only)
    document.addEventListener('docviewer:downloadresume', () => this.markQuest('download_resume'));
    // BSOD
    if (this.bsodOverlay) {
      const observer = new MutationObserver(mutations => {
        mutations.forEach(m => {
          if (m.attributeName === 'style' && this.bsodOverlay.style.display !== 'none') {
            this.markQuest('trigger_bsod');
          }
        });
      });
      observer.observe(this.bsodOverlay, { attributes: true });
    }
    // BonziBuddy
    if (this.bonziAudio) {
      this.bonziAudio.addEventListener('play', () => this.markQuest('find_buddy'));
    }
    // Taskbar reorder
    if (this.taskbarItems) {
      this.taskbarItems.addEventListener('mouseup', () => {
        // On mouseup after drag, check if order changed
        this.markQuest('reorder_taskbar');
      });
    }
  }

  markProjectViewed(pid) {
    if (!this.questState['view_all_projects']) this.questState['view_all_projects'] = [];
    if (!this.questState['view_all_projects'].includes(pid)) {
      this.questState['view_all_projects'].push(pid);
      this.saveQuestState();
      this.render();
    }
  }

  markWindowOpened(wid) {
    if (!this.questState['open_all_windows']) this.questState['open_all_windows'] = [];
    if (!this.questState['open_all_windows'].includes(wid)) {
      this.questState['open_all_windows'].push(wid);
      this.saveQuestState();
      this.render();
    }
  }

  markQuest(id) {
    if (!this.questState[id]) {
      this.questState[id] = true;
      this.saveQuestState();
      this.render();
    }
  }
} 