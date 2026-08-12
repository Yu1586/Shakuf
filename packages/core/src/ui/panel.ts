import { BRAND } from '../brand.js';
import { FEATURES } from '../features/index.js';
import { HE } from '../i18n/he.js';
import { getHeadings, getLandmarks, getLinks, jumpTo } from '../nav/outline.js';
import type { OutlineItem } from '../nav/outline.js';
import type { Feature, GroupId, StepperFeature, ToggleFeature, WidgetConfig } from '../types.js';
import { chevronIcon, closeIcon, el } from './dom.js';

export interface PanelHandlers {
  getLevel(id: string): number;
  setLevel(id: string, level: number): void;
  reset(): void;
  close(): void;
  announce(message: string): void;
}

const GROUP_TITLES: Record<GroupId, string> = {
  text: HE.groupText,
  color: HE.groupColor,
  motion: HE.groupMotion,
  nav: HE.groupNav,
  info: HE.groupInfo,
};

let uid = 0;
const nextId = (prefix: string) => `a11y-${prefix}-${++uid}`;

export class Panel {
  readonly root: HTMLElement;
  /** Re-reads state into the controls. Called after any change and on open. */
  private syncers: Array<() => void> = [];

  constructor(
    private readonly config: WidgetConfig,
    private readonly handlers: PanelHandlers,
  ) {
    this.root = this.build();
  }

  sync(): void {
    for (const s of this.syncers) s();
  }

  // ---- Structure --------------------------------------------------------

  private build(): HTMLElement {
    const titleId = nextId('title');

    const panel = el('div', {
      class: 'panel',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': titleId,
      tabindex: '-1',
      lang: 'he',
      dir: 'rtl',
    });

    // Header
    const closeBtn = el('button', {
      type: 'button',
      class: 'close',
      'aria-label': HE.close,
    }, [closeIcon()]);
    closeBtn.addEventListener('click', () => this.handlers.close());

    panel.appendChild(
      el('div', { class: 'header' }, [
        el('h2', { class: 'title', id: titleId, text: HE.panelTitle }),
        closeBtn,
      ]),
    );

    // Body
    const body = el('div', { class: 'body' });
    for (const group of ['text', 'color', 'motion'] as const) {
      body.appendChild(this.buildFeatureGroup(group));
    }
    body.appendChild(this.buildNavGroup());
    body.appendChild(this.buildInfoGroup());
    panel.appendChild(body);

    panel.appendChild(this.buildFooter());
    return panel;
  }

  private buildFeatureGroup(group: GroupId): HTMLElement {
    const headingId = nextId('grp');
    const section = el('section', { class: 'group', 'aria-labelledby': headingId }, [
      el('h3', { class: 'group-title', id: headingId, text: GROUP_TITLES[group] }),
    ]);

    for (const feature of FEATURES.filter((f) => f.group === group)) {
      section.appendChild(
        feature.kind === 'toggle'
          ? this.buildToggle(feature)
          : this.buildStepper(feature),
      );
    }
    return section;
  }

  // ---- Controls ---------------------------------------------------------

  private buildToggle(feature: ToggleFeature): HTMLElement {
    const descId = nextId('desc');

    const labels = el('span', {}, [
      el('span', { class: 'toggle-label', text: feature.label }),
    ]);
    if (feature.description) {
      labels.appendChild(
        el('span', { class: 'toggle-desc', id: descId, text: feature.description }),
      );
    }

    // `aria-label` fixes the accessible name to the short label, so the longer
    // description is announced as a description rather than folded into the name.
    const btn = el('button', {
      type: 'button',
      class: 'toggle',
      'aria-pressed': 'false',
      'aria-label': feature.label,
      ...(feature.description ? { 'aria-describedby': descId } : {}),
    }, [labels, el('span', { class: 'switch', 'aria-hidden': 'true' })]);

    btn.addEventListener('click', () => {
      const next = this.handlers.getLevel(feature.id) ? 0 : 1;
      this.handlers.setLevel(feature.id, next);
      this.handlers.announce(
        next ? HE.announceOn(feature.label) : HE.announceOff(feature.label),
      );
    });

    this.syncers.push(() => {
      btn.setAttribute(
        'aria-pressed',
        this.handlers.getLevel(feature.id) ? 'true' : 'false',
      );
    });

    return btn;
  }

  private buildStepper(feature: StepperFeature): HTMLElement {
    const labelId = nextId('lbl');
    const descId = nextId('desc');

    const wrap = el('div', {
      class: 'stepper',
      role: 'group',
      'aria-labelledby': labelId,
      ...(feature.description ? { 'aria-describedby': descId } : {}),
    }, [el('span', { class: 'stepper-label', id: labelId, text: feature.label })]);

    if (feature.description) {
      wrap.appendChild(
        el('span', { class: 'stepper-desc', id: descId, text: feature.description }),
      );
    }

    const value = el('span', { class: 'step-value' });

    // In RTL the first child renders rightmost, so decrease comes first.
    const down = el('button', {
      type: 'button',
      class: 'step-btn',
      'aria-label': `${HE.decrease} — ${feature.label}`,
    }, ['−']);
    const up = el('button', {
      type: 'button',
      class: 'step-btn',
      'aria-label': `${HE.increase} — ${feature.label}`,
    }, ['+']);

    // `aria-disabled` rather than `disabled`: a disabled button drops out of the
    // tab order, so a visitor pressing "+" up to the maximum would lose focus
    // entirely at the moment they reach it.
    const step = (delta: number) => {
      const current = this.handlers.getLevel(feature.id);
      const next = Math.max(0, Math.min(feature.max, current + delta));
      if (next === current) return;
      this.handlers.setLevel(feature.id, next);
      this.handlers.announce(
        HE.announceLevel(feature.label, feature.stepLabel(next)),
      );
    };
    down.addEventListener('click', () => step(-1));
    up.addEventListener('click', () => step(1));

    const dots = el('div', { class: 'step-dots', 'aria-hidden': 'true' });
    const dotEls: HTMLElement[] = [];
    for (let i = 1; i <= feature.max; i++) {
      const dot = el('span', { class: 'step-dot' });
      dotEls.push(dot);
      dots.appendChild(dot);
    }

    wrap.appendChild(
      el('div', { class: 'stepper-controls' }, [down, value, up]),
    );
    wrap.appendChild(dots);

    this.syncers.push(() => {
      const level = this.handlers.getLevel(feature.id);
      value.textContent = feature.stepLabel(level);
      down.setAttribute('aria-disabled', level === 0 ? 'true' : 'false');
      up.setAttribute('aria-disabled', level === feature.max ? 'true' : 'false');
      dotEls.forEach((dot, i) => {
        dot.className = i < level ? 'step-dot on' : 'step-dot';
      });
    });

    return wrap;
  }

  // ---- Navigation aids --------------------------------------------------

  private buildNavGroup(): HTMLElement {
    const headingId = nextId('grp');
    const section = el('section', { class: 'group', 'aria-labelledby': headingId }, [
      el('h3', { class: 'group-title', id: headingId, text: GROUP_TITLES.nav }),
      el('p', { class: 'nav-hint', text: HE.navHint }),
    ]);

    section.appendChild(this.buildNavAid(HE.navHeadings, getHeadings, HE.navCountHeadings));
    section.appendChild(this.buildNavAid(HE.navLandmarks, getLandmarks, HE.navCountLandmarks));
    section.appendChild(this.buildNavAid(HE.navLinks, getLinks, HE.navCountLinks));
    return section;
  }

  private buildNavAid(
    label: string,
    read: () => OutlineItem[],
    count: (n: number) => string,
  ): HTMLElement {
    const listId = nextId('list');
    const countEl = el('span', { class: 'nav-count' });

    const btn = el('button', {
      type: 'button',
      class: 'nav-btn',
      'aria-expanded': 'false',
      'aria-controls': listId,
    }, [el('span', { text: label }), countEl, chevronIcon()]);

    const list = el('ul', { class: 'nav-list', id: listId, hidden: true });
    const wrap = el('div', {}, [btn, list]);

    const fill = () => {
      list.textContent = '';
      // Read the page fresh on every expand — SPA routes and lazy content mean
      // a list captured at mount would be stale by the time it is opened.
      const items = read();
      countEl.textContent = count(items.length);

      if (items.length === 0) {
        list.appendChild(el('li', {}, [
          el('span', { class: 'nav-empty', text: HE.navEmpty }),
        ]));
        return;
      }

      for (const item of items) {
        const jump = el('button', {
          type: 'button',
          class: 'nav-item',
          style: item.level ? `padding-inline-start:${(item.level - 1) * 12 + 10}px` : null,
          text: item.label,
        });
        jump.addEventListener('click', () => {
          this.handlers.close();
          jumpTo(item.element);
          this.handlers.announce(HE.navJumped(item.label));
        });
        list.appendChild(el('li', {}, [jump]));
      }
    };

    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      if (open) {
        btn.setAttribute('aria-expanded', 'false');
        list.hidden = true;
      } else {
        fill();
        btn.setAttribute('aria-expanded', 'true');
        list.hidden = false;
      }
    });

    // Keep the counts honest without opening: refresh them on every panel open.
    this.syncers.push(() => {
      countEl.textContent = count(read().length);
    });

    return wrap;
  }

  // ---- Site accessibility info -----------------------------------------

  private buildInfoGroup(): HTMLElement {
    const { statementUrl, coordinatorName, coordinatorPhone, coordinatorEmail } = this.config;
    const headingId = nextId('grp');
    const section = el('section', { class: 'group', 'aria-labelledby': headingId }, [
      el('h3', { class: 'group-title', id: headingId, text: GROUP_TITLES.info }),
    ]);

    if (statementUrl) {
      section.appendChild(
        el('p', { class: 'info-row' }, [
          el('a', { href: statementUrl, text: HE.statementLink }),
        ]),
      );
    }
    if (coordinatorName) {
      section.appendChild(
        el('p', { class: 'info-row' }, [
          el('span', { class: 'info-label', text: `${HE.coordinator}: ` }),
          el('span', { text: coordinatorName }),
        ]),
      );
    }
    if (coordinatorPhone) {
      section.appendChild(
        el('p', { class: 'info-row' }, [
          el('span', { class: 'info-label', text: `${HE.coordinatorPhone}: ` }),
          el('a', { href: `tel:${coordinatorPhone}`, text: coordinatorPhone }),
        ]),
      );
    }
    if (coordinatorEmail) {
      section.appendChild(
        el('p', { class: 'info-row' }, [
          el('span', { class: 'info-label', text: `${HE.coordinatorEmail}: ` }),
          el('a', { href: `mailto:${coordinatorEmail}`, text: coordinatorEmail }),
        ]),
      );
    }

    // Saying nothing here would let the widget stand in for obligations it does
    // not discharge. If the owner configured neither, the visitor is told that
    // the site is missing something the law requires (PLAN.md §1.4).
    if (!statementUrl && !coordinatorName && !coordinatorPhone && !coordinatorEmail) {
      section.appendChild(el('p', { class: 'info-missing', text: HE.infoMissing }));
    }

    return section;
  }

  // ---- Footer -----------------------------------------------------------

  private buildFooter(): HTMLElement {
    const resetBtn = el('button', {
      type: 'button',
      class: 'reset',
      text: HE.reset,
    });
    resetBtn.addEventListener('click', () => {
      this.handlers.reset();
      this.handlers.announce(HE.resetDone);
    });

    const footer = el('div', { class: 'footer' }, [
      resetBtn,
      // Mandatory. See PLAN.md §2.4 layer 1 — this is the only control that
      // reaches ordinary installers, so it is neither optional nor themeable.
      el('p', { class: 'disclaimer' }, [
        el('strong', { text: HE.disclaimerShort }),
        document.createTextNode(' '),
        document.createTextNode(HE.disclaimerLong),
      ]),
    ]);

    const byName = this.config.byName ?? BRAND.name;
    const byUrl = this.config.byUrl ?? BRAND.url;

    // Both links open in a new tab so the visitor never loses the page they
    // were on. `aria-label` carries that fact, because a new tab opening
    // unannounced is disorienting for screen-reader users (WCAG G201).
    // Only the name itself is the link — "תוסף" stays plain text beside it.
    const productLink = el('a', {
      href: byUrl,
      rel: 'noopener',
      target: '_blank',
      'aria-label': `${byName} — ${HE.newTab}`,
      text: byName,
    });
    const authorLink = el('a', {
      href: BRAND.authorUrl,
      rel: 'noopener',
      target: '_blank',
      'aria-label': `${BRAND.authorName} — ${HE.newTab}`,
      text: BRAND.authorName,
    });

    footer.appendChild(
      el('p', { class: 'by' }, [
        document.createTextNode(`${HE.byPrefix} `),
        productLink,
        document.createTextNode(` ${HE.byMiddle} `),
        authorLink,
      ]),
    );

    return footer;
  }
}
