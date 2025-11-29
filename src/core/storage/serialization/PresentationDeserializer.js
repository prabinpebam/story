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
     * Deserialize a single slide - copies ALL properties to ensure nothing is lost
     * @param {Object} data - Raw slide data
     * @returns {Object} Deserialized slide
     */
    deserializeSlide(data) {
        // Start with a complete copy of ALL properties
        const slide = { ...data };
        
        // Transform elements array
        slide.elements = (data.elements || []).map(el => this.deserializeElement(el));
        
        // Ensure elementOrder exists
        slide.elementOrder = data.elementOrder || slide.elements.map(el => el.id);
        
        // Deserialize background properly
        slide.background = this.deserializeBackground(data.background);
        
        // Ensure layoutId is set (support both layout and layoutId)
        if (!slide.layoutId && slide.layout) {
            slide.layoutId = slide.layout;
        }
        
        // Set defaults for required properties
        slide.width = slide.width || 1920;
        slide.height = slide.height || 1080;
        
        return slide;
    }

    /**
     * Deserialize an element - copies ALL properties to ensure nothing is lost
     * @param {Object} data - Raw element data
     * @returns {Object} Deserialized element
     */
    deserializeElement(data) {
        // Start with a complete copy of ALL properties
        const element = { ...data };
        
        // Deep copy nested objects
        if (data.style) {
            element.style = { ...data.style };
            if (data.style.fills) {
                element.style.fills = data.style.fills.map(f => ({ ...f }));
            }
            if (data.style.strokes) {
                element.style.strokes = data.style.strokes.map(s => ({ ...s }));
            }
        }
        
        if (data.textFill) {
            element.textFill = { ...data.textFill };
        }
        
        if (data.fill) {
            element.fill = { ...data.fill };
        }
        
        if (data.stroke) {
            element.stroke = { ...data.stroke };
        }
        
        if (data.effects) {
            element.effects = data.effects.map(e => ({ ...e }));
        }
        
        if (data.animation) {
            element.animation = { ...data.animation };
        }
        
        if (data.crop) {
            element.crop = { ...data.crop };
        }
        
        if (data.filters) {
            element.filters = data.filters.map(f => ({ ...f }));
        }
        
        // Support legacy 'text' property for backwards compatibility
        if (data.text && !element.content) {
            element.content = data.text;
        }
        
        // Ensure defaults for core properties
        element.x = element.x ?? 0;
        element.y = element.y ?? 0;
        element.width = element.width ?? 100;
        element.height = element.height ?? 100;
        element.rotation = element.rotation ?? 0;
        element.opacity = element.opacity ?? 1;
        element.visible = element.visible !== false;
        
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
     * Deserialize background - can be null, single fill object, or array of fills
     * @param {Object|Array|null} data - Raw background data
     * @returns {Object|Array|null} Deserialized background
     */
    deserializeBackground(data) {
        // null means inherit from parent - preserve this
        if (data === null || data === undefined) {
            return null;
        }

        // Handle array of fills
        if (Array.isArray(data)) {
            return data.map(fill => this.deserializeFill(fill));
        }

        // Handle single fill object
        return this.deserializeFill(data);
    }

    /**
     * Deserialize a single fill object
     * @param {Object} fill - Fill object
     * @returns {Object} Deserialized fill
     */
    deserializeFill(fill) {
        if (!fill) {
            return { type: 'solid', value: '#ffffff' };
        }

        const deserialized = { ...fill };

        // Support legacy 'color' property - convert to 'value'
        if (fill.type === 'solid' && fill.color && !fill.value) {
            deserialized.value = fill.color;
            delete deserialized.color;
        }

        return deserialized;
    }

    /**
     * Legacy background deserializer (kept for reference)
     * @deprecated Use deserializeBackground instead
     */
    deserializeBackgroundLegacy(data) {
        if (!data) {
            return { type: 'solid', value: '#ffffff' };
        }

        const background = {
            type: data.type || 'solid'
        };

        switch (data.type) {
            case 'solid':
                background.value = data.value || data.color || '#ffffff';
                break;
            case 'gradient':
                background.value = data.value || data.gradient;
                break;
            case 'image':
                background.assetId = data.assetId;
                background.value = data.assetPath || data.value;
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
