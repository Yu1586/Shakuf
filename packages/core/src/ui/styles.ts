/**
 * Shadow-DOM styles for the widget itself.
 *
 * Two things this file has to get right:
 *
 * 1. **Reset inherited properties.** `font-family`, `line-height`,
 *    `letter-spacing`, `word-spacing`, `color` and `direction` all inherit
 *    through the shadow boundary, so our own host-page overrides would land on
 *    our panel too. Everything inheritable is set explicitly on `:host`.
 *
 * 2. **Meet the bar it exists to raise.** An inaccessible accessibility widget
 *    is indefensible (PLAN.md §4), so: 4.5:1 text contrast, 3:1 for UI borders,
 *    44px targets against the 24px minimum, a visible focus ring at 3:1, and
 *    `prefers-reduced-motion` honoured.
 */
export const PANEL_STYLES = /* css */ `
:host {
  /* --accent and --accent-fg are set at runtime from config. */
  --bg: #ffffff;
  --fg: #1a1a1a;          /* 16.1:1 on white */
  --fg-muted: #545454;    /* 7.4:1 on white */
  --border: #595959;      /* 7.0:1 — clears the 3:1 UI-component minimum */
  --border-soft: #c9c9c9;
  --surface: #f4f5f7;
  --focus: #0b5fff;       /* 5.1:1 on white */
  --radius: 10px;

  all: initial;
  font-family: Arial, "Segoe UI", Tahoma, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  letter-spacing: normal;
  word-spacing: normal;
  color: var(--fg);
  direction: rtl;
  text-align: right;
  position: fixed;
  z-index: 2147483000;
}

*, *::before, *::after { box-sizing: border-box; }

button {
  font: inherit;
  color: inherit;
  direction: rtl;
  cursor: pointer;
  background: none;
  border: none;
  margin: 0;
}

:focus-visible {
  outline: 3px solid var(--focus);
  outline-offset: 2px;
  border-radius: 4px;
}

/* ---- Launcher ---------------------------------------------------------- */
.launcher {
  position: fixed;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--accent);
  color: var(--accent-fg);
  display: grid;
  place-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
  transition: transform 0.15s ease;
}
.launcher:hover { transform: scale(1.06); }
.launcher:focus-visible { outline-offset: 4px; }
.launcher svg { width: 32px; height: 32px; display: block; }

/* ---- Panel ------------------------------------------------------------- */
.panel {
  position: fixed;
  width: min(370px, calc(100vw - 24px));
  max-height: min(82vh, 720px);
  display: flex;
  flex-direction: column;
  background: var(--bg);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.28);
  overflow: hidden;
}
.panel:focus { outline: none; }
.panel:focus-visible { outline: 3px solid var(--focus); outline-offset: -3px; }

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 16px;
  background: var(--accent);
  color: var(--accent-fg);
  flex: none;
}
.title { font-size: 18px; font-weight: 700; margin: 0; }
.close {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  color: inherit;
}
.close:hover { background: rgba(0, 0, 0, 0.16); }
.close svg { width: 22px; height: 22px; }

.body { overflow-y: auto; overscroll-behavior: contain; padding: 4px 0 8px; }

.group { border-bottom: 1px solid var(--border-soft); padding: 10px 16px 14px; }
.group:last-of-type { border-bottom: none; }
.group-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--fg-muted);
  margin: 4px 0 10px;
  letter-spacing: 0.04em;
}

/* ---- Toggle rows ------------------------------------------------------- */
.toggle {
  width: 100%;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border: 2px solid var(--border-soft);
  border-radius: 8px;
  background: var(--bg);
  text-align: start;
  margin-bottom: 8px;
}
.toggle:hover { background: var(--surface); }
.toggle[aria-pressed="true"] {
  border-color: var(--accent);
  background: var(--surface);
}
.toggle-label { font-size: 15px; }
.toggle-desc { display: block; font-size: 12.5px; color: var(--fg-muted); margin-top: 2px; }

.switch {
  flex: none;
  width: 44px;
  height: 26px;
  border-radius: 13px;
  background: #6b6b6b;
  border: 2px solid transparent;
  position: relative;
  transition: background 0.15s ease;
}
.toggle[aria-pressed="true"] .switch { background: var(--accent); }
.switch::after {
  content: "";
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.15s ease;
}
.toggle[aria-pressed="true"] .switch::after { transform: translateX(-18px); }

/* ---- Steppers ---------------------------------------------------------- */
.stepper { margin-bottom: 12px; }
.stepper-label { font-size: 15px; display: block; margin-bottom: 2px; }
.stepper-desc { font-size: 12.5px; color: var(--fg-muted); display: block; margin-bottom: 6px; }
.stepper-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 2px solid var(--border-soft);
  border-radius: 8px;
  padding: 4px;
}
.step-btn {
  width: 44px;
  height: 44px;
  flex: none;
  border-radius: 6px;
  display: grid;
  place-items: center;
  font-size: 22px;
  font-weight: 700;
  background: var(--surface);
  border: 2px solid var(--border);
}
.step-btn:hover:not(:disabled) { background: var(--accent); color: var(--accent-fg); border-color: var(--accent); }
.step-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.step-value { flex: 1; text-align: center; font-size: 14px; font-weight: 700; }
.step-dots { display: flex; gap: 3px; justify-content: center; margin-top: 4px; }
.step-dot { width: 22px; height: 4px; border-radius: 2px; background: var(--border-soft); }
.step-dot.on { background: var(--accent); }

/* ---- Navigation aids --------------------------------------------------- */
.nav-btn {
  width: 100%;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border: 2px solid var(--border-soft);
  border-radius: 8px;
  margin-bottom: 8px;
  font-size: 15px;
}
.nav-btn:hover { background: var(--surface); }
.nav-count { font-size: 12.5px; color: var(--fg-muted); }
.nav-list { list-style: none; margin: 0 0 10px; padding: 0; max-height: 240px; overflow-y: auto; }
.nav-list li { margin: 0; }
.nav-item {
  width: 100%;
  min-height: 40px;
  text-align: start;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 14px;
  border: 1px solid transparent;
}
.nav-item:hover { background: var(--surface); border-color: var(--border-soft); }
.nav-hint { font-size: 12.5px; color: var(--fg-muted); margin: 0 0 6px; }
.nav-empty { font-size: 13px; color: var(--fg-muted); padding: 6px 10px; }

/* ---- Site accessibility info ------------------------------------------- */
.info-row { font-size: 14px; margin-bottom: 6px; }
.info-row a { color: #0a48c2; } /* 6.6:1 on white */
.info-label { color: var(--fg-muted); }
.info-missing {
  font-size: 13px;
  line-height: 1.55;
  color: var(--fg-muted);
  background: var(--surface);
  border-inline-start: 4px solid var(--border);
  padding: 10px 12px;
  border-radius: 6px;
}

/* ---- Footer ------------------------------------------------------------ */
.footer { flex: none; border-top: 1px solid var(--border-soft); padding: 12px 16px; background: var(--surface); }
.reset {
  width: 100%;
  min-height: 44px;
  border: 2px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 10px;
}
.reset:hover { background: var(--accent); color: var(--accent-fg); border-color: var(--accent); }

/*
 * The disclaimer. Rendered unconditionally, styled to be legible rather than
 * hidden, and deliberately not configurable — PLAN.md §2.4 layer 1. If you are
 * about to add an option that removes or shortens this, read that section first.
 */
.disclaimer { font-size: 12px; line-height: 1.6; color: var(--fg-muted); margin: 0; }
.disclaimer strong { color: var(--fg); }
.by { font-size: 11.5px; color: var(--fg-muted); margin: 8px 0 0; }
.by a { color: #0a48c2; }

/* ---- Reading guide ----------------------------------------------------- */
.a11y-reading-guide {
  position: fixed;
  inset-inline: 0;
  top: 0;
  height: 40px;
  margin-top: -20px;
  background: rgba(255, 214, 0, 0.28);
  border-top: 2px solid rgba(0, 0, 0, 0.55);
  border-bottom: 2px solid rgba(0, 0, 0, 0.55);
  pointer-events: none;
  z-index: 2147483001;
  will-change: transform;
}

@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; animation: none !important; }
}
`;
