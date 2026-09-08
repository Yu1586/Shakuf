/**
 * Turning a coordinator's phone number, as a human typed it into a CMS field,
 * into something a `tel:` link can dial from anywhere.
 *
 * The panel used to emit the attribute verbatim, so `data-coordinator-phone`
 * of "055-3000-898" produced `tel:055-3000-898`. That dials correctly inside
 * Israel and fails from abroad — which matters here more than it looks, because
 * the number in that panel is often the only accessibility contact a visitor is
 * given, and "call the accessibility coordinator" is a right under Israeli law
 * rather than a convenience.
 *
 * The bug worth naming, because it is the tempting implementation: strip
 * everything that is not a digit and glue 972 onto the front. A number already
 * written in international form then comes out as +972972…, which is not
 * dialable, and which WhatsApp rejects outright.
 */

/**
 * A number's national significant digits: 8 for a landline (2/3/4/8/9 areas),
 * 9 for mobile and the 07x ranges. Service numbers (1-800, 1-700, *6050) are
 * deliberately excluded — they carry no country code and genuinely cannot be
 * dialled from abroad, so there is nothing honest to put in an href for them.
 */
const NATIONAL = /^[2-9]\d{7,8}$/;

/** E.164 caps the whole number at 15 digits, country code included. */
const E164_ANY = /^[1-9]\d{7,14}$/;

/**
 * Characters that may legitimately appear in a typed phone number. Anything
 * else means the field holds prose, and prose must not be silently turned into
 * a number.
 *
 * This check has to come BEFORE separators are stripped, not after. Otherwise
 * "03-0000000 שלוחה 2" reduces to 0300000002, which survives a length check as
 * a plausible nine-digit mobile and produces a confidently wrong, dialable
 * number — the extension digit swallowed into the subscriber number.
 */
const PHONE_CHARS = /^[+0-9\s().\u200e\u200f\u2010-\u2015-]+$/;

/**
 * Normalises to E.164, or returns '' if the value is not a dialable number.
 *
 * '' is a deliberate signal rather than a failure: the caller keeps showing the
 * number as text and simply drops the link. An Israeli site whose coordinator
 * line is *6050 or 1-800-… must not lose its contact number from the panel just
 * because that number has no international form.
 */
export function telHref(raw: string | null | undefined): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (!PHONE_CHARS.test(trimmed)) return '';

  let d = trimmed.replace(/[^+\d]/g, '');

  // A plus is only meaningful at the front. "05+3" is not a phone number, and
  // silently dropping the plus would invent one.
  let international = false;
  if (d.startsWith('+')) {
    international = true;
    d = d.slice(1);
  } else if (d.startsWith('00')) {
    // The international access code as dialled from Israel and most of the world.
    international = true;
    d = d.slice(2);
  }
  if (d.includes('+')) return '';

  if (d.startsWith('972') && isPlausibleNational(d.slice(3))) {
    // Already carries the country code, in any of the three ways it gets
    // written: +972…, 00972… or a bare 972…. Strip it rather than add a second.
    d = d.slice(3);
  } else if (international) {
    // International, and not Israeli. It is already dialable exactly as given,
    // and rewriting it as Israeli is how the +972972… bug happens.
    return E164_ANY.test(d) ? `+${d}` : '';
  }

  // A single national trunk zero. Also catches "+972 0 55…", where an editor
  // has written both the country code and the trunk zero.
  if (d.startsWith('0')) d = d.slice(1);

  return NATIONAL.test(d) ? `+972${d}` : '';
}

/**
 * Guards the country-code strip, so a bare local number that merely starts with
 * the digits 972 — 09-72xxxxx, written without its trunk zero — is not mistaken
 * for an international one and mutilated.
 */
function isPlausibleNational(rest: string): boolean {
  return NATIONAL.test(rest) || (rest.startsWith('0') && NATIONAL.test(rest.slice(1)));
}
