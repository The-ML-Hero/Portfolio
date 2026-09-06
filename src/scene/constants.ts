/**
 * Measured geometry of public/models/terminal.opt.glb, in world space after the
 * model's own root matrix (which converts the FBX Z-up export to Y-up, +Z toward the viewer).
 *
 * These are not eyeballed. They were extracted from the mesh by clustering coplanar triangles
 * and sampling the base-colour texture through their UVs — see scripts/ and the notes below.
 * Re-derive them if the model is ever replaced.
 */

/**
 * The CRT glass. Found as a cluster of dark, front-facing, recessed faces on the monitor mesh:
 * x[-0.543, 0.253], y[0.435, 0.964], z 0.261..0.309. The z spread across the face is the tube's
 * convex curvature, so the frontmost point is the near edge of the glass.
 *
 * Note it sits LEFT of the chassis centre — the bright region at x[0.44, 0.77] is a separate
 * control panel, not part of the display.
 */
export const SCREEN = {
  center: [-0.145, 0.6995, 0.312] as const,
  width: 0.796,
  height: 0.529,
  /** 1.505 — close to 3:2, which the DOM viewport below is matched to. */
  aspect: 0.796 / 0.529,
  /** Glass is flat-mounted; the tube's curve is faked in CSS rather than geometry. */
  rotation: [0, 0, 0] as const,
  /** Depth of the frontmost glass point; the CSS3D plane sits just proud of it. */
  z: 0.312,
} as const;

/**
 * Pixel size of the virtual desktop. 3:2 to match the glass.
 * Deliberately low: the seated camera now frames the whole monitor rather than filling the
 * viewport with the glass, so the UI has to be chunky enough to read at that distance.
 */
export const SCREEN_RES = { w: 640, h: 425 } as const;

/**
 * The keyboard's tilted top face on the keyboard mesh: normal [0, 0.98, 0.17], so it rakes back
 * 9.85° from horizontal. The procedural key plate replaces this surface entirely.
 */
export const KEYBOARD = {
  center: [0.072, 0.244, 0.674] as const,
  /** Extent along the plate's own axes (width, depth in-plane). */
  width: 1.416,
  depth: 0.327,
  /** Rake angle in radians, about X. */
  tilt: Math.atan2(0.17, 0.98),
  /** Full mesh bounds, for sanity checks. */
  bounds: { min: [-0.646, 0.18, 0.494], max: [0.791, 0.273, 0.843] } as const,
} as const;

/** Whole-model bounds, used to frame the idle camera orbit. */
export const MODEL_BOUNDS = {
  min: [-0.707, 0.055, -0.456],
  max: [0.854, 1.137, 0.978],
} as const;

/**
 * What the seated shot must keep in frame: the monitor's front face plus a little chassis,
 * so the physical machine reads as an object rather than the screen swallowing the viewport.
 */
export const SEATED_FRAME = {
  center: [0.02, 0.66, SCREEN.z] as const,
  width: 1.62,
  height: 1.16,
  /** Multiplier on the fitted distance — breathing room around the monitor. */
  margin: 1.16,
} as const;

/**
 * The same arrival on a tall viewport, framing the screen instead of the whole terminal.
 *
 * Fitting the full 1.62-wide terminal into a portrait phone needs about 5.6 units of standoff,
 * and the next bank of desks is only 3.9 away — so the camera ended up behind the following
 * row and framed *its* terminal instead of the hero's. There is no distance that fixes that;
 * the shot has to want less.
 */
export const SEATED_FRAME_TALL = {
  center: [SCREEN.center[0], SCREEN.center[1], SCREEN.z] as const,
  width: SCREEN.width * 1.16,
  height: SCREEN.height * 1.2,
  margin: 1,
} as const;

/**
 * How far back the camera may sit and still be in the hero's own bay. The next row's desk
 * front edge is at pitchZ − desk.d/2 ≈ 3.0 from the hero, measured from the screen plane;
 * this keeps a clear margin inside that.
 */
export const MAX_SEAT_DISTANCE = 2.3;

/** The arrival stop. Its distance is fitted per-viewport, not fixed. */
export const CAMERA = {
  seated: { target: SEATED_FRAME.center, fov: 40 },
} as const;

/**
 * Distance at which SEATED_FRAME fits the viewport, given a vertical FOV and aspect ratio.
 * Height governs on wide viewports, width on tall ones — so a phone in portrait pulls back
 * far enough to keep the monitor whole instead of cropping its sides.
 */
export function fitDistance(
  frame: { width: number; height: number; margin: number },
  aspect: number,
  fovDeg: number,
): number {
  const half = Math.tan((fovDeg * Math.PI) / 180 / 2);
  const forHeight = frame.height / 2 / half;
  const forWidth = frame.width / 2 / (half * aspect);
  return Math.max(forHeight, forWidth) * frame.margin;
}

/** Vertical FOV that fits `frame` at a given distance — the inverse of fitDistance. */
export function fitFov(
  frame: { width: number; height: number; margin: number },
  aspect: number,
  distance: number,
): number {
  const halfH = (frame.height / 2) * frame.margin;
  const halfW = (frame.width / 2) * frame.margin;
  const tan = Math.max(halfH / distance, halfW / (distance * aspect));
  return (2 * Math.atan(tan) * 180) / Math.PI;
}

/**
 * The whole arrival shot for a viewport: where to look, how far back, and through what lens.
 *
 * Two things it will not do. It will not back out of the hero's bay to fit a frame — past
 * MAX_SEAT_DISTANCE it opens the lens instead, because a camera behind the next row of desks
 * frames the wrong terminal however well the numbers add up. And it will not open the lens
 * past 62°, where the barrel distortion starts bending the monitor; beyond that the frame is
 * simply cropped, which is the least bad of the three.
 */
export function seatedShot(aspect: number) {
  const frame = aspect < 1.1 ? SEATED_FRAME_TALL : SEATED_FRAME;
  let fov: number = CAMERA.seated.fov;
  let distance = fitDistance(frame, aspect, fov);
  if (distance > MAX_SEAT_DISTANCE) {
    distance = MAX_SEAT_DISTANCE;
    fov = Math.min(62, fitFov(frame, aspect, distance));
  }
  return { target: frame.center, distance, fov };
}

/* ------------------------------------------------------------------------------------------
 * The office floor.
 *
 * The model's own space already puts the desk surface at y ≈ 0.174 (it is where the keyboard
 * mesh bottoms out), so the whole office is built around that plane rather than re-deriving a
 * scale. Working back from it: a CRT plus keyboard is about half a metre tall and measures
 * 0.96 units here, which fixes the scale at roughly 1 unit ≈ 0.52 m. Every dimension below is
 * a real office measurement converted at that rate, which is what keeps the grid from reading
 * as a toy set when seen from above.
 * ---------------------------------------------------------------------------------------- */

export const OFFICE = {
  /**
   * 34 × 24 = 816 workstations. Instanced, so the count costs draw calls, not frames.
   * Sized by the opening pan rather than by taste: the traverse has to stay over occupied
   * floor from end to end, and a sliver of empty blue at the edge of frame gives the whole
   * thing away as a set.
   */
  cols: 34,
  rows: 24,
  /** Which cell holds the real, interactive terminal. Everything else is an instance. */
  heroCol: 16,
  heroRow: 8,

  /** Pod pitch — desk width plus the walkway between banks. */
  pitchX: 3.4,
  pitchZ: 3.9,

  /**
   * Desk slab: 1.55 m × 0.94 m.
   *
   * `top` is the plane the terminal RESTS on, and it is the monitor mesh's underside at
   * y = 0.055 — not the keyboard slab's at 0.180. Those are 0.125 apart because the keyboard
   * sits on a tray moulded into the chassis, well above the desk. Taking the keyboard's figure
   * (which is what KEYBOARD.bounds gives) buries the monitor's base 0.119 into the desk.
   * A hair lower again, so the two surfaces are not coplanar and cannot z-fight.
   */
  desk: {
    center: [0.07, 0.26] as const,
    w: 3.0,
    d: 1.8,
    thickness: 0.09,
    top: 0.052,
  },

  /** Floor sits a 0.73 m desk height below the slab; ceiling a shade under 2.8 m above it. */
  floorY: 0.052 - 1.4,
  ceilingY: 0.052 + 4.0,

  /** Cubicle panels: 1.35 m tall, 35 mm thick. */
  partition: { h: 2.6, t: 0.07 },

  /** Ceiling troffers, in pods: one 4-foot fitting every other bay. */
  lightEveryX: 2,
  lightEveryZ: 2,
  light: { w: 2.3, d: 0.55 },
} as const;

/** World position of a pod's origin. The hero cell is the world origin, by construction. */
export function podOrigin(col: number, row: number): [number, number, number] {
  return [(col - OFFICE.heroCol) * OFFICE.pitchX, 0, (row - OFFICE.heroRow) * OFFICE.pitchZ];
}

/**
 * The opening shot: a long-lens traverse across the floor, then a turn and a descent.
 *
 * The camera holds one altitude and one angle while it glides from `from` to `to`, so the pan
 * reads as gliding over the floor rather than as swinging around it. Both ends are look-at
 * points on the floor plane; the camera itself sits back along `dir` at whatever distance
 * frames the same amount of floor on this viewport.
 */
export const OVERVIEW = {
  /** Look-at points the pan travels between. Both sit well inside the occupied grid. */
  from: [-30, -0.4, -12] as const,
  to: [4, -0.4, 4] as const,
  /**
   * Steep — about 58° down. Shallower angles put the floor's far edge and the horizon in
   * frame, which turns the room into a model on a table; past roughly 55° the grid fills the
   * viewport edge to edge and reads as endless, which is the whole point of the shot.
   */
  dir: [0.38, 0.92, 0.42] as const,
  /** World units of floor to hold vertically — about eight banks deep. */
  frameHeight: 30,
  fov: 34,
} as const;

export function overviewDistance(aspect: number): number {
  return fitDistance(
    { width: OVERVIEW.frameHeight * 1.2, height: OVERVIEW.frameHeight, margin: 1 },
    aspect,
    OVERVIEW.fov,
  );
}
