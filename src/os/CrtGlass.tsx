import { useEffect, useRef } from 'react';

/**
 * Barrel distortion for the DOM screen.
 *
 * The Win95 desktop is real DOM composited above the WebGL canvas, so the tube's curve cannot
 * come from geometry — anything drawn in three.js renders behind it. Instead we warp the DOM
 * itself with an SVG feDisplacementMap whose displacement map is generated here on a canvas.
 *
 * Encoding: for a point at normalised offset (u,v) from centre, we sample from nearer the
 * centre as r grows, which bulges content outward the way a tube does.
 *   R = 0.5 − 0.5·rr·u,  G = 0.5 − 0.5·rr·v,  where rr = (u²+v²)/2
 * feDisplacementMap then reads displacement = SCALE·(channel − 0.5).
 *
 * SCALE is bounded by pointer accuracy: hit-testing uses the unwarped layout, so a large warp
 * desyncs clicks from what the viewer sees. Displacement is zero at the centre and peaks at the
 * corners, and the taskbar sits at bottom-centre where the vertical term is ~5px — well inside a
 * 22px-tall button. 20px is the most curve we can show without aiming becoming a problem.
 */
const MAP_SIZE = 128;
export const WARP_SCALE = 20;

function buildDisplacementMap(): string {
  const c = document.createElement('canvas');
  c.width = c.height = MAP_SIZE;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(MAP_SIZE, MAP_SIZE);
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      const u = (x / (MAP_SIZE - 1)) * 2 - 1;
      const v = (y / (MAP_SIZE - 1)) * 2 - 1;
      const rr = (u * u + v * v) / 2;
      const i = (y * MAP_SIZE + x) * 4;
      img.data[i] = Math.round(255 * Math.min(1, Math.max(0, 0.5 - 0.5 * rr * u)));
      img.data[i + 1] = Math.round(255 * Math.min(1, Math.max(0, 0.5 - 0.5 * rr * v)));
      img.data[i + 2] = 0;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL();
}

/** Injects the filter definition once. Rendered inside the screen, never visible itself. */
export function CrtFilterDefs() {
  const ref = useRef<SVGFEImageElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.setAttribute('href', buildDisplacementMap());
  }, []);
  return (
    <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }} aria-hidden>
      <defs>
        <filter id="crt-barrel" x="-4%" y="-4%" width="108%" height="108%" colorInterpolationFilters="sRGB">
          <feImage ref={ref} result="map" preserveAspectRatio="none" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale={WARP_SCALE}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
