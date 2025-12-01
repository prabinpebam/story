/**
 * Table of Contents Generator
 * 
 * Automatically generates a table of contents from article headings
 * with scroll spy functionality to highlight current section.
 */

export class TableOfContents {
    constructor() {
        this.container = null;
        this.headings = [];
        this.links = [];
        this.observer = null;
    }
    
    generate(articleElement, tocContainer) {
        this.container = tocContainer;
        
        if (!articleElement || !tocContainer) {
            return;
        }
        
        // Find all headings in the article
        this.headings = Array.from(articleElement.querySelectorAll('h2, h3, h4'));
        
        if (this.headings.length === 0) {
            tocContainer.innerHTML = '<div class="toc-empty">No headings</div>';
            return;
        }
        
        // Build TOC HTML
        const html = this.headings.map(heading => {
            const level = parseInt(heading.tagName.charAt(1));
            const id = heading.id;
            const text = heading.textContent;
            
            return `<a href="#${id}" class="toc-link" data-level="${level}">${this.escapeHtml(text)}</a>`;
        }).join('');
        
        tocContainer.innerHTML = html;
        
        // Get all links for scroll spy
        this.links = Array.from(tocContainer.querySelectorAll('.toc-link'));
        
        // Add click handlers
        this.links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const id = link.getAttribute('href').slice(1);
                const target = document.getElementById(id);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                    // Update URL hash without jumping
                    history.replaceState(null, '', link.getAttribute('href'));
                }
            });
        });
        
        // Set up scroll spy
        this.setupScrollSpy(articleElement);
    }
    
    setupScrollSpy(articleElement) {
        // Clean up previous observer
        if (this.observer) {
            this.observer.disconnect();
        }
        
        // Use Intersection Observer for scroll spy
        const options = {
            root: articleElement,
            rootMargin: '-20% 0px -80% 0px',
            threshold: 0
        };
        
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.setActiveLink(entry.target.id);
                }
            });
        }, options);
        
        // Observe all headings
        this.headings.forEach(heading => {
            this.observer.observe(heading);
        });
        
        // Also handle scroll for fallback
        let scrollTimeout;
        articleElement.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.updateActiveFromScroll(articleElement);
            }, 100);
        });
    }
    
    updateActiveFromScroll(articleElement) {
        const scrollTop = articleElement.scrollTop;
        const offset = 100; // Offset from top
        
        let currentHeading = null;
        
        for (const heading of this.headings) {
            if (heading.offsetTop - offset <= scrollTop) {
                currentHeading = heading;
            } else {
                break;
            }
        }
        
        if (currentHeading) {
            this.setActiveLink(currentHeading.id);
        }
    }
    
    setActiveLink(id) {
        this.links.forEach(link => {
            const isActive = link.getAttribute('href') === `#${id}`;
            link.classList.toggle('active', isActive);
        });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }
}
