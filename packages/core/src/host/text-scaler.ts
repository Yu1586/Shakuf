/**
 * Reversible font scaling.
 *
 * This is the only feature that writes to host elements rather than to a single
 * attribute on `<html>`, so it carries the strictest reversibility requirement
 * in the codebase: we record each element's *original inline* font-size before
 * touching it, and restoring means putting exactly that back — including the
 * case where there was no inline font-size at all.
 *
 * Why not just scale `html { font-size }`: that only moves sites built in `rem`.
 * A large share of Israeli sites are px-based, where it does nothing at all, and
 * a text-size control that silently does nothing on half its installs is the
 * kind of hollow feature PLAN.md §2 exists to prevent.
 */

/** Multiplier per level. Index 0 is "site default" and is never applied. */
const FACTORS = [1, 1.15, 1.3, 1.5, 1.75] as const;

const SKIP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'PATH', 'CANVAS', 'IFRAME', 'BR', 'HR',
]);

/** Form controls carry text that is not in a child text node. */
const ALWAYS_INCLUDE = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'OPTION']);

export class TextScaler {
  /** element -> the inline font-size it had before we touched it (null = none). */
  private original = new Map<HTMLElement, string | null>();
  private level = 0;
  private observer: MutationObserver | null = null;
  private rescanQueued = false;

  /** Elements whose own text should scale. */
  private collect(root: ParentNode): HTMLElement[] {
    const out: HTMLElement[] = [];
    const all = root.querySelectorAll<HTMLElement>('*');

    for (const el of all) {
      if (SKIP_TAGS.has(el.tagName)) continue;
      // Never touch ourselves — our panel sizes itself from shadow styles.
      if (el.id === 'shakuf-root' || el.closest('#shakuf-root')) continue;

      if (ALWAYS_INCLUDE.has(el.tagName)) {
        out.push(el);
        continue;
      }
      // Only elements holding their own text. Scaling containers as well would
      // be redundant, much slower, and more disruptive to layout.
      let hasOwnText = false;
      for (const node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue?.trim()) {
          hasOwnText = true;
          break;
        }
      }
      if (hasOwnText) out.push(el);
    }
    return out;
  }

  private applyTo(elements: HTMLElement[], factor: number): void {
    for (const el of elements) {
      if (!this.original.has(el)) {
        // `style.fontSize` is the inline value only — exactly what we must restore.
        const inline = el.style.fontSize;
        this.original.set(el, inline === '' ? null : inline);
      }
      // Base the new size on the *computed* size with our own effect removed,
      // so repeated level changes don't compound.
      const base = this.baseSize(el);
      if (base == null) continue;
      el.style.setProperty('font-size', `${(base * factor).toFixed(2)}px`, 'important');
    }
  }

  /** The element's font-size as it would be without our scaling. */
  private baseSize(el: HTMLElement): number | null {
    const stored = this.original.get(el);
    if (stored) {
      // It had an inline size of its own: measure that, not our override.
      const current = el.style.fontSize;
      el.style.fontSize = stored;
      const px = parseFloat(getComputedStyle(el).fontSize);
      el.style.fontSize = current;
      return Number.isFinite(px) ? px : null;
    }
    if (stored === null) {
      // No inline size originally. Clear ours, measure, restore.
      const current = el.style.fontSize;
      el.style.removeProperty('font-size');
      const px = parseFloat(getComputedStyle(el).fontSize);
      if (current) el.style.setProperty('font-size', current, 'important');
      return Number.isFinite(px) ? px : null;
    }
    const px = parseFloat(getComputedStyle(el).fontSize);
    return Number.isFinite(px) ? px : null;
  }

  private restoreAll(): void {
    for (const [el, inline] of this.original) {
      if (inline === null) el.style.removeProperty('font-size');
      else el.style.setProperty('font-size', inline);
      // Drop the attribute entirely if we left it empty, so we don't litter
      // the host's DOM with `style=""`.
      if (el.getAttribute('style') === '') el.removeAttribute('style');
    }
    this.original.clear();
  }

  /**
   * Watches for content added after the user picked a size — SPAs and lazy
   * lists would otherwise render at the site's default size while everything
   * around them is scaled.
   */
  private startObserving(): void {
    if (this.observer || typeof MutationObserver === 'undefined') return;
    this.observer = new MutationObserver((records) => {
      if (this.rescanQueued || this.level === 0) return;
      const hasNewElements = records.some((r) => r.addedNodes.length > 0);
      if (!hasNewElements) return;

      this.rescanQueued = true;
      // Coalesce bursts; a list render can fire hundreds of records.
      requestAnimationFrame(() => {
        this.rescanQueued = false;
        if (this.level === 0) return;
        const factor = FACTORS[this.level] ?? 1;
        const fresh = this.collect(document.body).filter((el) => !this.original.has(el));
        if (fresh.length) this.applyTo(fresh, factor);
      });
    });
    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  private stopObserving(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  /** 0 = site default. Anything else scales by FACTORS[level]. */
  set(level: number): void {
    const clamped = Math.max(0, Math.min(FACTORS.length - 1, Math.round(level)));
    if (clamped === this.level) return;
    this.level = clamped;

    if (clamped === 0) {
      this.stopObserving();
      this.restoreAll();
      return;
    }

    const factor = FACTORS[clamped] ?? 1;
    this.applyTo(this.collect(document.body), factor);
    this.startObserving();
  }

  /** Full teardown — used by "reset all" and on destroy. */
  reset(): void {
    this.level = 0;
    this.stopObserving();
    this.restoreAll();
  }

  get maxLevel(): number {
    return FACTORS.length - 1;
  }
}
