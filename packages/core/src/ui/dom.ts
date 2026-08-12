/**
 * Tiny DOM builders.
 *
 * Everything is built with `createElement` / `createElementNS` and `textContent`
 * — never `innerHTML`. Two reasons: sites running a strict Trusted Types policy
 * would throw on an `innerHTML` assignment and our widget would be the thing
 * that breaks their page, and building nodes directly means no string of ours
 * can ever be parsed as markup on someone else's site.
 */

type Attrs = Record<string, string | number | boolean | null | undefined>;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  children: Array<Node | string> = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = String(value);
    else if (key === 'text') node.textContent = String(value);
    else node.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of children) {
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Builds a decorative icon. Always `aria-hidden` — the control carries the name. */
export function icon(viewBox: string, paths: string[]): SVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  for (const d of paths) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    svg.appendChild(path);
  }
  return svg;
}

/** The universal accessibility symbol, drawn rather than fetched. */
export function accessibilityIcon(): SVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  const head = document.createElementNS(SVG_NS, 'circle');
  head.setAttribute('cx', '12');
  head.setAttribute('cy', '4.2');
  head.setAttribute('r', '2.2');
  head.setAttribute('fill', 'currentColor');
  svg.appendChild(head);

  const body = document.createElementNS(SVG_NS, 'path');
  body.setAttribute(
    'd',
    'M12 7.6c-2.3 0-4.4-.5-6.2-1.1a1.15 1.15 0 0 0-.7 2.19c1.4.47 2.9.85 4.5 1.05v2.5l-2.1 6.4a1.15 1.15 0 0 0 2.18.72L11.3 14h1.4l1.62 5.36a1.15 1.15 0 0 0 2.18-.72l-2.1-6.4v-2.5c1.6-.2 3.1-.58 4.5-1.05a1.15 1.15 0 0 0-.7-2.19c-1.8.6-3.9 1.1-6.2 1.1Z',
  );
  body.setAttribute('fill', 'currentColor');
  svg.appendChild(body);

  return svg;
}

export function closeIcon(): SVGElement {
  return icon('0 0 24 24', ['M6 6l12 12', 'M18 6L6 18']);
}

export function chevronIcon(): SVGElement {
  return icon('0 0 24 24', ['M6 9l6 6 6-6']);
}
