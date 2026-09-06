import { useEffect, useState } from 'react';
import { OFFICE } from '../scene/constants';
import '../styles/loader.css';

const STEPS = [
  'Initialising video adapter',
  'Allocating texture memory',
  'Decompressing terminal.opt.glb',
  'Building draco index',
  'Linking shader programs',
  'Warming phosphor',
];

/**
 * Site-level loader. Distinct from the in-world BIOS POST that plays on the CRT afterwards:
 * this one covers the WebGL context and model load, before there is anything to look at.
 *
 * It is printed on the same paper as the title card underneath it — same stock, same cubicle
 * plan at the room's own 34 × 24 — so when it leaves, only the panel goes. The sheet stays,
 * and the word opens through the sheet the loader was already drawn on. No cut, no flash of
 * room in between.
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
    const settle = setTimeout(() => setLeaving(true), 420);
    const done = setTimeout(onDone, 1040);
    return () => { clearTimeout(settle); clearTimeout(done); };
  }, [progress, onDone]);

  const pct = Math.min(100, Math.round(shown));
  const step = STEPS[Math.min(STEPS.length - 1, Math.floor((pct / 100) * STEPS.length))];

  return (
    <div className={`loader${leaving ? ' is-leaving' : ''}`}>
      <div className="loader-inner">
        <div className="loader-head">
          <span>Abnb Systems</span>
          <span className="loader-floor">Floor 03</span>
        </div>

        <div className="loader-title">Portfolio Terminal</div>

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
    </div>
  );
}
