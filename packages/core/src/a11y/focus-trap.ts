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
    //
    // `shadow.activeElement` FIRST. `document.activeElement` retargets across
    // the shadow boundary and reports the #shakuf-root host div, which has
    // neither `tabindex` nor `delegatesFocus` — so calling `.focus()` on it in
    // `deactivate()` is a silent no-op and the visitor is dumped at the top of
    // the document. That happened on every close.
    const active = this.shadow.activeElement ?? document.activeElement;
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

      // The container counts as the leading boundary. It holds focus on open
      // (see below) but carries `tabindex="-1"`, so it is deliberately absent
      // from `FOCUSABLE` — without this clause, Shift+Tab from the freshly
      // opened panel matched no branch, went un-prevented, and walked focus
      // straight out of a dialog marked `aria-modal="true"`.
      if (e.shiftKey && (current === first || current === this.container)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    };

    // Bound to the shadow root, not the container: if focus ever does leave the
    // panel, a container-bound listener would stop seeing Escape and the dialog
    // would become uncloseable by keyboard. Capture phase so the panel wins over
    // any Escape handler on the host page.
    this.shadow.addEventListener('keydown', this.onKeydown as EventListener, true);

    // Focus the panel itself rather than the first control, so the screen
    // reader announces the dialog's name before its contents.
    requestAnimationFrame(() => this.container.focus());
  }

  deactivate(): void {
    if (this.onKeydown) {
      this.shadow.removeEventListener('keydown', this.onKeydown as EventListener, true);
      this.onKeydown = null;
    }

    const target = this.previouslyFocused;
    this.previouslyFocused = null;

    // Only restore focus if it is still ours to move — the visitor may have
    // clicked into the page while the panel was open.
    if (!target?.isConnected) return;
    target.focus();

    // Belt and braces: if that focus call did not land (a detached or
    // non-focusable target), hand focus to the launcher rather than leaving the
    // visitor at the top of the document.
    if (this.shadow.activeElement === null) {
      this.shadow.querySelector<HTMLElement>('.launcher')?.focus();
    }
  }
}
