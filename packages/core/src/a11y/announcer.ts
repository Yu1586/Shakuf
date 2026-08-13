/**
 * Screen-reader announcements, in Hebrew.
 *
 * The live region lives in the light DOM rather than inside our shadow root.
 * Live regions inside shadow DOM have a long history of being missed by screen
 * readers, and a silent live region is worse than none — the visitor toggles a
 * setting and gets no confirmation that anything happened.
 */
import { currentLang, dirFor } from '../i18n/index.js';

const LIVE_ID = 'shakuf-live';

/**
 * Where the live region gets appended. Set by the widget from `data-mount`.
 *
 * This has to follow the same target as the widget host, and the reason is not
 * symmetry. The live region is a *separate* child of whatever it is appended
 * to, so a host that inerts body children would leave it inert even after the
 * widget itself moved somewhere safe — and an inert live region is silent. The
 * visitor would keep operating a panel that had stopped confirming anything,
 * with nothing on screen to indicate it.
 */
let container: HTMLElement | null = null;

export function setAnnouncerContainer(el: HTMLElement | null): void {
  container = el;
}

function ensureRegion(): HTMLElement {
  const existing = document.getElementById(LIVE_ID);
  if (existing) return existing;

  const el = document.createElement('div');
  el.id = LIVE_ID;
  el.setAttribute('aria-live', 'polite');
  el.setAttribute('aria-atomic', 'true');
  el.setAttribute('role', 'status');
  // Tagged with the panel's language, not the page's. A screen reader reading
  // English text announced inside a `lang="he"` region switches to a Hebrew
  // voice and renders it unintelligible — the sharpest edge of getting this
  // wrong, because it fails only for the users the widget exists to serve.
  const lang = currentLang();
  el.lang = lang;
  el.dir = dirFor(lang);

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

  (container ?? document.body).appendChild(el);
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

/**
 * Re-tags an already-created region after a language switch.
 *
 * `ensureRegion` caches, so without this the region keeps whatever language it
 * was born with — and every later announcement is spoken in the wrong voice.
 */
export function retagAnnouncer(): void {
  const region = document.getElementById(LIVE_ID);
  if (!region) return;
  const lang = currentLang();
  region.lang = lang;
  region.dir = dirFor(lang);
}

export function destroyAnnouncer(): void {
  window.clearTimeout(clearTimer);
  document.getElementById(LIVE_ID)?.remove();
  container = null;
}
