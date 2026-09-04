import { useLayoutEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import {
  BufferGeometry, InstancedMesh, Material, Matrix4, Mesh, Object3D,
} from 'three';
import { OFFICE, podOrigin } from './constants';

const MODEL = '/models/terminal.opt.glb';
const DRACO = '/draco/';

const POD_COUNT = OFFICE.cols * OFFICE.rows;
const isHero = (c: number, r: number) => c === OFFICE.heroCol && r === OFFICE.heroRow;

/** Every pod origin, once. Iterated by each instanced layer below. */
function usePods() {
  return useMemo(() => {
    const all: { x: number; z: number; hero: boolean }[] = [];
    for (let r = 0; r < OFFICE.rows; r++) {
      for (let c = 0; c < OFFICE.cols; c++) {
        const [x, , z] = podOrigin(c, r);
        all.push({ x, z, hero: isHero(c, r) });
      }
    }
    return all;
  }, []);
}

/** Writes a transform list into an InstancedMesh and marks it dirty exactly once. */
function useInstances(
  ref: React.RefObject<InstancedMesh | null>,
  place: (o: Object3D, pod: { x: number; z: number; hero: boolean }, i: number) => boolean,
  pods: ReturnType<typeof usePods>,
) {
  useLayoutEffect(() => {
    const im = ref.current;
    if (!im) return;
    const dummy = new Object3D();
    let n = 0;
    for (let i = 0; i < pods.length; i++) {
      if (!place(dummy, pods[i], i)) continue;
      dummy.updateMatrix();
      im.setMatrixAt(n++, dummy.matrix);
    }
    im.count = n;
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere();
  }, [ref, place, pods]);
}

/**
 * A floor of 816 workstations.
 *
 * Everything repeated is an InstancedMesh, so the entire floor — desks, both cubicle panels
 * and every terminal but one — costs a handful of draw calls rather than several thousand.
 * The hero cell is skipped by the terminal layer only: it still gets its desk and panels,
 * because it has to sit in the grid rather than on top of it.
 *
 * Deliberately unpeopled: no chairs, so nothing suggests anyone is coming back.
 */
export function Office() {
  const pods = usePods();
  const { scene: model } = useGLTF(MODEL, DRACO);

  /** Source geometry/material pairs from the GLB, flattened with their baked transforms. */
  const parts = useMemo(() => {
    const out: { geometry: BufferGeometry; material: Material | Material[]; matrix: Matrix4 }[] = [];
    model.updateMatrixWorld(true);
    model.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      out.push({ geometry: m.geometry, material: m.material, matrix: m.matrixWorld.clone() });
    });
    return out;
  }, [model]);

  const { desk, partition } = OFFICE;

  const deskRef = useRef<InstancedMesh>(null);
  const backRef = useRef<InstancedMesh>(null);
  const sideRef = useRef<InstancedMesh>(null);

  const placeDesk = useMemo(
    () => (o: Object3D, p: { x: number; z: number }) => {
      o.position.set(p.x + desk.center[0], desk.top - desk.thickness / 2, p.z + desk.center[1]);
      o.rotation.set(0, 0, 0);
      o.scale.set(1, 1, 1);
      return true;
    },
    [desk],
  );

  // Back panel: spans the full pod pitch, behind the monitor.
  const placeBack = useMemo(
    () => (o: Object3D, p: { x: number; z: number }) => {
      o.position.set(
        p.x + desk.center[0],
        OFFICE.floorY + partition.h / 2,
        p.z + desk.center[1] - desk.d / 2 - partition.t,
      );
      o.rotation.set(0, 0, 0);
      o.scale.set(1, 1, 1);
      return true;
    },
    [desk, partition],
  );

  // Side panel: one per pod, on the left, forming the cubicle's open-L.
  const placeSide = useMemo(
    () => (o: Object3D, p: { x: number; z: number }) => {
      o.position.set(
        p.x + desk.center[0] - OFFICE.pitchX / 2,
        OFFICE.floorY + partition.h / 2,
        p.z + desk.center[1] - desk.d / 2 + OFFICE.pitchZ * 0.22,
      );
      o.rotation.set(0, Math.PI / 2, 0);
      o.scale.set(1, 1, 1);
      return true;
    },
    [desk, partition],
  );

  useInstances(deskRef, placeDesk, pods);
  useInstances(backRef, placeBack, pods);
  useInstances(sideRef, placeSide, pods);

  // Generously past the last cubicle: at the overview the camera is high enough to see the
  // floor's edge, and a visible edge turns the room into a diorama on a table.
  const floorW = OFFICE.cols * OFFICE.pitchX + 160;
  const floorD = OFFICE.rows * OFFICE.pitchZ + 160;
  const floorCx = ((OFFICE.cols - 1) / 2 - OFFICE.heroCol) * OFFICE.pitchX;
  const floorCz = ((OFFICE.rows - 1) / 2 - OFFICE.heroRow) * OFFICE.pitchZ;

  return (
    <group>
      {/* Floor. The saturated blue is the one colour in the room, which is what makes the
          grey-and-white everything else read as sterile rather than merely dim. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[floorCx, OFFICE.floorY, floorCz]}
        receiveShadow
      >
        <planeGeometry args={[floorW, floorD]} />
        <meshStandardMaterial color="#1f7fd6" roughness={0.42} metalness={0} />
      </mesh>

      {/*
        Ceiling. Its underside faces away from every source in the environment map, so lit
        honestly it comes out the colour of the floor bounce — a blue ceiling. Real acoustic
        tile is pale because of interreflection the environment map does not model, so it gets
        a little emissive of its own to stand in for that.
      */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[floorCx, OFFICE.ceilingY, floorCz]}>
        <planeGeometry args={[floorW, floorD]} />
        <meshStandardMaterial
          color="#eef1f5"
          roughness={0.95}
          emissive="#c9d3de"
          emissiveIntensity={0.55}
        />
      </mesh>

      <CeilingLights />

      <instancedMesh ref={deskRef} args={[undefined, undefined, POD_COUNT]} castShadow receiveShadow>
        <boxGeometry args={[desk.w, desk.thickness, desk.d]} />
        <meshStandardMaterial color="#eceef0" roughness={0.55} metalness={0} />
      </instancedMesh>

      <instancedMesh ref={backRef} args={[undefined, undefined, POD_COUNT]} castShadow receiveShadow>
        <boxGeometry args={[OFFICE.pitchX, partition.h, partition.t]} />
        <meshStandardMaterial color="#dfe2e6" roughness={0.88} metalness={0} />
      </instancedMesh>

      <instancedMesh ref={sideRef} args={[undefined, undefined, POD_COUNT]} castShadow receiveShadow>
        <boxGeometry args={[OFFICE.pitchZ * 0.86, partition.h, partition.t]} />
        <meshStandardMaterial color="#dfe2e6" roughness={0.88} metalness={0} />
      </instancedMesh>

      {parts.map((p, i) => (
        <TerminalField key={i} part={p} pods={pods} />
      ))}
    </group>
  );
}

/**
 * One instanced copy of a single mesh from the terminal GLB, placed on every pod but the hero.
 *
 * The GLB's own node transform is baked into each instance matrix rather than applied to a
 * parent, so the instances land in exactly the space scene/constants.ts measures.
 */
function TerminalField({
  part,
  pods,
}: {
  part: { geometry: BufferGeometry; material: Material | Material[]; matrix: Matrix4 };
  pods: { x: number; z: number; hero: boolean }[];
}) {
  const ref = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const im = ref.current;
    if (!im) return;
    const m = new Matrix4();
    const offset = new Matrix4();
    let n = 0;
    for (const pod of pods) {
      if (pod.hero) continue; // the real one lives here
      offset.makeTranslation(pod.x, 0, pod.z);
      m.multiplyMatrices(offset, part.matrix);
      im.setMatrixAt(n++, m);
    }
    im.count = n;
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere();
  }, [part, pods]);

  return (
    <instancedMesh
      ref={ref}
      args={[part.geometry, part.material as Material, pods.length]}
      castShadow
      receiveShadow
    />
  );
}

/** Recessed fluorescent troffers, on the standard every-other-bay grid. */
function CeilingLights() {
  const ref = useRef<InstancedMesh>(null);

  const positions = useMemo(() => {
    const out: [number, number][] = [];
    for (let r = 0; r < OFFICE.rows; r += OFFICE.lightEveryZ) {
      for (let c = 0; c < OFFICE.cols; c += OFFICE.lightEveryX) {
        const [x, , z] = podOrigin(c, r);
        out.push([x + OFFICE.desk.center[0], z + OFFICE.desk.center[1] + OFFICE.pitchZ / 2]);
      }
    }
    return out;
  }, []);

  useLayoutEffect(() => {
    const im = ref.current;
    if (!im) return;
    const d = new Object3D();
    positions.forEach(([x, z], i) => {
      d.position.set(x, OFFICE.ceilingY - 0.02, z);
      d.updateMatrix();
      im.setMatrixAt(i, d.matrix);
    });
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere();
  }, [positions]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, positions.length]}>
      <boxGeometry args={[OFFICE.light.w, 0.05, OFFICE.light.d]} />
      {/* Emissive only — the actual lighting is the environment map and the key light.
          These exist so the ceiling reads, and so the CRT has something to reflect. */}
      <meshStandardMaterial
        color="#ffffff"
        emissive="#f4f8ff"
        emissiveIntensity={2.6}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

useGLTF.preload(MODEL, DRACO);
