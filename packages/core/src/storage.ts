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
const KEY = 'a11y-il:prefs:v1';

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

export function loadPrefs(): PrefState {
  const store = safeStorage();
  if (!store) return {};
  try {
    const raw = store.getItem(KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    // Whitelist to numbers. A hand-edited or corrupted value must not be able
    // to put the widget into a state the UI cannot render or reset.
    const out: PrefState = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 10) {
        out[k] = v;
      }
    }
    return out;
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
