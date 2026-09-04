# Asset pipeline

Reproduces `public/models/terminal.opt.glb` from the raw Sketchfab download.
Not run at build time — the optimized GLB is committed. Re-run only if the source model changes.

    cd scripts
    npm i --no-save @gltf-transform/core @gltf-transform/extensions \
                    @gltf-transform/functions draco3dgltf sharp
    cp ~/Downloads/computer_terminal.glb src.glb
    node 01-strip.mjs      # drop Sketchfab backdrop + shadow-catcher planes
    node 02-compress.mjs   # WebP textures + draco geometry
    node 03-verify.mjs     # PSNR check vs. the stripped original
    cp terminal.opt.glb ../public/models/

## Results

| stage | size |
|---|---|
| source | 14.5 MB |
| backdrop planes stripped | 13.9 MB |
| WebP + draco | **1.23 MB** |

Base colour stays 2048² at quality 96 (PSNR 40.4 dB vs. source — visually lossless); it carries the
chassis art. Metallic-roughness and normal drop to 1024² at quality 85 — they describe low-frequency
surface response and the difference is not visible on this model.

WebP rather than KTX2: no KTX toolchain (`ktx`/`toktx`/`basisu`) is installed on this machine and
adding one needs a system package. With two meshes and one material, GPU texture memory is not the
binding constraint, so the tradeoff is not worth a sudo install. If KTX2 is wanted later, swap the
`textureCompress` calls in `02-compress.mjs` for `toktx`.

## Model attribution

"Computer Terminal" by Chris Sweetwood — CC-BY-SA-4.0
https://sketchfab.com/3d-models/computer-terminal-b3a26b00c5b04eedad0a1cdca884130f

Surfaced in the Credits program. Required by the licence; do not remove.
