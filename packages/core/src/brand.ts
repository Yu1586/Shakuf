/**
 * Attribution.
 *
 * This used to carry a commercial-disclosure job: PLAN.md §3.5(2) required it
 * because the widget funnelled work to the author's paid services, and an
 * apparently-neutral free tool that hides that connection is the second count
 * the FTC brought against accessiBe. That model is gone — there are no paid
 * services — so the row is now plain authorship rather than a disclosure the
 * law compels.
 *
 * It stays non-removable anyway. The row is what makes the widget traceable to
 * a named human, and that is what keeps the disclaimer attached to someone
 * rather than floating free.
 *
 * The site owner may override the display name via `data-by-name`, but they
 * cannot remove the attribution row, and they cannot touch the disclaimer.
 */
export const BRAND = {
  /**
   * Product name. Settled — see the "לבחור שם" card.
   *
   * Note this is the *project* name, not a legal entity. There is no company,
   * so NOTICE and DISCLAIMER.md name Yuval Rahamim personally — accurate, and
   * consistent with what this file already renders into the panel. If a company
   * is ever formed, those two files and the copyright line are what change.
   */
  name: 'שקוף',
  /**
   * Latin-script forms, used when the panel renders in English.
   *
   * The same product and the same person, transliterated — not a translation.
   * Dropping Hebrew names into an English sentence reads as a rendering fault
   * to someone who cannot read the script, and a screen reader announcing
   * `lang="en"` text containing Hebrew characters produces noise.
   */
  nameLatin: 'Shakuf',
  /** The product's own site — what "תוסף שקוף" links to. */
  url: 'https://shakuf.yuvalrahamim.com',
  /** The human who built it. */
  authorName: 'יובל רחמים',
  /** See `nameLatin`. */
  authorNameLatin: 'Yuval Rahamim',
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
