import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { textureCompress, resample, prune, dedup, draco } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import sharp from 'sharp';

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    'draco3d.encoder': await draco3d.createEncoderModule(),
    'draco3d.decoder': await draco3d.createDecoderModule(),
  });

const doc = await io.read('stripped.glb');
const mat = doc.getRoot().listMaterials()[0];

// Base colour carries the chassis art and panel labels — keep it at 2K.
// MR and normal describe low-frequency surface response; 1K is indistinguishable here.
const mr = mat.getMetallicRoughnessTexture();
const nrm = mat.getNormalTexture();

await doc.transform(
  textureCompress({
    encoder: sharp,
    targetFormat: 'webp',
    quality: 96,
    slots: /baseColor/,
  }),
  textureCompress({
    encoder: sharp,
    targetFormat: 'webp',
    quality: 85,
    resize: [1024, 1024],
    slots: /metallicRoughness|normal/,
  }),
  resample(),
  dedup(),
  prune(),
  draco({ method: 'edgebreaker' }),
);

await io.write('terminal.opt.glb', doc);

const r = doc.getRoot();
for (const t of r.listTextures()) {
  console.log(`  ${t.getSize().join('x')} ${t.getMimeType()} ${(t.getImage().byteLength / 1024).toFixed(0)}KB`);
}
