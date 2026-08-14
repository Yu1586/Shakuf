import {
  announce,
  destroyAnnouncer,
  retagAnnouncer,
  setAnnouncerContainer,
} from './a11y/announcer.js';
import { FocusTrap } from './a11y/focus-trap.js';
import { readConfig, resolveMount } from './config.js';
import { getFeature, getFeatures } from './features/index.js';
import { clearHostAttrs, ensureHostStyles, setHostAttr } from './host/host-styles.js';
import { ReadingGuide } from './host/reading-guide.js';
import { TextScaler } from './host/text-scaler.js';
import {
  currentLang,
  dirFor,
  parseLang,
  resolveLang,
  setLang,
  t,
  type Lang,
} from './i18n/index.js';
import { clearJumpTargets } from './nav/outline.js';
import { clearPrefs, loadPrefs, sanitizePrefs, savePrefs } from './storage.js';
import type { Feature, HostContext, PrefState, WidgetConfig } from './types.js';
import { foregroundFor } from './ui/color.js';
import { accessibilityIcon, el } from './ui/dom.js';
import { Panel } from './ui/panel.js';
import { HOST_Z_INDEX, PANEL_STYLES } from './ui/styles.js';

const ROOT_ID = 'shakuf-root';

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
  private panelOpen = false;
  private langObserver: MutationObserver | null = null;
  /** Whether this boot took its state from `initialPrefs` rather than storage. */
  private readonly seeded: boolean;

  constructor(config?: Partial<WidgetConfig>) {
    this.config = { ...readConfig(), ...config };

    // Stored preferences win. `initialPrefs` is a seed for visitors who have
    // none yet, so a host migrating from another tool can carry settings across
    // without overriding what this visitor has since chosen here.
    this.state = loadPrefs();
    this.seeded = Object.keys(this.state).length === 0 && this.config.initialPrefs !== null;
    if (this.seeded) this.state = sanitizePrefs(this.config.initialPrefs);

    // Before anything reads a string. `buildLauncher()` below is the first
    // caller of `t()`, and the panel, features and live region all follow.
    setLang(resolveLang(this.config.lang));

    this.host = el('div', { id: ROOT_ID, dir: dirFor(currentLang()) });
    this.shadow = this.host.attachShadow({ mode: 'open' });
    this.guide = new ReadingGuide(this.shadow);

    const style = document.createElement('style');
    style.textContent = PANEL_STYLES;
    this.shadow.appendChild(style);

    this.applyTheme();
    this.pinHostStacking();
    this.launcher = this.buildLauncher();
    this.launcher.hidden = this.config.hidden;
    this.shadow.appendChild(this.launcher);

    ensureHostStyles();

    // Both of our light-DOM elements go to the same place. The live region is
    // wired up before the first `announce()` can fire, which is why this sits
    // ahead of `applyAll()` below.
    const target = resolveMount(this.config.mount);
    setAnnouncerContainer(target);
    target.appendChild(this.host);

    // Re-apply what this visitor previously chose.
    //
    // This is not a violation of "nothing changes on load" (PLAN.md §4): the
    // rule exists to stop the widget making decisions the visitor did not ask
    // for. A stored preference *is* their explicit prior request, and dropping
    // it every navigation would make the tool useless to the people it is for.
    this.applyAll();

    // Persist a seed on first use, so it behaves like any other stored
    // preference from here on: the visitor can change or reset it, and the
    // host's migration values do not reappear every page load to undo them.
    // `applyAll` has already zeroed anything that failed to apply.
    if (this.seeded) savePrefs(this.state);

    this.watchLanguage();
  }

  // ---- Setup ------------------------------------------------------------

  private applyTheme(): void {
    this.host.style.setProperty('--accent', this.config.accent);
    this.host.style.setProperty('--accent-fg', foregroundFor(this.config.accent));
  }

  /**
   * Writes the host's positioning inline, because `:host` cannot be trusted with
   * it.
   *
   * Per CSS Scoping, a `:host` rule loses to *any* rule in the host document
   * that matches the host element — not by specificity, but categorically.
   * Measured on the live widget: `* { position: static; z-index: auto }`, the
   * weakest selector that exists, erases both. Most applications ship a reset of
   * exactly that shape, so the widget's entire stacking position was being
   * switched off on a large share of real installs, leaving the launcher to
   * paint by DOM order and disappear behind any host overlay. It surfaced as a
   * report that we set no z-index at all — we do, in the one place a stylesheet
   * erases for free.
   *
   * This is the worst failure this can have: a visitor pinned behind a blocking
   * overlay is exactly who needs stop-animations or high contrast, and the
   * control is gone precisely then.
   *
   * Inline beats normal host rules, so resets stop reaching us. Deliberately NOT
   * `!important`: a host that means to move us — mounting inside its own
   * stacking context, say — can still win with `!important`, and that escape
   * hatch is load-bearing for anyone already patching this themselves.
   *
   * Note `position: fixed` here does NOT make the host a containing block for
   * the fixed launcher inside it; only transform, filter, perspective, contain
   * and will-change do that. A host applying any of those to `#shakuf-root`
   * silently relocates the launcher, which is why the setup guide warns against
   * it.
   */
  private pinHostStacking(): void {
    this.host.style.position = 'fixed';
    this.host.style.zIndex = String(HOST_Z_INDEX);
  }

  /**
   * Corner placement for the launcher and the panel that opens beside it.
   *
   * `start` and `end` emit `inset-inline-*`, which the browser resolves against
   * the element's own direction — and ours is set from the widget language on
   * the shadow host. So a logical placement follows a runtime language switch on
   * its own, with nothing to re-apply: these strings are written once and the
   * resolution happens at layout. That is the whole reason to prefer the logical
   * property over computing left/right ourselves.
   */
  private placement(): { launcher: string; panel: string } {
    const gap = this.config.offset;
    const [vertical, horizontal] = this.config.position.split('-') as [
      'top' | 'bottom',
      'left' | 'right' | 'start' | 'end',
    ];
    const side =
      horizontal === 'start' || horizontal === 'end'
        ? `inset-inline-${horizontal}`
        : horizontal;
    const launcher = `${vertical}:${gap}px;${side}:${gap}px;`;
    // The panel sits beside the launcher, clear of its 56px diameter.
    const panelOffset = gap + 56 + 12;
    const panel = `${vertical}:${panelOffset}px;${side}:${gap}px;`;
    return { launcher, panel };
  }

  private buildLauncher(): HTMLButtonElement {
    const btn = el('button', {
      type: 'button',
      class: 'launcher',
      'aria-label': t().launcherLabel,
      'aria-expanded': 'false',
      // Resolved, never hardcoded. The label is translated, so a fixed `he` tag
      // meant a screen reader read "Open accessibility menu" in a Hebrew voice —
      // unintelligible, on the one control every visitor meets first. The panel
      // and the live region already resolve theirs; the launcher was missed.
      lang: currentLang(),
    }, [accessibilityIcon()]) as HTMLButtonElement;

    btn.style.cssText = this.placement().launcher;
    btn.addEventListener('click', () => this.toggle());
    return btn;
  }

  // ---- Language ---------------------------------------------------------

  /**
   * Follows `<html lang>` for the life of the page.
   *
   * A single read at boot is not enough. Single-page apps switch language by
   * rewriting `<html lang>` and `<html dir>` in place, with no navigation — so
   * a one-shot read leaves the panel stranded in the previous language for the
   * rest of the session, which is exactly the case a screen-reader user cannot
   * work around.
   *
   * Skipped when `data-lang` is set: that is the host saying "this language,
   * regardless", and an observer would keep overriding their choice.
   */
  private watchLanguage(): void {
    if (parseLang(this.config.lang)) return;

    this.langObserver = new MutationObserver(() => this.syncLanguage());
    this.langObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang'],
    });
  }

  /** Observer callback: re-resolve from the document, apply only on a change. */
  private syncLanguage(): void {
    if (setLang(resolveLang(this.config.lang))) this.relanguage();
  }

  /** Pushes the already-set language onto everything that renders a string. */
  private relanguage(): void {
    this.host.dir = dirFor(currentLang());
    this.launcher.lang = currentLang();
    this.launcher.setAttribute(
      'aria-label',
      this.panelOpen ? t().launcherLabelClose : t().launcherLabel,
    );
    retagAnnouncer();

    // Nothing rendered yet — the next open builds it in the new language.
    if (!this.panel) return;

    // The panel is built once and cached, and every string in it was resolved
    // at build time, so a language switch has to discard it. Re-opening moves
    // focus back into the panel, which is a visible jolt for anyone who had it
    // open — accepted deliberately, because the alternative is leaving them
    // reading a panel in a language the page has already left.
    const wasOpen = this.panelOpen;
    if (wasOpen) this.close();
    this.panel.root.remove();
    this.panel = null;
    if (wasOpen) this.open();
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

  /**
   * Runs one feature's `apply`, containing anything it throws.
   *
   * A feature reaches into the host page — other people's DOM, other people's
   * media elements, occasionally cross-origin — so it can fail for reasons that
   * have nothing to do with us. Unguarded, one throw took the rest of the loop
   * with it: on boot that meant the visitor's other stored preferences silently
   * never applied, and on a click it meant `savePrefs` and `panel.sync()` never
   * ran, so the control the visitor just pressed sat there looking dead.
   *
   * Returns false so callers can roll the state back rather than persist a
   * level that is not actually in effect.
   */
  private tryApply(feature: Feature, level: number): boolean {
    try {
      feature.apply(level, this.ctx);
      return true;
    } catch (error) {
      if (typeof console !== 'undefined') {
        console.error(`[shakuf] feature "${feature.id}" failed:`, error);
      }
      return false;
    }
  }

  private setLevel = (id: string, level: number): boolean => {
    const feature = getFeature(id);
    if (!feature) return false;

    const max = feature.kind === 'stepper' ? feature.max : 1;
    const clamped = Math.max(0, Math.min(max, Math.round(level)));
    const previous = this.getLevel(id);

    this.state[id] = clamped;

    if (!this.tryApply(feature, clamped)) {
      // Put the state back so the panel keeps telling the truth about what is
      // applied, and say so out loud. Silence is the wrong failure mode here:
      // a visitor who cannot see the page has no other way to learn that the
      // control they just pressed did nothing.
      this.state[id] = previous;
      this.panel?.sync();
      announce(t().featureFailed(feature.label));
      return false;
    }

    savePrefs(this.state);
    this.panel?.sync();
    return true;
  };

  /**
   * Replays the incoming state onto the page, and normalises it on the way.
   *
   * Rebuilt from the feature list rather than edited in place, so what survives
   * is exactly what this build can actually render: known ids only, each clamped
   * to its own feature's max. Both matter, and for the same reason — state
   * arrives from localStorage, which a stale or hand-edited value can populate,
   * and now also from a host's `initialPrefs`. An unknown id used to be carried
   * along and written straight back out by `savePrefs`, so `getPrefs()` returned
   * entries that were not features at all, contradicting its own contract and
   * disagreeing with `setPrefs`, which has always dropped them. An out-of-range
   * level would leave the page scaled while the panel reported "רגיל" and lit no
   * dots.
   *
   * Nothing is applied at level 0 here: at boot there is nothing to undo, and no
   * announcement is made — speaking on page load would be its own accessibility
   * problem. Isolated per feature, so one that cannot restore itself does not
   * stop the rest.
   */
  private applyAll(): void {
    const incoming = this.state;
    this.state = {};

    for (const feature of getFeatures()) {
      const max = feature.kind === 'stepper' ? feature.max : 1;
      const level = Math.max(0, Math.min(max, incoming[feature.id] ?? 0));
      if (level > 0 && this.tryApply(feature, level)) this.state[feature.id] = level;
    }
  }

  private resetAll = (): void => {
    this.state = {};
    clearPrefs();

    // Replay every feature at level 0 so each one runs its OWN undo. The three
    // sweeps below cover the attribute, scaling and overlay channels, but a
    // feature that touches anything else — `stopMotion` clearing `autoplay` on
    // host media, for instance — is only undone by its own `apply(0)`.
    // Isolated for the same reason, and it matters most here: reset is the
    // visitor's escape hatch. If one feature throws while undoing itself, every
    // feature after it in the list must still get its chance to clean up.
    for (const feature of getFeatures()) this.tryApply(feature, 0);

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
    if (this.panelOpen) this.close();
    else this.open();
  }

  // ---- Launcher visibility ----------------------------------------------

  /**
   * Hides the launcher without unmounting.
   *
   * `unmount()` also removes the button, but it tears down the whole widget:
   * the visitor's applied preferences are reset, and re-mounting costs a full
   * rebuild. Hosts that expose a "hide the accessibility button" setting are
   * toggling *chrome*, not asking to undo someone's contrast choice, so this
   * leaves everything applied and only takes the button off screen.
   *
   * Not persisted. The host owns this preference — it is theirs to store and
   * re-apply, and writing it to our own localStorage would mean two sources of
   * truth disagreeing the first time they diverge.
   */
  hide(): void {
    if (this.launcher.hidden) return;
    // An open panel with no launcher to return focus to is an orphan, and
    // `deactivate()` would hand focus to a hidden element.
    this.close();
    this.launcher.hidden = true;
  }

  show(): void {
    this.launcher.hidden = false;
  }

  get hidden(): boolean {
    return this.launcher.hidden;
  }

  /** Clears every preference and undoes everything applied to the page. */
  reset(): void {
    this.resetAll();
  }

  /**
   * The visitor's current preferences, as feature id → level.
   *
   * A copy, so a host cannot mutate our state by holding the object. Levels
   * absent from it are off. Pair this with `setPrefs` to store a visitor's
   * settings against a server-side profile — an accessibility preference that
   * only survives on one device is the weaker half of the feature.
   *
   * Reading this is not a licence to transmit it without asking. "High
   * contrast" is arguably an inference about disability (PLAN.md §4), which is
   * why the widget itself never sends it anywhere; a host that does is making
   * its own decision under its own privacy policy.
   */
  getPrefs(): PrefState {
    return { ...this.state };
  }

  /**
   * Replaces the visitor's preferences wholesale and applies the result.
   *
   * Replace, not merge, and deliberately: this is how a host restores a saved
   * profile, and a merge would leave whatever the visitor had turned on locally
   * silently mixed into a state the host thinks it fully specified. Every
   * feature is re-applied, including at level 0, so anything previously on runs
   * its own undo — the same mechanism `reset()` relies on. To change one setting
   * without disturbing the rest, spread over `getPrefs()`.
   *
   * Input is sanitised and then clamped per feature, so a stale level from an
   * older version, an unknown feature id, or a hand-built object cannot put the
   * widget into a state the panel cannot render or the visitor cannot reset.
   */
  setPrefs(prefs: unknown): void {
    const next = sanitizePrefs(prefs);
    this.state = {};

    for (const feature of getFeatures()) {
      const max = feature.kind === 'stepper' ? feature.max : 1;
      const level = Math.max(0, Math.min(max, next[feature.id] ?? 0));
      // Isolated per feature, as everywhere else: one feature that cannot apply
      // must not stop the rest of the profile from being restored.
      if (this.tryApply(feature, level) && level > 0) this.state[feature.id] = level;
    }

    savePrefs(this.state);
    this.panel?.sync();
  }

  get lang(): Lang {
    return currentLang();
  }

  // ---- Language ---------------------------------------------------------

  /**
   * Sets the language imperatively, and stops following the host document.
   *
   * An explicit call is a stronger signal than the attribute, so this pins:
   * otherwise the next `<html lang>` mutation would silently undo it, and a
   * host driving language through both channels would fight itself. Hosts that
   * want the widget to keep tracking the document should change `<html lang>`
   * instead of calling this.
   *
   * Unknown tags are ignored rather than throwing — a bad value should not take
   * a host page down (see `auto.ts`), and the current language remains valid.
   */
  setLanguage(lang: string): void {
    const parsed = parseLang(lang);
    if (!parsed) return;

    this.langObserver?.disconnect();
    this.langObserver = null;

    if (setLang(parsed)) this.relanguage();
  }

  open(): void {
    if (this.panelOpen) return;
    const panel = this.ensurePanel();
    panel.sync();
    panel.root.hidden = false;
    this.panelOpen = true;

    this.launcher.setAttribute('aria-expanded', 'true');
    this.launcher.setAttribute('aria-label', t().launcherLabelClose);

    this.trap = new FocusTrap(panel.root, this.shadow, () => this.close());
    this.trap.activate();
  }

  close(): void {
    if (!this.panelOpen || !this.panel) return;
    this.panel.root.hidden = true;
    this.panelOpen = false;

    this.launcher.setAttribute('aria-expanded', 'false');
    this.launcher.setAttribute('aria-label', t().launcherLabel);

    // Deactivate returns focus to whatever opened the panel.
    this.trap?.deactivate();
    this.trap = null;
  }

  /** Removes every trace of the widget and undoes everything it applied. */
  destroy(): void {
    this.close();
    this.langObserver?.disconnect();
    this.langObserver = null;
    this.resetAll();
    this.guide.destroy();
    clearJumpTargets();
    destroyAnnouncer();
    this.host.remove();
    document.getElementById('shakuf-host-styles')?.remove();

    // `destroy()` is public alongside `mount()`, so clear the singleton here
    // too. Otherwise `mount()` after `destroy()` returned the dead instance —
    // detached host, no widget on the page, and no error to explain it.
    if (instance === this) instance = null;
  }
}

let instance: A11yWidget | null = null;

/** Mounts the widget. Safe to call more than once — later calls are no-ops. */
export function mount(config?: Partial<WidgetConfig>): A11yWidget {
  if (instance) return instance;
  if (document.getElementById(ROOT_ID)) {
    // Two copies of the script on one page: the second must not fight the first.
    throw new Error('[shakuf] Widget already mounted on this page.');
  }
  if (!document.body) {
    // The npm path documents calling `mount()` yourself, and a bundler user may
    // well do that from <head>. Constructing here would throw on
    // `body.appendChild` *after* having already injected the host stylesheet,
    // leaving a half-initialised page. Wait for the body instead.
    throw new Error(
      '[shakuf] mount() called before <body> exists. Call it after DOMContentLoaded, or load the script with defer.',
    );
  }
  instance = new A11yWidget(config);

  // Fired on `document`, not `window`, so it is reachable from a host that
  // never touches globals. Dispatched synchronously at the end of mount, which
  // means a listener must already be attached — with `defer` that is any inline
  // script earlier in the document. Hosts that cannot guarantee ordering should
  // check for `window.shakuf` instead: it is set at the same moment and stays.
  document.dispatchEvent(
    new CustomEvent<A11yWidget>('shakuf:ready', { detail: instance }),
  );

  return instance;
}

export function unmount(): void {
  instance?.destroy();
  instance = null;
}
