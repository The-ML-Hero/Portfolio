/**
 * How the page's scroll range is divided.
 *
 * Scroll position is the single source of truth for the whole opening — the title card's
 * reveal and the camera's traverse are two consecutive stretches of the same gesture, not an
 * animation followed by an interaction. Both read from here so the handover is seamless and
 * neither can drift from the other.
 *
 *   0 ............ TITLE_SPAN ............ ARRIVE_AT ............ 1
 *   |  title opens  |    camera travels     |  arrived, dead zone  |
 */

/** Fraction of the scroll spent growing the title's letterforms. The camera holds still. */
export const TITLE_SPAN = 0.12;

/**
 * Fraction at which the camera has fully arrived and the desktop goes live. Everything past
 * it still maps to progress 1, so a stray wheel tick while you are using the desktop does not
 * nudge the camera off the desk.
 */
export const ARRIVE_AT = 0.88;

/** Where Esc drops you back to — just off the desk, not all the way to the ceiling. */
export const EXIT_TO = 0.62;

/** Current scroll position as 0..1 of the scrollable range. */
export function scrollFraction(): number {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (max <= 0) return 0;
  return Math.min(1, Math.max(0, window.scrollY / max));
}

/** 0..1 across the title zone. */
export const titleProgress = (raw: number) => Math.min(1, Math.max(0, raw / TITLE_SPAN));

/** 0..1 across the camera's stretch, starting only once the title has fully opened. */
export const cameraProgress = (raw: number) =>
  Math.min(1, Math.max(0, (raw - TITLE_SPAN) / (ARRIVE_AT - TITLE_SPAN)));
