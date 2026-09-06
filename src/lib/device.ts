/**
 * What this device can be asked for.
 *
 * A phone renders at a device pixel ratio of 2 or 3, so the same page fills four to nine times
 * the pixels it does on a laptop, on a small fraction of the fill rate — and then pays for a
 * shadow pass and a bloom pass over every one of them. Geometry was the first problem (see the
 * LOD note in scene/Office.tsx); past that, everything left is per-pixel.
 *
 * Read once at module load: a device does not stop being a phone mid-session, and re-reading
 * per frame would make the renderer's own settings a moving target.
 */
const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

export const DEVICE = {
  coarse,
  /** 1.5 is where the CRT's scanlines still resolve; 2 is where a phone starts dropping frames. */
  maxDpr: coarse ? 1.5 : 2,
  /** The key light's shadow map. Halving it quarters the pass. */
  shadowMap: coarse ? 1024 : 2048,
} as const;
