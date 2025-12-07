import { store } from '../../../core/Store.js';

export function getActiveContainer(state) {
    if (state.editor.mode === 'master') {
        return state.slideMasterPresets[state.editor.activeMasterId];
    } else {
        return state.slides[state.editor.activeSlideId];
    }
}

export function updateProperty(ids, key, value) {
    const idArray = Array.isArray(ids) ? ids : [ids];
    idArray.forEach(id => {
        store.dispatch('UPDATE_ELEMENT', { id, [key]: value });
    });
}

export function updateStyle(ids, key, value) {
    const idArray = Array.isArray(ids) ? ids : [ids];
    const state = store.getState();
    const slide = getActiveContainer(state);

    idArray.forEach(id => {
        const el = slide.elements[id];
        if (el) {
            const newStyle = { ...el.style, [key]: value };
            store.dispatch('UPDATE_ELEMENT', { id, style: newStyle });
        }
    });
}

export function updateShadow(ids, key, value) {
    const idArray = Array.isArray(ids) ? ids : [ids];
    const state = store.getState();
    const slide = getActiveContainer(state);

    idArray.forEach(id => {
        const el = slide.elements[id];
        if (el) {
            const current = el.style?.dropShadow || { x: 0, y: 4, blur: 4, spread: 0, color: '#00000040' };
            const newShadow = { ...current, [key]: value };
            const newStyle = { ...el.style, dropShadow: newShadow };
            store.dispatch('UPDATE_ELEMENT', { id, style: newStyle });
        }
    });
}

export function updateAnimation(ids, key, value) {
    const idArray = Array.isArray(ids) ? ids : [ids];
    const state = store.getState();
    const slide = getActiveContainer(state);

    idArray.forEach(id => {
        const el = slide.elements[id];
        if (el) {
            const current = el.animations || { entrance: 'none', exit: 'none', duration: 1000, delay: 0 };
            const newAnim = { ...current, [key]: value };
            store.dispatch('UPDATE_ELEMENT', { id, animations: newAnim });
        }
    });
}

export function updateGradient(ids, updates) {
    const idArray = Array.isArray(ids) ? ids : [ids];
    const state = store.getState();
    const slide = getActiveContainer(state);

    idArray.forEach(id => {
        const element = slide.elements[id];
        if (!element) return;

        const style = element.style || {};
        const currentAngle = style.gradientAngle !== undefined ? style.gradientAngle : 180;
        const currentStops = style.gradientStops || [
            { color: '#D9D9D9', position: 0 },
            { color: '#000000', position: 100 }
        ];
        const currentType = style.gradientType || 'linear';

        const newAngle = updates.angle !== undefined ? updates.angle : currentAngle;
        const newStops = updates.stops !== undefined ? updates.stops : currentStops;
        const newType = updates.type !== undefined ? updates.type : currentType;

        // Construct CSS String
        let gradientString = '';
        const stopsString = newStops.map(s => `${s.color} ${s.position}%`).join(', ');

        if (newType === 'linear') {
            gradientString = `linear-gradient(${newAngle}deg, ${stopsString})`;
        } else if (newType === 'radial') {
            gradientString = `radial-gradient(circle, ${stopsString})`;
        } else if (newType === 'conic') {
            gradientString = `conic-gradient(from ${newAngle}deg, ${stopsString})`;
        }

        const newStyle = {
            ...style,
            fillValue: gradientString,
            gradientAngle: newAngle,
            gradientStops: newStops,
            gradientType: newType
        };

        store.dispatch('UPDATE_ELEMENT', { id, style: newStyle });
    });
}

export function getAlphaFromHex(hex) {
    if (hex.length === 9) {
        return hex.slice(7, 9);
    }
    return 'ff';
}

export function createControlGroup(title, sectionStates, defaultOpen = true) {
    const group = document.createElement('div');
    group.className = 'panel-section';
    
    // Determine open state
    const isOpen = sectionStates[title] !== undefined ? sectionStates[title] : defaultOpen;

    const header = document.createElement('div');
    header.className = 'section-header';
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.cursor = 'pointer';
    header.style.marginBottom = '8px';
    header.style.userSelect = 'none';

    const icon = document.createElement('i');
    icon.className = `fa-solid fa-chevron-${isOpen ? 'down' : 'right'}`;
    icon.style.fontSize = '10px';
    icon.style.width = '16px';
    icon.style.color = 'var(--color-text-secondary)';
    
    const label = document.createElement('div');
    label.className = 'section-title';
    label.innerText = title;
    label.style.marginBottom = '0'; // Override default
    label.style.flex = '1';
    
    header.appendChild(icon);
    header.appendChild(label);
    
    const content = document.createElement('div');
    content.style.display = isOpen ? 'block' : 'none';
    
    header.onclick = () => {
        const wasOpen = content.style.display !== 'none';
        const nowOpen = !wasOpen;
        content.style.display = nowOpen ? 'block' : 'none';
        icon.className = `fa-solid fa-chevron-${nowOpen ? 'down' : 'right'}`;
        sectionStates[title] = nowOpen;
    };

    group.appendChild(header);
    group.appendChild(content);
    
    // Return content container so we append controls there
    return { group, content };
}

export function createInputRow(label, input) {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.marginBottom = '8px';
    
    const labelEl = document.createElement('label');
    labelEl.innerText = label;
    labelEl.style.width = '80px';
    labelEl.style.fontSize = '11px';
    labelEl.style.color = 'var(--color-text-secondary)';
    
    row.appendChild(labelEl);
    row.appendChild(input);
    return row;
}

export function getPropertyValue(el, key) {
    if (key in el) return el[key];
    if (el.style && key in el.style) return el.style[key];
    return undefined;
}

export function getCommonProperties(elements) {
    const props = {};
    // Add all potential properties
    const keys = ['x', 'y', 'width', 'height', 'rotation', 'opacity', 'fontFamily', 'fontSize', 'fontWeight', 'textAlign', 'color', 'backgroundColor', 'cornerRadius'];
    
    keys.forEach(key => {
        const firstVal = getPropertyValue(elements[0], key);
        const allSame = elements.every(el => getPropertyValue(el, key) === firstVal);
        props[key] = allSame ? firstVal : 'Mixed';
    });
    
    return props;
}
