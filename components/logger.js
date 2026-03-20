// ============================================================================
// LOGGER — controlled console output
// Debug/info logs are silenced in production automatically.
// Use logger.error / logger.warn for things that always surface.
// ============================================================================

const isDev =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

export const logger = {
    /** Only printed in development */
    log(...args) {
        if (isDev) console.log(...args);
    },

    /** Only printed in development */
    info(...args) {
        if (isDev) console.info(...args);
    },

    /** Always printed */
    warn(...args) {
        console.warn(...args);
    },

    /** Always printed */
    error(...args) {
        console.error(...args);
    }
};
