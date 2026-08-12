/**
 * Script-tag entry point — the ~90% install path.
 *
 * Self-starts as soon as the document has a body, reading its configuration
 * from the script tag's data attributes. Makes no network requests: there is no
 * licence check, no phone-home and no server to fail (PLAN.md D2), so there is
 * no failure mode in which our infrastructure removes an accessibility feature
 * from someone's live site.
 */
import { mount } from './widget.js';

function start(): void {
  try {
    mount();
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
