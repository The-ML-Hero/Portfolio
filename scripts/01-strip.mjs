// Remove the Sketchfab studio backdrop + shadow catcher planes; we light our own room.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, dedup, weld } from '@gltf-transform/functions';

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read('src.glb');
const root = doc.getRoot();

const DROP = ['ShadowMaterial', 'BackgroundMaterial'];
for (const mesh of root.listMeshes()) {
  const mats = mesh.listPrimitives().map((p) => p.getMaterial()?.getName());
  if (mats.some((m) => DROP.includes(m))) {
    // Detach every node referencing this mesh, then dispose it.
    for (const node of root.listNodes()) {
      if (node.getMesh() === mesh) node.dispose();
    }
    mesh.dispose();
    console.log('dropped mesh:', mesh.getName(), mats.join(','));
  }
}
for (const mat of root.listMaterials()) {
  if (DROP.includes(mat.getName())) { mat.dispose(); console.log('dropped material:', mat.getName()); }
}

await doc.transform(prune(), dedup(), weld());
await io.write('stripped.glb', doc);

const r2 = doc.getRoot();
console.log('remaining meshes:', r2.listMeshes().map((m) => m.getName()));
console.log('remaining materials:', r2.listMaterials().map((m) => m.getName()));
console.log('remaining textures:', r2.listTextures().map((t) => `${t.getName()||'?'} ${t.getMimeType()} ${(t.getImage().byteLength/1048576).toFixed(2)}MB`));
