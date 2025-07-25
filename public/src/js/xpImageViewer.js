

export class XPImageViewer {
  constructor({
    container,
    assets = [],
    docViewer = null,
    startIndex = 0,
    borderColor = '#4A9EFF', // XP active title bar blue
  }) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.assets = assets;
    this.docViewer = docViewer;
    this.index = startIndex;
    this.borderColor = borderColor;
    this.isPlaying = false;
    this.videoEl = null;
    this.render();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = '';
    this.container.classList.add('xp-image-viewer-container');
    // Main viewer area
    const viewer = document.createElement('div');
    viewer.className = 'xp-image-viewer';
    viewer.style.borderColor = this.borderColor;
    // Asset display
    const asset = this.assets[this.index];
    let assetEl;
    if (asset && this.isVideo(asset)) {
      assetEl = document.createElement('video');
      assetEl.src = asset;
      assetEl.controls = false;
      assetEl.autoplay = false;
      assetEl.className = 'xp-image-viewer-media';
      assetEl.style.background = '#000';
      assetEl.style.maxWidth = '100%';
      assetEl.style.maxHeight = '100%';
      assetEl.addEventListener('ended', () => this.next());
      this.videoEl = assetEl;
    } else if (asset) {
      assetEl = document.createElement('img');
      assetEl.src = asset;
      assetEl.alt = '';
      assetEl.className = 'xp-image-viewer-media';
      assetEl.style.maxWidth = '100%';
      assetEl.style.maxHeight = '100%';
      this.videoEl = null;
    } else {
      assetEl = document.createElement('div');
      assetEl.textContent = 'No media';
      assetEl.className = 'xp-image-viewer-media';
    }
    viewer.appendChild(assetEl);
    // Toolbar (hidden by default, shown on hover)
    const toolbar = document.createElement('div');
    toolbar.className = 'xp-image-viewer-toolbar';
    // Prev button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'xp-image-viewer-btn';
    prevBtn.innerHTML = '&#9664;';
    prevBtn.title = 'Previous';
    prevBtn.onclick = () => this.prev();
    toolbar.appendChild(prevBtn);
    // Play/Pause (for video)
    if (asset && this.isVideo(asset)) {
      const playBtn = document.createElement('button');
      playBtn.className = 'xp-image-viewer-btn';
      playBtn.innerHTML = this.isPlaying ? '&#10073;&#10073;' : '&#9654;';
      playBtn.title = this.isPlaying ? 'Pause' : 'Play';
      playBtn.onclick = () => this.togglePlay();
      toolbar.appendChild(playBtn);
    }
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'xp-image-viewer-btn';
    nextBtn.innerHTML = '&#9654;';
    nextBtn.title = 'Next';
    nextBtn.onclick = () => this.next();
    toolbar.appendChild(nextBtn);
    // Open in DocViewer
    if (this.docViewer && asset) {
      const openBtn = document.createElement('button');
      openBtn.className = 'xp-image-viewer-btn';
      openBtn.innerHTML = "<img src='/assets/images/icons/docViewer.png' alt='Open in DocViewer' style='width:16px; height:16px; display:block; margin:auto;' />";
      openBtn.title = 'Open in DocViewer';
      openBtn.onclick = () => this.docViewer.openDoc(asset, asset.split('/').pop());
      toolbar.appendChild(openBtn);
    }
    viewer.appendChild(toolbar);
    // Show toolbar only on hover
    viewer.addEventListener('mouseenter', () => toolbar.style.opacity = '1');
    viewer.addEventListener('mouseleave', () => toolbar.style.opacity = '0');
    toolbar.style.opacity = '0';
    this.container.appendChild(viewer);
  }

  isVideo(url) {
    return /\.(mp4|webm|ogg)$/i.test(url);
  }

  prev() {
    this.index = (this.index - 1 + this.assets.length) % this.assets.length;
    this.isPlaying = false;
    this.render();
  }

  next() {
    this.index = (this.index + 1) % this.assets.length;
    this.isPlaying = false;
    this.render();
  }

  togglePlay() {
    if (!this.videoEl) return;
    if (this.isPlaying) {
      this.videoEl.pause();
      this.isPlaying = false;
    } else {
      this.videoEl.play();
      this.isPlaying = true;
    }
    this.render();
  }
} 