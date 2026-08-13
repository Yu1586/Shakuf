/**
 * Core types.
 *
 * Design rule that governs this whole file (PLAN.md §4): every feature is
 * user-invoked and fully reversible. A feature may change *presentation* on the
 * host page. No feature may add, remove or rewrite ARIA, roles, or semantics,
 * and no feature may intercept the visitor's own assistive technology.
 */

/** Panel sections, in display order. */
export type GroupId = 'text' | 'color' | 'motion' | 'nav' | 'info';

/**
 * What a feature can do to the host page.
 *
 * Deliberately narrow: features get attribute writes, the text scaler and the
 * announcer, and nothing else. Anything wanting broader DOM access is a feature
 * we have decided not to build.
 */
export interface HostContext {
  /** Sets or removes `data-shakuf-<name>` on `<html>`. All host CSS keys off these. */
  setHostAttr(name: string, value: string | null): void;
  /** Reversible font scaling. The only feature that touches host elements directly. */
  scaleText(level: number): void;
  /** Shows/hides the reading ruler. Lives inside our shadow root, not the page. */
  readingGuide(on: boolean): void;
  /** Announces a message to assistive tech, in Hebrew, via our own live region. */
  announce(message: string): void;
}

interface FeatureBase {
  readonly id: string;
  readonly group: GroupId;
  /** Hebrew. Shown as the control's accessible name. */
  readonly label: string;
  /** Hebrew. Optional longer explanation, wired via aria-describedby. */
  readonly description?: string;
}

/** On/off. State is 0 or 1. */
export interface ToggleFeature extends FeatureBase {
  readonly kind: 'toggle';
  apply(level: number, ctx: HostContext): void;
}

/** Multi-step. State is 0..max, where 0 is always "off / site default". */
export interface StepperFeature extends FeatureBase {
  readonly kind: 'stepper';
  readonly max: number;
  /** Hebrew label for the current level, used in the live announcement. */
  stepLabel(level: number): string;
  apply(level: number, ctx: HostContext): void;
}

export type Feature = ToggleFeature | StepperFeature;

/** Persisted state: feature id -> level. Absent key means 0. */
export type PrefState = Record<string, number>;

/**
 * Host-page configuration, read from the script tag's data attributes.
 *
 * Everything here is supplied by the site owner. None of it is sent anywhere —
 * there is no server (PLAN.md §5, D2).
 */
export interface WidgetConfig {
  /**
   * Corner the launcher sits in.
   *
   * Physical values pin a literal corner. The `-start` / `-end` values are
   * logical: they follow the reading direction, so the launcher moves to the
   * other side when the page switches between Hebrew and English, the same way
   * a host built on CSS logical properties moves everything else. A site with
   * its own floating button in the opposite logical corner cannot avoid a
   * collision with physical values — it collides in exactly one of its two
   * languages, whichever corner it picks.
   */
  position:
    | 'bottom-right'
    | 'bottom-left'
    | 'top-right'
    | 'top-left'
    | 'bottom-start'
    | 'bottom-end'
    | 'top-start'
    | 'top-end';
  /** Launcher offset from the page edges, in px. */
  offset: number;
  /** URL of the site's published הצהרת נגישות. */
  statementUrl: string | null;
  /** רכז נגישות — name, phone, email. Shown in the "נגישות באתר" section. */
  coordinatorName: string | null;
  coordinatorPhone: string | null;
  coordinatorEmail: string | null;
  /** Accent colour for the launcher and controls. Must meet 4.5:1 on white. */
  accent: string;
  /** Attribution link target. See PLAN.md §3.5 — disclosure is mandatory. */
  byUrl: string | null;
  byName: string | null;
  /**
   * CSS selector for the element to mount into. Defaults to `<body>`.
   *
   * Exists because hosts that manage `inert` or focus at the body level will
   * otherwise disable us at exactly the wrong moment. A React app that marks
   * every `<body>` child inert behind a full-screen blocker, exempting only its
   * own root, would inert the accessibility widget while the visitor is stuck
   * looking at the blocker — which is precisely when they may need the contrast
   * and reduce-motion controls. Pointing us inside their root instead keeps us
   * reachable.
   */
  mount: string | null;
  /**
   * `he` or `en`. Falls back to `<html lang>`, then Hebrew.
   *
   * Set this only to override the host document. Leaving it unset is usually
   * right: the widget should speak the language of the page it sits on.
   */
  lang: string | null;
  /**
   * Start with the launcher hidden.
   *
   * For hosts that already know the visitor turned the button off. Without it
   * they can only call `hide()` after mount, which paints the launcher for a
   * frame and then removes it — a flash on every page load, on a control the
   * visitor has explicitly asked not to see.
   */
  hidden: boolean;
  /**
   * Preferences to start from when this visitor has none stored yet.
   *
   * For hosts replacing another accessibility tool. Without it, everyone who
   * had set large text or high contrast in the old widget is silently reset on
   * migration day — and that is precisely the population the feature exists for.
   *
   * A *seed*, not an override: it is used only when our own storage is empty, so
   * it cannot keep overwriting choices the visitor makes afterwards. Once
   * applied it is persisted like any other preference. To push settings in
   * unconditionally — restoring from a server-side profile, say — call
   * `setPrefs()` instead, which is explicit about being the stronger signal.
   *
   * There is no data attribute for this. It is an object, and the script-tag
   * path has no sane way to express one; bundler hosts pass it to `mount()`.
   */
  initialPrefs: PrefState | null;
}
