/**
 * Attribution.
 *
 * PLAN.md §3.5(2): because the widget exists to generate work for a business
 * the author owns, the connection must be disclosed prominently — an
 * apparently-neutral free tool that funnels to its author's paid services,
 * undisclosed, is the second count the FTC brought against accessiBe.
 *
 * These are deliberately left as visible `[BRACKETED]` placeholders (PLAN.md
 * §3 / Part V drafting rule). Shipping with them unfilled is obvious in the UI,
 * which is the point: a silently-wrong default would be worse than an obvious
 * gap. Fill them in before the first public build.
 *
 * The site owner may override the display name via `data-by-name`, but they
 * cannot remove the attribution row, and they cannot touch the disclaimer.
 */
export const BRAND = {
  /** TODO(before publish): the legal entity name decided in PLAN.md §3.1. */
  name: '[שם העסק]',
  /** TODO(before publish): the business site. */
  url: 'https://[DOMAIN]',
} as const;
