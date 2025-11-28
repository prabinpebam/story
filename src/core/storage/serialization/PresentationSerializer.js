/**
 * PresentationSerializer
 * Converts app state to .str file format
 */

import { ZipFileWriter } from '../zip/ZipFileWriter.js';
import { ManifestBuilder } from '../builders/ManifestBuilder.js';
import { MetadataBuilder } from '../builders/MetadataBuilder.js';
import { THUMBNAIL } from '../constants/StorageConstants.js';

export class PresentationSerializer {
    /**
     * Create serializer
     * @param {Object} appState - Current application state
     * @param {Object} options - Serialization options
     */
    constructor(appState, options = {}) {
        this.state = appState;
        this.options = {
            includeThumbnail: true,
            includeAssets: true,
            ...options
        };
        this.writer = new ZipFileWriter();
        this.assetMap = new Map(); // Track asset paths for deduplication
    }

    /**
     * Serialize the presentation to .str format
     * @returns {Promise<Blob>} The .str file as a Blob
     */
    async serialize() {
        // 1. Build and add manifest
        const manifest = await this.buildManifest();
        this.writer.addManifest(manifest);

        // 2. Build and add metadata
        const metadata = this.buildMetadata();
        this.writer.addMetadata(metadata);

        // 3. Add theme
        if (this.state.theme) {
            this.writer.addTheme(this.serializeTheme(this.state.theme));
        }

        // 4. Add slides (one file per slide)
        await this.addSlides();

        // 5. Add assets
        if (this.options.includeAssets) {
            await this.addAssets();
        }

        // 6. Generate thumbnail
        if (this.options.includeThumbnail) {
            await this.addThumbnail();
        }

        // 7. Generate the final ZIP
        return this.writer.generate();
    }

    /**
     * Build the manifest
     * @returns {Promise<Object>} Manifest object
     */
    async buildManifest() {
        const builder = new ManifestBuilder();
        
        builder
            .setTitle(this.state.metadata?.title)
            .setCreated(this.state.metadata?.created);

        // Set author if available
        if (this.state.auth?.user) {
            builder.setAuthor(this.state.auth.user);
        }

        // Add slide chunks
        const slides = this.state.slides || [];
        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];
            const slideData = this.serializeSlide(slide);
            const slideJson = JSON.stringify(slideData);
            builder.addSlideChunk(slide.id, slideJson.length, i);
        }

        // Add asset chunks
        const assetIds = this.collectAssetIds();
        for (const assetId of assetIds) {
            const asset = this.getAsset(assetId);
            if (asset) {
                const hash = await this.hashBlob(asset.blob || asset.data);
                const ext = this.getExtension(asset.mimeType || asset.type);
                const path = `images/${hash}.${ext}`;
                const size = asset.blob?.size || asset.data?.size || 0;
                
                builder.addAssetChunk(assetId, path, size, hash, asset.mimeType || asset.type);
                this.assetMap.set(assetId, path);
            }
        }

        return builder.build();
    }

    /**
     * Build the metadata
     * @returns {Object} Metadata object
     */
    buildMetadata() {
        const builder = new MetadataBuilder();
        const meta = this.state.metadata || {};
        
        builder
            .setTitle(meta.title)
            .setDescription(meta.description)
            .setSlideCount(this.state.slides?.length || 0)
            .setAspectRatio(meta.aspectRatio || '16:9')
            .setTags(meta.tags)
            .setLanguage(meta.language)
            .setCreated(meta.created);

        // Set author if available
        if (this.state.auth?.user) {
            builder.setAuthor(this.state.auth.user);
        }

        // Increment version on each save
        if (meta.version) {
            builder.setVersion(meta.version + 1);
        }

        return builder.build();
    }

    /**
     * Add all slides to the archive
     */
    async addSlides() {
        const slides = this.state.slides || [];
        
        for (const slide of slides) {
            const slideData = this.serializeSlide(slide);
            this.writer.addSlide(slide.id, slideData);
        }
    }

    /**
     * Serialize a single slide
     * @param {Object} slide - Slide object
     * @returns {Object} Serialized slide data
     */
    serializeSlide(slide) {
        return {
            id: slide.id,
            order: slide.order ?? 0,
            name: slide.name || null,
            elements: (slide.elements || []).map(el => this.serializeElement(el)),
            background: this.serializeBackground(slide.background),
            layout: slide.layout || null,
            notes: slide.notes || '',
            transition: slide.transition || null,
            duration: slide.duration || null,
            masterSlideId: slide.masterSlideId || null
        };
    }

    /**
     * Serialize an element
     * @param {Object} element - Element object
     * @returns {Object} Serialized element
     */
    serializeElement(element) {
        const serialized = {
            id: element.id,
            type: element.type,
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
            rotation: element.rotation || 0,
            opacity: element.opacity ?? 1,
            locked: element.locked || false,
            visible: element.visible !== false,
            name: element.name || null
        };

        // Type-specific properties
        switch (element.type) {
            case 'text':
                serialized.text = element.text || '';
                serialized.style = this.serializeTextStyle(element.style);
                break;
            case 'image':
                serialized.assetId = element.assetId || element.props?.assetId;
                serialized.assetPath = this.assetMap.get(serialized.assetId) || null;
                serialized.crop = element.crop || null;
                serialized.filters = element.filters || null;
                break;
            case 'shape':
                serialized.shapeType = element.shapeType || 'rectangle';
                serialized.fill = element.fill || null;
                serialized.stroke = element.stroke || null;
                break;
            case 'video':
                serialized.assetId = element.assetId || element.props?.assetId;
                serialized.assetPath = this.assetMap.get(serialized.assetId) || null;
                serialized.autoPlay = element.autoPlay || false;
                serialized.loop = element.loop || false;
                serialized.muted = element.muted || false;
                break;
            case 'code':
                serialized.code = element.code || '';
                serialized.language = element.language || 'javascript';
                serialized.theme = element.theme || 'dark';
                break;
            default:
                // Copy all props for unknown types
                serialized.props = element.props || {};
        }

        // Effects
        if (element.effects) {
            serialized.effects = element.effects;
        }

        // Animation
        if (element.animation) {
            serialized.animation = element.animation;
        }

        return serialized;
    }

    /**
     * Serialize text style
     * @param {Object} style - Text style object
     * @returns {Object} Serialized style
     */
    serializeTextStyle(style) {
        if (!style) return null;
        
        return {
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            fontStyle: style.fontStyle,
            color: style.color,
            backgroundColor: style.backgroundColor,
            textAlign: style.textAlign,
            lineHeight: style.lineHeight,
            letterSpacing: style.letterSpacing,
            textDecoration: style.textDecoration
        };
    }

    /**
     * Serialize background
     * @param {Object} background - Background object
     * @returns {Object} Serialized background
     */
    serializeBackground(background) {
        if (!background) {
            return { type: 'solid', color: '#FFFFFF' };
        }

        const serialized = {
            type: background.type || 'solid'
        };

        switch (background.type) {
            case 'solid':
                serialized.color = background.color || '#FFFFFF';
                break;
            case 'gradient':
                serialized.gradient = background.gradient;
                break;
            case 'image':
                serialized.assetId = background.assetId;
                serialized.assetPath = this.assetMap.get(background.assetId) || null;
                serialized.fit = background.fit || 'cover';
                break;
            default:
                serialized.color = '#FFFFFF';
        }

        return serialized;
    }

    /**
     * Serialize theme
     * @param {Object} theme - Theme object
     * @returns {Object} Serialized theme
     */
    serializeTheme(theme) {
        return {
            name: theme.name || 'Default',
            colors: theme.colors || {},
            fonts: theme.fonts || {},
            spacing: theme.spacing || {},
            custom: theme.custom || {}
        };
    }

    /**
     * Add all assets to the archive
     */
    async addAssets() {
        const assetIds = this.collectAssetIds();
        
        for (const assetId of assetIds) {
            const path = this.assetMap.get(assetId);
            if (!path) continue;

            const asset = this.getAsset(assetId);
            if (!asset) continue;

            const data = asset.blob || asset.data;
            if (data) {
                await this.writer.addAsset(path, data);
            }
        }
    }

    /**
     * Collect all asset IDs referenced in the presentation
     * @returns {Set<string>} Set of asset IDs
     */
    collectAssetIds() {
        const ids = new Set();
        const slides = this.state.slides || [];

        for (const slide of slides) {
            // Check slide background
            if (slide.background?.assetId) {
                ids.add(slide.background.assetId);
            }

            // Check elements
            for (const element of slide.elements || []) {
                if (element.assetId) {
                    ids.add(element.assetId);
                }
                if (element.props?.assetId) {
                    ids.add(element.props.assetId);
                }
            }
        }

        return ids;
    }

    /**
     * Get asset from state
     * @param {string} assetId - Asset ID
     * @returns {Object|null} Asset object or null
     */
    getAsset(assetId) {
        if (!this.state.assets) return null;
        
        // Handle Map or plain object
        if (this.state.assets instanceof Map) {
            return this.state.assets.get(assetId);
        }
        return this.state.assets[assetId];
    }

    /**
     * Add thumbnail to the archive
     */
    async addThumbnail() {
        const slides = this.state.slides || [];
        if (slides.length === 0) return;

        try {
            const thumbnailBlob = await this.renderThumbnail(slides[0]);
            if (thumbnailBlob) {
                await this.writer.addThumbnail(thumbnailBlob);
            }
        } catch (error) {
            console.warn('Failed to generate thumbnail:', error);
            // Non-critical, continue without thumbnail
        }
    }

    /**
     * Render a slide to a thumbnail canvas
     * @param {Object} slide - Slide to render
     * @returns {Promise<Blob>} Thumbnail as PNG blob
     */
    async renderThumbnail(slide) {
        const canvas = document.createElement('canvas');
        canvas.width = THUMBNAIL.WIDTH;
        canvas.height = THUMBNAIL.HEIGHT;
        const ctx = canvas.getContext('2d');

        // Fill background
        ctx.fillStyle = slide.background?.color || '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Simple thumbnail - just background for now
        // Full rendering would require the rendering engine

        return new Promise((resolve) => {
            canvas.toBlob(resolve, THUMBNAIL.FORMAT, THUMBNAIL.QUALITY);
        });
    }

    /**
     * Hash a blob using SHA-256
     * @param {Blob|ArrayBuffer} data - Data to hash
     * @returns {Promise<string>} Hex hash string
     */
    async hashBlob(data) {
        let buffer;
        if (data instanceof Blob) {
            buffer = await data.arrayBuffer();
        } else {
            buffer = data;
        }

        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Get file extension from MIME type
     * @param {string} mimeType - MIME type
     * @returns {string} File extension
     */
    getExtension(mimeType) {
        const mimeMap = {
            'image/png': 'png',
            'image/jpeg': 'jpg',
            'image/gif': 'gif',
            'image/webp': 'webp',
            'image/svg+xml': 'svg',
            'video/mp4': 'mp4',
            'video/webm': 'webm',
            'font/ttf': 'ttf',
            'font/otf': 'otf',
            'font/woff': 'woff',
            'font/woff2': 'woff2'
        };
        return mimeMap[mimeType] || 'bin';
    }
}

export default PresentationSerializer;
