import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, SRGBColorSpace, Vector3, WebGLRenderTarget } from 'three';
import { SCREEN, SCREEN_RES } from './constants';
import { useOS } from '../os/useOS';

/**
 * The room, reflected in the CRT's front glass.
 *
 * This has to be a DOM layer, not a mesh. The desktop is real DOM on a CSS3D plane, which sits
 * above the WebGL canvas in the document — anything drawn in three.js is behind it and can
 * never appear over the screen. So three.js captures the room once, and CSS composites it over
 * the desktop with `screen` blending, driven each frame by the real camera.
 */

/** Captured from just in front of the glass: sitting on it would fill the frame with bezel. */
const CAPTURE_OFFSET = 0.25;
/**
 * Vertical FOV of the capture, in degrees. Wide enough that the reflected direction stays
 * inside the image across the camera's whole idle→seated arc — at the idle angle it lands
 * around 27% across, which a narrower capture would miss entirely.
 */
const CAPTURE_FOV = 112;
const CAPTURE_RES = 512;
/** Tone curve applied to the capture — see the note where it is used. */
const CONTRAST = 1.7;
const HIGHLIGHT_GAIN = 1.6;

/**
 * Sagitta of the tube's front glass, in world units, and the panel's resulting angular sweep.
 *
 * The curvature is the whole effect: a flat panel reflects one direction across its entire
 * surface and reads as a tinted sheet. A spherical cap makes the reflection slide. From the
 * cap radius R = (a² + s²)/2s over the glass half-diagonal, the surface normal at the top edge
 * tilts 5.87°, so the reflected direction sweeps 11.74° from centre to edge. Against the
 * capture's 56° half-FOV that puts the panel across 14% of the image — hence the scale below.
 */
const SAG = 0.045;
const IMG_SCALE = (() => {
  const a = Math.hypot(SCREEN.width / 2, SCREEN.height / 2);
  const R = (a * a + SAG * SAG) / (2 * SAG);
  const y = SCREEN.height / 2;
  const tilt = Math.atan2(y / Math.sqrt(R * R - y * y), 1);
  const panelFraction = Math.tan(2 * tilt) / Math.tan((CAPTURE_FOV / 2) * (Math.PI / 180));
  return 1 / panelFraction;
})();

/**
 * Reflection gain, by camera state. Dimmed when seated so the desktop stays readable.
 * Lower than it was under the single-lamp room: overhead troffers are far brighter, and the
 * reflection now carries real content rather than having to be pushed to show anything.
 */
const IDLE_GAIN = 0.5;
const SEATED_GAIN = 0.26;
/** Never let the glass hide the desktop, whatever the angle. */
const MAX_OPACITY = 0.42;

const setVar = (k: string, v: string) => document.documentElement.style.setProperty(k, v);

export function CrtReflection() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const phase = useOS((s) => s.phase);

  const rt = useMemo(() => {
    const t = new WebGLRenderTarget(CAPTURE_RES, CAPTURE_RES);
    // Ask three for a display-ready buffer, so the readback needs no conversion of its own.
    t.texture.colorSpace = SRGBColorSpace;
    return t;
  }, []);

  const cam = useMemo(() => {
    const c = new PerspectiveCamera(CAPTURE_FOV, 1, 0.05, 40);
    c.position.set(SCREEN.center[0], SCREEN.center[1], SCREEN.z + CAPTURE_OFFSET);
    c.lookAt(SCREEN.center[0], SCREEN.center[1], SCREEN.z + 5);
    return c;
  }, []);

  useEffect(() => {
    setVar('--crt-refl-size', `${(SCREEN_RES.h * IMG_SCALE).toFixed(0)}px`);
    return () => {
      rt.dispose();
      setVar('--crt-refl-image', 'none');
      setVar('--crt-refl-o', '0');
    };
  }, [rt]);

  const captured = useRef(0);
  const gain = useRef<number>(IDLE_GAIN);
  const V = useMemo(() => new Vector3(), []);
  const glass = useMemo(() => new Vector3(SCREEN.center[0], SCREEN.center[1], SCREEN.z), []);

  useFrame(({ camera }) => {
    // Capture once, a few frames in — by then the model is decoded and the lamp has settled.
    if (captured.current < 3) {
      captured.current++;
      if (captured.current === 3) capture();
    }

    V.copy(camera.position).sub(glass).normalize();
    // Mirror about the glass normal (0,0,1): R = -V + 2(N·V)N.
    const rx = -V.x;
    const ry = -V.y;
    const rz = V.z;
    if (rz <= 0.01) return; // behind the glass; nothing to reflect

    const halfTan = Math.tan((CAPTURE_FOV / 2) * (Math.PI / 180));
    const u = 0.5 + rx / rz / (2 * halfTan);
    const v = 0.5 - ry / rz / (2 * halfTan);

    // Place the reflected point at the centre of the glass.
    const img = SCREEN_RES.h * IMG_SCALE;
    setVar('--crt-refl-x', `${(SCREEN_RES.w / 2 - u * img).toFixed(1)}px`);
    setVar('--crt-refl-y', `${(SCREEN_RES.h / 2 - v * img).toFixed(1)}px`);

    // Fresnel: glass barely reflects head-on and mirrors at grazing angles. This is why the
    // reflection swells as you swing around the desk and clears as you sit down at it.
    const f = 0.16 + 0.84 * Math.pow(1 - Math.max(V.z, 0), 3);
    const want = phase === 'seated' ? SEATED_GAIN : IDLE_GAIN;
    gain.current += (want - gain.current) * 0.05;
    // Hard ceiling on the reflection. Under office light the Fresnel term goes to ~1 at the
    // grazing angles the descent passes through, which without a cap washes the screen out to
    // white exactly when the visitor is first close enough to read it.
    setVar('--crt-refl-o', Math.min(MAX_OPACITY, f * gain.current).toFixed(3));
  });

  /** Render the room in front of the tube once and hand it to CSS as an image. */
  function capture() {
    const prev = gl.getRenderTarget();
    gl.setRenderTarget(rt);
    gl.render(scene, cam);
    gl.setRenderTarget(prev);

    const px = new Uint8Array(CAPTURE_RES * CAPTURE_RES * 4);
    gl.readRenderTargetPixels(rt, 0, 0, CAPTURE_RES, CAPTURE_RES, px);

    const c = document.createElement('canvas');
    c.width = c.height = CAPTURE_RES;
    const ctx = c.getContext('2d')!;
    const id = ctx.createImageData(CAPTURE_RES, CAPTURE_RES);
    // GL reads bottom-up; canvas is top-down.
    const row = CAPTURE_RES * 4;
    for (let y = 0; y < CAPTURE_RES; y++) {
      id.data.set(px.subarray((CAPTURE_RES - 1 - y) * row, (CAPTURE_RES - y) * row), y * row);
    }
    // Crush the ambient midtones and keep the highlights. Without this the capture is a
    // near-uniform dim grey, and screen-blending it just lifts the whole desktop a flat step —
    // which is precisely how a flat, wrong reflection looks. A reflection reads as bright
    // shapes over nothing, so the curve has to make it one.
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = Math.min(255, 255 * Math.pow(d[i] / 255, CONTRAST) * HIGHLIGHT_GAIN);
      d[i + 1] = Math.min(255, 255 * Math.pow(d[i + 1] / 255, CONTRAST) * HIGHLIGHT_GAIN);
      d[i + 2] = Math.min(255, 255 * Math.pow(d[i + 2] / 255, CONTRAST) * HIGHLIGHT_GAIN);
    }
    ctx.putImageData(id, 0, 0);
    setVar('--crt-refl-image', `url(${c.toDataURL('image/png')})`);

    if (import.meta.env.DEV) {
      // Coarse luminance map of the capture, for checking there is anything in the room worth
      // reflecting without having to decode the data URL back out of CSS.
      const N = 24;
      const step = CAPTURE_RES / N;
      const map: number[][] = [];
      for (let j = 0; j < N; j++) {
        const r: number[] = [];
        for (let i = 0; i < N; i++) {
          const sx = Math.floor((i + 0.5) * step);
          const sy = Math.floor((j + 0.5) * step);
          const k = (sy * CAPTURE_RES + sx) * 4;
          r.push(Math.round((d[k] + d[k + 1] + d[k + 2]) / 3));
        }
        map.push(r);
      }
      (window as unknown as { __reflMap: number[][] }).__reflMap = map;
    }
  }

  return null;
}
