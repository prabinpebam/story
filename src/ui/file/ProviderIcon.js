/**
 * ProviderIcon - Cloud provider logo component
 * 
 * Displays the appropriate icon for file sources:
 * - OneDrive (Microsoft logo)
 * - Google Drive (Google Drive logo)
 * - Local (laptop icon)
 * - Unsaved (empty circle)
 */

/**
 * @typedef {'onedrive' | 'google-drive' | 'local' | 'unsaved'} ProviderType
 */

/**
 * @typedef {'sm' | 'md' | 'lg' | 'xl'} IconSize
 */

const PROVIDER_ICONS = {
    onedrive: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9.46 8.86L14.46 5.86C14.14 5.31 13.7 4.83 13.17 4.47C12.32 3.88 11.3 3.56 10.24 3.56C8.59 3.56 7.09 4.37 6.16 5.62C6.62 5.54 7.1 5.5 7.58 5.5C8.34 5.5 9.07 5.65 9.73 5.93C9.61 6.48 9.53 7.05 9.53 7.63C9.53 8.05 9.47 8.46 9.46 8.86Z" fill="#0364B8"/>
        <path d="M9.46 8.86C9.47 8.46 9.53 8.05 9.53 7.63C9.53 7.05 9.61 6.48 9.73 5.93C9.07 5.65 8.34 5.5 7.58 5.5C7.1 5.5 6.62 5.54 6.16 5.62C4.96 6.07 3.94 6.89 3.26 7.97C2.46 9.26 2.27 10.78 2.66 12.18C2.87 12.1 3.09 12.03 3.32 11.97C4.38 11.68 5.53 11.68 6.57 11.97L9.46 8.86Z" fill="#0078D4"/>
        <path d="M14.46 5.86L9.46 8.86L6.57 11.97C6.94 12.07 7.3 12.21 7.64 12.38L10.95 10.41L17.09 13.61C17.32 13.24 17.52 12.84 17.67 12.42C18.16 11 18.11 9.45 17.52 8.07C16.93 6.68 15.86 5.58 14.46 5.86Z" fill="#1490DF"/>
        <path d="M17.09 13.61L10.95 10.41L7.64 12.38C8.06 12.6 8.45 12.88 8.8 13.21C9.62 13.97 10.2 14.95 10.47 16.03L10.5 16.17H18.98C19.56 16.17 20.13 16.03 20.63 15.76C21.91 15.06 22.72 13.72 22.72 12.23C22.72 11.11 22.27 10.03 21.49 9.22C20.71 8.41 19.65 7.91 18.54 7.86C18.32 9.92 17.35 11.79 17.09 13.61Z" fill="#28A8EA"/>
        <path d="M10.47 16.03C10.2 14.95 9.62 13.97 8.8 13.21C8.45 12.88 8.06 12.6 7.64 12.38C7.3 12.21 6.94 12.07 6.57 11.97C5.53 11.68 4.38 11.68 3.32 11.97C3.09 12.03 2.87 12.1 2.66 12.18C2.34 12.29 2.04 12.44 1.75 12.61C0.67 13.27 0 14.5 0 15.81C0 17.76 1.58 19.34 3.53 19.34H10.5V16.17L10.47 16.03Z" fill="#0078D4"/>
        <path d="M10.5 16.17V19.34H18.98C20.93 19.34 22.51 17.76 22.51 15.81C22.51 15.1 22.28 14.41 21.86 13.84C21.44 13.27 20.84 12.86 20.16 12.66C19.79 12.54 19.4 12.48 19.01 12.48C18.86 12.48 18.7 12.49 18.54 12.51C17.79 12.6 17.39 13.09 17.09 13.61L10.95 10.41L10.47 16.03L10.5 16.17Z" fill="#14447D"/>
    </svg>`,
    
    'google-drive': `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4.433 20.333L0.883 14.167L8.067 2H15.25L4.433 20.333Z" fill="#0066DA"/>
        <path d="M15.25 2L8.067 14.167L11.617 20.333H23.117L15.25 2Z" fill="#00AC47"/>
        <path d="M8.067 14.167H23.117L19.567 20.333H4.433L8.067 14.167Z" fill="#FFBA00"/>
    </svg>`,
    
    local: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V15C20 16.1046 19.1046 17 18 17H6C4.89543 17 4 16.1046 4 15V6Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M1 20H23" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M9 17V20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M15 17V20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,
    
    unsaved: null // Will use CSS for empty circle
};

const SIZE_MAP = {
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32
};

export class ProviderIcon {
    /**
     * Create a provider icon element
     * @param {ProviderType} provider - The provider type
     * @param {IconSize} size - Icon size
     * @returns {HTMLElement}
     */
    static create(provider, size = 'md') {
        const container = document.createElement('span');
        container.className = `provider-icon provider-icon--${size} provider-icon--${provider}`;
        
        const pixelSize = SIZE_MAP[size] || SIZE_MAP.md;
        container.style.width = `${pixelSize}px`;
        container.style.height = `${pixelSize}px`;
        
        if (provider === 'unsaved') {
            // Empty circle placeholder
            container.classList.add('provider-icon--placeholder');
        } else {
            const svgContent = PROVIDER_ICONS[provider];
            if (svgContent) {
                container.innerHTML = svgContent;
            }
        }
        
        return container;
    }
    
    /**
     * Get provider display name
     * @param {ProviderType} provider
     * @returns {string}
     */
    static getName(provider) {
        const names = {
            onedrive: 'OneDrive',
            'google-drive': 'Google Drive',
            local: 'Local',
            unsaved: 'Not Saved'
        };
        return names[provider] || provider;
    }
    
    /**
     * Get provider from file handle or info
     * @param {Object} fileInfo
     * @returns {ProviderType}
     */
    static getProviderFromFileInfo(fileInfo) {
        if (!fileInfo) return 'unsaved';
        if (fileInfo.provider === 'onedrive') return 'onedrive';
        if (fileInfo.provider === 'google-drive') return 'google-drive';
        if (fileInfo.handle || fileInfo.isLocal) return 'local';
        return 'unsaved';
    }
}

export default ProviderIcon;
