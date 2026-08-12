/**
 * Screen-reader announcements, in Hebrew.
 *
 * The live region lives in the light DOM rather than inside our shadow root.
 * Live regions inside shadow DOM have a long history of being missed by screen
 * readers, and a silent live region is worse than none — the visitor toggles a
 * setting and gets no confirmation that anything happened.
 */
const LIVE_ID = 'a11y-il-live';

function ensureRegion(): HTMLElement {
  const existing = document.getElementById(LIVE_ID);
  if (existing) return existing;

  const el = document.createElement('div');
  el.id = LIVE_ID;
  el.setAttribute('aria-live', 'polite');
  el.setAttribute('aria-atomic', 'true');
  el.setAttribute('role', 'status');
  el.lang = 'he';
  el.dir = 'rtl';

  // Visually hidden, but not `display:none` or `visibility:hidden`, either of
  // which would remove it from the accessibility tree and silence it.
  el.style.cssText = [
    'position:absolute',
    'width:1px',
    'height:1px',
    'margin:-1px',
    'padding:0',
    'overflow:hidden',
    'clip:rect(0 0 0 0)',
    'clip-path:inset(50%)',
    'white-space:nowrap',
    'border:0',
  ].join(';');

  document.body.appendChild(el);
  return el;
}

let clearTimer: number | undefined;

export function announce(message: string): void {
  const region = ensureRegion();

  // Re-announcing identical text is ignored by most screen readers unless the
  // node actually changes, so clear first and set on the next frame.
  region.textContent = '';
  window.clearTimeout(clearTimer);

  requestAnimationFrame(() => {
    region.textContent = message;
    // Empty it again so the message isn't re-read when focus moves back here.
    clearTimer = window.setTimeout(() => {
      region.textContent = '';
    }, 4000);
  });
}

export function destroyAnnouncer(): void {
  window.clearTimeout(clearTimer);
  document.getElementById(LIVE_ID)?.remove();
}
