/**
 * Reading ruler — a horizontal band that follows the pointer, or the keyboard
 * focus, to help the visitor keep their place on a line.
 *
 * It lives inside our shadow root, not the host page, so it cannot be styled,
 * broken, or accidentally selected by the site's CSS. It is decorative and
 * carries `aria-hidden`, since it conveys nothing to a screen reader.
 */
export class ReadingGuide {
  private el: HTMLElement | null = null;
  private onMove: ((e: PointerEvent) => void) | null = null;
  private onFocus: ((e: FocusEvent) => void) | null = null;
  private pending = false;
  private y = 0;

  constructor(private readonly root: ShadowRoot) {}

  private create(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'a11y-reading-guide';
    el.setAttribute('aria-hidden', 'true');
    // Hidden until something places it. Before the first pointer move or
    // focus change there is no line to mark, and a band parked across the top
    // of the viewport read as a stuck element rather than a ruler.
    el.hidden = true;
    this.root.appendChild(el);
    return el;
  }

  /** Moves the band to `y`, at most once a frame; shows it on the first move. */
  private moveTo(y: number): void {
    this.y = y;
    if (this.pending) return;
    this.pending = true;
    requestAnimationFrame(() => {
      this.pending = false;
      if (!this.el) return;
      this.el.hidden = false;
      this.el.style.transform = `translateY(${this.y}px)`;
    });
  }

  set(on: boolean): void {
    if (on) {
      if (this.el) return;
      this.el = this.create();

      this.onMove = (e) => this.moveTo(e.clientY);
      // Keyboard users have no pointer to follow, so the band goes to whatever
      // takes focus instead — on the host page, not in our own panel: the
      // panel paints above everything, and a band across it would only cover
      // the control being used. Focus inside our shadow root reaches the
      // document retargeted to the host element, which `contains` catches.
      this.onFocus = (e) => {
        const target = e.target;
        if (!(target instanceof Element) || this.root.host.contains(target)) return;
        const box = target.getBoundingClientRect();
        if (box.height) this.moveTo(box.top + box.height / 2);
      };
      // Passive: we never call preventDefault, and this fires constantly.
      window.addEventListener('pointermove', this.onMove, { passive: true });
      document.addEventListener('focusin', this.onFocus, true);
    } else {
      if (this.onMove) window.removeEventListener('pointermove', this.onMove);
      if (this.onFocus) document.removeEventListener('focusin', this.onFocus, true);
      this.onMove = null;
      this.onFocus = null;
      this.el?.remove();
      this.el = null;
    }
  }

  destroy(): void {
    this.set(false);
  }
}
