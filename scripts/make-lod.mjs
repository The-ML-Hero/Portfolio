/**
 * Builds the distant-terminal LOD from the full model. Run when the model changes:
 *
 *   npm run lod
 *
 * The office draws 815 background terminals. At full detail that is 1.08M triangles a frame,
 * so they need a cheaper mesh — but it has to be the terminal, not a stand-in: a box reads as
 * a box even twenty pixels tall, which is what the first attempt at this looked like.
 *
 * Simplification keeps the silhouette and the UVs, so the output is paired with the full
 * model's own material in scene/Office.tsx and needs to carry no images of its own. That is
 * why the textures are stripped here — otherwise this file would ship a second copy of a
 * 1.2 MB atlas to save geometry.
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { simplify, prune, dedup } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import draco3d from 'draco3dgltf';

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});

const doc = await io.read('public/models/terminal.opt.glb');
const before = doc.getRoot().listMeshes().flatMap(m => m.listPrimitives())
  .reduce((n, p) => n + (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3, 0);

await doc.transform(
  simplify({ simplifier: MeshoptSimplifier, ratio: Number(process.env.RATIO ?? 0.08), error: Number(process.env.ERROR ?? 0.02) }),
);

// The LOD carries no images of its own: it is paired with the full model's material in code,
// and the UVs survive simplification, so the same texture fits.
for (const mat of doc.getRoot().listMaterials()) {
  mat.setBaseColorTexture(null).setMetallicRoughnessTexture(null).setNormalTexture(null)
     .setOcclusionTexture(null).setEmissiveTexture(null);
}
/* keepAttributes: the UVs look unused once the textures are gone, but the full model's
   material is applied to this geometry at runtime and needs them. */
await doc.transform(prune({ keepAttributes: true }), dedup());

const after = doc.getRoot().listMeshes().flatMap(m => m.listPrimitives())
  .reduce((n, p) => n + (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3, 0);

await io.write('public/models/terminal.lod.glb', doc);
console.log(`triangles ${before} -> ${after}`);
for (const m of doc.getRoot().listMeshes()) {
  for (const p of m.listPrimitives()) {
    console.log(' ', m.getName(), (p.getIndices()?.getCount() ?? 0) / 3, 'tris, uv:', !!p.getAttribute('TEXCOORD_0'));
  }
}
