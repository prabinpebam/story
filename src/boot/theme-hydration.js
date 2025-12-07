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
        const themes = {
            dark: {
                '--color-bg-app': '#1E1E1E',
                '--color-bg-panel': '#2D2D2D',
                '--color-text-primary': '#E8E8E8',
                '--color-accent': '#18A0FB'
            },
            light: {
                '--color-bg-app': '#E8E8E8',
                '--color-bg-panel': '#F5F5F5',
                '--color-text-primary': '#1A1A1A',
                '--color-accent': '#18A0FB'
            }
        };

        // 2. Determine preference
        let theme = 'dark'; // Default
        const storedTheme = localStorage.getItem('theme-preference');

        if (storedTheme) {
            theme = storedTheme === 'light' ? 'light' : 'dark';
        } else {
            // Fallback to system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
                theme = 'light';
            }
        }

        // 3. Apply to DOM immediately
        const root = document.documentElement;
        const values = themes[theme];

        // Set CSS variables inline to block paint
        for (const [property, value] of Object.entries(values)) {
            root.style.setProperty(property, value);
        }

        // Set data attribute for CSS selectors
        root.dataset.theme = theme;

        // Set body class for legacy support (variables.css uses body.theme-light)
        // Note: document.body might not exist yet if this runs in <head>, 
        // so we use a DOMContentLoaded listener as a backup, but we try to set class on root 
        // or handle body class injection carefully.
        // Actually, variables.css targets html[data-theme="light"] as well, so root.dataset.theme is sufficient for CSS.
        // But for the boot screen background, we rely on the inline style we just set.

        // 4. Update Boot Screen Background
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
