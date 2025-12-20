function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

export function createEmptyNotesDoc() {
    return { version: 1, blocks: [] };
}

export function sanitizeHref(rawHref) {
    const href = String(rawHref || '').trim();
    if (!href) return null;

    let url;
    try {
        url = new URL(href, 'https://example.invalid');
    } catch {
        return null;
    }

    const protocol = (url.protocol || '').toLowerCase();
    if (protocol === 'http:' || protocol === 'https:' || protocol === 'mailto:') {
        return href;
    }

    return null;
}

function renderInlines(inlines) {
    const safeInlines = Array.isArray(inlines) ? inlines : [];

    return safeInlines
        .map((inline) => {
            if (!inline || typeof inline !== 'object') return '';

            if (inline.type === 'text') {
                const text = escapeHtml(inline.text || '');
                const marks = Array.isArray(inline.marks) ? inline.marks : [];

                let out = text;
                if (marks.includes('bold')) out = `<strong>${out}</strong>`;
                if (marks.includes('italic')) out = `<em>${out}</em>`;
                if (marks.includes('strikethrough')) out = `<s>${out}</s>`;
                return out;
            }

            if (inline.type === 'link') {
                const href = sanitizeHref(inline.href);
                const inner = renderInlines(inline.inlines);
                if (!href) return inner;
                return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${inner}</a>`;
            }

            return '';
        })
        .join('');
}

export function notesDocToSafeHtml(doc) {
    const blocks = Array.isArray(doc?.blocks) ? doc.blocks : [];

    const html = blocks
        .map((block) => {
            if (!block || typeof block !== 'object') return '';

            if (block.type === 'paragraph') {
                return `<p>${renderInlines(block.inlines)}</p>`;
            }

            if (block.type === 'heading') {
                const level = [1, 2, 3].includes(block.level) ? block.level : 2;
                return `<h${level}>${renderInlines(block.inlines)}</h${level}>`;
            }

            if (block.type === 'bulletList') {
                const items = Array.isArray(block.items) ? block.items : [];
                const lis = items
                    .map((item) => `<li>${renderInlines(item?.inlines)}</li>`)
                    .join('');
                return `<ul>${lis}</ul>`;
            }

            if (block.type === 'orderedList') {
                const items = Array.isArray(block.items) ? block.items : [];
                const lis = items
                    .map((item) => `<li>${renderInlines(item?.inlines)}</li>`)
                    .join('');
                return `<ol>${lis}</ol>`;
            }

            return '';
        })
        .join('');

    return html;
}

function parseInlineNodes(nodes, inheritedMarks = []) {
    const out = [];
    const markList = Array.isArray(inheritedMarks) ? inheritedMarks : [];

    for (const node of Array.from(nodes || [])) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent || '';
            if (text) {
                out.push({ type: 'text', text, marks: markList.length ? [...markList] : undefined });
            }
            continue;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) continue;

        const el = /** @type {HTMLElement} */ (node);
        const tag = (el.tagName || '').toLowerCase();

        if (tag === 'br') {
            out.push({ type: 'text', text: ' ', marks: markList.length ? [...markList] : undefined });
            continue;
        }

        const nextMarks = [...markList];
        if (tag === 'strong' || tag === 'b') nextMarks.push('bold');
        if (tag === 'em' || tag === 'i') nextMarks.push('italic');
        if (tag === 's' || tag === 'del' || tag === 'strike') nextMarks.push('strikethrough');

        if (tag === 'a') {
            const href = el.getAttribute('href') || '';
            const safeHref = sanitizeHref(href);
            const linkInlines = parseInlineNodes(el.childNodes, nextMarks);

            if (safeHref) {
                out.push({ type: 'link', href: safeHref, inlines: linkInlines });
            } else {
                out.push(...linkInlines);
            }
            continue;
        }

        if (
            tag === 'strong' ||
            tag === 'b' ||
            tag === 'em' ||
            tag === 'i' ||
            tag === 's' ||
            tag === 'del' ||
            tag === 'strike' ||
            tag === 'span' ||
            tag === 'div'
        ) {
            out.push(...parseInlineNodes(el.childNodes, nextMarks));
            continue;
        }

        // Unknown element: treat as text content only (drops unsafe attrs/tags).
        const text = el.textContent || '';
        if (text) {
            out.push({ type: 'text', text, marks: markList.length ? [...markList] : undefined });
        }
    }

    return out;
}

export function legacyNotesToNotesDoc(legacy) {
    const html = String(legacy || '').trim();
    if (!html) return createEmptyNotesDoc();

    let doc;
    try {
        doc = new DOMParser().parseFromString(html, 'text/html');
    } catch {
        return { version: 1, blocks: [{ type: 'paragraph', inlines: [{ type: 'text', text: html }] }] };
    }

    const body = doc.body;
    if (!body) return createEmptyNotesDoc();

    const blocks = [];

    const pushParagraphFromNode = (node) => {
        const inlines = parseInlineNodes(node.childNodes);
        blocks.push({ type: 'paragraph', inlines });
    };

    const children = Array.from(body.childNodes);
    if (children.length === 0) return createEmptyNotesDoc();

    // If the HTML contains only text nodes, treat as one paragraph.
    const hasElement = children.some((n) => n.nodeType === Node.ELEMENT_NODE);
    if (!hasElement) {
        const text = (body.textContent || '').trim();
        if (!text) return createEmptyNotesDoc();
        return { version: 1, blocks: [{ type: 'paragraph', inlines: [{ type: 'text', text }] }] };
    }

    for (const node of children) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = (node.textContent || '').trim();
            if (text) {
                blocks.push({ type: 'paragraph', inlines: [{ type: 'text', text }] });
            }
            continue;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        const el = /** @type {HTMLElement} */ (node);
        const tag = (el.tagName || '').toLowerCase();

        if (tag === 'p' || tag === 'div') {
            pushParagraphFromNode(el);
            continue;
        }

        if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
            const level = tag === 'h1' ? 1 : tag === 'h2' ? 2 : 3;
            blocks.push({ type: 'heading', level, inlines: parseInlineNodes(el.childNodes) });
            continue;
        }

        if (tag === 'ul' || tag === 'ol') {
            const items = Array.from(el.querySelectorAll(':scope > li')).map((li) => ({
                inlines: parseInlineNodes(li.childNodes)
            }));
            blocks.push({ type: tag === 'ul' ? 'bulletList' : 'orderedList', items });
            continue;
        }

        // Unknown top-level element: keep its text only.
        const text = (el.textContent || '').trim();
        if (text) {
            blocks.push({ type: 'paragraph', inlines: [{ type: 'text', text }] });
        }
    }

    return { version: 1, blocks: blocks.filter(Boolean) };
}
