import { HE } from '../i18n/he.js';
import type { Feature } from '../types.js';

/**
 * The feature registry.
 *
 * Every entry obeys PLAN.md §4: user-invoked, presentation-only, and reversible
 * by writing the same state back at level 0. Nothing here adds or edits ARIA,
 * roles, headings, alt text or any other semantics on the host page, and
 * nothing here observes what the visitor turns on.
 */

/** Level names shared by the simple 0..2 spacing steppers. */
const spacingLabel = (level: number): string =>
  HE.spacingNames[level] ?? HE.spacingNames[0];

/**
 * Elements whose `autoplay` we cleared, so level 0 can put it back.
 *
 * Clearing the attribute is a mutation of the host's own markup, and every
 * feature must fully undo itself at level 0 (PLAN.md §4 — everything
 * reversible). Without this the attribute stayed gone for the life of the
 * page: a `<video autoplay muted loop>` became `<video muted loop>` even after
 * "איפוס כל ההגדרות", so any site script later reading `video.autoplay` or
 * calling `load()` saw state the site never set.
 */
const autoplayCleared = new WeakSet<HTMLMediaElement>();

/** Pauses playing media. Autoplay cannot be stopped with CSS alone. */
function pauseMedia(paused: boolean): void {
  const media = document.querySelectorAll<HTMLMediaElement>('video, audio');
  for (const el of media) {
    if (el.closest('#shakuf-root')) continue;
    try {
      if (paused) {
        if (!el.paused) el.pause();
        // Stop it starting again on its own. We deliberately do not resume
        // playback when the toggle goes off — restarting a video the visitor
        // did not ask for would be worse than leaving it paused. Restoring the
        // *attribute*, though, is required: that is the host's markup, not our
        // decision to make permanent.
        if (el.autoplay) {
          autoplayCleared.add(el);
          el.autoplay = false;
        }
      } else if (autoplayCleared.has(el)) {
        el.autoplay = true;
        autoplayCleared.delete(el);
      }
    } catch {
      /* cross-origin media can throw */
    }
  }
}

export const FEATURES: readonly Feature[] = [
  // ---- Text ------------------------------------------------------------
  {
    id: 'textSize',
    kind: 'stepper',
    group: 'text',
    label: HE.textSize,
    description: HE.textSizeDesc,
    max: 4,
    stepLabel: (level) => HE.levelNames[level] ?? HE.levelNames[0],
    apply: (level, ctx) => ctx.scaleText(level),
  },
  {
    id: 'lineHeight',
    kind: 'stepper',
    group: 'text',
    label: HE.lineHeight,
    max: 2,
    stepLabel: spacingLabel,
    apply: (level, ctx) => ctx.setHostAttr('line', level ? String(level) : null),
  },
  {
    id: 'letterSpacing',
    kind: 'stepper',
    group: 'text',
    label: HE.letterSpacing,
    max: 2,
    stepLabel: spacingLabel,
    apply: (level, ctx) => ctx.setHostAttr('letter', level ? String(level) : null),
  },
  {
    id: 'wordSpacing',
    kind: 'stepper',
    group: 'text',
    label: HE.wordSpacing,
    max: 2,
    stepLabel: spacingLabel,
    apply: (level, ctx) => ctx.setHostAttr('word', level ? String(level) : null),
  },
  {
    id: 'readableFont',
    kind: 'toggle',
    group: 'text',
    label: HE.readableFont,
    description: HE.readableFontDesc,
    apply: (on, ctx) => ctx.setHostAttr('font', on ? 'readable' : null),
  },
  {
    id: 'textAlign',
    kind: 'toggle',
    group: 'text',
    label: HE.textAlign,
    description: HE.textAlignDesc,
    apply: (on, ctx) => ctx.setHostAttr('align', on ? 'start' : null),
  },

  // ---- Colour ----------------------------------------------------------
  {
    id: 'contrast',
    kind: 'stepper',
    group: 'color',
    label: HE.contrast,
    max: 3,
    stepLabel: (level) =>
      [HE.levelOff, HE.contrastHigh, HE.contrastInvert, HE.contrastMono][level] ??
      HE.levelOff,
    apply: (level, ctx) =>
      ctx.setHostAttr(
        'contrast',
        [null, 'high', 'invert', 'mono'][level] ?? null,
      ),
  },
  {
    id: 'saturation',
    kind: 'stepper',
    group: 'color',
    label: HE.saturation,
    max: 2,
    stepLabel: (level) =>
      [HE.levelOff, HE.saturationLow, HE.saturationHigh][level] ?? HE.levelOff,
    apply: (level, ctx) =>
      ctx.setHostAttr('saturation', [null, 'low', 'high'][level] ?? null),
  },
  {
    id: 'highlightLinks',
    kind: 'toggle',
    group: 'color',
    label: HE.highlightLinks,
    description: HE.highlightLinksDesc,
    apply: (on, ctx) => ctx.setHostAttr('links', on ? '1' : null),
  },
  {
    id: 'hideImages',
    kind: 'toggle',
    group: 'color',
    label: HE.hideImages,
    apply: (on, ctx) => ctx.setHostAttr('images', on ? 'hidden' : null),
  },

  // ---- Motion & focus --------------------------------------------------
  {
    id: 'stopMotion',
    kind: 'toggle',
    group: 'motion',
    label: HE.stopMotion,
    description: HE.stopMotionDesc,
    apply: (on, ctx) => {
      ctx.setHostAttr('motion', on ? 'off' : null);
      pauseMedia(!!on);
    },
  },
  {
    id: 'focusOutline',
    kind: 'toggle',
    group: 'motion',
    label: HE.focusOutline,
    description: HE.focusOutlineDesc,
    apply: (on, ctx) => ctx.setHostAttr('focus', on ? 'strong' : null),
  },
  {
    id: 'bigCursor',
    kind: 'toggle',
    group: 'motion',
    label: HE.bigCursor,
    apply: (on, ctx) => ctx.setHostAttr('cursor', on ? 'big' : null),
  },
  {
    id: 'readingGuide',
    kind: 'toggle',
    group: 'motion',
    label: HE.readingGuide,
    description: HE.readingGuideDesc,
    apply: (on, ctx) => ctx.readingGuide(!!on),
  },
];

export const FEATURES_BY_ID = new Map(FEATURES.map((f) => [f.id, f]));
