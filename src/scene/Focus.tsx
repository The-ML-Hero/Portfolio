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

/*
 * The beats, and where they land in the scroll.
 *
 * The first version of this put its heaviest defocus at scroll zero and racked in across the
 * title — which is precisely backwards. At scroll zero the word is at 1× and almost no room
 * shows through it, so the softest frame of the whole move was the one with nothing in it to
 * be soft; by the time the letterforms filled the screen the lens had already sharpened. Then
 * it held one value flat for four screens of traverse. The effect was real and essentially
 * invisible.
 *
 * So the defocus now DEEPENS as the word opens, is at its softest exactly when the room fills
 * the letterforms, and racks in afterwards over about a screen and a half — long enough to
 * watch at a normal scrolling pace rather than something a flick skips past.
 */

/** Word just cut: a sliver of room, held soft. */
const BOKEH_OPEN = 5;
/** Word filling the frame, and the handover to the room. The softest point of the move. */
const BOKEH_HANDOVER = 8;
/** The traverse. Near-deep: a shallow plane over a floor seen from forty units up is the
 *  tilt-shift miniature look, and this shot exists to say the room is enormous. */
const BOKEH_DEEP = 1.5;
/** Closed on one desk, where a real lens would be wide open and shallow. */
const BOKEH_SEAT = 2.6;

/** Depth of the sharp zone, in world units. */
const RANGE_OPEN = 2.4;
const RANGE_HANDOVER = 2;
const RANGE_DEEP = 24;
const RANGE_SEAT = 1.2;

/** Where the rack finishes, and where the field starts closing again — in camera progress. */
const RACK_ENDS = 0.3;
const CLOSE_BEGINS = 0.55;

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
      bokeh = lerp(BOKEH_OPEN, BOKEH_HANDOVER, k);
      range = lerp(RANGE_OPEN, RANGE_HANDOVER, k);
    } else {
      const cp = cameraProgress(raw);
      if (cp <= RACK_ENDS) {
        const k = smooth(cp / RACK_ENDS);
        bokeh = lerp(BOKEH_HANDOVER, BOKEH_DEEP, k);
        range = lerp(RANGE_HANDOVER, RANGE_DEEP, k);
      } else {
        const k = smooth(Math.min(1, Math.max(0, (cp - CLOSE_BEGINS) / (1 - CLOSE_BEGINS))));
        bokeh = lerp(BOKEH_DEEP, BOKEH_SEAT, k);
        range = lerp(RANGE_DEEP, RANGE_SEAT, k);
      }
    }

    effect.bokehScale = bokeh;
    const coc = effect.cocMaterial as unknown as {
      worldFocusDistance: number;
      worldFocusRange: number;
    };
    coc.worldFocusDistance = camera.position.distanceTo(focusTarget);
    coc.worldFocusRange = range;

    if (import.meta.env.DEV) {
      (window as unknown as { __lens: unknown }).__lens = {
        raw: +raw.toFixed(4), bokeh: +bokeh.toFixed(2), range: +range.toFixed(2),
        dist: +coc.worldFocusDistance.toFixed(2),
      };
    }
  });

  return (
    <DepthOfField
      ref={ref}
      /* Construction-only, so it is set once and never animated: changing it rebuilds the
         pass, which costs a compiled shader and a visible hitch mid-move. */
      resolutionScale={DEVICE.coarse ? 0.4 : 0.75}
      bokehScale={BOKEH_OPEN}
    />
  );
}
