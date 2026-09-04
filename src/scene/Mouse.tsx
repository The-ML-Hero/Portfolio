import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry, Group, Mesh, Vector3 } from 'three';
import { KEYBOARD } from './constants';

/** Desk pad the mouse is confined to, to the right of the keyboard. */
const PAD = {
  minX: 1.00, maxX: 1.72,
  minZ: 0.46, maxZ: 1.02,
  y: KEYBOARD.bounds.min[1] - 0.004,
};

/** Where the cable disappears into the back of the terminal. */
const PORT = new Vector3(0.80, 0.20, 0.02);

const ROPE_POINTS = 22;
const RADIAL = 6;
const CABLE_RADIUS = 0.012;
/** Slack: total cable length as a multiple of the straight-line port→mouse distance at rest. */
const SEGMENT_LEN = 0.062;

/**
 * Verlet rope for the mouse cable.
 *
 * Both ends are pinned — one at the terminal's cable port, one at the mouse's cable stub — and
 * the points between fall under gravity and settle via distance constraints. Relaxation runs a
 * fixed 12 iterations per frame, which is plenty at 22 points and keeps the cable from looking
 * rubbery when the mouse is thrown across the pad.
 */
class Rope {
  pos: Vector3[] = [];
  prev: Vector3[] = [];

  constructor(a: Vector3, b: Vector3) {
    for (let i = 0; i < ROPE_POINTS; i++) {
      const t = i / (ROPE_POINTS - 1);
      const p = new Vector3().lerpVectors(a, b, t);
      // Start with a little sag so it settles downward rather than snapping.
      p.y -= Math.sin(t * Math.PI) * 0.12;
      this.pos.push(p);
      this.prev.push(p.clone());
    }
  }

  step(anchorA: Vector3, anchorB: Vector3, dt: number, floorY: number) {
    const g = -1.9 * dt * dt;
    const damp = 0.94;
    for (let i = 0; i < ROPE_POINTS; i++) {
      const p = this.pos[i];
      const pr = this.prev[i];
      const vx = (p.x - pr.x) * damp;
      const vy = (p.y - pr.y) * damp;
      const vz = (p.z - pr.z) * damp;
      pr.copy(p);
      p.x += vx;
      p.y += vy + g;
      p.z += vz;
    }

    for (let k = 0; k < 12; k++) {
      this.pos[0].copy(anchorA);
      this.pos[ROPE_POINTS - 1].copy(anchorB);
      for (let i = 0; i < ROPE_POINTS - 1; i++) {
        const a = this.pos[i];
        const b = this.pos[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
        const d = Math.hypot(dx, dy, dz) || 1e-6;
        const diff = (d - SEGMENT_LEN) / d;
        const mA = i === 0 ? 0 : 0.5;
        const mB = i + 1 === ROPE_POINTS - 1 ? 0 : 0.5;
        const s = diff / (mA + mB || 1);
        a.x += dx * s * mA; a.y += dy * s * mA; a.z += dz * s * mA;
        b.x -= dx * s * mB; b.y -= dy * s * mB; b.z -= dz * s * mB;
      }
      // Keep the cable on top of the desk.
      for (let i = 1; i < ROPE_POINTS - 1; i++) {
        if (this.pos[i].y < floorY) this.pos[i].y = floorY;
      }
    }
  }
}

/**
 * Builds a tube once and rewrites its vertex positions each frame using parallel-transport
 * frames, so a moving cable costs no allocation — rebuilding a TubeGeometry per frame would
 * churn the GC for the whole session.
 */
function useCableGeometry() {
  return useMemo(() => {
    const g = new BufferGeometry();
    const verts = ROPE_POINTS * RADIAL;
    g.setAttribute('position', new BufferAttribute(new Float32Array(verts * 3), 3));
    g.setAttribute('normal', new BufferAttribute(new Float32Array(verts * 3), 3));
    const idx: number[] = [];
    for (let i = 0; i < ROPE_POINTS - 1; i++) {
      for (let j = 0; j < RADIAL; j++) {
        const j2 = (j + 1) % RADIAL;
        const a = i * RADIAL + j;
        const b = i * RADIAL + j2;
        const c = (i + 1) * RADIAL + j;
        const d = (i + 1) * RADIAL + j2;
        idx.push(a, c, b, b, c, d);
      }
    }
    g.setIndex(idx);
    return g;
  }, []);
}

const tangent = new Vector3();
const normal = new Vector3();
const binormal = new Vector3();
const up = new Vector3(0, 1, 0);

function updateCable(g: BufferGeometry, pts: Vector3[]) {
  const pos = g.getAttribute('position') as BufferAttribute;
  const nor = g.getAttribute('normal') as BufferAttribute;
  const pa = pos.array as Float32Array;
  const na = nor.array as Float32Array;

  // Seed the frame with an arbitrary perpendicular, then carry it along the curve.
  normal.set(0, 0, 0);
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    tangent.subVectors(b, a).normalize();
    if (i === 0) {
      normal.copy(up).cross(tangent);
      if (normal.lengthSq() < 1e-6) normal.set(1, 0, 0);
      normal.normalize();
    } else {
      // Remove the tangential component to keep the frame continuous (no twist popping).
      normal.addScaledVector(tangent, -normal.dot(tangent)).normalize();
    }
    binormal.crossVectors(tangent, normal).normalize();

    for (let j = 0; j < RADIAL; j++) {
      const ang = (j / RADIAL) * Math.PI * 2;
      const cx = Math.cos(ang), sy = Math.sin(ang);
      const nx = normal.x * cx + binormal.x * sy;
      const ny = normal.y * cx + binormal.y * sy;
      const nz = normal.z * cx + binormal.z * sy;
      const o = (i * RADIAL + j) * 3;
      pa[o] = pts[i].x + nx * CABLE_RADIUS;
      pa[o + 1] = pts[i].y + ny * CABLE_RADIUS;
      pa[o + 2] = pts[i].z + nz * CABLE_RADIUS;
      na[o] = nx; na[o + 1] = ny; na[o + 2] = nz;
    }
  }
  pos.needsUpdate = true;
  nor.needsUpdate = true;
  g.computeBoundingSphere();
}

/**
 * A period-correct two-button mouse that tracks the real pointer across a patch of desk,
 * trailing a physically simulated cable back to the terminal.
 */
export function Mouse() {
  const group = useRef<Group>(null);
  const cableRef = useRef<Mesh>(null);
  const { size } = useThree();

  const target = useRef(new Vector3((PAD.minX + PAD.maxX) / 2, PAD.y, (PAD.minZ + PAD.maxZ) / 2));
  const current = useRef(target.current.clone());
  const stub = useRef(new Vector3());
  const geometry = useCableGeometry();
  const rope = useMemo(() => new Rope(PORT.clone(), target.current.clone()), []);

  useFrame((state, dt) => {
    // Map the pointer across the pad. state.pointer is already normalised to [-1, 1].
    const px = (state.pointer.x + 1) / 2;
    const py = (1 - (state.pointer.y + 1) / 2);
    target.current.set(
      PAD.minX + px * (PAD.maxX - PAD.minX),
      PAD.y,
      PAD.minZ + py * (PAD.maxZ - PAD.minZ),
    );

    // Ease toward the target so the mouse has weight instead of teleporting.
    current.current.lerp(target.current, Math.min(1, dt * 7));
    if (group.current) {
      group.current.position.copy(current.current);
      // Lean very slightly into the direction of travel.
      const vx = target.current.x - current.current.x;
      group.current.rotation.z = -vx * 0.35;
    }

    // Cable leaves the front-left of the mouse body.
    stub.current.set(current.current.x - 0.03, current.current.y + 0.05, current.current.z - 0.17);
    rope.step(PORT, stub.current, Math.min(dt, 1 / 45), PAD.y + CABLE_RADIUS);
    updateCable(geometry, rope.pos);
  });

  // Suppress on touch devices, where there is no pointer to follow.
  if (size.width < 700) return null;

  return (
    <>
      <group ref={group}>
        {/* body */}
        <mesh castShadow position={[0, 0.055, 0]}>
          <boxGeometry args={[0.185, 0.085, 0.33]} />
          <meshStandardMaterial color="#d8d2c4" roughness={0.62} metalness={0.03} />
        </mesh>
        {/* domed back */}
        <mesh castShadow position={[0, 0.088, 0.055]} scale={[0.092, 0.043, 0.16]}>
          <sphereGeometry args={[1, 20, 14]} />
          <meshStandardMaterial color="#ded8ca" roughness={0.58} />
        </mesh>
        {/* buttons */}
        <mesh position={[-0.046, 0.1, -0.105]}>
          <boxGeometry args={[0.082, 0.012, 0.115]} />
          <meshStandardMaterial color="#cbc5b6" roughness={0.55} />
        </mesh>
        <mesh position={[0.046, 0.1, -0.105]}>
          <boxGeometry args={[0.082, 0.012, 0.115]} />
          <meshStandardMaterial color="#cbc5b6" roughness={0.55} />
        </mesh>
        {/* cable stub */}
        <mesh position={[-0.03, 0.05, -0.168]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.014, 0.014, 0.03, 8]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
        </mesh>
      </group>

      <mesh ref={cableRef} geometry={geometry} castShadow frustumCulled={false}>
        <meshStandardMaterial color="#242424" roughness={0.85} metalness={0.02} />
      </mesh>
    </>
  );
}
