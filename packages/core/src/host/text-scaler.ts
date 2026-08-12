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

/**
 * Elements that can hold a text child but must never be scaled.
 *
 * `tagName` is only uppercased for HTML-namespace elements — an `<svg>` reports
 * `"svg"` and a `<path>` reports `"path"`. Listing them in uppercase here never
 * matched, which is why SVG `<text>` was being given an inline font-size. The
 * namespace check in `collect()` handles all of SVG and MathML properly, so
 * this set only needs the HTML elements that legitimately contain text nodes.
 * (`BR`/`HR` are void — the has-own-text test already excludes them.)
 */
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CANVAS', 'IFRAME']);

const HTML_NS = 'http://www.w3.org/1999/xhtml';

/** Form controls carry text that is not in a child text node. */
const ALWAYS_INCLUDE = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'OPTION']);

/** What an element looked like before we touched it. */
interface Original {
  /** The inline font-size, or null if the element had none. */
  inline: string | null;
  /** Its priority — dropping this silently downgraded `!important` declarations. */
  priority: string;
  /** Unscaled computed size in px, measured once at first sight. */
  basePx: number;
}

export class TextScaler {
  private original = new Map<HTMLElement, Original>();
  private level = 0;
  private observer: MutationObserver | null = null;
  private rescanQueued = false;

  /** Elements whose own text should scale. */
  private collect(root: ParentNode): HTMLElement[] {
    const out: HTMLElement[] = [];
    const all = root.querySelectorAll<HTMLElement>('*');

    for (const el of all) {
      // Namespace first: this is what actually excludes SVG and MathML.
      if (el.namespaceURI !== HTML_NS) continue;
      if (SKIP_TAGS.has(el.tagName)) continue;
      // Never touch ourselves. An id check is sufficient — `querySelectorAll`
      // does not descend into shadow roots, and everything we render lives in
      // ours, so no descendant of the host can appear in this list.
      if (el.id === 'shakuf-root') continue;

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

  /**
   * The scaling cycle: undo → measure → write, always in that order.
   *
   * This ordering is the whole correctness story, and it fixes two problems the
   * previous interleaved version had.
   *
   * 1. **Compounding by nesting depth.** `collect()` returns elements in
   *    document order, so an ancestor was written before its descendant was
   *    measured — and measuring reads the *computed* size, which inherits the
   *    ancestor's brand-new scaled value. `<em>` inside `<strong>` inside `<p>`
   *    came out at factor³: at level 1 that is 16px → 18.4 → 21.2 → 24.3, so a
   *    bold run rendered 15% larger than its own paragraph.
   * 2. **Layout thrash.** Write-read-write-read invalidates the style cache on
   *    every iteration, forcing a recalc per element. Phase-separated, each pass
   *    is a clean batch.
   *
   * Measurement therefore only ever happens with the page in its unscaled state,
   * and each element's base size is cached the first time it is seen.
   */
  private undoWrites(): void {
    for (const [el, o] of this.original) {
      if (o.inline === null) el.style.removeProperty('font-size');
      // Restore the priority too. Reading `style.fontSize` drops it, so an
      // author's `font-size: 14px !important` used to come back as plain
      // `14px` — silently losing to any `!important` stylesheet rule that had
      // previously lost to it.
      else el.style.setProperty('font-size', o.inline, o.priority);
      // Drop the attribute entirely if we left it empty, so we don't litter
      // the host's DOM with `style=""`.
      if (el.getAttribute('style') === '') el.removeAttribute('style');
    }
  }

  /** Records untouched elements. MUST run with no scaling active. */
  private measure(elements: HTMLElement[]): void {
    for (const el of elements) {
      if (this.original.has(el)) continue;
      const inline = el.style.fontSize;
      const px = parseFloat(getComputedStyle(el).fontSize);
      this.original.set(el, {
        inline: inline === '' ? null : inline,
        priority: el.style.getPropertyPriority('font-size'),
        basePx: Number.isFinite(px) ? px : 0,
      });
    }
  }

  /** Applies the factor from cached base sizes. Pure writes, no reads. */
  private write(factor: number): void {
    for (const [el, o] of this.original) {
      if (!o.basePx || !el.isConnected) continue;
      el.style.setProperty('font-size', `${(o.basePx * factor).toFixed(2)}px`, 'important');
    }
  }

  private forgetAll(): void {
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
        // Same undo → measure → write cycle. New nodes cannot be measured while
        // their ancestors are scaled, so the undo pass is not optional here
        // either. Already-known elements keep their cached base, so the
        // measure pass only touches what actually arrived.
        this.apply(this.level);
      });
    });
    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  private stopObserving(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  /** Runs the full undo → measure → write cycle for a level. */
  private apply(level: number): void {
    this.undoWrites();
    const factor = FACTORS[level] ?? 1;
    this.measure(this.collect(document.body));
    this.write(factor);
  }

  /** 0 = site default. Anything else scales by FACTORS[level]. */
  set(level: number): void {
    const clamped = Math.max(0, Math.min(FACTORS.length - 1, Math.round(level)));
    if (clamped === this.level) return;
    this.level = clamped;

    if (clamped === 0) {
      this.reset();
      return;
    }

    this.apply(clamped);
    this.startObserving();
  }

  /** Full teardown — used by "reset all" and on destroy. */
  reset(): void {
    this.level = 0;
    this.stopObserving();
    this.undoWrites();
    this.forgetAll();
  }
}
