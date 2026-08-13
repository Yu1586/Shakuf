import { t } from '../i18n/index.js';
import type { Strings } from '../i18n/index.js';
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
const spacingLabel = (level: number): string => {
  const names = t().spacingNames;
  return names[level] ?? names[0]!;
};

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

/**
 * Builds the registry against a string pack.
 *
 * This used to be a module-level `const`, which baked every label at import
 * time — fine when Hebrew was the only language, wrong the moment the panel has
 * to re-render in another one. Only `label`, `description` and `stepLabel`
 * depend on language; `apply` never does, and the state it relies on
 * (`autoplayCleared`) is module-scoped, so rebuilding the array is free of
 * side effects.
 */
function build(s: Strings): readonly Feature[] {
  return [
    // ---- Text ------------------------------------------------------------
    {
      id: 'textSize',
      kind: 'stepper',
      group: 'text',
      label: s.textSize,
      description: s.textSizeDesc,
      max: 4,
      stepLabel: (level) => s.levelNames[level] ?? s.levelNames[0]!,
      apply: (level, ctx) => ctx.scaleText(level),
    },
    {
      id: 'lineHeight',
      kind: 'stepper',
      group: 'text',
      label: s.lineHeight,
      max: 2,
      stepLabel: spacingLabel,
      apply: (level, ctx) => ctx.setHostAttr('line', level ? String(level) : null),
    },
    {
      id: 'letterSpacing',
      kind: 'stepper',
      group: 'text',
      label: s.letterSpacing,
      max: 2,
      stepLabel: spacingLabel,
      apply: (level, ctx) => ctx.setHostAttr('letter', level ? String(level) : null),
    },
    {
      id: 'wordSpacing',
      kind: 'stepper',
      group: 'text',
      label: s.wordSpacing,
      max: 2,
      stepLabel: spacingLabel,
      apply: (level, ctx) => ctx.setHostAttr('word', level ? String(level) : null),
    },
    {
      id: 'readableFont',
      kind: 'toggle',
      group: 'text',
      label: s.readableFont,
      description: s.readableFontDesc,
      apply: (on, ctx) => ctx.setHostAttr('font', on ? 'readable' : null),
    },
    {
      id: 'textAlign',
      kind: 'toggle',
      group: 'text',
      label: s.textAlign,
      description: s.textAlignDesc,
      apply: (on, ctx) => ctx.setHostAttr('align', on ? 'start' : null),
    },

    // ---- Colour ----------------------------------------------------------
    {
      id: 'contrast',
      kind: 'stepper',
      group: 'color',
      label: s.contrast,
      max: 3,
      stepLabel: (level) =>
        [s.levelOff, s.contrastHigh, s.contrastInvert, s.contrastMono][level] ??
        s.levelOff,
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
      label: s.saturation,
      max: 2,
      stepLabel: (level) =>
        [s.levelOff, s.saturationLow, s.saturationHigh][level] ?? s.levelOff,
      apply: (level, ctx) =>
        ctx.setHostAttr('saturation', [null, 'low', 'high'][level] ?? null),
    },
    {
      id: 'highlightLinks',
      kind: 'toggle',
      group: 'color',
      label: s.highlightLinks,
      description: s.highlightLinksDesc,
      apply: (on, ctx) => ctx.setHostAttr('links', on ? '1' : null),
    },
    {
      id: 'hideImages',
      kind: 'toggle',
      group: 'color',
      label: s.hideImages,
      apply: (on, ctx) => ctx.setHostAttr('images', on ? 'hidden' : null),
    },

    // ---- Motion & focus --------------------------------------------------
    {
      id: 'stopMotion',
      kind: 'toggle',
      group: 'motion',
      label: s.stopMotion,
      description: s.stopMotionDesc,
      apply: (on, ctx) => {
        ctx.setHostAttr('motion', on ? 'off' : null);
        pauseMedia(!!on);
      },
    },
    {
      id: 'focusOutline',
      kind: 'toggle',
      group: 'motion',
      label: s.focusOutline,
      description: s.focusOutlineDesc,
      apply: (on, ctx) => ctx.setHostAttr('focus', on ? 'strong' : null),
    },
    {
      id: 'bigCursor',
      kind: 'toggle',
      group: 'motion',
      label: s.bigCursor,
      apply: (on, ctx) => ctx.setHostAttr('cursor', on ? 'big' : null),
    },
    {
      id: 'readingGuide',
      kind: 'toggle',
      group: 'motion',
      label: s.readingGuide,
      description: s.readingGuideDesc,
      apply: (on, ctx) => ctx.readingGuide(!!on),
    },
  ];
}

/**
 * Cached per string pack, keyed on the pack's identity rather than a manual
 * invalidate call. `t()` returns the same object for as long as the language is
 * unchanged, so this rebuilds exactly once per switch and never needs the
 * language layer to know that this module has a cache.
 */
let cache: { pack: Strings; list: readonly Feature[]; byId: Map<string, Feature> } | null = null;

function registry(): { list: readonly Feature[]; byId: Map<string, Feature> } {
  const pack = t();
  if (cache?.pack !== pack) {
    const list = build(pack);
    cache = { pack, list, byId: new Map(list.map((f) => [f.id, f])) };
  }
  return cache;
}

export function getFeatures(): readonly Feature[] {
  return registry().list;
}

export function getFeature(id: string): Feature | undefined {
  return registry().byId.get(id);
}
