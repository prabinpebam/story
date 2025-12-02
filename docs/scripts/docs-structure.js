/**
 * Documentation Structure Definition
 * 
 * This file defines the complete hierarchy of documentation
 * for navigation and search indexing.
 */

export const DOCS_STRUCTURE = {
    title: 'Story Documentation',
    sections: [
        {
            title: 'Getting Started',
            icon: 'fa-solid fa-rocket',
            items: [
                { title: 'Product Specification', path: 'product-spec.md', icon: 'fa-solid fa-book' },
                { title: 'Development Principles', path: 'principles.md', icon: 'fa-solid fa-compass' },
                { title: 'OAuth Setup Guide', path: 'oauth-setup-guide.md', icon: 'fa-solid fa-key' },
            ]
        },
        {
            title: 'Design System',
            icon: 'fa-solid fa-palette',
            items: [
                { title: 'Design System Overview', path: 'specs/design-system/design-system-overview.md', badge: 'Start Here' },
                { title: 'Interactive Component Showcase', path: 'specs/design-system/interactive-component-showcase.md', badge: 'Interactive' },
                { title: 'Design Tokens Reference', path: 'specs/design-system/design-tokens-reference.md', badge: 'Reference' },
                { title: 'Z-Index Strategy', path: 'specs/design-system/z-index-strategy.md', badge: 'New' },
                { title: 'Component Library', path: 'specs/design-system/component-library.md', badge: 'Reference' },
                { title: 'Interaction Patterns', path: 'specs/design-system/interaction-patterns.md' },
                {
                    title: 'Core Specifications',
                    items: [
                        { title: 'UI Design System', path: 'specs/design-system/ui-design-system.md' },
                        { title: 'Design System UX Guide', path: 'specs/design-system/design-system-ux-guide.md' },
                        { title: 'Theme Architecture', path: 'specs/design-system/theme-architecture.md' },
                        { title: 'Linked Properties System', path: 'specs/design-system/linked-properties-system.md' },
                    ]
                },
                {
                    title: 'Theme & Style Managers',
                    items: [
                        { title: 'Color Theme Manager', path: 'specs/design-system/color-theme-manager.md' },
                        { title: 'Typography Style Manager', path: 'specs/design-system/typography-style-manager.md' },
                    ]
                },
                { title: 'Design Consistency Audit', path: 'specs/design-system/design-consistency-audit.md' },
            ]
        },
        {
            title: 'Core Architecture',
            icon: 'fa-solid fa-cube',
            items: [
                { title: 'Architecture Overview', path: 'tech-specs/core/architecture-overview.md', badge: 'Core' },
                { title: 'Data Structures', path: 'tech-specs/core/data-structures.md' },
                { title: 'Interaction Model', path: 'tech-specs/core/interaction-model.md' },
                { title: 'Component System', path: 'tech-specs/core/component-system.md' },
            ]
        },
        {
            title: 'Canvas & Interaction',
            icon: 'fa-solid fa-vector-square',
            items: [
                { title: 'Canvas Interaction', path: 'specs/canvas/canvas-interaction.md' },
                { title: 'Context Menu', path: 'specs/canvas/context-menu.md' },
                { title: 'Cursor Behavior', path: 'specs/canvas/cursor-behavior.md' },
                { title: 'Layer Management', path: 'specs/canvas/layer-management.md' },
            ]
        },
        {
            title: 'Core Behaviors',
            icon: 'fa-solid fa-gears',
            items: [
                { title: 'Global Input Behavior', path: 'specs/core/global-input-behavior.md' },
                { title: 'Text Editing v2', path: 'specs/core/text-editing-v2.md' },
                { title: 'Undo/Redo System', path: 'specs/core/undo-redo.md' },
                { title: 'Context Menu System', path: 'specs/core/context-menu-system.md' },
                { title: 'Property Memory System', path: 'specs/core/property-memory-system.md' },
                { title: 'URL Routing Strategy', path: 'specs/core/url-routing-strategy.md' },
            ]
        },
        {
            title: 'Slides & Masters',
            icon: 'fa-solid fa-layer-group',
            items: [
                { title: 'Master Slide System', path: 'tech-specs/slides/master-slide-system.md', badge: 'Core' },
                { title: 'Slide Management', path: 'specs/slides/slide-management.md' },
                { title: 'Slide Master System', path: 'specs/slides/slide-master-system.md' },
                { title: 'Master Mode Interaction', path: 'specs/slides/master-mode-interaction.md' },
                { title: 'Master Placeholder Integration', path: 'specs/slides/master-placeholder-integration.md' },
            ]
        },
        {
            title: 'Fill System',
            icon: 'fa-solid fa-fill-drip',
            items: [
                { title: 'Code Fill Panel', path: 'specs/fills/code-fill-panel.md' },
                { title: 'CodeFill Presets', path: 'specs/fills/codefill-presets.md' },
                { title: 'Color Picker UI', path: 'specs/fills/color-picker-ui.md' },
                { title: 'Gradient Fill', path: 'specs/fills/gradient-fill.md' },
                { title: 'Media Fill System', path: 'specs/fills/media-fill-system.md' },
                {
                    title: 'Technical Specs',
                    items: [
                        { title: 'Media Fill System', path: 'tech-specs/fills/media-fill-system.md' },
                        { title: 'Media Asset Integration', path: 'tech-specs/fills/media-asset-integration.md' },
                        { title: 'Text Fill System', path: 'tech-specs/fills/text-fill-system.md' },
                        { title: 'CodeFill Mouse Interaction', path: 'tech-specs/fills/codefill-mouse-interaction.md' },
                    ]
                }
            ]
        },
        {
            title: 'Property Inspector',
            icon: 'fa-solid fa-sliders',
            items: [
                { title: 'Property Inspector UI', path: 'specs/property-inspector/property-inspector-ui.md' },
                { title: 'Position Properties', path: 'specs/property-inspector/property-inspector-position.md' },
                { title: 'Layout & Appearance', path: 'specs/property-inspector/property-inspector-layout-appearance.md' },
                { title: 'Fill Properties', path: 'specs/property-inspector/property-inspector-fill.md' },
                { title: 'Stroke Properties', path: 'specs/property-inspector/property-inspector-stroke.md' },
                { title: 'Typography', path: 'specs/property-inspector/property-inspector-typography.md' },
                { title: 'Effects', path: 'specs/property-inspector/property-inspector-effects.md' },
                { title: 'Slide Properties', path: 'specs/property-inspector/property-inspector-slide.md' },
                { title: 'Export Settings', path: 'specs/property-inspector/property-inspector-export.md' },
            ]
        },
        {
            title: 'Rendering',
            icon: 'fa-solid fa-display',
            items: [
                { title: 'Rendering Architecture', path: 'specs/rendering/rendering-architecture.md' },
                { title: 'Background System', path: 'specs/rendering/background-system.md' },
                {
                    title: 'Technical Specs',
                    items: [
                        { title: 'Rendering Pipeline', path: 'tech-specs/rendering/rendering-pipeline.md' },
                        { title: 'Background Engine', path: 'tech-specs/rendering/background-engine.md' },
                        { title: 'Text Engine', path: 'tech-specs/rendering/text-engine.md' },
                        { title: 'Rendering Navigation', path: 'tech-specs/rendering/rendering-navigation-details.md' },
                    ]
                }
            ]
        },
        {
            title: 'Presentation Mode',
            icon: 'fa-solid fa-play',
            items: [
                { title: 'Presentation Mode', path: 'specs/presentation/presentation-mode.md' },
                { title: 'Caching Strategy', path: 'specs/presentation/presentation-mode-caching.md' },
                { title: 'Animation & Transitions', path: 'specs/presentation/animation-transitions.md' },
            ]
        },
        {
            title: 'Storage & Files',
            icon: 'fa-solid fa-hard-drive',
            items: [
                { title: 'File Format & Storage', path: 'specs/storage/file-format-storage.md' },
                { title: 'File Storage UX', path: 'specs/storage/file-storage-ux.md' },
                { title: 'File Storage UI', path: 'specs/storage/file-storage-ui-components.md' },
                { title: 'Cloud File Browser', path: 'specs/storage/cloud-file-browser-ux-spec.md' },
                { title: 'Cloud Storage Abstraction', path: 'specs/storage/cloud-storage-abstraction.md' },
                { title: 'Asset Management', path: 'specs/storage/asset-management.md' },
                { title: 'Memory Management', path: 'specs/storage/memory-management.md' },
                { title: 'Progressive Loading', path: 'specs/storage/progressive-loading.md' },
                { title: 'Large File Handling', path: 'specs/storage/large-file-handling.md' },
            ]
        },
        {
            title: 'Identity & Auth',
            icon: 'fa-solid fa-user-shield',
            items: [
                { title: 'Identity Overview', path: 'specs/identity/README.md' },
                { title: 'Identity Architecture', path: 'specs/identity/identity-architecture.md' },
                { title: 'OAuth Identity Flow', path: 'specs/identity/oauth-identity-flow.md' },
                { title: 'User Profile Model', path: 'specs/identity/user-profile-model.md' },
                { title: 'Session Lifecycle', path: 'specs/identity/session-lifecycle.md' },
                { title: 'Privacy Model', path: 'specs/identity/privacy-model.md' },
                {
                    title: 'User Preferences',
                    items: [
                        { title: 'Preferences File', path: 'specs/identity/user-preferences-file.md' },
                        { title: 'First Run UX', path: 'specs/identity/preferences-ux-first-run.md' },
                        { title: 'Returning User UX', path: 'specs/identity/preferences-ux-returning-user.md' },
                        { title: 'Import/Export', path: 'specs/identity/preferences-ux-import-export.md' },
                    ]
                }
            ]
        },
        {
            title: 'Collaboration',
            icon: 'fa-solid fa-users',
            items: [
                { title: 'Real-time Collaboration', path: 'specs/collaboration/realtime-collaboration.md' },
                { title: 'Collaboration Protocol', path: 'specs/collaboration/collaboration-protocol.md' },
                { title: 'Authentication', path: 'specs/collaboration/authentication.md' },
                { title: 'Azure SignalR', path: 'specs/collaboration/azure-signalr-integration.md' },
                { title: 'Security Model', path: 'specs/collaboration/security-model.md' },
                { title: 'Sharing & Permissions', path: 'specs/collaboration/sharing-permissions.md' },
                { title: 'State Sync Engine', path: 'specs/collaboration/state-sync-engine.md' },
            ]
        },
        {
            title: 'AI Integration',
            icon: 'fa-solid fa-wand-magic-sparkles',
            items: [
                { title: 'AI Copilot', path: 'specs/ai/ai-copilot.md' },
                { title: 'AI Integration Tech Spec', path: 'tech-specs/ai/ai-integration.md' },
            ]
        },
        {
            title: 'Toolbar & Menus',
            icon: 'fa-solid fa-toolbox',
            items: [
                { title: 'App Menu', path: 'specs/toolbar/app-menu.md' },
                { title: 'Toolbar Redesign', path: 'specs/toolbar/toolbar-redesign.md' },
            ]
        },
        {
            title: 'Implementation Plans',
            icon: 'fa-solid fa-clipboard-list',
            collapsed: true,
            items: [
                { title: 'Master Implementation Plan v2', path: 'plans/master-implementation-plan-v2.md' },
                { title: 'Comprehensive Test Plan', path: 'plans/comprehensive-test-plan.md' },
                { title: 'Validation Framework', path: 'plans/validation-framework.md' },
                {
                    title: 'Core Systems',
                    items: [
                        { title: 'Undo/Redo', path: 'plans/undo-redo-implementation-plan.md' },
                        { title: 'Global Input', path: 'plans/global-input-behavior-plan.md' },
                        { title: 'Cursor System', path: 'plans/cursor-system-implementation-plan.md' },
                    ]
                },
                {
                    title: 'Slide System',
                    items: [
                        { title: 'Slide Master', path: 'plans/slide-master-implementation-plan.md' },
                        { title: 'Master Slide Design', path: 'plans/master-slide-design-plan.md' },
                        { title: 'Mode Unification', path: 'plans/master-mode-unification-plan.md' },
                    ]
                },
                {
                    title: 'Text & Typography',
                    items: [
                        { title: 'Text Editing v2', path: 'plans/text-editing-v2-implementation-plan.md' },
                        { title: 'Typography', path: 'plans/typography-implementation-plan.md' },
                        { title: 'Typography Style Manager', path: 'plans/typography-style-manager-implementation-plan.md' },
                    ]
                },
                {
                    title: 'Design System',
                    items: [
                        { title: 'Design Tokens', path: 'plans/design-token-standardization-plan.md' },
                        { title: 'Color Theme Manager', path: 'plans/color-theme-manager-implementation-plan.md' },
                    ]
                },
                {
                    title: 'Fill System',
                    items: [
                        { title: 'Code Fill Panel', path: 'plans/code-fill-panel-implementation-plan.md' },
                        { title: 'CodeFill Mouse Interaction', path: 'plans/codefill-mouse-interaction-plan.md' },
                        { title: 'CodeFill Presets', path: 'plans/codefill-presets-implementation-plan.md' },
                        { title: 'Media Fill', path: 'plans/media-fill-implementation-plan.md' },
                    ]
                },
                {
                    title: 'Presentation & Storage',
                    items: [
                        { title: 'Presentation Mode', path: 'plans/presentation-mode-implementation-plan.md' },
                        { title: 'Presentation Caching', path: 'plans/presentation-mode-caching-plan.md' },
                        { title: 'File Format', path: 'plans/file-format-implementation-plan.md' },
                        { title: 'File Storage', path: 'plans/file-storage-implementation-plan.md' },
                        { title: 'Memory Management', path: 'plans/memory-management-plan.md' },
                    ]
                },
                {
                    title: 'Identity & Collaboration',
                    items: [
                        { title: 'Identity Management', path: 'plans/identity-management-implementation-plan.md' },
                        { title: 'Real-time Collaboration', path: 'plans/realtime-collaboration-implementation-plan.md' },
                    ]
                },
            ]
        },
    ]
};

/**
 * Flatten the documentation structure for search indexing
 */
export function flattenDocsStructure(structure = DOCS_STRUCTURE) {
    const items = [];
    
    function traverse(nodes, parentPath = []) {
        for (const node of nodes) {
            if (node.path) {
                items.push({
                    title: node.title,
                    path: node.path,
                    breadcrumb: [...parentPath, node.title],
                    icon: node.icon,
                    badge: node.badge,
                });
            }
            if (node.items) {
                traverse(node.items, [...parentPath, node.title]);
            }
        }
    }
    
    traverse(structure.sections);
    return items;
}
