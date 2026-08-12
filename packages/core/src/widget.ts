import { announce, destroyAnnouncer } from './a11y/announcer.js';
import { FocusTrap } from './a11y/focus-trap.js';
import { readConfig } from './config.js';
import { FEATURES, FEATURES_BY_ID } from './features/index.js';
import { clearHostAttrs, ensureHostStyles, setHostAttr } from './host/host-styles.js';
import { ReadingGuide } from './host/reading-guide.js';
import { TextScaler } from './host/text-scaler.js';
import { HE } from './i18n/he.js';
import { clearPrefs, loadPrefs, savePrefs } from './storage.js';
import type { HostContext, PrefState, WidgetConfig } from './types.js';
import { foregroundFor } from './ui/color.js';
import { accessibilityIcon, el } from './ui/dom.js';
import { Panel } from './ui/panel.js';
import { PANEL_STYLES } from './ui/styles.js';

const ROOT_ID = 'a11y-il-root';

export class A11yWidget {
  private readonly config: WidgetConfig;
  private readonly host: HTMLElement;
  private readonly shadow: ShadowRoot;
  private readonly launcher: HTMLButtonElement;
  private readonly scaler = new TextScaler();
  private readonly guide: ReadingGuide;

  private state: PrefState;
  private panel: Panel | null = null;
  private trap: FocusTrap | null = null;
  private open = false;

  constructor(config?: Partial<WidgetConfig>) {
    this.config = { ...readConfig(), ...config };
    this.state = loadPrefs();

    this.host = el('div', { id: ROOT_ID });
    this.shadow = this.host.attachShadow({ mode: 'open' });
    this.guide = new ReadingGuide(this.shadow);

    const style = document.createElement('style');
    style.textContent = PANEL_STYLES;
    this.shadow.appendChild(style);

    this.applyTheme();
    this.launcher = this.buildLauncher();
    this.shadow.appendChild(this.launcher);

    ensureHostStyles();
    document.body.appendChild(this.host);

    // Re-apply what this visitor previously chose.
    //
    // This is not a violation of "nothing changes on load" (PLAN.md §4): the
    // rule exists to stop the widget making decisions the visitor did not ask
    // for. A stored preference *is* their explicit prior request, and dropping
    // it every navigation would make the tool useless to the people it is for.
    this.applyAll();
  }

  // ---- Setup ------------------------------------------------------------

  private applyTheme(): void {
    this.host.style.setProperty('--accent', this.config.accent);
    this.host.style.setProperty('--accent-fg', foregroundFor(this.config.accent));
  }

  /** Corner placement for the launcher and the panel that opens beside it. */
  private placement(): { launcher: string; panel: string } {
    const gap = this.config.offset;
    const [vertical, horizontal] = this.config.position.split('-') as ['top' | 'bottom', 'left' | 'right'];
    const launcher = `${vertical}:${gap}px;${horizontal}:${gap}px;`;
    // The panel sits beside the launcher, clear of its 56px diameter.
    const panelOffset = gap + 56 + 12;
    const panel = `${vertical}:${panelOffset}px;${horizontal}:${gap}px;`;
    return { launcher, panel };
  }

  private buildLauncher(): HTMLButtonElement {
    const btn = el('button', {
      type: 'button',
      class: 'launcher',
      'aria-label': HE.launcherLabel,
      'aria-expanded': 'false',
      lang: 'he',
    }, [accessibilityIcon()]) as HTMLButtonElement;

    btn.style.cssText = this.placement().launcher;
    btn.addEventListener('click', () => this.toggle());
    return btn;
  }

  // ---- Feature state ----------------------------------------------------

  private get ctx(): HostContext {
    return {
      setHostAttr,
      scaleText: (level) => this.scaler.set(level),
      readingGuide: (on) => this.guide.set(on),
      announce,
    };
  }

  private getLevel = (id: string): number => this.state[id] ?? 0;

  private setLevel = (id: string, level: number): void => {
    const feature = FEATURES_BY_ID.get(id);
    if (!feature) return;

    const max = feature.kind === 'stepper' ? feature.max : 1;
    const clamped = Math.max(0, Math.min(max, Math.round(level)));

    this.state[id] = clamped;
    feature.apply(clamped, this.ctx);
    savePrefs(this.state);
    this.panel?.sync();
  };

  /** Replays the whole stored state onto the page. */
  private applyAll(): void {
    for (const feature of FEATURES) {
      const level = this.getLevel(feature.id);
      if (level > 0) feature.apply(level, this.ctx);
    }
  }

  private resetAll = (): void => {
    this.state = {};
    clearPrefs();
    clearHostAttrs();
    this.scaler.reset();
    this.guide.set(false);
    this.panel?.sync();
  };

  // ---- Open / close -----------------------------------------------------

  private ensurePanel(): Panel {
    if (this.panel) return this.panel;

    this.panel = new Panel(this.config, {
      getLevel: this.getLevel,
      setLevel: this.setLevel,
      reset: this.resetAll,
      close: () => this.close(),
      announce,
    });
    this.panel.root.style.cssText = this.placement().panel;
    this.panel.root.hidden = true;
    this.shadow.appendChild(this.panel.root);
    return this.panel;
  }

  toggle(): void {
    if (this.open) this.close();
    else this.show();
  }

  show(): void {
    if (this.open) return;
    const panel = this.ensurePanel();
    panel.sync();
    panel.root.hidden = false;
    this.open = true;

    this.launcher.setAttribute('aria-expanded', 'true');
    this.launcher.setAttribute('aria-label', HE.launcherLabelClose);

    this.trap = new FocusTrap(panel.root, this.shadow, () => this.close());
    this.trap.activate();
  }

  close(): void {
    if (!this.open || !this.panel) return;
    this.panel.root.hidden = true;
    this.open = false;

    this.launcher.setAttribute('aria-expanded', 'false');
    this.launcher.setAttribute('aria-label', HE.launcherLabel);

    // Deactivate returns focus to whatever opened the panel.
    this.trap?.deactivate();
    this.trap = null;
  }

  /** Removes every trace of the widget and undoes everything it applied. */
  destroy(): void {
    this.close();
    this.resetAll();
    this.guide.destroy();
    destroyAnnouncer();
    this.host.remove();
    document.getElementById('a11y-il-host-styles')?.remove();
  }
}

let instance: A11yWidget | null = null;

/** Mounts the widget. Safe to call more than once — later calls are no-ops. */
export function mount(config?: Partial<WidgetConfig>): A11yWidget {
  if (instance) return instance;
  if (document.getElementById(ROOT_ID)) {
    // Two copies of the script on one page: the second must not fight the first.
    throw new Error('[a11y-il] Widget already mounted on this page.');
  }
  instance = new A11yWidget(config);
  return instance;
}

export function unmount(): void {
  instance?.destroy();
  instance = null;
}
