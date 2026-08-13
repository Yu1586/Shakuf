/**
 * Script-tag entry point — the ~90% install path.
 *
 * Self-starts as soon as the document has a body, reading its configuration
 * from the script tag's data attributes. Makes no network requests: there is no
 * licence check, no phone-home and no server to fail (PLAN.md D2), so there is
 * no failure mode in which our infrastructure removes an accessibility feature
 * from someone's live site.
 */
import type { Lang } from './i18n/index.js';
import { mount, unmount, type A11yWidget } from './widget.js';

/**
 * The host-page control surface.
 *
 * Only the script-tag build defines this. Bundler consumers import `mount()`
 * and hold the instance themselves, and putting a global on their page would be
 * an unasked-for side effect of an import.
 *
 * Deliberately not a re-export of the widget instance: this is the supported
 * surface, and keeping it a hand-written object means the class can change
 * shape without silently changing what host pages depend on.
 */
export interface ShakufApi {
  /** Opens the panel. */
  open(): void;
  /** Closes the panel. Focus returns to the launcher. */
  close(): void;
  /** Opens if closed, closes if open. */
  toggle(): void;
  /** Hides the launcher button. Applied preferences are kept. */
  hide(): void;
  /** Shows the launcher button again. */
  show(): void;
  /** Whether the launcher is currently hidden. */
  readonly hidden: boolean;
  /** Clears every preference and undoes everything applied to the page. */
  reset(): void;
  /** `he` or `en`. Pins the language and stops following the host document. */
  setLanguage(lang: Lang | string): void;
  /** The active language. */
  readonly lang: Lang;
  /** Removes the widget entirely and undoes everything it applied. */
  destroy(): void;
}

declare global {
  interface Window {
    shakuf?: ShakufApi;
  }
  interface DocumentEventMap {
    'shakuf:ready': CustomEvent<A11yWidget>;
  }
}

function api(widget: A11yWidget): ShakufApi {
  return {
    open: () => widget.open(),
    close: () => widget.close(),
    toggle: () => widget.toggle(),
    hide: () => widget.hide(),
    show: () => widget.show(),
    get hidden() {
      return widget.hidden;
    },
    reset: () => widget.reset(),
    setLanguage: (lang) => widget.setLanguage(lang),
    get lang() {
      return widget.lang;
    },
    destroy: () => {
      unmount();
      delete window.shakuf;
    },
  };
}

function start(): void {
  try {
    // `mount()` dispatches `shakuf:ready` before returning, so `window.shakuf`
    // does not exist yet inside that listener — which is why the event carries
    // the widget in `detail`. Use the detail from the event, or the global from
    // anywhere after boot; do not reach for the global from the listener.
    window.shakuf = api(mount());
  } catch (error) {
    // Never take the host page down with us. A widget that throws during a
    // site's boot sequence is a far worse outcome than a widget that is absent.
    if (typeof console !== 'undefined') {
      console.error('[shakuf] mount failed:', error);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
