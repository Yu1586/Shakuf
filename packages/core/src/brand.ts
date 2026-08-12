/**
 * Attribution.
 *
 * PLAN.md §3.5(2): because the widget exists to generate work for a business
 * the author owns, the connection must be disclosed prominently — an
 * apparently-neutral free tool that funnels to its author's paid services,
 * undisclosed, is the second count the FTC brought against accessiBe.
 *
 * The site owner may override the display name via `data-by-name`, but they
 * cannot remove the attribution row, and they cannot touch the disclaimer.
 */
export const BRAND = {
  /**
   * Product name. Settled — see the "לבחור שם" card.
   *
   * Note this is the *project* name, not a legal entity. `[LEGAL ENTITY NAME]`
   * in NOTICE stays a placeholder until a company actually exists, because that
   * one identifies a legal person and naming a company that isn't registered is
   * worse than leaving the gap visible.
   */
  name: 'שקוף',
  /** The product's own site — what "תוסף שקוף" links to. */
  url: 'https://shakuf.yuvalrahamim.com',
  /** The human who built it. */
  authorName: 'יובל רחמים',
  /**
   * The author's own site.
   *
   * This is the half that makes the attribution a real disclosure rather than a
   * decorative one: it lands somewhere plainly identifiable as a person, not a
   * faceless project page. That page has to carry the connection and the §2.1
   * claims discipline in its own copy — a link only works as disclosure if what
   * it points at is honest too.
   */
  authorUrl: 'https://yuvalrahamim.com/',
} as const;
