/**
 * ShareLinkGenerator Tests
 * 
 * Tests for shareable link generation and parsing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ShareLinkGenerator } from '../../../../src/core/storage/sharing/ShareLinkGenerator.js';

describe('ShareLinkGenerator', () => {
    let generator;
    
    beforeEach(() => {
        generator = new ShareLinkGenerator({
            appUrl: 'https://story.app'
        });
    });
    
    describe('constructor', () => {
        it('should use provided appUrl', () => {
            expect(generator.appUrl).toBe('https://story.app');
        });
        
        it('should use window.location.origin when available', () => {
            const originalWindow = global.window;
            global.window = { location: { origin: 'https://custom.app' } };
            
            const gen = new ShareLinkGenerator();
            expect(gen.appUrl).toBe('https://custom.app');
            
            global.window = originalWindow;
        });
    });
    
    describe('generateShareUrl', () => {
        it('should generate Story app URL', () => {
            const url = generator.generateShareUrl({
                provider: 'onedrive',
                fileId: 'file123',
                providerUrl: 'https://1drv.ms/xxx'
            });
            
            expect(url).toContain('https://story.app/open?');
            expect(url).toContain('provider=onedrive');
            expect(url).toContain('id=file123');
        });
        
        it('should include mode parameter', () => {
            const url = generator.generateShareUrl({
                provider: 'google-drive',
                fileId: 'file123',
                type: 'edit'
            });
            
            expect(url).toContain('mode=edit');
        });
        
        it('should encode provider URL', () => {
            const url = generator.generateShareUrl({
                provider: 'onedrive',
                fileId: 'file123',
                providerUrl: 'https://1drv.ms/test?param=value'
            });
            
            expect(url).toContain('source=');
            // The URL is double-encoded: once in the generateShareUrl function
            // and once by URLSearchParams, so check for the presence of encoded URL
            expect(url).toContain('source=https%253A');
        });
    });
    
    describe('generatePresentUrl', () => {
        it('should generate present mode URL', () => {
            const url = generator.generatePresentUrl('file123', 'onedrive');
            
            expect(url).toContain('https://story.app/present?');
            expect(url).toContain('provider=onedrive');
            expect(url).toContain('id=file123');
            expect(url).toContain('mode=present');
            expect(url).toContain('autostart=true');
        });
    });
    
    describe('generateEmbedCode', () => {
        it('should generate iframe embed code', () => {
            const code = generator.generateEmbedCode({
                fileId: 'file123',
                provider: 'google-drive'
            });
            
            expect(code).toContain('<iframe');
            expect(code).toContain('</iframe>');
            expect(code).toContain('https://story.app/embed?');
            expect(code).toContain('provider=google-drive');
            expect(code).toContain('id=file123');
        });
        
        it('should use custom dimensions', () => {
            const code = generator.generateEmbedCode({
                fileId: 'file123',
                provider: 'onedrive',
                width: 1024,
                height: 768
            });
            
            expect(code).toContain('width="1024"');
            expect(code).toContain('height="768"');
        });
        
        it('should include autoplay parameter', () => {
            const code = generator.generateEmbedCode({
                fileId: 'file123',
                provider: 'onedrive',
                autoplay: true
            });
            
            expect(code).toContain('autoplay=true');
        });
        
        it('should include accessibility attributes', () => {
            const code = generator.generateEmbedCode({
                fileId: 'file123',
                provider: 'onedrive'
            });
            
            expect(code).toContain('title="Story Presentation"');
            expect(code).toContain('frameborder="0"');
            expect(code).toContain('allowfullscreen');
        });
    });
    
    describe('generateQRCodeUrl', () => {
        it('should generate QR code URL', () => {
            const qrUrl = generator.generateQRCodeUrl('https://story.app/open?id=123');
            
            expect(qrUrl).toContain('chart.googleapis.com/chart');
            expect(qrUrl).toContain('cht=qr');
            expect(qrUrl).toContain(encodeURIComponent('https://story.app/open?id=123'));
        });
        
        it('should use custom size', () => {
            const qrUrl = generator.generateQRCodeUrl('https://story.app/open?id=123', {
                size: 300
            });
            
            expect(qrUrl).toContain('chs=300x300');
        });
    });
    
    describe('parseShareUrl', () => {
        it('should parse Story app open URL', () => {
            const result = generator.parseShareUrl(
                'https://story.app/open?provider=onedrive&id=file123&mode=view'
            );
            
            expect(result).toEqual({
                provider: 'onedrive',
                fileId: 'file123',
                mode: 'view',
                sourceUrl: null,
                isStoryUrl: true
            });
        });
        
        it('should parse Story app present URL', () => {
            const result = generator.parseShareUrl(
                'https://story.app/present?provider=google-drive&id=abc&mode=present'
            );
            
            expect(result).toEqual({
                provider: 'google-drive',
                fileId: 'abc',
                mode: 'present',
                sourceUrl: null,
                isStoryUrl: true
            });
        });
        
        it('should decode source URL', () => {
            const sourceUrl = 'https://1drv.ms/test?param=value';
            const url = `https://story.app/open?provider=onedrive&id=123&source=${encodeURIComponent(sourceUrl)}`;
            
            const result = generator.parseShareUrl(url);
            
            expect(result.sourceUrl).toBe(sourceUrl);
        });
        
        it('should detect OneDrive URLs', () => {
            const result = generator.parseShareUrl(
                'https://1drv.ms/u/s!AqHBdNlF_abc'
            );
            
            expect(result.provider).toBe('onedrive');
            expect(result.isStoryUrl).toBe(false);
        });
        
        it('should detect SharePoint URLs', () => {
            const result = generator.parseShareUrl(
                'https://contoso.sharepoint.com/sites/team/:b:/g/personal/items/123'
            );
            
            expect(result.provider).toBe('onedrive');
        });
        
        it('should detect Google Drive URLs', () => {
            const result = generator.parseShareUrl(
                'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/view'
            );
            
            expect(result.provider).toBe('google-drive');
            expect(result.fileId).toBe('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs');
            expect(result.isStoryUrl).toBe(false);
        });
        
        it('should extract Google Drive file ID from path', () => {
            const result = generator.parseShareUrl(
                'https://docs.google.com/presentation/d/AbC123_XyZ/edit'
            );
            
            expect(result.provider).toBe('google-drive');
            expect(result.fileId).toBe('AbC123_XyZ');
        });
        
        it('should return null for unrecognized URLs', () => {
            const result = generator.parseShareUrl('https://example.com/file');
            
            expect(result).toBeNull();
        });
        
        it('should return null for invalid URLs', () => {
            expect(generator.parseShareUrl('not a url')).toBeNull();
            expect(generator.parseShareUrl('')).toBeNull();
        });
    });
    
    describe('validateUrl', () => {
        it('should validate valid Story URLs', () => {
            const result = generator.validateUrl(
                'https://story.app/open?provider=onedrive&id=file123'
            );
            
            expect(result.isValid).toBe(true);
            expect(result.parsed).toBeDefined();
        });
        
        it('should validate valid cloud provider URLs', () => {
            const result = generator.validateUrl(
                'https://drive.google.com/file/d/abc123/view'
            );
            
            expect(result.isValid).toBe(true);
        });
        
        it('should reject empty URLs', () => {
            const result = generator.validateUrl('');
            
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('URL is required');
        });
        
        it('should reject non-HTTP URLs', () => {
            const result = generator.validateUrl('ftp://example.com/file');
            
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('URL must use HTTP or HTTPS');
        });
        
        it('should reject unrecognized URLs', () => {
            const result = generator.validateUrl('https://example.com/random');
            
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Unrecognized URL format');
        });
        
        it('should reject malformed URLs', () => {
            const result = generator.validateUrl('not-a-valid-url');
            
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Invalid URL format');
        });
    });
    
    describe('shortenUrl', () => {
        it('should return original URL (placeholder)', async () => {
            const url = 'https://story.app/open?provider=onedrive&id=file123';
            const shortened = await generator.shortenUrl(url);
            
            expect(shortened).toBe(url);
        });
    });
    
    describe('generateMailtoLink', () => {
        it('should generate mailto link', () => {
            const mailto = generator.generateMailtoLink({
                shareUrl: 'https://story.app/open?id=123',
                title: 'My Presentation'
            });
            
            expect(mailto).toContain('mailto:');
            expect(mailto).toContain('subject=');
            expect(mailto).toContain('My%20Presentation');
            expect(mailto).toContain('body=');
        });
        
        it('should include recipient when provided', () => {
            const mailto = generator.generateMailtoLink({
                shareUrl: 'https://story.app/open?id=123',
                title: 'My Presentation',
                to: 'test@example.com'
            });
            
            expect(mailto).toContain('mailto:test@example.com');
        });
    });
    
    describe('generateSocialLinks', () => {
        it('should generate social sharing links', () => {
            const links = generator.generateSocialLinks({
                shareUrl: 'https://story.app/open?id=123',
                title: 'My Presentation'
            });
            
            expect(links.twitter).toContain('twitter.com/intent/tweet');
            expect(links.linkedin).toContain('linkedin.com');
            expect(links.facebook).toContain('facebook.com/sharer');
            expect(links.teams).toContain('teams.microsoft.com');
            expect(links.slack).toContain('slack.com/share');
        });
        
        it('should encode URL and title', () => {
            const links = generator.generateSocialLinks({
                shareUrl: 'https://story.app/open?id=123',
                title: 'Test & Demo'
            });
            
            expect(links.twitter).toContain(encodeURIComponent('https://story.app/open?id=123'));
            expect(links.twitter).toContain(encodeURIComponent('Test & Demo'));
        });
    });
    
    describe('copyToClipboard', () => {
        let originalNavigator;
        let originalDocument;
        
        beforeEach(() => {
            originalNavigator = global.navigator;
            originalDocument = global.document;
        });
        
        afterEach(() => {
            global.navigator = originalNavigator;
            global.document = originalDocument;
        });
        
        it('should copy using Clipboard API when available', async () => {
            const writeText = vi.fn().mockResolvedValue(undefined);
            global.navigator = {
                clipboard: { writeText }
            };
            
            const result = await generator.copyToClipboard('https://story.app');
            
            expect(writeText).toHaveBeenCalledWith('https://story.app');
            expect(result).toBe(true);
        });
        
        it('should use fallback when Clipboard API unavailable', async () => {
            const mockTextArea = {
                value: '',
                style: {},
                select: vi.fn()
            };
            
            global.navigator = {};
            global.document = {
                createElement: vi.fn().mockReturnValue(mockTextArea),
                body: {
                    appendChild: vi.fn(),
                    removeChild: vi.fn()
                },
                execCommand: vi.fn().mockReturnValue(true)
            };
            
            const result = await generator.copyToClipboard('https://story.app');
            
            expect(mockTextArea.value).toBe('https://story.app');
            expect(mockTextArea.select).toHaveBeenCalled();
            expect(global.document.execCommand).toHaveBeenCalledWith('copy');
            expect(result).toBe(true);
        });
        
        it('should return false on copy failure', async () => {
            global.navigator = {
                clipboard: {
                    writeText: vi.fn().mockRejectedValue(new Error('Failed'))
                }
            };
            
            const result = await generator.copyToClipboard('https://story.app');
            
            expect(result).toBe(false);
        });
    });
});
