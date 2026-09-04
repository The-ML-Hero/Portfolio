import { useEffect, useRef, useState } from 'react';
import { OFFICE } from '../scene/constants';
import '../styles/title.css';

/**
 * Title card, shown once the assets are in and before the visitor takes the camera.
 *
 * The card is not laid over the room — it is cut out of it. A sheet of paper covers the
 * viewport and the word PORTFOLIO is a *hole* in that sheet, so the office is already visible,
 * live and full size, inside the letterforms before it is visible anywhere else. The sheet
 * carries the cubicle plan at the room's own 34 × 24, and the word is opened by 34 vertical
 * slats — one per column of that grid. When the card leaves, the holes scale up and the room
 * arrives through the type rather than after it.
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

/** Total run time before it leaves on its own, in ms. Kept short — it is a title, not a film. */
const DWELL = 3400;
const EXIT_MS = 980;

export function TitleCard({ onDone, hold }: { onDone: () => void; hold?: boolean }) {
  const [leaving, setLeaving] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    if (hold) return;
    const finish = () => {
      if (done.current) return;
      done.current = true;
      setLeaving(true);
      window.setTimeout(onDone, EXIT_MS);
    };

    /*
     * Only start counting once the tab is actually being looked at. Chrome pauses CSS
     * animations in a hidden tab but keeps timers running, so a background-tab load would
     * otherwise spend the card's whole run on a blank screen and dismiss it before the
     * visitor ever switched over.
     */
    let timer = 0;
    const start = () => {
      if (timer || document.visibilityState !== 'visible') return;
      timer = window.setTimeout(finish, DWELL);
    };
    start();
    document.addEventListener('visibilitychange', start);

    // Always skippable. A title card that holds someone hostage is just a loading screen.
    const opts = { passive: true } as const;
    window.addEventListener('wheel', finish, opts);
    window.addEventListener('touchstart', finish, opts);
    window.addEventListener('keydown', finish);
    window.addEventListener('pointerdown', finish);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', start);
      window.removeEventListener('wheel', finish);
      window.removeEventListener('touchstart', finish);
      window.removeEventListener('keydown', finish);
      window.removeEventListener('pointerdown', finish);
    };
  }, [onDone, hold]);

  return (
    <div
      className="title-card"
      data-leaving={leaving || undefined}
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
