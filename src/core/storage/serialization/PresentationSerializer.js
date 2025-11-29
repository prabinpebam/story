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
        
        // Copy ALL slide properties to ensure nothing is lost
        const serialized = { ...slide };
        
        // Transform elements to array format for storage
        serialized.elements = elements.map(el => this.serializeElement(el));
        serialized.elementOrder = elementOrder;
        
        // Serialize background properly
        serialized.background = this.serializeBackground(slide.background);
        
        // Remove transient/runtime properties
        delete serialized._cached;
        delete serialized._domElement;
        
        return serialized;
    }

    /**
     * Serialize an element - copies ALL properties to ensure nothing is lost
     * @param {Object} element - Element object
     * @returns {Object} Serialized element
     */
    serializeElement(element) {
        // Start with a complete shallow copy of ALL properties
        const serialized = { ...element };
        
        // Ensure core defaults are set
        serialized.rotation = serialized.rotation ?? 0;
        serialized.opacity = serialized.opacity ?? 1;
        
        // Deep copy nested objects that need special handling
        if (element.style) {
            serialized.style = { ...element.style };
            // Deep copy fills array if present
            if (element.style.fills) {
                serialized.style.fills = element.style.fills.map(f => ({ ...f }));
            }
            // Deep copy strokes array if present
            if (element.style.strokes) {
                serialized.style.strokes = element.style.strokes.map(s => ({ ...s }));
            }
        }
        
        // Deep copy textFill if present
        if (element.textFill) {
            serialized.textFill = { ...element.textFill };
        }
        
        // Deep copy effects array if present
        if (element.effects) {
            serialized.effects = element.effects.map(e => ({ ...e }));
        }
        
        // Deep copy animation if present
        if (element.animation) {
            serialized.animation = { ...element.animation };
        }
        
        // Deep copy fill/stroke for shapes
        if (element.fill) {
            serialized.fill = { ...element.fill };
        }
        if (element.stroke) {
            serialized.stroke = { ...element.stroke };
        }
        
        // Deep copy crop for images
        if (element.crop) {
            serialized.crop = { ...element.crop };
        }
        
        // Deep copy filters for images
        if (element.filters) {
            serialized.filters = element.filters.map(f => ({ ...f }));
        }
        
        // Handle asset path mapping
        if (element.assetId) {
            serialized.assetPath = this.assetMap.get(element.assetId) || null;
        }
        
        // Remove transient/runtime properties that shouldn't be saved
        delete serialized._domElement;
        delete serialized._cached;
        delete serialized._codeRunner;
        delete serialized._observer;
        delete serialized._liveWidth;
        delete serialized._liveHeight;
        delete serialized._liveX;
        delete serialized._liveY;
        
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
     * Serialize background - can be null, single fill object, or array of fills
     * @param {Object|Array|null} background - Background object(s)
     * @returns {Object|Array|null} Serialized background
     */
    serializeBackground(background) {
        // null means inherit from parent - preserve this
        if (background === null || background === undefined) {
            return null;
        }

        // Handle array of fills
        if (Array.isArray(background)) {
            return background.map(fill => this.serializeFill(fill));
        }

        // Handle single fill object
        return this.serializeFill(background);
    }

    /**
     * Serialize a single fill object
     * @param {Object} fill - Fill object
     * @returns {Object} Serialized fill
     */
    serializeFill(fill) {
        if (!fill) {
            return { type: 'solid', value: '#ffffff', color: '#ffffff' };
        }

        const serialized = { ...fill };

        // For solid fills, ensure both 'color' and 'value' are set for maximum compatibility
        if (fill.type === 'solid') {
            const colorValue = fill.value || fill.color || '#ffffff';
            serialized.value = colorValue;
            serialized.color = colorValue;
        }

        // Handle image fills - map asset path
        if (fill.type === 'image' && fill.assetId) {
            serialized.assetPath = this.assetMap.get(fill.assetId) || null;
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
