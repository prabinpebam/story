/**
 * Documentation Search Component
 * 
 * Provides fast, fuzzy search across all documentation with:
 * - Real-time filtering
 * - Keyboard navigation
 * - Search result highlighting
 * - Recent searches
 */

import { flattenDocsStructure } from './docs-structure.js';

export class DocsSearch {
    constructor(structure, onNavigate) {
        this.structure = structure;
        this.onNavigate = onNavigate;
        this.searchIndex = [];
        this.searchInput = null;
        this.resultsContainer = null;
        this.selectedIndex = -1;
        this.results = [];
        this.debounceTimer = null;
        
        this.init();
    }
    
    async init() {
        this.searchInput = document.getElementById('docs-search');
        this.resultsContainer = document.getElementById('search-results');
        
        if (!this.searchInput || !this.resultsContainer) {
            console.warn('Search elements not found');
            return;
        }
        
        // Build search index
        this.buildSearchIndex();
        
        // Bind events
        this.bindEvents();
    }
    
    buildSearchIndex() {
        // Flatten document structure for searching
        this.searchIndex = flattenDocsStructure(this.structure);
        
        // Optionally load full content for deep search
        // This could be done lazily or in a web worker
    }
    
    bindEvents() {
        // Input event for search
        this.searchInput.addEventListener('input', (e) => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this.search(e.target.value);
            }, 150);
        });
        
        // Focus events
        this.searchInput.addEventListener('focus', () => {
            if (this.searchInput.value.length > 0) {
                this.showResults();
            }
        });
        
        // Blur with delay to allow click on results
        this.searchInput.addEventListener('blur', () => {
            setTimeout(() => this.hideResults(), 200);
        });
        
        // Keyboard navigation
        this.searchInput.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.selectNext();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.selectPrevious();
                    break;
                case 'Enter':
                    e.preventDefault();
                    this.selectCurrent();
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.hideResults();
                    this.searchInput.blur();
                    break;
            }
        });
    }
    
    search(query) {
        query = query.trim().toLowerCase();
        
        if (query.length === 0) {
            this.hideResults();
            return;
        }
        
        // Simple fuzzy matching
        const scored = this.searchIndex.map(item => {
            const score = this.calculateScore(item, query);
            return { ...item, score };
        }).filter(item => item.score > 0);
        
        // Sort by score descending
        scored.sort((a, b) => b.score - a.score);
        
        // Take top results
        this.results = scored.slice(0, 10);
        this.selectedIndex = -1;
        
        this.renderResults(query);
    }
    
    calculateScore(item, query) {
        const title = item.title.toLowerCase();
        const path = item.path.toLowerCase();
        const breadcrumb = item.breadcrumb.join(' ').toLowerCase();
        
        let score = 0;
        
        // Exact title match
        if (title === query) {
            score += 100;
        }
        // Title starts with query
        else if (title.startsWith(query)) {
            score += 80;
        }
        // Title contains query
        else if (title.includes(query)) {
            score += 60;
        }
        
        // Path contains query
        if (path.includes(query)) {
            score += 30;
        }
        
        // Breadcrumb contains query
        if (breadcrumb.includes(query)) {
            score += 20;
        }
        
        // Fuzzy match on title
        if (score === 0) {
            const fuzzyScore = this.fuzzyMatch(title, query);
            score += fuzzyScore * 40;
        }
        
        return score;
    }
    
    fuzzyMatch(str, query) {
        let queryIndex = 0;
        let score = 0;
        let consecutiveBonus = 0;
        
        for (let i = 0; i < str.length && queryIndex < query.length; i++) {
            if (str[i] === query[queryIndex]) {
                score += 1 + consecutiveBonus;
                consecutiveBonus += 0.5;
                queryIndex++;
            } else {
                consecutiveBonus = 0;
            }
        }
        
        return queryIndex === query.length ? score / query.length : 0;
    }
    
    renderResults(query) {
        if (this.results.length === 0) {
            this.resultsContainer.innerHTML = `
                <div class="search-empty">
                    <p>No results found for "<strong>${this.escapeHtml(query)}</strong>"</p>
                </div>
            `;
            this.showResults();
            return;
        }
        
        const html = this.results.map((result, index) => {
            const isSelected = index === this.selectedIndex;
            const highlightedTitle = this.highlightMatch(result.title, query);
            const breadcrumb = result.breadcrumb.slice(0, -1).join(' › ');
            
            return `
                <div class="search-result-item ${isSelected ? 'selected' : ''}" 
                     data-index="${index}" 
                     data-path="${result.path}">
                    <div class="search-result-title">${highlightedTitle}</div>
                    <div class="search-result-path">${breadcrumb}</div>
                </div>
            `;
        }).join('');
        
        this.resultsContainer.innerHTML = html;
        
        // Add click handlers
        this.resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const path = item.dataset.path;
                this.hideResults();
                this.searchInput.value = '';
                this.onNavigate(path);
            });
            
            item.addEventListener('mouseenter', () => {
                this.selectedIndex = parseInt(item.dataset.index);
                this.updateSelection();
            });
        });
        
        this.showResults();
    }
    
    highlightMatch(text, query) {
        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const index = lowerText.indexOf(lowerQuery);
        
        if (index === -1) {
            return this.escapeHtml(text);
        }
        
        const before = text.slice(0, index);
        const match = text.slice(index, index + query.length);
        const after = text.slice(index + query.length);
        
        return `${this.escapeHtml(before)}<mark>${this.escapeHtml(match)}</mark>${this.escapeHtml(after)}`;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    selectNext() {
        if (this.results.length === 0) return;
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.results.length - 1);
        this.updateSelection();
    }
    
    selectPrevious() {
        if (this.results.length === 0) return;
        this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        this.updateSelection();
    }
    
    updateSelection() {
        const items = this.resultsContainer.querySelectorAll('.search-result-item');
        items.forEach((item, index) => {
            item.classList.toggle('selected', index === this.selectedIndex);
        });
        
        // Scroll selected into view
        const selected = this.resultsContainer.querySelector('.search-result-item.selected');
        if (selected) {
            selected.scrollIntoView({ block: 'nearest' });
        }
    }
    
    selectCurrent() {
        if (this.selectedIndex >= 0 && this.selectedIndex < this.results.length) {
            const result = this.results[this.selectedIndex];
            this.hideResults();
            this.searchInput.value = '';
            this.onNavigate(result.path);
        }
    }
    
    showResults() {
        this.resultsContainer.classList.remove('hidden');
    }
    
    hideResults() {
        this.resultsContainer.classList.add('hidden');
        this.selectedIndex = -1;
    }
}
