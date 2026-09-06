import { useFrame } from '@react-three/fiber';
import { DepthOfField } from '@react-three/postprocessing';
import type { DepthOfFieldEffect } from 'postprocessing';
import { useRef } from 'react';
import { DEVICE } from '../lib/device';
import { TITLE_SPAN, cameraProgress, scrollFraction, titleProgress } from '../lib/scrollZones';
import { focusTarget } from './CameraRig';

/**
 * The lens.
 *
 * Focus is pulled from the same scroll position that drives everything else, and it tracks
 * whatever the camera is actually pointed at — so the plane of focus is always the subject,
 * the way a focus puller would hold it, rather than a fixed distance the shot drifts out of.
 *
 * Three beats:
 *
 *  - The title. The room is barely open yet and sits far out of focus, so what shows through
 *    the letterforms reads as depth rather than as a picture behind a stencil. It racks in as
 *    the word opens.
 *  - The traverse. Nearly deep focus, deliberately. A shallow plane over a floor seen from
 *    forty units up is the tilt-shift miniature look, and the whole point of that shot is that
 *    the room is enormous — a hint of softness at the edges is as far as this goes.
 *  - The approach. The range closes as the camera does, so the field narrows onto one desk and
 *    the rest of the floor falls away. This is where it reads as a real lens.
 *
 * Only bokehScale and the coc material's world focus distance/range are written per frame;
 * everything else on DepthOfFieldEffect is construction-only and would rebuild the pass.
 */

/** Bokeh strength at each beat. */
const BOKEH_TITLE = 9;
const BOKEH_PAN = 1.8;
const BOKEH_SEAT = 1.5;

/** Depth of the sharp zone, in world units. Large is deep focus; small is a shallow lens. */
const RANGE_TITLE = 1.4;
const RANGE_PAN = 22;
const RANGE_SEAT = 1.5;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);

export function Focus() {
  const ref = useRef<DepthOfFieldEffect>(null);

  useFrame(({ camera }) => {
    const effect = ref.current;
    if (!effect) return;

    const raw = scrollFraction();
    let bokeh: number;
    let range: number;

    if (raw <= TITLE_SPAN) {
      const k = smooth(titleProgress(raw));
      bokeh = lerp(BOKEH_TITLE, BOKEH_PAN, k);
      range = lerp(RANGE_TITLE, RANGE_PAN, k);
    } else {
      /* Held flat across the traverse, then pulled in over the descent — the same split the
         camera's own FOV uses, so the lens and the move arrive together. */
      const k = smooth(Math.min(1, Math.max(0, (cameraProgress(raw) - 0.5) / 0.5)));
      bokeh = lerp(BOKEH_PAN, BOKEH_SEAT, k);
      range = lerp(RANGE_PAN, RANGE_SEAT, k);
    }

    effect.bokehScale = bokeh;
    const coc = effect.cocMaterial as unknown as {
      worldFocusDistance: number;
      worldFocusRange: number;
    };
    coc.worldFocusDistance = camera.position.distanceTo(focusTarget);
    coc.worldFocusRange = range;
  });

  return (
    <DepthOfField
      ref={ref}
      /* Construction-only, so it is set once and never animated: changing it rebuilds the
         pass, which costs a compiled shader and a visible hitch mid-move. */
      resolutionScale={DEVICE.coarse ? 0.4 : 0.75}
      bokehScale={BOKEH_TITLE}
    />
  );
}
