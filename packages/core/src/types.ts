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
  /** Sets or removes `data-a11y-<name>` on `<html>`. All host CSS keys off these. */
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
}
