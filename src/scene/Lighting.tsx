import { Environment, Lightformer } from '@react-three/drei';
import { OFFICE } from './constants';

/**
 * Sterile office lighting.
 *
 * The room is lit by an image-based environment rather than by lamps: a set of Lightformer
 * planes standing in for the ceiling's fluorescent troffers is rendered to a cube map, and
 * every surface samples it. That is what produces the flat, shadow-poor, faintly clinical look
 * — a couple of point lights cannot fake it, because the giveaway is not brightness but the
 * *size* of the sources. Big soft area sources overhead, and nothing at eye level.
 *
 * The environment is built in-scene rather than loaded from an .hdr, so there is no external
 * asset and nothing to fetch at runtime. If a measured office HDRI turns up later it drops
 * straight in as <Environment files="..."/> with these children removed.
 */
export function Lighting() {
  const ceiling = OFFICE.ceilingY;
  const gridW = OFFICE.cols * OFFICE.pitchX;
  const gridD = OFFICE.rows * OFFICE.pitchZ;

  return (
    <>
      <Environment resolution={256} frames={1}>
        {/* Ceiling: a bank of long troffers, which is what gives specular highlights their
            characteristic stretched-bar shape on the monitor glass and the desk edges. */}
        {[-0.62, -0.21, 0.21, 0.62].map((u) => (
          <Lightformer
            key={u}
            form="rect"
            intensity={2.4}
            color="#f2f6ff"
            position={[u * 18, ceiling + 1, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[3.2, 34, 1]}
          />
        ))}
        {/* Broad ceiling bounce, so the space between fittings is not black. */}
        <Lightformer
          form="rect"
          intensity={0.65}
          color="#e9eef6"
          position={[0, ceiling + 3, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[46, 46, 1]}
        />
        {/* Floor bounce. The blue floor is the only saturated surface in the room, and the
            faint cool cast it throws up onto the desk undersides is most of what stops the
            greys reading as flat paint. */}
        <Lightformer
          form="rect"
          intensity={0.5}
          color="#2f7fc8"
          position={[0, OFFICE.floorY - 1, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[46, 46, 1]}
        />
      </Environment>

      {/*
        One gentle key from overhead, purely so the floor gets contact shadows — without them
        280 desks read as floating. Kept weak and high: a strong directional would carve hard
        shadows that no ceiling-lit office has. The shadow camera covers the whole grid, which
        it can afford to because every pod is instanced and the shadow pass is a handful of
        draws.
      */}
      <directionalLight
        position={[gridW * 0.18, ceiling + 14, gridD * 0.12]}
        intensity={0.85}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0009}
        shadow-normalBias={0.02}
        shadow-camera-left={-gridW * 0.62}
        shadow-camera-right={gridW * 0.62}
        shadow-camera-top={gridD * 0.62}
        shadow-camera-bottom={-gridD * 0.62}
        shadow-camera-near={1}
        shadow-camera-far={ceiling + 40}
      />
      {/* Floor-level fill so shadowed undersides stay grey rather than going to black. */}
      <ambientLight intensity={0.18} color="#dfe7f2" />
    </>
  );
}
