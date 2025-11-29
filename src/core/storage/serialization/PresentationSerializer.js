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
        // Support both object-based slides (keyed by ID) and array-based slides
        const slidesObj = this.state.slides || {};
        const slideOrder = this.state.slideOrder || Object.keys(slidesObj);
        const slides = Array.isArray(slidesObj) ? slidesObj : slideOrder.map(id => slidesObj[id]).filter(Boolean);
        
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
        const meta = this.state.metadata || this.state.meta || {};
        
        // Calculate slide count - support both object and array format
        const slidesObj = this.state.slides || {};
        const slideOrder = this.state.slideOrder || Object.keys(slidesObj);
        const slideCount = Array.isArray(slidesObj) ? slidesObj.length : slideOrder.length;
        
        builder
            .setTitle(meta.title)
            .setDescription(meta.description)
            .setSlideCount(slideCount)
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
        // Support both object-based slides (keyed by ID) and array-based slides
        const slidesObj = this.state.slides || {};
        const slideOrder = this.state.slideOrder || Object.keys(slidesObj);
        const slides = Array.isArray(slidesObj) ? slidesObj : slideOrder.map(id => slidesObj[id]).filter(Boolean);
        
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
        // Support both object-based elements (keyed by ID) and array-based elements
        const elementsObj = slide.elements || {};
        const elementOrder = slide.elementOrder || Object.keys(elementsObj);
        const elements = Array.isArray(elementsObj) 
            ? elementsObj 
            : elementOrder.map(id => elementsObj[id]).filter(Boolean);
        
        return {
            id: slide.id,
            order: slide.order ?? 0,
            name: slide.name || null,
            title: slide.title || null,
            elements: elements.map(el => this.serializeElement(el)),
            elementOrder: elementOrder,
            background: this.serializeBackground(slide.background),
            layout: slide.layout || null,
            layoutId: slide.layoutId || null,
            width: slide.width,
            height: slide.height,
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
        // Start with a complete copy of the element to preserve all properties
        const serialized = {
            // Core properties
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
            name: element.name || null,
            
            // Placeholder properties
            isPlaceholder: element.isPlaceholder || false,
            placeholderType: element.placeholderType || null
        };

        // Type-specific properties
        switch (element.type) {
            case 'text':
                // Text content - use 'content' as the app does, not 'text'
                serialized.content = element.content || '';
                
                // Typography properties at element level
                serialized.fontSize = element.fontSize;
                serialized.fontFamily = element.fontFamily;
                serialized.fontWeight = element.fontWeight;
                serialized.fontStyle = element.fontStyle;
                serialized.textAlign = element.textAlign;
                serialized.verticalAlign = element.verticalAlign;
                serialized.lineHeight = element.lineHeight;
                serialized.letterSpacing = element.letterSpacing;
                serialized.textTransform = element.textTransform;
                serialized.textDecoration = element.textDecoration;
                serialized.paragraphSpacing = element.paragraphSpacing;
                serialized.paragraphIndent = element.paragraphIndent;
                
                // Text fill (color)
                serialized.textFill = element.textFill || null;
                
                // Style object (may contain additional styling)
                serialized.style = element.style ? { ...element.style } : null;
                break;
                
            case 'rect':
            case 'circle':
            case 'shape':
                serialized.shapeType = element.shapeType || element.type;
                // Style contains backgroundColor, borderWidth, borderColor, etc.
                serialized.style = element.style ? { ...element.style } : null;
                serialized.fill = element.fill || null;
                serialized.stroke = element.stroke || null;
                serialized.cornerRadius = element.cornerRadius;
                break;
                
            case 'image':
                serialized.assetId = element.assetId || element.props?.assetId;
                serialized.assetPath = this.assetMap.get(serialized.assetId) || null;
                serialized.src = element.src;
                serialized.crop = element.crop || null;
                serialized.filters = element.filters || null;
                serialized.style = element.style ? { ...element.style } : null;
                break;
                
            case 'video':
                serialized.assetId = element.assetId || element.props?.assetId;
                serialized.assetPath = this.assetMap.get(serialized.assetId) || null;
                serialized.src = element.src;
                serialized.autoPlay = element.autoPlay || false;
                serialized.loop = element.loop || false;
                serialized.muted = element.muted || false;
                serialized.style = element.style ? { ...element.style } : null;
                break;
                
            case 'code':
                serialized.code = element.code || '';
                serialized.language = element.language || 'javascript';
                serialized.theme = element.theme || 'dark';
                serialized.style = element.style ? { ...element.style } : null;
                break;
                
            default:
                // For unknown types, preserve ALL properties
                Object.keys(element).forEach(key => {
                    if (!(key in serialized)) {
                        serialized[key] = element[key];
                    }
                });
        }

        // Effects
        if (element.effects) {
            serialized.effects = element.effects;
        }

        // Animation
        if (element.animation) {
            serialized.animation = element.animation;
        }
        
        // Build steps
        if (element.buildStep !== undefined) {
            serialized.buildStep = element.buildStep;
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
        // Support both object-based slides (keyed by ID) and array-based slides
        const slidesObj = this.state.slides || {};
        const slideOrder = this.state.slideOrder || Object.keys(slidesObj);
        const slides = Array.isArray(slidesObj) ? slidesObj : slideOrder.map(id => slidesObj[id]).filter(Boolean);

        for (const slide of slides) {
            // Check slide background
            if (slide.background?.assetId) {
                ids.add(slide.background.assetId);
            }

            // Check elements - support both object-based and array-based elements
            const elementsObj = slide.elements || {};
            const elementOrder = slide.elementOrder || Object.keys(elementsObj);
            const elements = Array.isArray(elementsObj) 
                ? elementsObj 
                : elementOrder.map(id => elementsObj[id]).filter(Boolean);
            
            for (const element of elements) {
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
        // Support both object-based slides (keyed by ID) and array-based slides
        const slidesObj = this.state.slides || {};
        const slideOrder = this.state.slideOrder || Object.keys(slidesObj);
        const slides = Array.isArray(slidesObj) ? slidesObj : slideOrder.map(id => slidesObj[id]).filter(Boolean);
        
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
        if (!slide) return null;
        
        const canvas = document.createElement('canvas');
        canvas.width = THUMBNAIL.WIDTH;
        canvas.height = THUMBNAIL.HEIGHT;
        const ctx = canvas.getContext('2d');

        // Fill background - handle various background formats
        const bgColor = slide.background?.color || 
                       slide.background?.value || 
                       (slide.background?.type === 'solid' ? slide.background.value : null) ||
                       '#FFFFFF';
        ctx.fillStyle = bgColor;
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
