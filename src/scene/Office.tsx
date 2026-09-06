import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import {
  Box3, BufferGeometry, InstancedMesh, Material, Matrix4, Mesh, Object3D, Vector3,
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

      <Terminals parts={parts} pods={pods} />
    </group>
  );
}

/**
 * The 815 background terminals, at two levels of detail.
 *
 * The model is 1,323 triangles. Drawn in full on every pod that was 1.08 M triangles a frame —
 * 97% of the scene — submitted whether a pod filled the screen, was twenty pixels tall, or was
 * behind the camera entirely: an InstancedMesh is culled as one object, so being off-screen
 * saved nothing. Seated at the hero desk cost exactly as much as the opening pan.
 *
 * So the real geometry goes only to the pods near the camera, and everything else is drawn as
 * two boxes. The boxes are sized from each part's own bounding box rather than from numbers
 * typed here, so they keep the terminal's silhouette and cannot drift if the model changes.
 * Nothing swaps within DETAIL_RADIUS, which is far enough out that a pod is a few dozen pixels
 * tall when it does.
 */
const DETAIL_MAX = 64;
const DETAIL_RADIUS = 22;
/** Only reselect once the camera has actually gone somewhere. */
const RESELECT_MOVE = 0.5;

function Terminals({
  parts,
  pods,
}: {
  parts: { geometry: BufferGeometry; material: Material | Material[]; matrix: Matrix4 }[];
  pods: { x: number; z: number; hero: boolean }[];
}) {
  const others = useMemo(() => pods.filter((p) => !p.hero), [pods]);

  /** Each part's world-space box, which is what the far proxy is built from. */
  const boxes = useMemo(
    () =>
      parts.map((p) => {
        const g = p.geometry.clone().applyMatrix4(p.matrix);
        g.computeBoundingBox();
        const bb = g.boundingBox ?? new Box3();
        const size = new Vector3();
        const centre = new Vector3();
        bb.getSize(size);
        bb.getCenter(centre);
        g.dispose();
        return { size, centre };
      }),
    [parts],
  );

  const detail = useRef<(InstancedMesh | null)[]>([]);
  const proxy = useRef<(InstancedMesh | null)[]>([]);
  const hidden = useRef<Set<number>>(new Set());
  const lastCam = useRef(new Vector3(Infinity, Infinity, Infinity));

  /* Every pod gets a proxy, written once. Near pods are hidden by zeroing their scale. */
  useLayoutEffect(() => {
    const d = new Object3D();
    boxes.forEach((box, b) => {
      const im = proxy.current[b];
      if (!im) return;
      others.forEach((pod, i) => {
        d.position.set(pod.x + box.centre.x, box.centre.y, pod.z + box.centre.z);
        d.scale.copy(box.size);
        d.updateMatrix();
        im.setMatrixAt(i, d.matrix);
      });
      im.count = others.length;
      im.instanceMatrix.needsUpdate = true;
      im.computeBoundingSphere();
    });
    hidden.current.clear();
  }, [boxes, others]);

  useFrame(({ camera }) => {
    if (camera.position.distanceToSquared(lastCam.current) < RESELECT_MOVE * RESELECT_MOVE) return;
    lastCam.current.copy(camera.position);

    /*
     * True distance, height included. Measuring it across the floor only meant the opening
     * pan — forty units up, but horizontally right above the middle of the field — promoted a
     * full detail budget of pods that were each a few pixels tall.
     */
    const cx = camera.position.x;
    const cy = camera.position.y - OFFICE.desk.top;
    const cz = camera.position.z;
    const d2 = (i: number) => (others[i].x - cx) ** 2 + cy * cy + (others[i].z - cz) ** 2;

    /*
     * And nothing behind the camera. Instances are culled as one object, so a pod at the back
     * of the room costs a full model however far outside the frame it is — seated at the desk
     * that was most of the budget spent on pods nobody can see. The margin keeps pods just
     * outside the frame detailed, so turning does not swap one in visibly.
     */
    camera.getWorldDirection(FORWARD);

    const near: number[] = [];
    for (let i = 0; i < others.length; i++) {
      if (d2(i) > DETAIL_RADIUS * DETAIL_RADIUS) continue;
      const dx = others[i].x - cx;
      const dz = others[i].z - cz;
      const ahead = dx * FORWARD.x + -cy * FORWARD.y + dz * FORWARD.z;
      if (ahead < -0.3 * Math.sqrt(d2(i))) continue;
      near.push(i);
    }
    if (near.length > DETAIL_MAX) {
      near.sort((a, b) => d2(a) - d2(b));
      near.length = DETAIL_MAX;
    }

    const want = new Set(near);
    const m = new Matrix4();
    const offset = new Matrix4();

    parts.forEach((part, b) => {
      const im = detail.current[b];
      if (!im) return;
      near.forEach((podIndex, n) => {
        offset.makeTranslation(others[podIndex].x, 0, others[podIndex].z);
        m.multiplyMatrices(offset, part.matrix);
        im.setMatrixAt(n, m);
      });
      im.count = near.length;
      im.instanceMatrix.needsUpdate = true;
    });

    /* Swap the proxies for exactly the pods whose detail state changed. */
    const d = new Object3D();
    const setProxy = (podIndex: number, show: boolean) => {
      boxes.forEach((box, b) => {
        const im = proxy.current[b];
        if (!im) return;
        const pod = others[podIndex];
        d.position.set(pod.x + box.centre.x, box.centre.y, pod.z + box.centre.z);
        d.scale.copy(show ? box.size : ZERO);
        d.updateMatrix();
        im.setMatrixAt(podIndex, d.matrix);
        im.instanceMatrix.needsUpdate = true;
      });
    };
    for (const i of want) if (!hidden.current.has(i)) setProxy(i, false);
    for (const i of hidden.current) if (!want.has(i)) setProxy(i, true);
    hidden.current = want;
  });

  return (
    <>
      {parts.map((p, i) => (
        <instancedMesh
          key={`d${i}`}
          ref={(el) => { detail.current[i] = el; }}
          args={[p.geometry, p.material as Material, DETAIL_MAX]}
          castShadow
          receiveShadow
        />
      ))}
      {boxes.map((_, i) => (
        <instancedMesh
          key={`p${i}`}
          ref={(el) => { proxy.current[i] = el; }}
          args={[undefined, undefined, others.length]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[1, 1, 1]} />
          {/* Stands in only at distance, where the model reads as a dark mass on a pale desk. */}
          <meshStandardMaterial color="#434a53" roughness={0.72} metalness={0} />
        </instancedMesh>
      ))}
    </>
  );
}

const ZERO = new Vector3(0, 0, 0);
const FORWARD = new Vector3();

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
