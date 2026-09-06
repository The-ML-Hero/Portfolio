import { Html } from '@react-three/drei';
import { SCREEN, SCREEN_RES } from './constants';
import { Desktop } from '../os/Desktop';

/**
 * The Win95 desktop, rendered as real DOM on a CSS3D plane matched to the CRT glass.
 *
 * `occlude="blending"` writes the plane into the depth buffer so the chassis correctly hides
 * the screen when the camera swings behind it. `transform` puts the DOM in 3D space, which is
 * what keeps text sharp and pointer events native — the whole reason the OS is DOM and not a
 * render target.
 */
export function ScreenSurface() {
  // 1.5% inset: the measured rect sits a hair proud of the glass at the bezel.
  const w = SCREEN.width * 0.985;
  const h = SCREEN.height * 0.985;
  /**
   * drei's <Html transform> maps CSS pixels to world units at a fixed internal ratio and then
   * applies the `scale` prop on top, so the prop is not world-units-per-pixel on its own —
   * measured empirically as a factor of 40 (passing 8.17e-4 yielded a 2.04e-5 matrix3d scale).
   * Correcting for it here makes the desktop fill the glass exactly.
   * If a drei upgrade changes this, ?calibrate shows it immediately as a mis-sized screen.
   */
  const DREI_TRANSFORM_FACTOR = 40;
  const scale = (w / SCREEN_RES.w) * DREI_TRANSFORM_FACTOR;

  return (
    <group position={[SCREEN.center[0], SCREEN.center[1], SCREEN.z + 0.001]}>
      <Html
        transform
        occlude="blending"
        distanceFactor={undefined}
        scale={scale}
        zIndexRange={[100, 0]}
        style={{ width: `${SCREEN_RES.w}px`, height: `${SCREEN_RES.h}px`, margin: 0 }}
      >
        <Desktop width={SCREEN_RES.w} height={SCREEN_RES.h} />
      </Html>
      {/*
        * Emissive plane behind the DOM, feeding bloom so the glass reads as lit rather than
        * as a sticker. Kept smaller than the warp-inset desktop (0.93) — at full size it
        * showed as a cyan halo around the screen's edge instead of hiding behind it.
        */}
      {/*
        * Backing, at the glass plane and just behind the DOM.
        *
        * The desktop is inset 1.5% and its corners are rounded, while the model's own screen
        * surface is a pale rectangle — so that surface showed through as a white ring, thickest
        * exactly at the corners where the rounding cuts deepest. This puts unlit tube behind the
        * cut instead, which is what a CRT's corners actually look like.
        */}
      <mesh position={[0, 0, -0.0004]}>
        <planeGeometry args={[SCREEN.width * 1.02, SCREEN.height * 1.02]} />
        <meshBasicMaterial color="#0a0e13" toneMapped={false} />
      </mesh>

      <mesh position={[0, 0, -0.004]}>
        <planeGeometry args={[w * 0.93, h * 0.93]} />
        <meshBasicMaterial color="#14527d" toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0, 0.36]} intensity={1.15} distance={1.9} decay={2} color="#8fd0ff" />
    </group>
  );
}
