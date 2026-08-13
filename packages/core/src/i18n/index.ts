import { EN } from './en.js';
import { HE } from './he.js';

export type Lang = 'he' | 'en';

/**
 * The shape both packs implement.
 *
 * Derived from the Hebrew pack rather than hand-declared, so adding a string
 * there is a compile error in every other pack until it is translated. The
 * widening is the point: `he.ts` is `as const`, which types its arrays as
 * literal tuples (`readonly ['רגיל', ...]`), and no other language could ever
 * satisfy that. This keeps the *keys* strict and relaxes the *values*.
 */
type Widen<T> = {
  -readonly [K in keyof T]: T[K] extends readonly string[]
    ? readonly string[]
    : T[K] extends string
      ? string
      : T[K];
};

export type Strings = Widen<typeof HE>;

const PACKS: Record<Lang, Strings> = { he: HE, en: EN };

/** Hebrew stays the default: existing installs must not change behaviour. */
const FALLBACK: Lang = 'he';

let current: Lang = FALLBACK;

/** The active string pack. Call at render time, never cache across a change. */
export function t(): Strings {
  return PACKS[current];
}

export function currentLang(): Lang {
  return current;
}

export function dirFor(lang: Lang): 'rtl' | 'ltr' {
  return lang === 'he' ? 'rtl' : 'ltr';
}

/**
 * Normalises anything a `lang` attribute might hold to a pack we have.
 *
 * BCP 47 tags carry subtags — `en-US`, `he-IL`, `en-GB-oxendict` — so an exact
 * match would miss almost every real-world value. Returns null rather than the
 * fallback so callers can tell "absent or unknown" from "explicitly Hebrew",
 * which is what lets `data-lang` override a host `<html lang>` cleanly.
 */
export function parseLang(raw: string | null | undefined): Lang | null {
  if (!raw) return null;
  const base = raw.trim().toLowerCase().split('-')[0];
  return base === 'he' || base === 'en' ? base : null;
}

/**
 * Resolves the language: explicit config wins, then the host document, then
 * Hebrew.
 *
 * `navigator.language` is deliberately not consulted. The widget's language
 * should match the page it is sitting on — a Hebrew site read by someone whose
 * browser is set to English is still a Hebrew page, and an English panel
 * floating over Hebrew content helps nobody.
 */
export function resolveLang(configured: string | null): Lang {
  return (
    parseLang(configured) ?? parseLang(document.documentElement.lang) ?? FALLBACK
  );
}

/** Returns true when the language actually changed. */
export function setLang(lang: Lang): boolean {
  if (current === lang) return false;
  current = lang;
  return true;
}
