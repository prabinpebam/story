/**
 * PresentationDeserializer
 * Loads .str file format back into app state
 */

import { ZipFileReader } from '../zip/ZipFileReader.js';
import { FILE_FORMAT, STORAGE_ERRORS } from '../constants/StorageConstants.js';

export class PresentationDeserializer {
    /**
     * Create deserializer
     * @param {Blob|ArrayBuffer|File} fileData - The .str file data
     */
    constructor(fileData) {
        this.fileData = fileData;
        this.reader = new ZipFileReader();
        this.assetCache = new Map();
    }

    /**
     * Deserialize the .str file to app state
     * @returns {Promise<Object>} Deserialized presentation state
     */
    async deserialize() {
        // Initialize reader
        await this.reader.init(this.fileData);

        // 1. Read and validate manifest
        const manifest = await this.reader.readManifest();
        this.validateManifest(manifest);

        // 2. Read metadata
        const metadata = await this.reader.readMetadata() || {};

        // 3. Read theme
        const theme = await this.reader.readTheme() || this.getDefaultTheme();

        // 4. Read all slides
        const slides = await this.loadSlides();

        // 5. Build asset loader (lazy loading)
        const assetLoader = this.createAssetLoader();

        // 6. Read thumbnail if available
        const thumbnail = await this.reader.readThumbnail();

        return {
            manifest,
            metadata: this.deserializeMetadata(metadata),
            theme: this.deserializeTheme(theme),
            slides,
            assetLoader,
            thumbnail
        };
    }

    /**
     * Validate manifest format and version
     * @param {Object} manifest - Manifest object
     */
    validateManifest(manifest) {
        if (!manifest) {
            throw new Error(STORAGE_ERRORS.MISSING_MANIFEST);
        }

        if (manifest.formatType !== FILE_FORMAT.TYPE) {
            throw new Error(STORAGE_ERRORS.INVALID_FORMAT);
        }

        // Check version compatibility
        const [major] = (manifest.formatVersion || '0.0.0').split('.');
        const [currentMajor] = FILE_FORMAT.VERSION.split('.');
        
        if (parseInt(major) > parseInt(currentMajor)) {
            throw new Error(STORAGE_ERRORS.VERSION_MISMATCH);
        }

        // Warn about minor version differences
        if (manifest.formatVersion !== FILE_FORMAT.VERSION) {
            console.warn(`File version ${manifest.formatVersion} differs from current ${FILE_FORMAT.VERSION}`);
        }
    }

    /**
     * Load all slides from the archive
     * @returns {Promise<Object[]>} Array of slide objects
     */
    async loadSlides() {
        const slideIds = await this.reader.listSlideIds();
        const slides = [];

        for (const slideId of slideIds) {
            const slideData = await this.reader.readSlide(slideId);
            slides.push(this.deserializeSlide(slideData));
        }

        // Sort by order
        slides.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        return slides;
    }

    /**
     * Deserialize metadata
     * @param {Object} data - Raw metadata
     * @returns {Object} Deserialized metadata
     */
    deserializeMetadata(data) {
        return {
            title: data.title || 'Untitled Presentation',
            description: data.description || '',
            author: data.author || null,
            created: data.created || new Date().toISOString(),
            modified: data.modified || new Date().toISOString(),
            slideCount: data.slideCount || 0,
            aspectRatio: data.aspectRatio || '16:9',
            tags: data.tags || [],
            language: data.language || 'en',
            version: data.version || 1
        };
    }

    /**
     * Deserialize a single slide
     * @param {Object} data - Raw slide data
     * @returns {Object} Deserialized slide
     */
    deserializeSlide(data) {
        return {
            id: data.id,
            order: data.order ?? 0,
            name: data.name || null,
            title: data.title || null,
            elements: (data.elements || []).map(el => this.deserializeElement(el)),
            elementOrder: data.elementOrder || [],
            background: this.deserializeBackground(data.background),
            layout: data.layout || null,
            layoutId: data.layoutId || data.layout || null,
            width: data.width || 1920,
            height: data.height || 1080,
            notes: data.notes || '',
            transition: data.transition || null,
            duration: data.duration || null,
            masterSlideId: data.masterSlideId || null
        };
    }

    /**
     * Deserialize an element
     * @param {Object} data - Raw element data
     * @returns {Object} Deserialized element
     */
    deserializeElement(data) {
        const element = {
            // Core properties
            id: data.id,
            type: data.type,
            x: data.x ?? 0,
            y: data.y ?? 0,
            width: data.width ?? 100,
            height: data.height ?? 100,
            rotation: data.rotation ?? 0,
            opacity: data.opacity ?? 1,
            locked: data.locked ?? false,
            visible: data.visible !== false,
            name: data.name || null,
            
            // Placeholder properties
            isPlaceholder: data.isPlaceholder || false,
            placeholderType: data.placeholderType || null
        };

        // Type-specific properties
        switch (data.type) {
            case 'text':
                // Text content - support both 'content' and legacy 'text'
                element.content = data.content || data.text || '';
                
                // Typography properties at element level
                if (data.fontSize !== undefined) element.fontSize = data.fontSize;
                if (data.fontFamily !== undefined) element.fontFamily = data.fontFamily;
                if (data.fontWeight !== undefined) element.fontWeight = data.fontWeight;
                if (data.fontStyle !== undefined) element.fontStyle = data.fontStyle;
                if (data.textAlign !== undefined) element.textAlign = data.textAlign;
                if (data.verticalAlign !== undefined) element.verticalAlign = data.verticalAlign;
                if (data.lineHeight !== undefined) element.lineHeight = data.lineHeight;
                if (data.letterSpacing !== undefined) element.letterSpacing = data.letterSpacing;
                if (data.textTransform !== undefined) element.textTransform = data.textTransform;
                if (data.textDecoration !== undefined) element.textDecoration = data.textDecoration;
                if (data.paragraphSpacing !== undefined) element.paragraphSpacing = data.paragraphSpacing;
                if (data.paragraphIndent !== undefined) element.paragraphIndent = data.paragraphIndent;
                
                // Text fill (color)
                if (data.textFill) element.textFill = data.textFill;
                
                // Style object
                if (data.style) element.style = { ...data.style };
                break;
                
            case 'rect':
            case 'circle':
            case 'shape':
                element.shapeType = data.shapeType || data.type;
                if (data.style) element.style = { ...data.style };
                if (data.fill) element.fill = data.fill;
                if (data.stroke) element.stroke = data.stroke;
                if (data.cornerRadius !== undefined) element.cornerRadius = data.cornerRadius;
                break;
                
            case 'image':
                element.assetId = data.assetId;
                element.assetPath = data.assetPath;
                if (data.src) element.src = data.src;
                element.crop = data.crop || null;
                element.filters = data.filters || null;
                if (data.style) element.style = { ...data.style };
                break;
                
            case 'video':
                element.assetId = data.assetId;
                element.assetPath = data.assetPath;
                if (data.src) element.src = data.src;
                element.autoPlay = data.autoPlay ?? false;
                element.loop = data.loop ?? false;
                element.muted = data.muted ?? false;
                if (data.style) element.style = { ...data.style };
                break;
                
            case 'code':
                element.code = data.code || '';
                element.language = data.language || 'javascript';
                element.theme = data.theme || 'dark';
                if (data.style) element.style = { ...data.style };
                break;
                
            default:
                // For unknown types, preserve ALL properties from the data
                Object.keys(data).forEach(key => {
                    if (!(key in element)) {
                        element[key] = data[key];
                    }
                });
        }

        // Effects
        if (data.effects) {
            element.effects = data.effects;
        }

        // Animation
        if (data.animation) {
            element.animation = data.animation;
        }
        
        // Build steps
        if (data.buildStep !== undefined) {
            element.buildStep = data.buildStep;
        }

        return element;
    }

    /**
     * Deserialize text style
     * @param {Object} style - Raw style data
     * @returns {Object} Deserialized style
     */
    deserializeTextStyle(style) {
        if (!style) {
            return {
                fontFamily: 'Inter, sans-serif',
                fontSize: 16,
                fontWeight: 400,
                color: '#000000'
            };
        }

        return {
            fontFamily: style.fontFamily || 'Inter, sans-serif',
            fontSize: style.fontSize || 16,
            fontWeight: style.fontWeight || 400,
            fontStyle: style.fontStyle || 'normal',
            color: style.color || '#000000',
            backgroundColor: style.backgroundColor || null,
            textAlign: style.textAlign || 'left',
            lineHeight: style.lineHeight || 1.5,
            letterSpacing: style.letterSpacing || 0,
            textDecoration: style.textDecoration || 'none'
        };
    }

    /**
     * Deserialize background
     * @param {Object} data - Raw background data
     * @returns {Object} Deserialized background
     */
    deserializeBackground(data) {
        if (!data) {
            return { type: 'solid', color: '#FFFFFF' };
        }

        const background = {
            type: data.type || 'solid'
        };

        switch (data.type) {
            case 'solid':
                background.color = data.color || '#FFFFFF';
                break;
            case 'gradient':
                background.gradient = data.gradient;
                break;
            case 'image':
                background.assetId = data.assetId;
                background.assetPath = data.assetPath;
                background.fit = data.fit || 'cover';
                break;
            default:
                background.color = '#FFFFFF';
        }

        return background;
    }

    /**
     * Deserialize theme
     * @param {Object} data - Raw theme data
     * @returns {Object} Deserialized theme
     */
    deserializeTheme(data) {
        return {
            name: data.name || 'Default',
            colors: data.colors || {},
            fonts: data.fonts || {},
            spacing: data.spacing || {},
            custom: data.custom || {}
        };
    }

    /**
     * Get default theme
     * @returns {Object} Default theme object
     */
    getDefaultTheme() {
        return {
            name: 'Default',
            colors: {
                primary: '#007AFF',
                secondary: '#5856D6',
                background: '#FFFFFF',
                text: '#000000'
            },
            fonts: {
                heading: 'Inter, sans-serif',
                body: 'Inter, sans-serif'
            },
            spacing: {},
            custom: {}
        };
    }

    /**
     * Create lazy asset loader function
     * @returns {Function} Asset loader function
     */
    createAssetLoader() {
        const reader = this.reader;
        const cache = this.assetCache;

        return async (assetPath, options = {}) => {
            // Check cache first
            if (cache.has(assetPath)) {
                return cache.get(assetPath);
            }

            try {
                let data;
                const format = options.format || 'blob';

                switch (format) {
                    case 'blob':
                        data = await reader.readAssetAsBlob(assetPath);
                        break;
                    case 'arraybuffer':
                        data = await reader.readAssetAsArrayBuffer(assetPath);
                        break;
                    case 'base64':
                        data = await reader.readAssetAsBase64(assetPath);
                        break;
                    case 'dataurl':
                        data = await reader.readAssetAsDataUrl(
                            assetPath,
                            options.mimeType || 'application/octet-stream'
                        );
                        break;
                    default:
                        data = await reader.readAssetAsBlob(assetPath);
                }

                // Cache the result
                cache.set(assetPath, data);
                return data;
            } catch (error) {
                console.error(`Failed to load asset: ${assetPath}`, error);
                throw error;
            }
        };
    }

    /**
     * Preload all assets into cache
     * @returns {Promise<Map>} Map of asset paths to blobs
     */
    async preloadAllAssets() {
        const assets = await this.reader.listAssets();
        
        for (const asset of assets) {
            try {
                const blob = await this.reader.readAssetAsBlob(asset.path);
                this.assetCache.set(asset.path, blob);
            } catch (error) {
                console.warn(`Failed to preload asset: ${asset.path}`, error);
            }
        }

        return this.assetCache;
    }

    /**
     * Get info about the file without full deserialization
     * @returns {Promise<Object>} File info
     */
    async getFileInfo() {
        await this.reader.init(this.fileData);
        
        const manifest = await this.reader.readManifest();
        const metadata = await this.reader.readMetadata();
        const thumbnail = await this.reader.readThumbnail();

        return {
            title: manifest.title || metadata?.title || 'Untitled',
            author: manifest.author || metadata?.author?.name,
            created: manifest.created,
            modified: manifest.modified,
            formatVersion: manifest.formatVersion,
            slideCount: manifest.chunkIndex?.slides?.length || 0,
            assetCount: manifest.chunkIndex?.assets?.length || 0,
            thumbnail: thumbnail ? URL.createObjectURL(thumbnail) : null
        };
    }
}

export default PresentationDeserializer;
