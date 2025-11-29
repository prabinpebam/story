/**
 * ShareLinkGenerator
 * 
 * Generates and validates shareable links for Story presentations.
 * Handles link formatting, URL parsing, and embed code generation.
 */

import { ShareLinkType, ShareLinkScope } from './SharingConstants.js';

export class ShareLinkGenerator {
    /**
     * Create a ShareLinkGenerator
     * @param {Object} options - Configuration options
     * @param {string} [options.appUrl] - Base URL for the Story app
     */
    constructor(options = {}) {
        this.appUrl = options.appUrl || this._getDefaultAppUrl();
    }

    /**
     * Get default app URL
     * @private
     */
    _getDefaultAppUrl() {
        if (typeof window !== 'undefined') {
            return window.location.origin;
        }
        return 'https://story.app';
    }

    /**
     * Generate a Story app share link from a cloud provider link
     * @param {Object} options - Link options
     * @param {string} options.provider - Cloud provider (onedrive, google-drive)
     * @param {string} options.fileId - File ID
     * @param {string} options.providerUrl - Original provider URL
     * @param {string} [options.type='view'] - Link type (view, edit, present)
     * @returns {string} Story app shareable URL
     */
    generateShareUrl(options) {
        const { provider, fileId, providerUrl, type = 'view' } = options;
        
        // Create a Story app URL that wraps the cloud provider link
        const params = new URLSearchParams({
            provider,
            id: fileId,
            mode: type
        });
        
        // Include the original URL for direct access if needed
        if (providerUrl) {
            params.set('source', encodeURIComponent(providerUrl));
        }
        
        return `${this.appUrl}/open?${params}`;
    }

    /**
     * Generate a direct present mode link
     * @param {string} fileId - File ID
     * @param {string} provider - Cloud provider
     * @returns {string} Present mode URL
     */
    generatePresentUrl(fileId, provider) {
        const params = new URLSearchParams({
            provider,
            id: fileId,
            mode: 'present',
            autostart: 'true'
        });
        
        return `${this.appUrl}/present?${params}`;
    }

    /**
     * Generate an embed code for the presentation
     * @param {Object} options - Embed options
     * @param {string} options.fileId - File ID
     * @param {string} options.provider - Cloud provider
     * @param {number} [options.width=800] - Embed width
     * @param {number} [options.height=450] - Embed height
     * @param {boolean} [options.autoplay=false] - Auto-start presentation
     * @returns {string} HTML embed code
     */
    generateEmbedCode(options) {
        const {
            fileId,
            provider,
            width = 800,
            height = 450,
            autoplay = false
        } = options;
        
        const params = new URLSearchParams({
            provider,
            id: fileId,
            mode: 'embed'
        });
        
        if (autoplay) {
            params.set('autoplay', 'true');
        }
        
        const embedUrl = `${this.appUrl}/embed?${params}`;
        
        return `<iframe 
    src="${embedUrl}" 
    width="${width}" 
    height="${height}" 
    frameborder="0" 
    allowfullscreen
    allow="fullscreen; autoplay"
    title="Story Presentation">
</iframe>`;
    }

    /**
     * Generate a QR code URL for a share link
     * @param {string} shareUrl - The URL to encode
     * @param {Object} [options] - QR options
     * @param {number} [options.size=200] - QR code size in pixels
     * @returns {string} URL to QR code image
     */
    generateQRCodeUrl(shareUrl, options = {}) {
        const { size = 200 } = options;
        
        // Use Google Charts API for QR generation (can be replaced with local generation)
        const encodedUrl = encodeURIComponent(shareUrl);
        return `https://chart.googleapis.com/chart?cht=qr&chs=${size}x${size}&chl=${encodedUrl}`;
    }

    /**
     * Parse a share URL to extract components
     * @param {string} url - URL to parse
     * @returns {Object|null} Parsed components or null if invalid
     */
    parseShareUrl(url) {
        try {
            const urlObj = new URL(url);
            
            // Check if it's a Story app URL
            // Must be from our app's origin to be a Story URL
            if (urlObj.origin === this.appUrl) {
                if (urlObj.pathname.startsWith('/open') || urlObj.pathname.startsWith('/present')) {
                    const params = new URLSearchParams(urlObj.search);
                    
                    return {
                        provider: params.get('provider'),
                        fileId: params.get('id'),
                        mode: params.get('mode') || 'view',
                        sourceUrl: params.get('source') ? decodeURIComponent(params.get('source')) : null,
                        isStoryUrl: true
                    };
                }
            }
            
            // Try to detect cloud provider URLs
            const providerInfo = this._detectProvider(url);
            if (providerInfo) {
                return {
                    ...providerInfo,
                    mode: 'view',
                    isStoryUrl: false
                };
            }
            
            return null;
        } catch {
            return null;
        }
    }

    /**
     * Detect cloud provider from URL
     * @private
     */
    _detectProvider(url) {
        const urlObj = new URL(url);
        
        // OneDrive / SharePoint
        if (urlObj.hostname.includes('sharepoint.com') || 
            urlObj.hostname.includes('onedrive.live.com') ||
            urlObj.hostname.includes('1drv.ms')) {
            return {
                provider: 'onedrive',
                fileId: this._extractOneDriveId(url),
                sourceUrl: url
            };
        }
        
        // Google Drive / Docs / Slides / Sheets
        if (urlObj.hostname.includes('drive.google.com') ||
            urlObj.hostname.includes('docs.google.com')) {
            return {
                provider: 'google-drive',
                fileId: this._extractGoogleDriveId(url),
                sourceUrl: url
            };
        }
        
        return null;
    }

    /**
     * Extract file ID from OneDrive URL
     * @private
     */
    _extractOneDriveId(url) {
        // OneDrive URLs have various formats
        // Try to extract resid or id parameter
        const urlObj = new URL(url);
        const params = new URLSearchParams(urlObj.search);
        
        if (params.has('resid')) {
            return params.get('resid');
        }
        
        if (params.has('id')) {
            return params.get('id');
        }
        
        // Check path for item ID
        const match = url.match(/items\/([A-Za-z0-9!]+)/);
        if (match) {
            return match[1];
        }
        
        return null;
    }

    /**
     * Extract file ID from Google Drive URL
     * @private
     */
    _extractGoogleDriveId(url) {
        // Google Drive URLs: /file/d/{fileId}/...
        const fileMatch = url.match(/\/file\/d\/([A-Za-z0-9_-]+)/);
        if (fileMatch) {
            return fileMatch[1];
        }
        
        // Google Docs/Slides/Sheets URLs: /d/{fileId}/... or /presentation/d/{fileId}/...
        const docMatch = url.match(/\/d\/([A-Za-z0-9_-]+)/);
        if (docMatch) {
            return docMatch[1];
        }
        
        // URL parameter
        try {
            const urlObj = new URL(url);
            const params = new URLSearchParams(urlObj.search);
            if (params.has('id')) {
                return params.get('id');
            }
        } catch {
            // Ignore URL parsing errors
        }
        
        return null;
    }

    /**
     * Validate a share URL
     * @param {string} url - URL to validate
     * @returns {Object} Validation result with isValid and error properties
     */
    validateUrl(url) {
        if (!url || typeof url !== 'string') {
            return { isValid: false, error: 'URL is required' };
        }
        
        try {
            const urlObj = new URL(url);
            
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                return { isValid: false, error: 'URL must use HTTP or HTTPS' };
            }
            
            const parsed = this.parseShareUrl(url);
            if (!parsed) {
                return { isValid: false, error: 'Unrecognized URL format' };
            }
            
            if (!parsed.fileId) {
                return { isValid: false, error: 'Could not extract file ID from URL' };
            }
            
            return { isValid: true, parsed };
        } catch {
            return { isValid: false, error: 'Invalid URL format' };
        }
    }

    /**
     * Shorten a URL using a URL shortening service
     * @param {string} url - URL to shorten
     * @returns {Promise<string>} Shortened URL
     */
    async shortenUrl(url) {
        // For now, return the original URL
        // In production, this would call a URL shortening service
        // like Bitly, TinyURL, or a custom service
        return url;
    }

    /**
     * Generate a mailto link for sharing
     * @param {Object} options - Email options
     * @param {string} options.shareUrl - URL to share
     * @param {string} options.title - Presentation title
     * @param {string} [options.to] - Recipient email
     * @returns {string} mailto: URL
     */
    generateMailtoLink(options) {
        const { shareUrl, title, to = '' } = options;
        
        const subject = encodeURIComponent(`Shared: ${title}`);
        const body = encodeURIComponent(
            `I'd like to share a presentation with you:\n\n` +
            `"${title}"\n\n` +
            `Click here to view: ${shareUrl}\n\n` +
            `Shared from Story`
        );
        
        return `mailto:${to}?subject=${subject}&body=${body}`;
    }

    /**
     * Generate social sharing links
     * @param {Object} options - Share options
     * @param {string} options.shareUrl - URL to share
     * @param {string} options.title - Presentation title
     * @returns {Object} Social sharing URLs
     */
    generateSocialLinks(options) {
        const { shareUrl, title } = options;
        const encodedUrl = encodeURIComponent(shareUrl);
        const encodedTitle = encodeURIComponent(title);
        
        return {
            twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            teams: `https://teams.microsoft.com/share?href=${encodedUrl}&msg=${encodedTitle}`,
            slack: `https://slack.com/share?url=${encodedUrl}&text=${encodedTitle}`
        };
    }

    /**
     * Copy a URL to clipboard
     * @param {string} url - URL to copy
     * @returns {Promise<boolean>} Whether copy succeeded
     */
    async copyToClipboard(url) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(url);
                return true;
            }
            
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = url;
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.select();
            
            const success = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            return success;
        } catch {
            return false;
        }
    }
}

export default ShareLinkGenerator;
