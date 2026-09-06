import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh, MeshBasicMaterial } from 'three';
import { SCREEN } from './constants';
import { cameraProgress, scrollFraction } from '../lib/scrollZones';

/**
 * The one machine that is on.
 *
 * The site's premise is 816 workstations and one occupied, and until now that was a line of
 * type on the title card: every screen on the floor, including this one, was equally dark
 * until the visitor sat down. So the claim was made in words and contradicted by the room.
 *
 * This is the hero's monitor in standby, and from the opening pan it is the only lit rectangle
 * on the floor — about 25 pixels of it at that distance, which is enough to pick out against
 * grey partitions and enough for bloom to give it a halo. The camera then flies to the one
 * thing that is switched on.
 *
 * It is geometry rather than a style on the DOM screen deliberately: the desktop is composited
 * above the canvas and never passes through the effect composer, so a glow drawn there could
 * never bloom. Being in front of the DOM plane also means it hides the boot panel behind it,
 * which is what makes this read as a machine idling rather than a machine off.
 *
 * It hands over at the desk. Standby holds the whole way in and clears just as the visitor
 * arrives, so the screen is unobscured for the POST that starts on arrival — the machine wakes
 * up as you sit down, rather than switching off as you approach.
 */

/** Where the fade begins and ends, in camera progress. Clear before the POST needs the glass. */
const HOLD_UNTIL = 0.86;
const GONE_BY = 0.985;

export function Beacon() {
  const ref = useRef<Mesh>(null);

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const p = cameraProgress(scrollFraction());
    const k = Math.min(1, Math.max(0, (p - HOLD_UNTIL) / (GONE_BY - HOLD_UNTIL)));
    const o = 1 - k * k * (3 - 2 * k);
    (mesh.material as MeshBasicMaterial).opacity = o;
    /* Stop drawing it entirely once it is gone, rather than leaving a transparent plane in
       front of the desktop soaking up picks and blend work for the rest of the visit. */
    mesh.visible = o > 0.002;
  });

  return (
    <mesh ref={ref} position={[0, 0, 0.002]}>
      {/* Inside the glass, so the glow cannot spill onto the bezel. */}
      <planeGeometry args={[SCREEN.width * 0.93, SCREEN.height * 0.93]} />
      <meshBasicMaterial color="#8ce9ff" transparent opacity={1} toneMapped={false} />
    </mesh>
  );
}
