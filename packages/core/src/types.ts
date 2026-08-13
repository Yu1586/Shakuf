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
  /** Corner the launcher sits in. */
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
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
}
