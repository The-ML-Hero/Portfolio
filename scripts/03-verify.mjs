import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import sharp from 'sharp';

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});
const a = await io.read('stripped.glb');
const b = await io.read('terminal.opt.glb');

const pick = (doc) => doc.getRoot().listMaterials()[0];
const A0 = pick(a).getBaseColorTexture().getImage();
const B0 = pick(b).getBaseColorTexture().getImage();

const A = await sharp(Buffer.from(A0)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const B = await sharp(Buffer.from(B0)).removeAlpha().resize(A.info.width, A.info.height).raw().toBuffer({ resolveWithObject: true });
let se = 0;
for (let i = 0; i < A.data.length; i++) { const d = A.data[i] - B.data[i]; se += d * d; }
const mse = se / A.data.length;
const psnr = 10 * Math.log10((255 * 255) / mse);
console.log(`baseColor ${A.info.width}x${A.info.height}  MSE ${mse.toFixed(3)}  PSNR ${psnr.toFixed(2)} dB  ${psnr > 40 ? '→ visually lossless' : psnr > 35 ? '→ good' : '→ INSPECT MANUALLY'}`);

// Geometry survived draco?
for (const m of b.getRoot().listMeshes()) {
  const p = m.listPrimitives()[0];
  console.log(`  ${m.getName()}: ${p.getAttribute('POSITION').getCount()} verts, ${p.getIndices().getCount() / 3} tris`);
}
