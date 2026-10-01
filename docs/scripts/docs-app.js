/**
 * Story Documentation - Main Application
 * 
 * A comprehensive documentation viewer with:
 * - Hierarchical navigation
 * - Full-text search
 * - Markdown rendering
 * - Table of contents generation
 * - Theme support
 * - Keyboard shortcuts
 */

import { DocsNavigation } from './docs-navigation.js';
import { DocsSearch } from './docs-search.js';
import { MarkdownRenderer } from './markdown-renderer.js';
import { TableOfContents } from './table-of-contents.js';
import { DOCS_STRUCTURE } from './docs-structure.js';
import { initComponentDemos, COMPONENT_DEMOS } from './component-demo.js';

class DocsApp {
    constructor() {
        this.navigation = null;
        this.search = null;
        this.markdownRenderer = null;
        this.toc = null;
        this.currentPath = null;
        
        this.init();
    }
    
    async init() {
        // Initialize theme from localStorage
        this.initTheme();
        
        // Initialize components
        this.navigation = new DocsNavigation(DOCS_STRUCTURE, this.navigateTo.bind(this));
        this.search = new DocsSearch(DOCS_STRUCTURE, this.navigateTo.bind(this));
        this.markdownRenderer = new MarkdownRenderer();
        this.toc = new TableOfContents();
        
        // Render navigation
        this.navigation.render(document.getElementById('docs-nav'));
        
        // Bind event listeners
        this.bindEvents();
        
        // Load initial page from URL hash or default
        const initialPath = this.getPathFromHash() || 'product-spec.md';
        await this.navigateTo(initialPath);
    }
    
    initTheme() {
        const savedTheme = localStorage.getItem('docs-theme');
        if (savedTheme === 'light') {
            document.body.classList.add('theme-light');
            this.updateThemeIcon(true);
        }
    }
    
    updateThemeIcon(isLight) {
        const icon = document.querySelector('#theme-toggle i');
        if (icon) {
            icon.className = isLight ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        }
    }
    
    bindEvents() {
        // Theme toggle
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            const isLight = document.body.classList.toggle('theme-light');
            localStorage.setItem('docs-theme', isLight ? 'light' : 'dark');
            this.updateThemeIcon(isLight);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Cmd/Ctrl + K - Focus search
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('docs-search')?.focus();
            }
            
            // Escape - Clear search
            if (e.key === 'Escape') {
                const searchInput = document.getElementById('docs-search');
                if (document.activeElement === searchInput) {
                    searchInput.value = '';
                    searchInput.blur();
                    this.search.hideResults();
                }
            }
        });
        
        // Hash change navigation
        window.addEventListener('hashchange', () => {
            const path = this.getPathFromHash();
            if (path && path !== this.currentPath) {
                this.navigateTo(path);
            }
        });
        
        // Article link clicks (internal navigation)
        document.getElementById('docs-article')?.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href) {
                const url = new URL(link.href);
                // Check if it's an internal documentation link
                if (url.pathname.endsWith('.md') || url.hash.startsWith('#')) {
                    if (url.hash && !url.pathname.endsWith('.md')) {
                        // Same-page anchor link
                        return;
                    }
                    e.preventDefault();
                    const path = this.resolveRelativePath(link.getAttribute('href'));
                    this.navigateTo(path);
                }
            }
        });
    }
    
    getPathFromHash() {
        const hash = window.location.hash.slice(1);
        if (hash) {
            return decodeURIComponent(hash);
        }
        return null;
    }
    
    resolveRelativePath(href) {
        if (href.startsWith('/') || href.startsWith('http')) {
            return href;
        }
        
        if (!this.currentPath) {
            return href;
        }
        
        // Handle relative paths
        const currentDir = this.currentPath.substring(0, this.currentPath.lastIndexOf('/') + 1);
        let resolved = currentDir + href;
        
        // Normalize path (handle ../)
        const parts = resolved.split('/');
        const normalized = [];
        for (const part of parts) {
            if (part === '..') {
                normalized.pop();
            } else if (part !== '.') {
                normalized.push(part);
            }
        }
        
        return normalized.join('/');
    }
    
    async navigateTo(path) {
        // Remove leading ./ if present
        path = path.replace(/^\.\//, '');
        
        // Update URL hash
        const newHash = '#' + encodeURIComponent(path);
        if (window.location.hash !== newHash) {
            history.pushState(null, '', newHash);
        }
        
        this.currentPath = path;
        
        // Update navigation active state
        this.navigation.setActive(path);
        
        // Load and render content
        const article = document.getElementById('docs-article');
        article.innerHTML = `
            <div class="loading-state">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>Loading documentation...</span>
            </div>
        `;
        
        try {
            const content = await this.loadDocument(path);
            const html = this.markdownRenderer.render(content);
            
            article.innerHTML = `<div class="article-content">${html}</div>`;
            
            // Process component demos in the rendered content
            this.processComponentDemos(article);
            
            // Generate table of contents
            this.toc.generate(article, document.getElementById('toc-nav'));
            
            // Scroll to top
            article.scrollTop = 0;
            
            // Handle anchor if present in original path
            if (path.includes('#')) {
                const anchor = path.split('#')[1];
                const target = document.getElementById(anchor);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        } catch (error) {
            console.error('Failed to load document:', error);
            article.innerHTML = `
                <div class="article-content">
                    <h1>Document Not Found</h1>
                    <p>The requested documentation page could not be found.</p>
                    <p><strong>Path:</strong> <code>${path}</code></p>
                    <p><a href="#product-spec.md">Return to Product Spec</a></p>
                </div>
            `;
        }
    }
    
    async loadDocument(path) {
        // Construct full path to documentation file
        const basePath = `${import.meta.env.BASE_URL}documentation/`;
        let fullPath = basePath + path;
        
        // Handle paths that might already include documentation/
        if (path.startsWith('documentation/')) {
            fullPath = '/' + path;
        }
        
        const response = await fetch(fullPath);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response.text();
    }
    
    /**
     * Process component demos embedded in the content
     * Looks for special markers like :::demo button-variants:::
     * and replaces them with interactive components
     */
    processComponentDemos(container) {
        // Process code blocks that contain demo markers
        const codeBlocks = container.querySelectorAll('code');
        codeBlocks.forEach(code => {
            const text = code.textContent.trim();
            const demoMatch = text.match(/^:::demo\s+([\w-]+)\s*:::$/);
            
            if (demoMatch) {
                const demoId = demoMatch[1];
                const demo = COMPONENT_DEMOS[demoId];
                
                if (demo) {
                    // Find the parent pre element and replace it
                    const pre = code.closest('pre');
                    if (pre) {
                        const demoContainer = document.createElement('div');
                        demoContainer.setAttribute('data-component-demo', demoId);
                        pre.replaceWith(demoContainer);
                        this.renderDemo(demoContainer, demo);
                    }
                }
            }
        });
        
        // Also process div elements with data-component-demo attribute
        initComponentDemos();
    }
    
    /**
     * Render a single demo into a container
     */
    renderDemo(container, demo) {
        container.innerHTML = '';
        container.className = 'component-demo';
        
        // Header
        if (demo.title) {
            const header = document.createElement('div');
            header.className = 'component-demo__header';
            
            const title = document.createElement('h4');
            title.className = 'component-demo__title';
            title.textContent = demo.title;
            header.appendChild(title);
            
            if (demo.description) {
                const desc = document.createElement('p');
                desc.className = 'component-demo__description';
                desc.textContent = demo.description;
                header.appendChild(desc);
            }
            
            container.appendChild(header);
        }
        
        // Demo content
        const content = document.createElement('div');
        content.className = 'component-demo__content';
        demo.render(content);
        container.appendChild(content);
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    window.docsApp = new DocsApp();
});
