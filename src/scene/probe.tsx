/** Dev-only: draws the measured SCREEN and KEYBOARD rects as wireframes to confirm placement. */
import { SCREEN, KEYBOARD } from './constants';

export function Probe() {
  return (
    <>
      <mesh position={[...SCREEN.center]}>
        <planeGeometry args={[SCREEN.width, SCREEN.height]} />
        <meshBasicMaterial color="#00ff88" wireframe />
      </mesh>
      <mesh position={[...KEYBOARD.center]} rotation={[-Math.PI / 2 + KEYBOARD.tilt, 0, 0]}>
        <planeGeometry args={[KEYBOARD.width, KEYBOARD.depth]} />
        <meshBasicMaterial color="#ff0088" wireframe />
      </mesh>
    </>
  );
}
