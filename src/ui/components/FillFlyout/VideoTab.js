import { NumberInput } from '../NumberInput.js';
import { IconButton } from '../IconButton.js';
import { Icons } from '../../Icons.js';
import { mediaAssetManager } from '../../../core/media/MediaAssetManager.js';
import { DEFAULT_VIDEO_FILL, SUPPORTED_VIDEO_FORMATS } from '../../../core/constants/MediaDefaults.js';

export class VideoTab {
    constructor(options = {}) {
        this.fill = { ...DEFAULT_VIDEO_FILL, ...options.fill };
        this.onChange = options.onChange || (() => {});
        
        this.element = document.createElement('div');
        this.element.className = 'flyout-content';
        
        this.render();
    }

    render() {
        this.element.innerHTML = '';

        // 1. Video Preview / Upload Area
        const previewArea = document.createElement('div');
        previewArea.className = 'media-preview-area';

        if (this.fill.assetId) {
            // Show video preview
            const blobUrl = mediaAssetManager.getBlobUrl(this.fill.assetId);
            if (blobUrl) {
                const video = document.createElement('video');
                video.src = blobUrl;
                video.muted = true;
                video.loop = true;
                
                // Play on hover
                previewArea.addEventListener('mouseenter', () => video.play());
                previewArea.addEventListener('mouseleave', () => {
                    video.pause();
                    video.currentTime = 0;
                });
                
                previewArea.appendChild(video);
                
                // Play indicator overlay
                const playOverlay = document.createElement('div');
                playOverlay.className = 'media-play-overlay';
                playOverlay.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21"/></svg>`;
                previewArea.appendChild(playOverlay);
                
                // Remove button overlay
                const removeBtn = document.createElement('button');
                removeBtn.className = 'media-remove-btn';
                removeBtn.innerHTML = Icons.CLOSE;
                const svgEl = removeBtn.querySelector('svg');
                if (svgEl) {
                    svgEl.style.width = '12px';
                    svgEl.style.height = '12px';
                }
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.clearVideo();
                });
                previewArea.appendChild(removeBtn);
            }
        } else {
            // Show upload prompt
            const uploadPrompt = document.createElement('div');
            uploadPrompt.className = 'media-upload-prompt';
            
            const icon = document.createElement('div');
            icon.className = 'icon';
            icon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><polygon points="10 8 16 12 10 16" fill="currentColor" stroke="none"/></svg>`;
            
            const text = document.createElement('div');
            text.className = 'text';
            text.textContent = 'Click or drop video';
            
            uploadPrompt.appendChild(icon);
            uploadPrompt.appendChild(text);
            previewArea.appendChild(uploadPrompt);
        }

        // File input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = SUPPORTED_VIDEO_FORMATS.join(',');
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleVideoFile(e.target.files[0]);
            }
        });

        previewArea.addEventListener('click', () => fileInput.click());
        previewArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            previewArea.classList.add('drag-over');
        });
        previewArea.addEventListener('dragleave', () => {
            previewArea.classList.remove('drag-over');
        });
        previewArea.addEventListener('drop', (e) => {
            e.preventDefault();
            previewArea.classList.remove('drag-over');
            if (e.dataTransfer.files.length > 0) {
                this.handleVideoFile(e.dataTransfer.files[0]);
            }
        });

        this.element.appendChild(previewArea);
        this.element.appendChild(fileInput);

        // 2. Scale Mode Selector
        const scaleModeRow = document.createElement('div');
        scaleModeRow.className = 'scale-mode-row';

        const scaleModes = [
            { value: 'fill', label: 'Fill', title: 'Fill (cover entire shape)' },
            { value: 'fit', label: 'Fit', title: 'Fit (contain within shape)' },
            { value: 'stretch', label: 'Stretch', title: 'Stretch (distort to fit)' }
        ];

        scaleModes.forEach(mode => {
            const btn = document.createElement('button');
            btn.textContent = mode.label;
            btn.title = mode.title;
            btn.className = 'scale-mode-btn' + (this.fill.scaleMode === mode.value ? ' active' : '');
            btn.addEventListener('click', () => this.setScaleMode(mode.value));
            scaleModeRow.appendChild(btn);
        });

        this.element.appendChild(scaleModeRow);

        // 3. Playback Controls
        const playbackSection = this.createPlaybackSection();
        this.element.appendChild(playbackSection);

        // 4. Opacity Control
        const opacityRow = document.createElement('div');
        opacityRow.className = 'flyout-row';

        const opacityLabel = document.createElement('span');
        opacityLabel.className = 'flyout-label';
        opacityLabel.textContent = 'Opacity';

        const opacityInput = new NumberInput({
            value: this.fill.opacity ?? 100,
            min: 0,
            max: 100,
            step: 1,
            suffix: '%',
            onChange: (value) => {
                this.fill.opacity = value;
                this.emitChange();
            }
        });
        opacityInput.element.style.flex = '1';

        opacityRow.appendChild(opacityLabel);
        opacityRow.appendChild(opacityInput.element);
        this.element.appendChild(opacityRow);

        // 5. Video Adjustments (collapsed by default)
        const adjustmentsSection = this.createAdjustmentsSection();
        this.element.appendChild(adjustmentsSection);
    }

    createPlaybackSection() {
        const section = document.createElement('div');
        section.className = 'collapsible-section expanded';

        const label = document.createElement('span');
        label.className = 'flyout-label';
        label.textContent = 'Playback';
        section.appendChild(label);

        const playback = this.fill.playback || {};

        // Checkbox options
        const options = [
            { key: 'autoplay', label: 'Autoplay', default: false },
            { key: 'loop', label: 'Loop', default: true },
            { key: 'muted', label: 'Muted', default: true },
            { key: 'showControls', label: 'Show controls', default: false }
        ];

        const optionsGrid = document.createElement('div');
        optionsGrid.style.display = 'grid';
        optionsGrid.style.gridTemplateColumns = '1fr 1fr';
        optionsGrid.style.gap = '6px';
        optionsGrid.style.marginTop = '8px';

        options.forEach(opt => {
            const row = document.createElement('label');
            row.className = 'checkbox-row';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = playback[opt.key] ?? opt.default;
            
            checkbox.addEventListener('change', () => {
                if (!this.fill.playback) this.fill.playback = {};
                this.fill.playback[opt.key] = checkbox.checked;
                this.emitChange();
            });

            row.appendChild(checkbox);
            row.appendChild(document.createTextNode(opt.label));
            optionsGrid.appendChild(row);
        });

        section.appendChild(optionsGrid);
        return section;
    }

    createAdjustmentsSection() {
        const section = document.createElement('div');
        section.className = 'collapsible-section' + (this.adjustmentsExpanded ? ' expanded' : '');

        const header = document.createElement('div');
        header.className = 'collapsible-header';

        const title = document.createElement('span');
        title.className = 'collapsible-title';
        title.textContent = 'Adjustments';

        const arrow = document.createElement('span');
        arrow.className = 'collapsible-arrow';
        arrow.textContent = '▶';

        header.appendChild(title);
        header.appendChild(arrow);

        const content = document.createElement('div');
        content.className = 'collapsible-content';

        const adjustments = [
            { key: 'brightness', label: 'Brightness', min: -100, max: 100, default: 0 },
            { key: 'contrast', label: 'Contrast', min: -100, max: 100, default: 0 },
            { key: 'saturation', label: 'Saturation', min: -100, max: 100, default: 0 }
        ];

        adjustments.forEach(adj => {
            const row = document.createElement('div');
            row.className = 'flyout-row';

            const label = document.createElement('span');
            label.className = 'flyout-label flyout-label-wide';
            label.textContent = adj.label;

            const input = new NumberInput({
                value: this.fill.filters?.[adj.key] ?? adj.default,
                min: adj.min,
                max: adj.max,
                step: 1,
                onChange: (value) => {
                    if (!this.fill.filters) this.fill.filters = {};
                    this.fill.filters[adj.key] = value;
                    this.emitChange();
                }
            });
            input.element.style.flex = '1';

            row.appendChild(label);
            row.appendChild(input.element);
            content.appendChild(row);
        });

        header.addEventListener('click', () => {
            this.adjustmentsExpanded = !this.adjustmentsExpanded;
            section.classList.toggle('expanded', this.adjustmentsExpanded);
        });

        section.appendChild(header);
        section.appendChild(content);
        return section;
    }

    async handleVideoFile(file) {
        try {
            const asset = await mediaAssetManager.importFile(file);
            this.fill.assetId = asset.assetId;
            this.emitChange();
            this.render();
        } catch (error) {
            console.error('Failed to import video:', error);
        }
    }

    clearVideo() {
        if (this.fill.assetId) {
            mediaAssetManager.release(this.fill.assetId);
        }
        this.fill.assetId = null;
        this.emitChange();
        this.render();
    }

    setScaleMode(mode) {
        this.fill.scaleMode = mode;
        this.emitChange();
        this.render();
    }

    emitChange() {
        this.onChange({
            type: 'video',
            ...this.fill
        });
    }
}
