/**
 * Theme Hydration Script
 * 
 * This script runs synchronously in the <head> to apply the user's preferred theme
 * before the main application renders. This prevents the "Flash of Incorrect Theme" (FOUC).
 * 
 * It reads from localStorage and system preferences to determine the theme,
 * then sets critical CSS variables and class names immediately.
 */
(function() {
    try {
        // 1. Define critical theme values (must match variables.css)
        // NOTE: --color-accent is NOT included here because it's handled by accent theme classes
        // (e.g., .theme-purple) which must not be overridden by inline styles.
        const themes = {
            dark: {
                '--color-bg-app': '#1E1E1E',
                '--color-bg-panel': '#2D2D2D',
                '--color-text-primary': '#E8E8E8'
            },
            light: {
                '--color-bg-app': '#E8E8E8',
                '--color-bg-panel': '#F5F5F5',
                '--color-text-primary': '#1A1A1A'
            }
        };

        // 2. Determine dark/light preference (match SettingsModal.js and main.js)
        let theme = 'dark'; // Default
        const storedTheme = localStorage.getItem('story-theme') || localStorage.getItem('themeMode');

        if (storedTheme) {
            theme = storedTheme === 'light' ? 'light' : 'dark';
        } else {
            // Fallback to system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
                theme = 'light';
            }
        }

        // 3. Determine accent theme (must match SettingsModal.js)
        const accentTheme = localStorage.getItem('accentTheme') || 'default';

        // 4. Apply to DOM immediately
        const root = document.documentElement;
        const values = themes[theme];

        // Set CSS variables inline to block paint
        for (const [property, value] of Object.entries(values)) {
            root.style.setProperty(property, value);
        }

        // Set data attribute for CSS selectors
        root.dataset.theme = theme;

        // Apply accent theme class (variables.css uses :root.theme-purple, etc.)
        if (accentTheme !== 'default') {
            root.classList.add(`theme-${accentTheme}`);
        }

        // 5. Update Boot Screen Background
        // The boot screen uses --color-bg-app, but since it's in a <style> block in head,
        // it might not pick up the inline style on :root immediately if the browser parses strictly.
        // However, CSS variables inherit.
        // To be safe, we can inject a style tag to force the boot screen color.
        const style = document.createElement('style');
        style.innerHTML = `
            .boot-screen { background-color: ${values['--color-bg-app']} !important; }
        `;
        document.head.appendChild(style);

    } catch (e) {
        console.error('Theme hydration failed:', e);
        // Fallback is already handled by default CSS (Dark Mode)
    }
})();
