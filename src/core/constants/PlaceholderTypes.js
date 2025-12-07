/**
 * PlaceholderTypes.js
 * Defines the types of placeholders available in the Slide Master system.
 */

export const PLACEHOLDER_TYPES = {
    TITLE: 'title',
    SUBTITLE: 'subtitle',
    BODY: 'body', // Main text content (bullets)
    CONTENT: 'content', // Mixed content (text, image, video, etc.)
    PICTURE: 'picture',
    CHART: 'chart',
    TABLE: 'table',
    SMART_ART: 'smartArt',
    MEDIA: 'media', // Video/Audio
    SLIDE_NUMBER: 'slideNumber',
    DATE: 'date',
    FOOTER: 'footer'
};

export const PLACEHOLDER_DEFAULTS = {
    [PLACEHOLDER_TYPES.TITLE]: {
        text: 'Click to edit Master title style',
        fontSize: 44,
        fontFamily: 'Inter',
        fontWeight: 'bold',
        align: 'center'
    },
    [PLACEHOLDER_TYPES.SUBTITLE]: {
        text: 'Click to edit Master subtitle style',
        fontSize: 32,
        fontFamily: 'Inter',
        fontWeight: 'normal',
        align: 'center',
        color: 'var(--color-text-secondary)'
    },
    [PLACEHOLDER_TYPES.BODY]: {
        text: 'Click to edit Master text styles',
        fontSize: 28,
        fontFamily: 'Inter',
        align: 'left',
        listType: 'bullet'
    },
    [PLACEHOLDER_TYPES.CONTENT]: {
        text: 'Click to add text',
        fontSize: 28,
        fontFamily: 'Inter',
        align: 'left'
    },
    [PLACEHOLDER_TYPES.PICTURE]: {
        icon: 'image',
        label: 'Picture'
    },
    [PLACEHOLDER_TYPES.CHART]: {
        icon: 'bar_chart',
        label: 'Chart'
    },
    [PLACEHOLDER_TYPES.TABLE]: {
        icon: 'table_chart',
        label: 'Table'
    },
    [PLACEHOLDER_TYPES.SMART_ART]: {
        icon: 'account_tree',
        label: 'SmartArt'
    },
    [PLACEHOLDER_TYPES.MEDIA]: {
        icon: 'movie',
        label: 'Media'
    },
    [PLACEHOLDER_TYPES.SLIDE_NUMBER]: {
        text: '‹#›',
        fontSize: 12,
        align: 'right'
    },
    [PLACEHOLDER_TYPES.DATE]: {
        text: '‹date/time›',
        fontSize: 12,
        align: 'left'
    },
    [PLACEHOLDER_TYPES.FOOTER]: {
        text: '‹footer›',
        fontSize: 12,
        align: 'center'
    }
};
