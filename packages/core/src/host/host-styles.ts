/**
 * The single stylesheet we inject into the host page.
 *
 * Every rule is gated on a `data-shakuf-*` attribute on `<html>`, so a feature is
 * one attribute write and its removal is one attribute removal. Nothing here
 * mutates host markup, ARIA, roles or semantics — presentation only (PLAN.md §4).
 *
 * On filters (contrast/saturation): these are applied to `<html>` and therefore
 * also affect our own widget. That is deliberate. Placing our root outside
 * `<body>` to escape the filter is fragile, and being affected is consistent —
 * the visitor asked for inverted or greyscale colours site-wide. These filters
 * map luminance monotonically, so our launcher's contrast ratio survives.
 *
 * `!important` is used throughout because we are overriding site authors who
 * frequently use it themselves. That is the whole job of this file.
 */

const SELF = '#shakuf-root';

/** Elements whose spacing must not be touched — icon fonts and vector art break. */
const NO_SPACING = `svg, svg *, i, [class*="icon"], [class*="Icon"], [class*="fa-"], .material-icons`;

/**
 * NOTE ON COMMENT LENGTH IN THIS FILE
 *
 * The comments below sit inside a template literal, so they are string content:
 * `minify: true` strips every JS comment in the bundle but cannot touch these,
 * and they ship to every visitor of every site running the widget. Keep the
 * rationale here short and put the long version in the commit message. Roughly
 * 5 KB of this file is comment text, which is why a build-time strip is worth
 * doing before the bundle needs the headroom.
 */
export const HOST_STYLES = /* css */ `
/* ---- Text spacing (WCAG 1.4.12 values) ------------------------------- */
html[data-shakuf-line="1"] body *:not(${NO_SPACING}):not(${SELF}) { line-height: 1.6 !important; }
html[data-shakuf-line="2"] body *:not(${NO_SPACING}):not(${SELF}) { line-height: 2 !important; }

html[data-shakuf-letter="1"] body *:not(${NO_SPACING}):not(${SELF}) { letter-spacing: 0.12em !important; }
html[data-shakuf-letter="2"] body *:not(${NO_SPACING}):not(${SELF}) { letter-spacing: 0.2em !important; }

html[data-shakuf-word="1"] body *:not(${NO_SPACING}):not(${SELF}) { word-spacing: 0.16em !important; }
html[data-shakuf-word="2"] body *:not(${NO_SPACING}):not(${SELF}) { word-spacing: 0.3em !important; }

/* ---- Readable font ---------------------------------------------------
   Arial and Tahoma both render Hebrew clearly at small sizes and are present
   on effectively every device, so this needs no webfont and no network request. */
html[data-shakuf-font="readable"] body *:not(${NO_SPACING}):not(${SELF}) {
  font-family: Arial, "Segoe UI", Tahoma, sans-serif !important;
}

/* ---- Right-aligned text ----------------------------------------------
   Justified text creates uneven "rivers" of whitespace that are a known
   reading barrier. This restores natural start-alignment (right, in Hebrew). */
html[data-shakuf-align="start"] body *:not(${SELF}) {
  text-align: start !important;
  text-justify: none !important;
}

/* ---- Colour filters ---------------------------------------------------
   Deliberately plain invert(1), with no hue-rotate.
   The "smart invert" trick (invert + hue-rotate(180deg), applied twice so media
   comes back) does not survive contact with the pipeline: CSS filters clamp to
   [0,1] after every step, and the hue-rotate matrix has negative coefficients,
   so saturated colours get clipped and cannot be recovered. Measured on the
   real matrix: pure red 255,0,0 came back as 171,62,62 and blue 0,0,255 as
   31,31,68 — near black. Only desaturated tones survived.
   invert(1) alone never leaves [0,1], so double-inversion restores media
   exactly, for every colour. Blues becoming orange is the honest cost, and it
   is what "צבעים הפוכים" says on the control. */
/* Contrast and saturation are composed into ONE declaration through custom
   properties. They used to be four separate "filter" rules on <html> at
   identical specificity (0-1-1), so source order decided and the saturation
   rules — declared last — silently replaced the contrast ones: "צבעים הפוכים"
   plus "רוויה מופחתת" computed to saturate(0.5) alone, leaving the panel
   reporting inversion as active while the page was not inverted at all. */
html[data-shakuf-contrast="invert"]    { --shakuf-invert: invert(1); }
html[data-shakuf-contrast="mono"]      { --shakuf-invert: grayscale(1); }
html[data-shakuf-saturation="low"]     { --shakuf-sat: saturate(0.5); }
html[data-shakuf-saturation="high"]    { --shakuf-sat: saturate(1.6); }

/* The fallbacks must be identity FUNCTIONS, never none: none is legal as the
   whole filter value but not as an item in a filter list, so a one-sided
   combination built "filter: invert(1) none", which is invalid at
   computed-value time and drops to none. That killed every one of these
   features when used alone while the panel still reported it active. */
html[data-shakuf-contrast="invert"],
html[data-shakuf-contrast="mono"],
html[data-shakuf-saturation="low"],
html[data-shakuf-saturation="high"] {
  filter: var(--shakuf-invert, invert(0)) var(--shakuf-sat, saturate(1)) !important;
}

/* Cancels the ancestor inversion so photos stay recognisable.
   Scoped to the image itself, never to <picture>. Filters compose down the
   tree, so matching both the wrapper and its child applied the cancellation
   twice and left images inside <picture> rendering as negatives — while a bare
   <img> came out correct. <picture> is the standard responsive-image wrapper,
   so that hit a large share of real sites. */
html[data-shakuf-contrast="invert"] img,
html[data-shakuf-contrast="invert"] video {
  filter: invert(1) !important;
}

/* ---- High contrast ----------------------------------------------------
   Not a filter: an explicit palette. Backgrounds are forced dark and text
   forced light, which is the combination most requested by low-vision users.

   The type exclusions sit inside :where() so they carry no specificity. As
   plain :not(svg):not(svg *) this rule computed to (1,1,4) against the link
   rule's (1,1,3), so it won and links rendered #fff — indistinguishable from
   body text, in the one mode built for low-vision users.
   :not(${SELF}) stays OUTSIDE the :where() on purpose: its ID weight is what
   keeps these rules ahead of hosts with their own ID-scoped !important rules.
   Only the type weight needed to go. */
html[data-shakuf-contrast="high"] body,
html[data-shakuf-contrast="high"] body *:not(${SELF}):not(:where(svg, svg *)) {
  background-color: #000 !important;
  background-image: none !important;
  color: #fff !important;
  border-color: #fff !important;
  text-shadow: none !important;
  box-shadow: none !important;
}
html[data-shakuf-contrast="high"] body a:not(${SELF}) { color: #ffe600 !important; }
html[data-shakuf-contrast="high"] body a:not(${SELF}):visited { color: #ffb3ff !important; }
html[data-shakuf-contrast="high"] body button:not(${SELF}),
html[data-shakuf-contrast="high"] body input:not(${SELF}),
html[data-shakuf-contrast="high"] body select:not(${SELF}),
html[data-shakuf-contrast="high"] body textarea:not(${SELF}) {
  background-color: #000 !important;
  color: #fff !important;
  border: 2px solid #fff !important;
}

/* ---- Highlight links -------------------------------------------------- */
html[data-shakuf-links="1"] body a:not(${SELF}) {
  text-decoration: underline !important;
  text-underline-offset: 2px !important;
  outline: 2px solid currentColor !important;
  outline-offset: 2px !important;
}

/* ---- Hide images ------------------------------------------------------
   Uses visibility rather than display, so the page does not reflow and the
   visitor does not lose their reading position. */
html[data-shakuf-images="hidden"] body img:not(${SELF}),
html[data-shakuf-images="hidden"] body picture:not(${SELF}),
html[data-shakuf-images="hidden"] body video:not(${SELF}) {
  visibility: hidden !important;
}
html[data-shakuf-images="hidden"] body *:not(${SELF}) {
  background-image: none !important;
}

/* ---- Stop motion ------------------------------------------------------ */
html[data-shakuf-motion="off"] body *:not(${SELF}),
html[data-shakuf-motion="off"] body *:not(${SELF})::before,
html[data-shakuf-motion="off"] body *:not(${SELF})::after {
  animation-play-state: paused !important;
  animation: none !important;
  transition: none !important;
  scroll-behavior: auto !important;
}

/* ---- Strong focus indicator ------------------------------------------
   Restores a visible focus ring on sites that have removed it — one of the
   single most common WCAG 2.4.7 failures. */
html[data-shakuf-focus="strong"] body *:not(${SELF}):focus,
html[data-shakuf-focus="strong"] body *:not(${SELF}):focus-visible {
  outline: 4px solid #ff8c00 !important;
  outline-offset: 3px !important;
  box-shadow: 0 0 0 8px rgba(0, 0, 0, 0.65) !important;
}

/* ---- Large cursor -----------------------------------------------------
   Inline SVG data URI: no network request, and it scales cleanly. */
html[data-shakuf-cursor="big"] body *:not(${SELF}) {
  cursor: url('data:image/svg+xml;utf8,\
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 32 32">\
<path d="M6 2l0 22 5.5-5.5 3.5 8 4-1.8-3.4-7.8 7.4 0z" fill="%23000" stroke="%23fff" stroke-width="1.5"/>\
</svg>') 6 2, auto !important;
}
html[data-shakuf-cursor="big"] body a:not(${SELF}),
html[data-shakuf-cursor="big"] body button:not(${SELF}),
html[data-shakuf-cursor="big"] body [role="button"]:not(${SELF}) {
  cursor: url('data:image/svg+xml;utf8,\
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 32 32">\
<path d="M12 2c-1.1 0-2 .9-2 2v12l-3-3c-1-1-2.5-1-3.5 0s-1 2.5 0 3.5l8 9h12l2-12c.2-1.2-.6-2.3-1.8-2.5s-2.3.6-2.5 1.8V4c0-1.1-.9-2-2-2s-2 .9-2 2v-.5c0-1.1-.9-2-2-2s-2 .9-2 2V4c0-1.1-.9-2-2-2z" fill="%23000" stroke="%23fff" stroke-width="1.5"/>\
</svg>') 12 2, pointer !important;
}
`;

const STYLE_ID = 'shakuf-host-styles';

/** Injects the stylesheet once. Idempotent. */
export function ensureHostStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = HOST_STYLES;
  document.head.appendChild(style);
}

/** Sets or removes `data-shakuf-<name>` on `<html>`. */
export function setHostAttr(name: string, value: string | null): void {
  const root = document.documentElement;
  if (value === null) root.removeAttribute(`data-shakuf-${name}`);
  else root.setAttribute(`data-shakuf-${name}`, value);
}

/** Removes every attribute we own. Used by "reset all". */
export function clearHostAttrs(): void {
  const root = document.documentElement;
  for (const attr of Array.from(root.attributes)) {
    if (attr.name.startsWith('data-shakuf-')) root.removeAttribute(attr.name);
  }
}
