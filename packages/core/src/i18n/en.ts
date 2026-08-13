import type { Strings } from './index.js';

/**
 * English strings.
 *
 * NOT a free translation. Two categories here are load-bearing and were written
 * against the constraints, not against the Hebrew:
 *
 * 1. `disclaimer*` — carries the same two claims as the Hebrew, and is subject
 *    to the same ban on conformance language (PLAN.md §2.1). It must never say
 *    the tool makes a site accessible, compliant, or protected from claims. The
 *    standard is named in English as "SI 5568", the official designation of
 *    ת״י 5568.
 * 2. `infoMissing` — states an Israeli legal requirement to an English reader
 *    who may not know it applies to them. It describes the site owner's duty,
 *    never ours, and never implies this widget discharges it.
 *
 * One deliberate divergence from a literal reading: the Hebrew `textAlign` says
 * "align text right", which is correct in Hebrew because start-alignment *is*
 * right. The feature actually sets `text-align: start`, so a literal English
 * "align right" would describe the opposite of what an English reader gets.
 * Named for the effect that matters instead — removing justification.
 */
export const EN: Strings = {
  // ---- Launcher & panel chrome ----------------------------------------
  launcherLabel: 'Open accessibility menu',
  launcherLabelClose: 'Close accessibility menu',
  panelTitle: 'Accessibility menu',
  close: 'Close',
  reset: 'Reset all settings',
  resetDone: 'All settings reset',
  on: 'On',
  off: 'Off',
  decrease: 'Decrease',
  increase: 'Increase',

  // ---- Group headings --------------------------------------------------
  groupText: 'Text',
  groupColor: 'Colour and contrast',
  groupMotion: 'Motion and focus',
  groupNav: 'Navigation',
  groupInfo: 'Site accessibility',

  // ---- Text ------------------------------------------------------------
  textSize: 'Text size',
  textSizeDesc: 'Enlarges the text without changing the page layout',
  lineHeight: 'Line spacing',
  letterSpacing: 'Letter spacing',
  wordSpacing: 'Word spacing',
  readableFont: 'Readable font',
  readableFontDesc: 'Replaces the site font with a clear, legible one',
  textAlign: 'Remove justified text',
  textAlignDesc: 'Cancels justified alignment, which can make reading harder',

  // ---- Colour ----------------------------------------------------------
  contrast: 'Contrast',
  contrastHigh: 'High contrast',
  contrastInvert: 'Inverted colours',
  contrastMono: 'Greyscale',
  saturation: 'Colour saturation',
  saturationLow: 'Reduced saturation',
  saturationHigh: 'Increased saturation',
  highlightLinks: 'Highlight links',
  highlightLinksDesc: 'Underlines and outlines every link',
  hideImages: 'Hide images',

  // ---- Motion & focus --------------------------------------------------
  stopMotion: 'Stop animations',
  stopMotionDesc: 'Stops movement, flashing and autoplay',
  focusOutline: 'Highlight keyboard focus',
  focusOutlineDesc: 'A prominent outline around the focused element',
  bigCursor: 'Large mouse cursor',
  readingGuide: 'Reading ruler',
  readingGuideDesc: 'A horizontal bar that follows the pointer to help track the line',

  // ---- Navigation ------------------------------------------------------
  navHeadings: 'Headings list',
  navLandmarks: 'Landmarks list',
  navLinks: 'Links list',
  navEmpty: 'No items found on this page',
  navOpen: 'Show',
  navHint: 'Choosing an item jumps to it on the page',
  navCountHeadings: (n: number) => `${n} headings on this page`,
  navCountLandmarks: (n: number) => `${n} landmarks on this page`,
  navCountLinks: (n: number) => `${n} links on this page`,
  navJumped: (name: string) => `Jumped to ${name}`,
  landmarkNames: {
    banner: 'Header',
    navigation: 'Navigation',
    main: 'Main content',
    complementary: 'Complementary content',
    contentinfo: 'Footer',
    search: 'Search',
    form: 'Form',
    region: 'Region',
  },

  // ---- Site accessibility info (Israeli requirements) ------------------
  statementLink: "This site's accessibility statement",
  coordinator: 'Accessibility coordinator',
  coordinatorPhone: 'Phone',
  coordinatorEmail: 'Email',
  infoMissing:
    'The site owner has not provided accessibility statement or coordinator details. Israeli law requires publishing an accessibility statement and appointing an accessibility coordinator.',

  // ---- Disclaimer — mandatory, not configurable ------------------------
  disclaimerShort: 'This tool adjusts display only',
  disclaimerLong:
    'and does not ensure conformance with SI 5568 or substitute for making this site accessible.',

  // ---- Attribution -----------------------------------------------------
  byPrefix: '',
  byMiddle: 'built as a volunteer project by',
  newTab: 'opens in a new tab',

  // ---- Announcements ---------------------------------------------------
  featureFailed: (label: string) => `${label} — could not be applied`,
  announceOn: (label: string) => `${label} — on`,
  announceOff: (label: string) => `${label} — off`,
  announceLevel: (label: string, level: string) => `${label} — ${level}`,
  levelOff: 'Normal',
  levelNames: ['Normal', 'Enlarged', 'Large', 'Very large', 'Largest'],
  spacingNames: ['Normal', 'Increased', 'Wide'],
};
