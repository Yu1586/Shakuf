import { HE } from '../i18n/he.js';

/**
 * Page structure readers for the navigation aids.
 *
 * These are strictly *additive*: we read the page and present what we find in
 * our own panel. We never insert landmarks the author omitted, never relabel
 * their headings, and never rewrite their link text — a screen-reader user
 * already has these lists natively, and quietly disagreeing with their AT about
 * the page structure is the overlay failure mode PLAN.md §4 exists to prevent.
 * This is here for sighted keyboard and low-vision visitors, who have no
 * equivalent.
 */

export interface OutlineItem {
  label: string;
  /** Heading depth 1-6, for indentation. Undefined for other kinds. */
  level?: number;
  element: HTMLElement;
}

function isVisible(el: HTMLElement): boolean {
  if (el.closest('#shakuf-root')) return false;
  if (el.hidden || el.getAttribute('aria-hidden') === 'true') return false;
  return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
}

function text(el: HTMLElement): string {
  const label =
    el.getAttribute('aria-label') ??
    (el.textContent ?? '').replace(/\s+/g, ' ').trim();
  return label.length > 80 ? `${label.slice(0, 80)}…` : label;
}

export function getHeadings(): OutlineItem[] {
  const nodes = document.querySelectorAll<HTMLElement>(
    'h1, h2, h3, h4, h5, h6, [role="heading"]',
  );
  const out: OutlineItem[] = [];
  for (const el of nodes) {
    if (!isVisible(el)) continue;
    const label = text(el);
    if (!label) continue;

    const tagLevel = /^H([1-6])$/.exec(el.tagName)?.[1];
    const ariaLevel = el.getAttribute('aria-level');
    const level = Number(tagLevel ?? ariaLevel ?? 2);
    out.push({ label, level: Number.isFinite(level) ? level : 2, element: el });
  }
  return out;
}

const LANDMARK_SELECTOR = [
  'header', 'nav', 'main', 'aside', 'footer', 'form[aria-label]',
  'section[aria-label]', 'section[aria-labelledby]',
  '[role="banner"]', '[role="navigation"]', '[role="main"]',
  '[role="complementary"]', '[role="contentinfo"]', '[role="search"]',
  '[role="form"]', '[role="region"]',
].join(',');

const IMPLICIT_ROLE: Record<string, string> = {
  HEADER: 'banner',
  NAV: 'navigation',
  MAIN: 'main',
  ASIDE: 'complementary',
  FOOTER: 'contentinfo',
  FORM: 'form',
  SECTION: 'region',
};

export function getLandmarks(): OutlineItem[] {
  const nodes = document.querySelectorAll<HTMLElement>(LANDMARK_SELECTOR);
  const out: OutlineItem[] = [];
  const seen = new Set<HTMLElement>();

  for (const el of nodes) {
    if (!isVisible(el) || seen.has(el)) continue;

    // `header`/`footer` are only banner/contentinfo at the top level; nested in
    // an article or section they are neither, and listing them would be wrong.
    const tag = el.tagName;
    if (
      (tag === 'HEADER' || tag === 'FOOTER') &&
      el.closest('article, section, aside, main')
    ) {
      continue;
    }

    const role = el.getAttribute('role') ?? IMPLICIT_ROLE[tag] ?? 'region';
    const roleName = HE.landmarkNames[role] ?? HE.landmarkNames['region']!;
    const own = el.getAttribute('aria-label')?.trim();

    seen.add(el);
    out.push({ label: own ? `${roleName} — ${own}` : roleName, element: el });
  }
  return out;
}

export function getLinks(): OutlineItem[] {
  const nodes = document.querySelectorAll<HTMLAnchorElement>('a[href]');
  const out: OutlineItem[] = [];
  for (const el of nodes) {
    if (!isVisible(el)) continue;
    const label = text(el);
    if (!label) continue;
    out.push({ label, element: el });
  }
  return out;
}

/**
 * Moves focus to a target, not just the viewport.
 *
 * Scrolling alone leaves keyboard focus behind, so the next Tab jumps back to
 * wherever the visitor was — the classic broken skip-link. Where the target
 * cannot receive focus we add `tabindex="-1"` (which does not put it in the tab
 * order or change its role) and remove it again on blur.
 */
export function jumpTo(el: HTMLElement): void {
  const hadTabindex = el.hasAttribute('tabindex');
  if (!hadTabindex) {
    el.setAttribute('tabindex', '-1');
    el.addEventListener(
      'blur',
      () => el.removeAttribute('tabindex'),
      { once: true },
    );
  }

  el.focus({ preventScroll: true });
  el.scrollIntoView({
    block: 'center',
    // Respect the visitor's own motion preference — and ours, if they set it.
    behavior:
      document.documentElement.getAttribute('data-shakuf-motion') === 'off' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
  });
}
