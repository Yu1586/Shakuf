/**
 * Contrast maths, so the launcher's label is legible against whatever accent
 * the site owner configured.
 *
 * The alternative — hardcoding white text and hoping — fails the moment someone
 * sets a pale accent, and shipping an accessibility widget whose own button is
 * unreadable is not a defensible outcome (PLAN.md §4).
 */

function parseHex(hex: string): [number, number, number] | null {
  const value = hex.replace('#', '');
  const full =
    value.length === 3
      ? value.split('').map((c) => c + c).join('')
      : value;
  if (full.length !== 6) return null;

  const num = Number.parseInt(full, 16);
  if (Number.isNaN(num)) return null;
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/** WCAG relative luminance. */
function luminance([r, g, b]: [number, number, number]): number {
  const channel = (raw: number): number => {
    const c = raw / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const rgbA = parseHex(a);
  const rgbB = parseHex(b);
  if (!rgbA || !rgbB) return 1;
  const lumA = luminance(rgbA);
  const lumB = luminance(rgbB);
  const [light, dark] = lumA > lumB ? [lumA, lumB] : [lumB, lumA];
  return (light + 0.05) / (dark + 0.05);
}

/** Picks black or white for text on `background`, whichever contrasts better. */
export function foregroundFor(background: string): string {
  const white = '#ffffff';
  const black = '#111111';
  return contrastRatio(background, white) >= contrastRatio(background, black)
    ? white
    : black;
}
