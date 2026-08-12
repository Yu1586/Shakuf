/**
 * npm entry point — for bundlers and the React/Vue wrappers (phase 2).
 *
 * Importing this module does nothing on its own; call `mount()` yourself. The
 * script-tag build (`src/auto.ts`) is the one that self-starts.
 */
export { A11yWidget, mount, unmount } from './widget.js';
export type { WidgetConfig } from './types.js';
