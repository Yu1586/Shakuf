/**
 * Reading ruler — a horizontal band that follows the pointer to help the
 * visitor keep their place on a line.
 *
 * It lives inside our shadow root, not the host page, so it cannot be styled,
 * broken, or accidentally selected by the site's CSS. It is decorative and
 * carries `aria-hidden`, since it conveys nothing to a screen reader.
 */
export class ReadingGuide {
  private el: HTMLElement | null = null;
  private onMove: ((e: PointerEvent) => void) | null = null;
  private pending = false;
  private y = 0;

  constructor(private readonly root: ShadowRoot) {}

  private create(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'a11y-reading-guide';
    el.setAttribute('aria-hidden', 'true');
    this.root.appendChild(el);
    return el;
  }

  set(on: boolean): void {
    if (on) {
      if (this.el) return;
      this.el = this.create();

      this.onMove = (e: PointerEvent) => {
        this.y = e.clientY;
        if (this.pending) return;
        this.pending = true;
        requestAnimationFrame(() => {
          this.pending = false;
          if (this.el) this.el.style.transform = `translateY(${this.y}px)`;
        });
      };
      // Passive: we never call preventDefault, and this fires constantly.
      window.addEventListener('pointermove', this.onMove, { passive: true });
    } else {
      if (this.onMove) {
        window.removeEventListener('pointermove', this.onMove);
        this.onMove = null;
      }
      this.el?.remove();
      this.el = null;
    }
  }

  destroy(): void {
    this.set(false);
  }
}
