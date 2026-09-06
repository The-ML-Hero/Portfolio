import { useEffect, useRef } from 'react';
import { OFFICE } from '../scene/constants';
import { scrollFraction, titleProgress } from '../lib/scrollZones';
import '../styles/title.css';

/**
 * Title card, shown once the assets are in and before the visitor takes the camera.
 *
 * The reveal is *scrolled*, not played. Growing the letterforms on a timer made the card a
 * thing that happened at you; driven by scroll it is the first stretch of the same gesture
 * that then flies the camera across the floor, so opening the title and entering the room are
 * one continuous movement with no seam where one ends and the other starts.
 *
 * The card is not laid over the room — it is cut out of it. A sheet of paper covers the
 * viewport and the word PORTFOLIO is a *hole* in that sheet, so the office is already visible,
 * live and full size, inside the letterforms before it is visible anywhere else. The sheet
 * carries the cubicle plan at the room's own 34 × 24, and the word is opened by 34 vertical
 * slats — one per column of that grid. When the card leaves, the holes scale up and the room
 * arrives through the type rather than after it.
 *
 * It mounts before the loader does its work and sits *underneath* it, on the same paper. The
 * loader leaving is therefore not a cut to the room — it is a panel lifting off a sheet that
 * was always there. `armed` is what the loader's departure switches on: until then the sheet
 * is blank and solid, the slats have not cut the word, and no scroll is read. Mounting the
 * card only after the loader had finished fading meant the room was briefly the only thing
 * on screen, which gave the reveal away before it started.
 *
 * Everything animates in CSS. Nothing here runs a rAF loop, because the WebGL scene behind it
 * is already loading and compiling and does not need the competition.
 */

const WORD = 'PORTFOLIO';
const YEAR = '2026';
/** Their preferred byline form. The brief also uses "Adithya A. Sherwood" for published work. */
const NAME = 'A. ADITHYA SHERWOOD';

/** One slat per column of the office grid — the link is literal, not decorative. */
const SLATS = OFFICE.cols;

/**
 * How the scrolled progress maps to what you see. Each is a plain function of p (0..1) rather
 * than a keyframe, because p goes backwards as readily as forwards — the card re-closes if you
 * scroll back up, right until it is fully open.
 */
/** Ease-in on the scale: it creeps, then rushes, the shape of a camera accelerating. */
const scaleAt = (p: number) => 1 + 51 * Math.pow(p, 2.2);
/** The veil has to be gone before the holes are, or the room arrives looking dirty. */
const veilAt = (p: number) => 0.55 * (1 - smoothstep(0, 0.72, p));
/** Small type steps aside early — it is about to be behind a fifty-times letterform. */
const smallAt = (p: number) => 1 - clamp01(p / 0.22);
/** Whatever paper is still on screen at the end fades, so the reveal finishes clean. */
const sheetAt = (p: number) => 1 - smoothstep(0.6, 0.98, p);
/** The outline cannot survive being scaled 50× — it goes early and quietly. */
const outlineAt = (p: number) => 0.55 * (1 - clamp01(p / 0.28));

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
function smoothstep(a: number, b: number, v: number) {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
}

export function TitleCard({
  onDone,
  hold,
  armed,
}: {
  onDone: () => void;
  hold?: boolean;
  /** The loader has gone: cut the word, run the entrance, start reading scroll. */
  armed?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const done = useRef(false);

  useEffect(() => {
    if (hold || !armed) return;
    const el = ref.current;
    if (!el) return;

    let frame = 0;
    const apply = () => {
      frame = 0;
      const p = titleProgress(scrollFraction());

      el.style.setProperty('--tc-scale', scaleAt(p).toFixed(3));
      el.style.setProperty('--tc-veil', veilAt(p).toFixed(3));
      el.style.setProperty('--tc-small', smallAt(p).toFixed(3));
      el.style.setProperty('--tc-sheet', sheetAt(p).toFixed(3));
      el.style.setProperty('--tc-outline', outlineAt(p).toFixed(3));

      // Any scroll at all snaps the slats open. They take under a second, but a visitor who
      // scrolls immediately would otherwise be growing letterforms that are not cut yet.
      if (p > 0) el.dataset.opened = '';

      if (p >= 1 && !done.current) {
        done.current = true;
        onDone();
      }
    };

    // Coalesce to one write per frame: scroll fires far more often than the page repaints.
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [onDone, hold, armed]);

  return (
    <div
      ref={ref}
      className={`title-card${armed || hold ? ' is-armed' : ''}`}
      aria-label={`Portfolio ${YEAR}, ${NAME}`}
    >
      {/*
        The sheet. Its paper and its plan grid are one masked group, so the word knocks a hole
        through both at once — a grid line cannot survive inside a letter.
      */}
      <svg className="tc-sheet" width="100%" height="100%" aria-hidden focusable="false">
        <defs>
          <pattern id="tc-plan" width={`${100 / OFFICE.cols}%`} height={`${100 / OFFICE.rows}%`}>
            <path d="M0 0 H10000 M0 0 V10000" stroke="rgba(16,36,58,0.13)" strokeWidth="1" fill="none" />
          </pattern>

          <clipPath id="tc-slats" clipPathUnits="userSpaceOnUse">
            {Array.from({ length: SLATS }, (_, i) => (
              <rect
                key={i}
                className="tc-slat"
                style={{ '--i': i } as React.CSSProperties}
                x={`${(i / SLATS) * 100}%`}
                y="0"
                /* A hair of overlap, or the slats leave seams down the letterforms. */
                width={`${100 / SLATS + 0.04}%`}
                height="100%"
              />
            ))}
          </clipPath>

          <mask id="tc-knockout">
            <rect width="100%" height="100%" fill="#fff" />
            {/* Black paints the hole. Clipped by the slats, so it opens column by column. */}
            <text className="tc-cut" x="50%" y="50%" clipPath="url(#tc-slats)">
              {WORD}
            </text>
          </mask>
        </defs>

        <g mask="url(#tc-knockout)">
          <rect className="tc-paper" width="100%" height="100%" />
          <rect width="100%" height="100%" fill="url(#tc-plan)" />
        </g>

        {/*
          Outline on top of the sheet. The office behind is mostly white partitions, so the
          letterforms need an edge of their own or they dissolve wherever a desk sits behind
          them. It rides the same transform as the hole, so the two never drift apart.
        */}
        <text className="tc-cut tc-outline" x="50%" y="50%" clipPath="url(#tc-slats)">
          {WORD}
        </text>
      </svg>

      <div className="tc-inner">
        <div className="tc-year" aria-hidden>
          {YEAR.split('').map((d, i) => (
            <Digit key={i} value={Number(d)} index={i} />
          ))}
        </div>

        <div className="tc-name">{NAME}</div>

        <div className="tc-meta">
          <span>{OFFICE.cols * OFFICE.rows} WORKSTATIONS</span>
          <i />
          <span>ONE OCCUPIED</span>
        </div>
      </div>
    </div>
  );
}

/**
 * One odometer digit: a column of 0–9 three times over, wound two full turns and landing on
 * its value. Two cycles rather than one so the settle reads as a deceleration, not a jump.
 *
 * The reel must stop on a row whose printed digit IS the value, so the travel is `value + 20`
 * rows, not `20 − value` — the latter lands on (20 − value) % 10, which spells 8084 for 2026.
 */
const REEL_ROWS = 31;

function Digit({ value, index }: { value: number; index: number }) {
  return (
    <span className="tc-digit" style={{ '--d': value, '--n': index } as React.CSSProperties}>
      <span className="tc-reel">
        {Array.from({ length: REEL_ROWS }, (_, i) => (
          <b key={i}>{i % 10}</b>
        ))}
      </span>
    </span>
  );
}
