import type { PrefState } from './types.js';

/**
 * Preference persistence.
 *
 * localStorage on the *host site's own origin*, and nowhere else. Nothing here
 * is ever transmitted — see PLAN.md §4: a visitor's preference for "dyslexia
 * font" or "high contrast" is arguably an inference about disability, i.e.
 * special-category data, so it must never reach a server we operate. We operate
 * no server at all (D2), and this file is the reason that stays true.
 */
const KEY = 'shakuf:prefs:v1';

/** localStorage throws in some privacy modes and when the site blocks storage. */
function safeStorage(): Storage | null {
  try {
    const s = window.localStorage;
    const probe = '__a11y_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

/**
 * Whitelists arbitrary input down to a usable `PrefState`.
 *
 * Shared by `loadPrefs` and the host-facing import path, and that sharing is the
 * point: preferences now arrive from two directions — localStorage, which may be
 * hand-edited or corrupted, and a host page importing a visitor's settings from
 * its own store during a migration. Neither is trusted input, and an import path
 * that skipped this check would be a way around it.
 *
 * The widget still clamps per feature when applying, because this cannot know a
 * given feature's `max`. This is the outer bound: integers only, 0..10.
 */
export function sanitizePrefs(input: unknown): PrefState {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const out: PrefState = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 10) {
      out[k] = v;
    }
  }
  return out;
}

export function loadPrefs(): PrefState {
  const store = safeStorage();
  if (!store) return {};
  try {
    const raw = store.getItem(KEY);
    if (!raw) return {};
    return sanitizePrefs(JSON.parse(raw));
  } catch {
    return {};
  }
}

export function savePrefs(state: PrefState): void {
  const store = safeStorage();
  if (!store) return;
  try {
    // Drop zeros: absent means "off", so this keeps the stored blob small and
    // makes a cleared state genuinely empty rather than a map of zeroes.
    const compact: PrefState = {};
    for (const [k, v] of Object.entries(state)) {
      if (v > 0) compact[k] = v;
    }
    if (Object.keys(compact).length === 0) store.removeItem(KEY);
    else store.setItem(KEY, JSON.stringify(compact));
  } catch {
    /* storage full or blocked — preferences simply won't persist */
  }
}

export function clearPrefs(): void {
  const store = safeStorage();
  try {
    store?.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
