/**
 * Focus management for the panel.
 *
 * The panel is a modal dialog: focus enters it on open, cycles inside it, and
 * returns to the launcher on close. This is the pattern screen-reader users
 * expect from a dialog, and getting it wrong on an accessibility widget is not
 * a defensible outcome (PLAN.md §4).
 *
 * Shadow-DOM note: `document.activeElement` reports our host element, not the
 * real focused control, so everything here reads `shadowRoot.activeElement`.
 */

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function visible(el: HTMLElement): boolean {
  return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
}

export class FocusTrap {
  private previouslyFocused: HTMLElement | null = null;
  private onKeydown: ((e: KeyboardEvent) => void) | null = null;

  constructor(
    private readonly container: HTMLElement,
    private readonly shadow: ShadowRoot,
    private readonly onEscape: () => void,
  ) {}

  private focusable(): HTMLElement[] {
    return Array.from(
      this.container.querySelectorAll<HTMLElement>(FOCUSABLE),
    ).filter(visible);
  }

  activate(): void {
    // Remember where focus came from, so we can hand it back on close.
    const active = document.activeElement;
    this.previouslyFocused = active instanceof HTMLElement ? active : null;

    this.onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.onEscape();
        return;
      }
      if (e.key !== 'Tab') return;

      const items = this.focusable();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const current = this.shadow.activeElement;

      if (e.shiftKey && current === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    };

    // Capture phase: the host page may also listen for Escape, and the panel
    // should win while it is open.
    this.container.addEventListener('keydown', this.onKeydown, true);

    // Focus the panel itself rather than the first control, so the screen
    // reader announces the dialog's name before its contents.
    requestAnimationFrame(() => this.container.focus());
  }

  deactivate(): void {
    if (this.onKeydown) {
      this.container.removeEventListener('keydown', this.onKeydown, true);
      this.onKeydown = null;
    }
    // Only restore focus if it is still ours to move — the visitor may have
    // clicked into the page while the panel was open.
    if (this.previouslyFocused?.isConnected) {
      this.previouslyFocused.focus();
    }
    this.previouslyFocused = null;
  }
}
