import type { WidgetConfig } from './types.js';

const DEFAULT_ACCENT = '#0b5fff'; // 5.1:1 on white — passes WCAG 1.4.3 for UI text

const POSITIONS = new Set([
  'bottom-right',
  'bottom-left',
  'top-right',
  'top-left',
]);

/**
 * The tag that loaded us, captured at module evaluation.
 *
 * This runs during our own synchronous execution, which is the only moment
 * `document.currentScript` is guaranteed to point at us — and it does so for
 * `defer` and `async` installs too, not just inline parsing. A previous version
 * of this file claimed otherwise and fell back to finding the script by
 * matching its `src` against a regex; that was both unnecessary and unsafe.
 *
 * Why unsafe: the regex was unanchored and took the *last* match in the
 * document, so any `<script src>` whose URL merely contained "shakuf.js"
 * became the config source. An attacker with HTML injection (no script
 * execution needed) could plant such an element — CSP blocking the load leaves
 * the element sitting in the DOM with its `data-*` attributes readable — and
 * thereby control the accessibility coordinator's name, phone and email shown
 * in our panel, which visitors reasonably read as first-party site chrome.
 *
 * Reading `currentScript` at module top level removes the heuristic entirely.
 * It is null on the npm/bundler path, where callers pass config to `mount()`
 * directly, so nothing is lost there.
 */
const OWN_SCRIPT: HTMLScriptElement | null =
  document.currentScript instanceof HTMLScriptElement ? document.currentScript : null;

function str(el: Element | null, name: string): string | null {
  const v = el?.getAttribute(`data-${name}`);
  if (v == null) return null;
  const trimmed = v.trim();
  return trimmed === '' ? null : trimmed;
}

/**
 * Only http(s), mailto and tel, plus same-origin relative paths.
 *
 * The site owner supplies these, so this is not a trust boundary — it is a
 * guard against a stray `javascript:` value turning a config typo into an
 * injection on their own page.
 */
function safeUrl(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw, document.baseURI);
    if (['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) {
      return url.href;
    }
  } catch {
    /* fall through */
  }
  return null;
}

/** Rejects anything that isn't a plain hex colour. */
function safeColor(raw: string | null): string | null {
  return raw && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw) ? raw : null;
}

const DEFAULT_OFFSET = 20;

/**
 * Parses a numeric attribute, falling back when absent or out of range.
 *
 * The explicit null check is the point. `Number(null)` is `0`, and `0` passes
 * an `isFinite && >= 0` guard cleanly — so reading the attribute straight into
 * `Number()` silently produced an offset of 0 on every install that did not set
 * one, pinning the launcher flush into the viewport corner instead of the
 * documented 20px. The absent case has to be handled before coercion, not after.
 */
function num(el: Element | null, name: string, fallback: number, max: number): number {
  const raw = str(el, name);
  if (raw === null) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 && n <= max ? n : fallback;
}

export function readConfig(): WidgetConfig {
  const el = OWN_SCRIPT;
  const position = str(el, 'position');

  return {
    position:
      position && POSITIONS.has(position)
        ? (position as WidgetConfig['position'])
        : 'bottom-right',
    offset: num(el, 'offset', DEFAULT_OFFSET, 200),
    statementUrl: safeUrl(str(el, 'statement-url')),
    coordinatorName: str(el, 'coordinator-name'),
    coordinatorPhone: str(el, 'coordinator-phone'),
    coordinatorEmail: str(el, 'coordinator-email'),
    accent: safeColor(str(el, 'accent')) ?? DEFAULT_ACCENT,
    byUrl: safeUrl(str(el, 'by-url')),
    byName: str(el, 'by-name'),
  };
}
