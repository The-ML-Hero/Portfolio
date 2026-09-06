import { useCallback, useEffect, useRef, useState } from 'react';
import { OFFICE } from '../scene/constants';
import { BALL_PATH, STROKES, VIEW, C, R } from '../lib/markA';
import '../styles/loader.css';

const STEPS = [
  'Initialising video adapter',
  'Allocating texture memory',
  'Decompressing terminal.opt.glb',
  'Building draco index',
  'Linking shader programs',
  'Warming phosphor',
];

/** Share of each cycle spent flying; the rest holds the finished mark, then clears it. */
const FLY = 78;
const HOLD = 92;

/** One full cycle. Kept here rather than in the stylesheet: the exit timing is derived from it. */
const CYCLE_MS = 2900;
/** When the ball lands on the last point and the A is closed. */
const FLY_MS = (CYCLE_MS * FLY) / 100;
/** A beat on the finished mark before the white takes it. */
const BEAT_MS = 260;

/**
 * Slack on each stroke's dash pattern. Two problems, one number.
 *
 * `stroke-dasharray: L` on a path of length L is not "one dash" — it is a repeating pattern of
 * L on, L off, so pushing the first dash off the start pulls the next one in at the end, and
 * the stroke shows a stub at its far end before it is drawn. Giving the gap `L + 2·CAP` makes
 * the pattern longer than the path, so only one dash can ever touch it. The offset then parks
 * that dash CAP units clear of the start, which is also what hides the round cap — otherwise
 * half of one pokes out as a dot on the ring where the crossbar has not arrived yet.
 */
const CAP = 8;

/**
 * Per-stroke keyframes, generated from the real chord lengths so each one is drawn exactly
 * while the ball is on it. Written once at module load, not per render.
 */
const MARK_CSS = [
  ...STROKES.map((s, i) => {
    const from = (s.from * FLY).toFixed(2);
    const to = (s.to * FLY).toFixed(2);
    const start = s.from <= 0 ? '0%' : `0%, ${from}%`;
    return `@keyframes mk-s${i}{${start}{stroke-dashoffset:${(s.len + CAP).toFixed(2)}}${to}%,100%{stroke-dashoffset:0}}`;
  }),
  `@keyframes mk-ball{0%{offset-distance:0%;opacity:0}3%{opacity:1}${FLY}%{offset-distance:100%}${HOLD}%{offset-distance:100%;opacity:1}100%{offset-distance:100%;opacity:0}}`,
  `@keyframes mk-fade{0%,${HOLD}%{opacity:1}100%{opacity:0}}`,
].join('\n');

/**
 * Site-level loader. Distinct from the in-world BIOS POST that plays on the CRT afterwards:
 * this one covers the WebGL context and model load, before there is anything to look at.
 *
 * A ball bounces inside a ring and its trail spells the A of the name. Geometry and the reason
 * the pen lifts once are in lib/markA.ts. It loops for as long as the load takes, then the
 * ball's own ring floods white across the viewport and the white settles onto the title card's
 * paper — which is the same colour, so the flood ends on the sheet the word opens through.
 *
 * `progress` is real (drei's useProgress, passed in), but it is floored by a minimum dwell so
 * a warm cache doesn't flash the panel for three frames and look like a glitch.
 */
export function LoadingScreen({ progress, onDone }: { progress: number; onDone: () => void }) {
  const [shown, setShown] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const ball = useRef<SVGCircleElement>(null);

  /**
   * Is the ball sitting on a closed A? Read off the ball's own animation, which is the only
   * clock that tracks what is on screen: a browser that is not painting the page does not
   * advance it, so a page opened in a background tab still gets its mark drawn when the
   * visitor looks at it, instead of having splashed to white while nobody was watching.
   *
   * Under reduced motion the ball is invisible but its animation still runs, purely so this
   * keeps working.
   */
  const closed = useCallback(() => {
    const anim = ball.current?.getAnimations?.()[0];
    const t = anim?.currentTime;
    // No animation to wait on (unsupported, or none running): nothing to hold for.
    if (typeof t !== 'number') return true;
    return t % CYCLE_MS >= FLY_MS;
  }, []);

  // Ease the bar toward real progress so it never jumps or stalls at a hard number.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setShown((s) => s + (progress - s) * 0.08);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progress]);

  /*
   * Dismissal is driven by a timer, not by the eased bar reaching 98. The easing runs on rAF,
   * which browsers throttle in backgrounded or occluded tabs — gating on it meant the loader
   * could sit forever on a page that had actually finished loading.
   */
  /*
   * The loader does not leave the moment the assets are in — it leaves when the mark is
   * finished. Cutting to white mid-flight threw away the only thing the loader is for, and on
   * a warm cache that was every time. Worst case this holds the page for one more pass of the
   * A; the mark is the point, so that is the right trade.
   */
  useEffect(() => {
    if (progress < 100) return;
    let raf = 0;
    let beat = 0;
    const go = () => {
      beat = window.setTimeout(() => setLeaving(true), BEAT_MS);
    };
    const poll = () => {
      if (closed()) go();
      else raf = requestAnimationFrame(poll);
    };
    poll();
    /*
     * Never wedge on the mark. A painting tab reaches the closed window inside one cycle, so
     * this only fires when the animation is not running at all — and it is deliberately far
     * past that, because leaving on this path is the mid-draw cut the whole gate exists to
     * prevent, and it is better to hold a page nobody is looking at than to spend the mark.
     */
    const bail = setTimeout(go, 15000);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(beat);
      clearTimeout(bail);
    };
  }, [progress, closed]);

  /* Unmount only once the flood has covered the page and settled onto the card underneath. */
  useEffect(() => {
    if (!leaving) return;
    const done = setTimeout(onDone, 1260);
    return () => clearTimeout(done);
  }, [leaving, onDone]);

  const pct = Math.min(100, Math.round(shown));
  const step = STEPS[Math.min(STEPS.length - 1, Math.floor((pct / 100) * STEPS.length))];

  return (
    <div
      className={`loader${leaving ? ' is-leaving' : ''}`}
      style={{ '--mk-cycle': `${CYCLE_MS}ms` } as React.CSSProperties}
    >
      <style>{MARK_CSS}</style>

      <div className="loader-inner">
        <svg className="loader-mark" viewBox={`0 0 ${VIEW} ${VIEW}`} aria-hidden focusable="false">
          <circle className="mk-ring" cx={C} cy={C} r={R} />

          <g className="mk-trail">
            {STROKES.map((s, i) => (
              <path
                key={i}
                className="mk-stroke"
                d={s.d}
                style={{
                  strokeDasharray: `${s.len} ${s.len + 2 * CAP}`,
                  strokeDashoffset: s.len + CAP,
                  animationName: `mk-s${i}`,
                }}
              />
            ))}
          </g>

          {/* Rides the whole flight, including the chord the trail does not record. */}
          <circle ref={ball} className="mk-ball" r="5.4" style={{ offsetPath: `path("${BALL_PATH}")` }} />
        </svg>

        <div className="loader-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="loader-fill" style={{ transform: `scaleX(${pct / 100})` }} />
        </div>

        <div className="loader-status">
          <span className="loader-step">{step}<span className="dots" /></span>
          <span className="loader-pct">{String(pct).padStart(3, '0')}%</span>
        </div>

        <div className="loader-foot">
          <span>{OFFICE.cols * OFFICE.rows} workstations</span>
          <i />
          <span>one occupied</span>
        </div>
      </div>

      {/* The flood. Starts at the ring, ends past every corner. */}
      <div className="loader-splash" />
    </div>
  );
}
