/**
 * MetadataBuilder
 * Builds document/metadata.json for .str file format
 */

export class MetadataBuilder {
    constructor() {
        this.metadata = {
            title: 'Untitled Presentation',
            description: '',
            author: null,
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            slideCount: 0,
            aspectRatio: '16:9',
            tags: [],
            language: 'en',
            version: 1
        };
    }

    /**
     * Set presentation title
     * @param {string} title - Title
     * @returns {MetadataBuilder} this for chaining
     */
    setTitle(title) {
        this.metadata.title = title || 'Untitled Presentation';
        return this;
    }

    /**
     * Set presentation description
     * @param {string} description - Description text
     * @returns {MetadataBuilder} this for chaining
     */
    setDescription(description) {
        this.metadata.description = description || '';
        return this;
    }

    /**
     * Set author information
     * @param {Object} user - User object with id, name, email
     * @returns {MetadataBuilder} this for chaining
     */
    setAuthor(user) {
        if (user) {
            this.metadata.author = {
                id: user.id || null,
                name: user.name || user.displayName || null,
                email: user.email || null,
                avatarUrl: user.avatarUrl || user.picture || null
            };
        }
        return this;
    }

    /**
     * Set creation timestamp
     * @param {Date|string} date - Creation date
     * @returns {MetadataBuilder} this for chaining
     */
    setCreated(date) {
        this.metadata.created = date instanceof Date 
            ? date.toISOString() 
            : date;
        return this;
    }

    /**
     * Set modification timestamp
     * @param {Date|string} date - Modification date
     * @returns {MetadataBuilder} this for chaining
     */
    setModified(date) {
        this.metadata.modified = date instanceof Date 
            ? date.toISOString() 
            : date;
        return this;
    }

    /**
     * Set slide count
     * @param {number} count - Number of slides
     * @returns {MetadataBuilder} this for chaining
     */
    setSlideCount(count) {
        this.metadata.slideCount = count;
        return this;
    }

    /**
     * Set aspect ratio
     * @param {string} ratio - Aspect ratio (e.g., '16:9', '4:3')
     * @returns {MetadataBuilder} this for chaining
     */
    setAspectRatio(ratio) {
        this.metadata.aspectRatio = ratio || '16:9';
        return this;
    }

    /**
     * Set tags
     * @param {string[]} tags - Array of tag strings
     * @returns {MetadataBuilder} this for chaining
     */
    setTags(tags) {
        this.metadata.tags = Array.isArray(tags) ? tags : [];
        return this;
    }

    /**
     * Add a single tag
     * @param {string} tag - Tag to add
     * @returns {MetadataBuilder} this for chaining
     */
    addTag(tag) {
        if (tag && !this.metadata.tags.includes(tag)) {
            this.metadata.tags.push(tag);
        }
        return this;
    }

    /**
     * Set language
     * @param {string} language - Language code (e.g., 'en', 'es')
     * @returns {MetadataBuilder} this for chaining
     */
    setLanguage(language) {
        this.metadata.language = language || 'en';
        return this;
    }

    /**
     * Increment version number
     * @returns {MetadataBuilder} this for chaining
     */
    incrementVersion() {
        this.metadata.version = (this.metadata.version || 0) + 1;
        return this;
    }

    /**
     * Set version number
     * @param {number} version - Version number
     * @returns {MetadataBuilder} this for chaining
     */
    setVersion(version) {
        this.metadata.version = version;
        return this;
    }

    /**
     * Set custom field
     * @param {string} key - Field key
     * @param {any} value - Field value
     * @returns {MetadataBuilder} this for chaining
     */
    setCustomField(key, value) {
        this.metadata[key] = value;
        return this;
    }

    /**
     * Build the metadata object
     * @returns {Object} The completed metadata
     */
    build() {
        // Ensure modified date is current
        this.metadata.modified = new Date().toISOString();
        return { ...this.metadata };
    }

    /**
     * Build and return as JSON string
     * @param {boolean} pretty - Whether to format with indentation
     * @returns {string} JSON string
     */
    toJSON(pretty = true) {
        return JSON.stringify(this.build(), null, pretty ? 2 : 0);
    }

    /**
     * Create from existing metadata (for updates)
     * @param {Object} existing - Existing metadata object
     * @returns {MetadataBuilder} New builder with existing data
     */
    static fromExisting(existing) {
        const builder = new MetadataBuilder();
        builder.metadata = {
            ...builder.metadata,
            ...existing,
            tags: [...(existing.tags || [])]
        };
        return builder;
    }
}

export default MetadataBuilder;
