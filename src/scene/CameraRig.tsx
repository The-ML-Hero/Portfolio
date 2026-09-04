import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { CatmullRomCurve3, PerspectiveCamera, Vector3 } from 'three';
import { CAMERA, OVERVIEW, SEATED_FRAME, overviewDistance, seatedDistance } from './constants';
import { useOS } from '../os/useOS';

/**
 * Scroll fraction at which the camera has fully arrived and the desktop goes live.
 *
 * Everything past it is a dead zone that still maps to progress 1, so a stray wheel tick while
 * you are using the desktop does not nudge the camera off the desk.
 */
export const ARRIVE_AT = 0.88;
/** Where Esc drops you back to — just off the desk, not all the way to the ceiling. */
export const EXIT_TO = 0.62;

const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * Camera path: a traverse across the floor, then a turn and a descent onto the hero desk.
 *
 * Seven stops, six segments, and getPoint spends an equal share of the scroll on each — so the
 * first half of the page is the pan and the second half is the approach. The three pan stops
 * are collinear by construction (same altitude, same offset along `dir`), which keeps that
 * stretch a dead-straight glide instead of a drifting arc.
 *
 * Both ends stay fitted to the viewport: the pan always holds the same amount of floor, and the
 * arrival always frames the whole monitor. Centripetal parameterisation is what stops the
 * corner between the two halves — a long straight meeting a tight descent — from overshooting
 * into a loop, which uniform Catmull-Rom does badly on unevenly spaced points.
 */
function usePath(aspect: number) {
  return useMemo(() => {
    const d = overviewDistance(aspect);
    const dir = new Vector3(...OVERVIEW.dir).normalize();
    const a = new Vector3(...OVERVIEW.from);
    const b = new Vector3(...OVERVIEW.to);

    /** Look-at point partway along the traverse. */
    const panTarget = (s: number) => a.clone().lerp(b, s);
    const panPos = (s: number) => panTarget(s).addScaledVector(dir, d);

    const seatTarget = new Vector3(...SEATED_FRAME.center);
    const seatPos = seatTarget.clone().setZ(seatTarget.z + seatedDistance(aspect));

    const positions = new CatmullRomCurve3(
      [
        panPos(0),
        panPos(0.34),
        panPos(0.67),
        panPos(1),
        new Vector3(6.4, 7.2, 8.4),
        new Vector3(1.9, 2.05, 3.5),
        seatPos,
      ],
      false,
      'centripetal',
    );

    const targets = new CatmullRomCurve3(
      [
        panTarget(0),
        panTarget(0.34),
        panTarget(0.67),
        panTarget(1),
        new Vector3(1.1, 0.1, 1.4),
        new Vector3(0.28, 0.6, 0.5),
        seatTarget,
      ],
      false,
      'centripetal',
    );

    return { positions, targets };
  }, [aspect]);
}

/**
 * FOV keyed to the same 0..1 progress. Held flat at the long lens for the whole traverse —
 * the pan's compressed, near-isometric look is the shot, and widening during it would undo it —
 * then opened out across the descent.
 */
const PAN_ENDS = 0.5;
function fovAt(p: number) {
  if (p <= PAN_ENDS) return OVERVIEW.fov;
  const k = smooth(Math.min(1, (p - PAN_ENDS) / (0.95 - PAN_ENDS)));
  return OVERVIEW.fov + (CAMERA.seated.fov - OVERVIEW.fov) * k;
}

const pos = new Vector3();
const look = new Vector3();

/**
 * Drives the camera from the page scroll.
 *
 * Scroll position is the single source of truth for where the camera is, which means the
 * browser's own scroll physics — momentum, trackpad, a dragged scrollbar, a phone flick — all
 * work for free, and the position survives a reload. The rig only smooths it, so the camera
 * lags the scroll slightly instead of snapping frame to frame.
 */
export function CameraRig() {
  const { camera, size } = useThree();
  const setPhase = useOS((s) => s.setPhase);
  const path = usePath(size.width / Math.max(1, size.height));

  /** Smoothed scroll progress. */
  const p = useRef(0);
  const raw = useRef(0);
  const arrived = useRef(false);

  useEffect(() => {
    const read = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      raw.current = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };
    read();
    window.addEventListener('scroll', read, { passive: true });
    window.addEventListener('resize', read);
    return () => {
      window.removeEventListener('scroll', read);
      window.removeEventListener('resize', read);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (useOS.getState().phase !== 'seated') return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: max * EXIT_TO, behavior: 'smooth' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useFrame((_, dt) => {
    // Critically-damped-ish follow, frame-rate independent.
    const k = 1 - Math.pow(0.0015, Math.min(dt, 0.05));
    p.current += (raw.current - p.current) * k;

    if (import.meta.env.DEV) {
      (window as unknown as { __rig: object }).__rig = { raw: raw.current, p: p.current };
    }
    const t = Math.min(1, p.current / ARRIVE_AT);
    path.positions.getPoint(t, pos);
    path.targets.getPoint(t, look);

    camera.position.copy(pos);
    camera.lookAt(look);

    const cam = camera as PerspectiveCamera;
    const fov = fovAt(t);
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }

    // Arriving hands pointer and keyboard control to the desktop. The page deliberately stays
    // scrollable: scrolling back up is the natural way to leave, and pinning the body here
    // zeroes window.scrollY, which would send the camera straight back to the overview.
    // Wheel events inside the desktop are contained by CSS instead (see styles/crt.css).
    const now = raw.current >= ARRIVE_AT;
    if (now !== arrived.current) {
      arrived.current = now;
      setPhase(now ? 'seated' : 'idle');
    }
  });

  return null;
}
