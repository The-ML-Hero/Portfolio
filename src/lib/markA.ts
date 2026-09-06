/**
 * Geometry for the loader's mark: a ball bouncing inside a circle, whose trail spells A.
 *
 * Every bounce point is genuinely on the ring — the ball travels in straight chords and turns
 * only where it touches, so the motion reads as a ball and not as a pen following a letter.
 *
 * One honest constraint sets the shape of this: a capital A cannot be drawn in a single
 * continuous stroke. Its junctions leave four odd-degree vertices (both feet and both ends of
 * the crossbar), and a figure with more than two of those needs more than one stroke. So the
 * ball bounces four times and the trail inks three of the four chords: the pen lifts for the
 * short hop from the right foot up to the crossbar's east end. The crossbar is then drawn full
 * width, ring to ring, which is also what keeps the mark reading as a monogram rather than as
 * a letter that happens to be sitting in a circle.
 */

export const VIEW = 200;
export const C = VIEW / 2;
export const R = 78;

/** Ring point, by angle from the top, clockwise. */
function at(deg: number): [number, number] {
  const t = (deg * Math.PI) / 180;
  return [C + R * Math.sin(t), C - R * Math.cos(t)];
}

/**
 * The crossbar sits at 69% of the way down the legs — high enough to read as an A's bar,
 * low enough not to look like a delta. Its ring angle follows from that height.
 */
const BAR_Y = 120;
const BAR_DEG = (Math.acos((C - BAR_Y) / R) * 180) / Math.PI;

const APEX = at(0);
const FOOT_L = at(215);
const FOOT_R = at(145);
const BAR_E = at(BAR_DEG);
const BAR_W = at(360 - BAR_DEG);

/** The ball's itinerary. Consecutive pairs are the chords it flies. */
const STOPS = [FOOT_L, APEX, FOOT_R, BAR_E, BAR_W];

/** Which chords leave ink. Index i covers STOPS[i] → STOPS[i + 1]. */
const INKED = [true, true, false, true];

const dist = (a: number[], b: number[]) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const fmt = (p: number[]) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;

const lengths = STOPS.slice(0, -1).map((p, i) => dist(p, STOPS[i + 1]));
const total = lengths.reduce((a, b) => a + b, 0);

/** Cumulative fraction of the flight completed at each stop — the ball moves at one speed. */
const marks = lengths.reduce<number[]>((acc, len) => [...acc, acc[acc.length - 1] + len / total], [0]);

/** Full flight path, for the ball's offset-path. */
export const BALL_PATH = `M ${STOPS.map(fmt).join(' L ')}`;

/**
 * One trail stroke per inked chord, each with the window of the flight during which it is
 * drawn. Separate elements rather than one dashed path, because the reveal has to pause
 * while the pen is up and dash offsets cannot pause.
 */
export const STROKES = INKED.map((ink, i) =>
  ink ? { d: `M ${fmt(STOPS[i])} L ${fmt(STOPS[i + 1])}`, len: lengths[i], from: marks[i], to: marks[i + 1] } : null,
).filter((s): s is { d: string; len: number; from: number; to: number } => s !== null);
