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
        this.element.style.display = 'flex';
        this.element.style.flexDirection = 'column';
        this.element.style.gap = '12px';
        
        this.render();
    }

    render() {
        this.element.innerHTML = '';

        // 1. Video Preview / Upload Area
        const previewArea = document.createElement('div');
        previewArea.style.width = '100%';
        previewArea.style.height = '120px';
        previewArea.style.borderRadius = '4px';
        previewArea.style.backgroundColor = '#1a1a1a';
        previewArea.style.border = '1px dashed #555';
        previewArea.style.display = 'flex';
        previewArea.style.alignItems = 'center';
        previewArea.style.justifyContent = 'center';
        previewArea.style.cursor = 'pointer';
        previewArea.style.overflow = 'hidden';
        previewArea.style.position = 'relative';

        if (this.fill.assetId) {
            // Show video preview
            const blobUrl = mediaAssetManager.getBlobUrl(this.fill.assetId);
            if (blobUrl) {
                const video = document.createElement('video');
                video.src = blobUrl;
                video.style.maxWidth = '100%';
                video.style.maxHeight = '100%';
                video.style.objectFit = 'contain';
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
                playOverlay.style.position = 'absolute';
                playOverlay.style.top = '50%';
                playOverlay.style.left = '50%';
                playOverlay.style.transform = 'translate(-50%, -50%)';
                playOverlay.style.width = '32px';
                playOverlay.style.height = '32px';
                playOverlay.style.borderRadius = '50%';
                playOverlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
                playOverlay.style.display = 'flex';
                playOverlay.style.alignItems = 'center';
                playOverlay.style.justifyContent = 'center';
                playOverlay.style.pointerEvents = 'none';
                playOverlay.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21"/></svg>`;
                previewArea.appendChild(playOverlay);
                
                // Remove button overlay
                const removeBtn = document.createElement('div');
                removeBtn.style.position = 'absolute';
                removeBtn.style.top = '4px';
                removeBtn.style.right = '4px';
                removeBtn.style.width = '20px';
                removeBtn.style.height = '20px';
                removeBtn.style.borderRadius = '50%';
                removeBtn.style.backgroundColor = 'rgba(0,0,0,0.7)';
                removeBtn.style.display = 'flex';
                removeBtn.style.alignItems = 'center';
                removeBtn.style.justifyContent = 'center';
                removeBtn.style.cursor = 'pointer';
                removeBtn.innerHTML = Icons.CLOSE;
                removeBtn.querySelector('svg').style.width = '12px';
                removeBtn.querySelector('svg').style.height = '12px';
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.clearVideo();
                });
                previewArea.appendChild(removeBtn);
            }
        } else {
            // Show upload prompt
            const uploadPrompt = document.createElement('div');
            uploadPrompt.style.textAlign = 'center';
            uploadPrompt.style.color = '#888';
            
            const icon = document.createElement('div');
            icon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><polygon points="10 8 16 12 10 16" fill="currentColor" stroke="none"/></svg>`;
            icon.style.marginBottom = '8px';
            
            const text = document.createElement('div');
            text.textContent = 'Click or drop video';
            text.style.fontSize = '11px';
            
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
            previewArea.style.borderColor = '#007AFF';
        });
        previewArea.addEventListener('dragleave', () => {
            previewArea.style.borderColor = '#555';
        });
        previewArea.addEventListener('drop', (e) => {
            e.preventDefault();
            previewArea.style.borderColor = '#555';
            if (e.dataTransfer.files.length > 0) {
                this.handleVideoFile(e.dataTransfer.files[0]);
            }
        });

        this.element.appendChild(previewArea);
        this.element.appendChild(fileInput);

        // 2. Scale Mode Selector
        const scaleModeRow = document.createElement('div');
        scaleModeRow.style.display = 'flex';
        scaleModeRow.style.gap = '4px';

        const scaleModes = [
            { value: 'fill', label: 'Fill', title: 'Fill (cover entire shape)' },
            { value: 'fit', label: 'Fit', title: 'Fit (contain within shape)' },
            { value: 'stretch', label: 'Stretch', title: 'Stretch (distort to fit)' }
        ];

        scaleModes.forEach(mode => {
            const btn = document.createElement('button');
            btn.textContent = mode.label;
            btn.title = mode.title;
            btn.style.flex = '1';
            btn.style.padding = '6px 8px';
            btn.style.fontSize = '10px';
            btn.style.border = 'none';
            btn.style.borderRadius = '4px';
            btn.style.cursor = 'pointer';
            btn.style.backgroundColor = this.fill.scaleMode === mode.value ? '#007AFF' : '#3a3a3a';
            btn.style.color = '#fff';
            btn.addEventListener('click', () => this.setScaleMode(mode.value));
            scaleModeRow.appendChild(btn);
        });

        this.element.appendChild(scaleModeRow);

        // 3. Playback Controls
        const playbackSection = this.createPlaybackSection();
        this.element.appendChild(playbackSection);

        // 4. Opacity Control
        const opacityRow = document.createElement('div');
        opacityRow.style.display = 'flex';
        opacityRow.style.alignItems = 'center';
        opacityRow.style.gap = '8px';

        const opacityLabel = document.createElement('span');
        opacityLabel.textContent = 'Opacity';
        opacityLabel.style.fontSize = '11px';
        opacityLabel.style.color = '#aaa';
        opacityLabel.style.width = '60px';

        const opacityInput = new NumberInput({
            value: Math.round((this.fill.opacity ?? 1) * 100),
            min: 0,
            max: 100,
            step: 1,
            suffix: '%',
            onChange: (value) => {
                this.fill.opacity = value / 100;
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
        section.style.display = 'flex';
        section.style.flexDirection = 'column';
        section.style.gap = '8px';
        section.style.borderTop = '1px solid #444';
        section.style.paddingTop = '12px';

        const label = document.createElement('span');
        label.textContent = 'Playback';
        label.style.fontSize = '11px';
        label.style.color = '#aaa';
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

        options.forEach(opt => {
            const row = document.createElement('label');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.gap = '6px';
            row.style.cursor = 'pointer';
            row.style.fontSize = '10px';
            row.style.color = '#ccc';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = playback[opt.key] ?? opt.default;
            checkbox.style.width = '12px';
            checkbox.style.height = '12px';
            checkbox.style.accentColor = '#007AFF';
            
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
        section.style.borderTop = '1px solid #444';
        section.style.paddingTop = '12px';
        section.style.marginTop = '4px';

        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.cursor = 'pointer';
        header.style.marginBottom = '8px';

        const title = document.createElement('span');
        title.textContent = 'Adjustments';
        title.style.fontSize = '11px';
        title.style.color = '#aaa';

        const arrow = document.createElement('span');
        arrow.textContent = this.adjustmentsExpanded ? '▼' : '▶';
        arrow.style.fontSize = '8px';
        arrow.style.color = '#666';

        header.appendChild(title);
        header.appendChild(arrow);

        const content = document.createElement('div');
        content.style.display = this.adjustmentsExpanded ? 'flex' : 'none';
        content.style.flexDirection = 'column';
        content.style.gap = '8px';

        const adjustments = [
            { key: 'brightness', label: 'Brightness', min: -100, max: 100, default: 0 },
            { key: 'contrast', label: 'Contrast', min: -100, max: 100, default: 0 },
            { key: 'saturation', label: 'Saturation', min: -100, max: 100, default: 0 }
        ];

        adjustments.forEach(adj => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.gap = '8px';

            const label = document.createElement('span');
            label.textContent = adj.label;
            label.style.fontSize = '10px';
            label.style.color = '#888';
            label.style.width = '70px';

            const input = new NumberInput({
                value: this.fill.adjustments?.[adj.key] ?? adj.default,
                min: adj.min,
                max: adj.max,
                step: 1,
                onChange: (value) => {
                    if (!this.fill.adjustments) this.fill.adjustments = {};
                    this.fill.adjustments[adj.key] = value;
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
            arrow.textContent = this.adjustmentsExpanded ? '▼' : '▶';
            content.style.display = this.adjustmentsExpanded ? 'flex' : 'none';
        });

        section.appendChild(header);
        section.appendChild(content);
        return section;
    }

    async handleVideoFile(file) {
        try {
            const asset = await mediaAssetManager.importFile(file);
            this.fill.assetId = asset.id;
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
