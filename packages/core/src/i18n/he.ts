/**
 * Hebrew strings. This is the only language (PLAN.md D4) — there is no locale
 * switch, no fallback chain, and no English in the UI.
 *
 * The `disclaimer*` keys are load-bearing and are rendered unconditionally by
 * the panel. They are not configurable and must not be made configurable:
 * see PLAN.md §2.4, where the UI-rendered disclaimer is the only control that
 * reaches ordinary installers.
 */
export const HE = {
  // ---- Launcher & panel chrome ----------------------------------------
  launcherLabel: 'פתיחת תפריט נגישות',
  launcherLabelClose: 'סגירת תפריט נגישות',
  panelTitle: 'תפריט נגישות',
  close: 'סגירה',
  reset: 'איפוס כל ההגדרות',
  resetDone: 'כל ההגדרות אופסו',
  on: 'פועל',
  off: 'כבוי',
  decrease: 'הקטנה',
  increase: 'הגדלה',

  // ---- Group headings --------------------------------------------------
  groupText: 'טקסט',
  groupColor: 'צבע וניגודיות',
  groupMotion: 'תנועה ומיקוד',
  groupNav: 'ניווט',
  groupInfo: 'נגישות באתר',

  // ---- Text ------------------------------------------------------------
  textSize: 'גודל טקסט',
  textSizeDesc: 'הגדלת הטקסט באתר מבלי לשנות את מבנה העמוד',
  lineHeight: 'מרווח שורות',
  letterSpacing: 'מרווח אותיות',
  wordSpacing: 'מרווח מילים',
  readableFont: 'גופן קריא',
  readableFontDesc: 'החלפת הגופן באתר בגופן ברור וקריא',
  // Note: there is deliberately no "dyslexia font" toggle. The fonts marketed
  // for this (OpenDyslexic and similar) have no Hebrew glyph coverage, so on a
  // Hebrew site the control would change nothing while appearing to help.
  // Shipping it would be a capability claim the product does not deliver —
  // see PLAN.md §2.1. `readableFont` plus the spacing controls are the honest,
  // evidence-backed version of the same intent.
  textAlign: 'יישור טקסט לימין',
  textAlignDesc: 'ביטול יישור דו-צדדי, שעלול להקשות על הקריאה',

  // ---- Colour ----------------------------------------------------------
  contrast: 'ניגודיות',
  contrastHigh: 'ניגודיות גבוהה',
  contrastInvert: 'צבעים הפוכים',
  contrastMono: 'גווני אפור',
  saturation: 'רוויית צבע',
  saturationLow: 'רוויה מופחתת',
  saturationHigh: 'רוויה מוגברת',
  highlightLinks: 'הדגשת קישורים',
  highlightLinksDesc: 'סימון כל הקישורים בקו תחתון ובמסגרת',
  hideImages: 'הסתרת תמונות',

  // ---- Motion & focus --------------------------------------------------
  stopMotion: 'עצירת אנימציות',
  stopMotionDesc: 'עצירת תנועה, הבהובים וניגון אוטומטי',
  focusOutline: 'הדגשת מיקוד מקלדת',
  focusOutlineDesc: 'מסגרת בולטת סביב הרכיב שנמצא במיקוד',
  bigCursor: 'סמן עכבר גדול',
  readingGuide: 'סרגל קריאה',
  readingGuideDesc: 'פס אופקי שעוקב אחר העכבר ומסייע במעקב אחר השורה',

  // ---- Navigation ------------------------------------------------------
  navHeadings: 'רשימת כותרות',
  navLandmarks: 'רשימת אזורים',
  navLinks: 'רשימת קישורים',
  navEmpty: 'לא נמצאו פריטים בעמוד זה',
  navOpen: 'הצגה',
  navHint: 'בחירת פריט תדלג אליו בעמוד',
  navCountHeadings: (n: number) => `${n} כותרות בעמוד`,
  navCountLandmarks: (n: number) => `${n} אזורים בעמוד`,
  navCountLinks: (n: number) => `${n} קישורים בעמוד`,
  navJumped: (name: string) => `מעבר אל ${name}`,
  landmarkNames: {
    banner: 'כותרת עליונה',
    navigation: 'ניווט',
    main: 'תוכן ראשי',
    complementary: 'תוכן משלים',
    contentinfo: 'כותרת תחתונה',
    search: 'חיפוש',
    form: 'טופס',
    region: 'אזור',
  } as Record<string, string>,

  // ---- Site accessibility info (Israeli requirements) ------------------
  statementLink: 'הצהרת הנגישות של האתר',
  coordinator: 'רכז נגישות',
  coordinatorPhone: 'טלפון',
  coordinatorEmail: 'דוא״ל',
  infoMissing:
    'בעל האתר לא הגדיר פרטי הצהרת נגישות ורכז נגישות. לפי הדין הישראלי חלה חובה לפרסם הצהרת נגישות ולמנות רכז נגישות.',

  // ---- Disclaimer — mandatory, not configurable ------------------------
  // Tightened deliberately. The two load-bearing claims are kept verbatim —
  // no conformance guarantee, and not a substitute for accessing the site
  // itself. The former enumeration (statement, coordinator, surveyor) moved to
  // the website, where there is room for it: a disclaimer nobody finishes
  // reading protects nobody, and length was costing more than it bought.
  // One sentence, rendered as `<strong>{short}</strong> {long}` — the split is
  // only about where the emphasis falls, not two separate statements.
  disclaimerShort: 'כלי זה מתאים תצוגה בלבד',
  disclaimerLong:
    'ואינו מבטיח עמידה בת״י 5568 ואינו תחליף להנגשת האתר.',

  // ---- Attribution -----------------------------------------------------
  /** Sits before the product name, outside the link. */
  byPrefix: 'תוסף',
  /** The connective tissue between the two links. */
  byMiddle: 'נבנה בהתנדבות על ידי',
  newTab: 'נפתח בכרטיסייה חדשה',

  // ---- Announcements ---------------------------------------------------
  announceOn: (label: string) => `${label} — פועל`,
  announceOff: (label: string) => `${label} — כבוי`,
  announceLevel: (label: string, level: string) => `${label} — ${level}`,
  levelOff: 'רגיל',
  // Every level above 0 ENLARGES — 1.15×, 1.3×, 1.5×, 1.75×. Level 1 was
  // labelled "קטן", so pressing "+" from the default announced "גודל טקסט —
  // קטן" while the text visibly grew. For the one control a screen-reader user
  // cannot see, the announcement contradicting the effect is the whole failure.
  levelNames: ['רגיל', 'מוגדל', 'גדול', 'גדול מאוד', 'הגדול ביותר'] as const,
  spacingNames: ['רגיל', 'מוגדל', 'רחב'] as const,
} as const;

export type Strings = typeof HE;
