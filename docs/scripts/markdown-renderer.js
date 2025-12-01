/**
 * Markdown Renderer
 * 
 * A lightweight markdown-to-HTML renderer with support for:
 * - Headings with auto-generated IDs
 * - Code blocks with syntax highlighting hints
 * - Tables
 * - Task lists
 * - Blockquotes
 * - Links and images
 * - Callout blocks
 */

export class MarkdownRenderer {
    constructor() {
        this.headingIds = new Map();
    }
    
    render(markdown) {
        this.headingIds.clear();
        
        // Normalize line endings
        let html = markdown.replace(/\r\n/g, '\n');
        
        // Process blocks in order
        html = this.processCodeBlocks(html);
        html = this.processTables(html);
        html = this.processBlockquotes(html);
        html = this.processLists(html);
        html = this.processHeadings(html);
        html = this.processParagraphs(html);
        html = this.processInlineElements(html);
        html = this.processHorizontalRules(html);
        
        return html;
    }
    
    processCodeBlocks(text) {
        // Fenced code blocks with language
        return text.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
            const escapedCode = this.escapeHtml(code.trim());
            const langClass = lang ? ` class="language-${lang}"` : '';
            return `<pre><code${langClass}>${escapedCode}</code></pre>`;
        });
    }
    
    processTables(text) {
        const tableRegex = /(?:^|\n)((?:\|[^\n]+\|\n)+)/g;
        
        return text.replace(tableRegex, (match, tableText) => {
            const lines = tableText.trim().split('\n');
            if (lines.length < 2) return match;
            
            // Check for separator row
            const separatorIndex = lines.findIndex(line => /^\|[\s\-:|]+\|$/.test(line));
            if (separatorIndex === -1) return match;
            
            let html = '<table>\n';
            
            // Header
            const headerCells = this.parseTableRow(lines[0]);
            html += '<thead><tr>\n';
            headerCells.forEach(cell => {
                html += `<th>${this.processInlineElements(cell)}</th>\n`;
            });
            html += '</tr></thead>\n';
            
            // Body
            html += '<tbody>\n';
            for (let i = separatorIndex + 1; i < lines.length; i++) {
                const cells = this.parseTableRow(lines[i]);
                html += '<tr>\n';
                cells.forEach(cell => {
                    html += `<td>${this.processInlineElements(cell)}</td>\n`;
                });
                html += '</tr>\n';
            }
            html += '</tbody>\n</table>\n';
            
            return html;
        });
    }
    
    parseTableRow(row) {
        return row.split('|')
            .slice(1, -1) // Remove first and last empty strings
            .map(cell => cell.trim());
    }
    
    processBlockquotes(text) {
        const lines = text.split('\n');
        const result = [];
        let inBlockquote = false;
        let blockquoteContent = [];
        
        for (const line of lines) {
            if (line.startsWith('> ')) {
                if (!inBlockquote) {
                    inBlockquote = true;
                    blockquoteContent = [];
                }
                blockquoteContent.push(line.slice(2));
            } else if (line.startsWith('>')) {
                if (!inBlockquote) {
                    inBlockquote = true;
                    blockquoteContent = [];
                }
                blockquoteContent.push(line.slice(1));
            } else {
                if (inBlockquote) {
                    result.push(this.renderBlockquote(blockquoteContent.join('\n')));
                    inBlockquote = false;
                }
                result.push(line);
            }
        }
        
        if (inBlockquote) {
            result.push(this.renderBlockquote(blockquoteContent.join('\n')));
        }
        
        return result.join('\n');
    }
    
    renderBlockquote(content) {
        // Check for callout syntax: > [!NOTE], > [!WARNING], etc.
        const calloutMatch = content.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i);
        
        if (calloutMatch) {
            const type = calloutMatch[1].toLowerCase();
            const calloutContent = content.slice(calloutMatch[0].length);
            const iconMap = {
                note: 'fa-solid fa-circle-info',
                tip: 'fa-solid fa-lightbulb',
                important: 'fa-solid fa-circle-exclamation',
                warning: 'fa-solid fa-triangle-exclamation',
                caution: 'fa-solid fa-fire'
            };
            const typeMap = {
                note: 'info',
                tip: 'success',
                important: 'info',
                warning: 'warning',
                caution: 'danger'
            };
            
            return `<div class="callout callout-${typeMap[type]}">
                <div class="callout-icon"><i class="${iconMap[type]}"></i></div>
                <div class="callout-content">${this.processInlineElements(calloutContent)}</div>
            </div>`;
        }
        
        return `<blockquote>${this.processInlineElements(content)}</blockquote>`;
    }
    
    processLists(text) {
        const lines = text.split('\n');
        const result = [];
        let listStack = [];
        let currentIndent = 0;
        
        const pushListItem = (content, isOrdered, indent) => {
            while (listStack.length > 0 && listStack[listStack.length - 1].indent >= indent) {
                const list = listStack.pop();
                const tag = list.ordered ? 'ol' : 'ul';
                result.push(`</${tag}>`);
            }
            
            if (listStack.length === 0 || listStack[listStack.length - 1].indent < indent) {
                const tag = isOrdered ? 'ol' : 'ul';
                result.push(`<${tag}>`);
                listStack.push({ ordered: isOrdered, indent });
            }
            
            // Handle task list items
            const taskMatch = content.match(/^\[([ xX])\]\s*/);
            if (taskMatch) {
                const checked = taskMatch[1].toLowerCase() === 'x' ? ' checked' : '';
                content = `<input type="checkbox"${checked} disabled> ${content.slice(taskMatch[0].length)}`;
            }
            
            result.push(`<li>${this.processInlineElements(content)}</li>`);
        };
        
        for (const line of lines) {
            // Unordered list
            const ulMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);
            if (ulMatch) {
                pushListItem(ulMatch[2], false, ulMatch[1].length);
                continue;
            }
            
            // Ordered list
            const olMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
            if (olMatch) {
                pushListItem(olMatch[2], true, olMatch[1].length);
                continue;
            }
            
            // Close all open lists
            while (listStack.length > 0) {
                const list = listStack.pop();
                const tag = list.ordered ? 'ol' : 'ul';
                result.push(`</${tag}>`);
            }
            
            result.push(line);
        }
        
        // Close remaining lists
        while (listStack.length > 0) {
            const list = listStack.pop();
            const tag = list.ordered ? 'ol' : 'ul';
            result.push(`</${tag}>`);
        }
        
        return result.join('\n');
    }
    
    processHeadings(text) {
        return text.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, content) => {
            const level = hashes.length;
            const id = this.generateHeadingId(content);
            return `<h${level} id="${id}">${this.processInlineElements(content)}</h${level}>`;
        });
    }
    
    generateHeadingId(text) {
        // Remove inline formatting and create slug
        let id = text
            .toLowerCase()
            .replace(/\*\*(.+?)\*\*/g, '$1')
            .replace(/\*(.+?)\*/g, '$1')
            .replace(/`(.+?)`/g, '$1')
            .replace(/\[(.+?)\]\(.+?\)/g, '$1')
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .trim();
        
        // Handle duplicates
        if (this.headingIds.has(id)) {
            const count = this.headingIds.get(id) + 1;
            this.headingIds.set(id, count);
            id = `${id}-${count}`;
        } else {
            this.headingIds.set(id, 0);
        }
        
        return id;
    }
    
    processParagraphs(text) {
        const lines = text.split('\n');
        const result = [];
        let inParagraph = false;
        let paragraphContent = [];
        
        const closeParagraph = () => {
            if (paragraphContent.length > 0) {
                result.push(`<p>${paragraphContent.join(' ')}</p>`);
                paragraphContent = [];
            }
            inParagraph = false;
        };
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            // Skip if it's already HTML
            if (trimmed.startsWith('<') && !trimmed.startsWith('<http')) {
                closeParagraph();
                result.push(line);
                continue;
            }
            
            // Empty line ends paragraph
            if (trimmed === '') {
                closeParagraph();
                result.push('');
                continue;
            }
            
            // Start or continue paragraph
            paragraphContent.push(trimmed);
            inParagraph = true;
        }
        
        closeParagraph();
        return result.join('\n');
    }
    
    processInlineElements(text) {
        if (!text) return '';
        
        // Already processed HTML
        if (text.startsWith('<') && text.endsWith('>')) {
            return text;
        }
        
        // Bold
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/__(.+?)__/g, '<strong>$1</strong>');
        
        // Italic
        text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
        text = text.replace(/_(.+?)_/g, '<em>$1</em>');
        
        // Strikethrough
        text = text.replace(/~~(.+?)~~/g, '<del>$1</del>');
        
        // Inline code
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Links
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url) => {
            const isExternal = url.startsWith('http');
            const target = isExternal ? ' target="_blank" rel="noopener"' : '';
            return `<a href="${url}"${target}>${label}</a>`;
        });
        
        // Images
        text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
        
        // Auto-link URLs
        text = text.replace(/(?<!["\(])https?:\/\/[^\s<>]+/g, '<a href="$&" target="_blank" rel="noopener">$&</a>');
        
        return text;
    }
    
    processHorizontalRules(text) {
        return text.replace(/^[-*_]{3,}$/gm, '<hr>');
    }
    
    escapeHtml(text) {
        const entities = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return text.replace(/[&<>"']/g, char => entities[char]);
    }
}
