import type { WidgetConfig } from './types.js';

const DEFAULT_ACCENT = '#0b5fff'; // 5.1:1 on white — passes WCAG 1.4.3 for UI text

const POSITIONS = new Set([
  'bottom-right',
  'bottom-left',
  'top-right',
  'top-left',
]);

/**
 * Locates the tag that loaded us, so we can read its data attributes.
 *
 * `document.currentScript` is correct during synchronous parse. With `defer`
 * (which we document as the recommended install) it is null by the time we run,
 * so we fall back to finding our own script by src.
 */
function findOwnScript(): HTMLScriptElement | null {
  const current = document.currentScript;
  if (current instanceof HTMLScriptElement) return current;

  const scripts = document.querySelectorAll<HTMLScriptElement>('script[src]');
  for (let i = scripts.length - 1; i >= 0; i--) {
    const el = scripts[i];
    if (!el) continue;
    if (/a11y(\.min)?\.js|@a11y-il\/widget/.test(el.src)) return el;
  }
  return null;
}

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

export function readConfig(): WidgetConfig {
  const el = findOwnScript();
  const position = str(el, 'position');
  const offsetRaw = Number(str(el, 'offset'));

  return {
    position:
      position && POSITIONS.has(position)
        ? (position as WidgetConfig['position'])
        : 'bottom-right',
    offset:
      Number.isFinite(offsetRaw) && offsetRaw >= 0 && offsetRaw <= 200
        ? offsetRaw
        : 20,
    statementUrl: safeUrl(str(el, 'statement-url')),
    coordinatorName: str(el, 'coordinator-name'),
    coordinatorPhone: str(el, 'coordinator-phone'),
    coordinatorEmail: str(el, 'coordinator-email'),
    accent: safeColor(str(el, 'accent')) ?? DEFAULT_ACCENT,
    byUrl: safeUrl(str(el, 'by-url')),
    byName: str(el, 'by-name'),
  };
}
