import { useGLTF } from '@react-three/drei';
import { useLayoutEffect } from 'react';

const MODEL = '/models/terminal.opt.glb';
/** Self-hosted; the drei default pulls the decoder from gstatic at runtime. */
const DRACO = '/draco/';

/**
 * The Sketchfab terminal. Loaded as-is — its root matrix already resolves the FBX Z-up
 * export to Y-up with +Z toward the viewer, so no correction is applied here.
 * All placement constants in scene/constants.ts are expressed in that same space.
 */
export function Terminal() {
  const { scene } = useGLTF(MODEL, DRACO);

  useLayoutEffect(() => {
    scene.traverse((o) => {
      if ((o as { isMesh?: boolean }).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
  }, [scene]);

  return <primitive object={scene} dispose={null} />;
}

useGLTF.preload(MODEL, DRACO);
