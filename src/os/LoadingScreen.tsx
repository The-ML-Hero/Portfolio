import { useEffect, useState } from 'react';
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

/**
 * Per-stroke keyframes, generated from the real chord lengths so each one is drawn exactly
 * while the ball is on it. Written once at module load, not per render.
 */
const MARK_CSS = [
  ...STROKES.map((s, i) => {
    const from = (s.from * FLY).toFixed(2);
    const to = (s.to * FLY).toFixed(2);
    const start = s.from <= 0 ? '0%' : `0%, ${from}%`;
    return `@keyframes mk-s${i}{${start}{stroke-dashoffset:${s.len.toFixed(2)}}${to}%,100%{stroke-dashoffset:0}}`;
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
  useEffect(() => {
    if (progress < 100) return;
    const settle = setTimeout(() => setLeaving(true), 300);
    const done = setTimeout(onDone, 1560);
    return () => { clearTimeout(settle); clearTimeout(done); };
  }, [progress, onDone]);

  const pct = Math.min(100, Math.round(shown));
  const step = STEPS[Math.min(STEPS.length - 1, Math.floor((pct / 100) * STEPS.length))];

  return (
    <div className={`loader${leaving ? ' is-leaving' : ''}`}>
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
                  strokeDasharray: s.len,
                  strokeDashoffset: s.len,
                  animationName: `mk-s${i}`,
                }}
              />
            ))}
          </g>

          {/* Rides the whole flight, including the chord the trail does not record. */}
          <circle className="mk-ball" r="5.4" style={{ offsetPath: `path("${BALL_PATH}")` }} />
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
