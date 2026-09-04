/**
 * Win95-era icons drawn as inline SVG on a 32×32 grid with shape-rendering:crispEdges,
 * so they stay hard-pixelled at any scale. Emoji read as modern and broke the period look.
 */
import type { ReactNode } from 'react';

const S = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 32 32" width="32" height="32" shapeRendering="crispEdges" style={{ display: 'block' }}>
    {children}
  </svg>
);

/** Sheet of paper with a folded corner. */
export const IconDoc = () => (
  <S>
    <path d="M6 2h14l6 6v22H6z" fill="#fff" stroke="#000" strokeWidth="1" />
    <path d="M20 2v6h6" fill="#c0c0c0" stroke="#000" strokeWidth="1" />
    <g fill="#808080">
      <rect x="9" y="12" width="14" height="1" /><rect x="9" y="15" width="14" height="1" />
      <rect x="9" y="18" width="14" height="1" /><rect x="9" y="21" width="10" height="1" />
    </g>
  </S>
);

/** Manila folder. */
export const IconFolder = () => (
  <S>
    <path d="M2 7h11l3 3h14v18H2z" fill="#ffd75e" stroke="#000" strokeWidth="1" />
    <path d="M2 12h28v16H2z" fill="#ffe89a" stroke="#000" strokeWidth="1" />
  </S>
);

/** CRT on a stand — used for System Properties / My Computer. */
export const IconMonitor = () => (
  <S>
    <rect x="3" y="4" width="26" height="18" fill="#c0c0c0" stroke="#000" strokeWidth="1" />
    <rect x="5" y="6" width="22" height="13" fill="#2a7d8c" stroke="#000" strokeWidth="1" />
    <rect x="6" y="7" width="20" height="4" fill="#3fa3b5" />
    <rect x="12" y="22" width="8" height="4" fill="#a0a0a0" stroke="#000" strokeWidth="1" />
    <rect x="7" y="26" width="18" height="3" fill="#c0c0c0" stroke="#000" strokeWidth="1" />
  </S>
);

/** Magnifier over a document — search. */
export const IconSearch = () => (
  <S>
    <path d="M6 2h12l5 5v10H6z" fill="#fff" stroke="#000" strokeWidth="1" />
    <g fill="#808080"><rect x="9" y="9" width="9" height="1" /><rect x="9" y="12" width="9" height="1" /></g>
    <circle cx="18" cy="20" r="7" fill="#bfe6ff" stroke="#000" strokeWidth="1" />
    <circle cx="18" cy="20" r="4" fill="#e8f6ff" stroke="#5a5a5a" strokeWidth="1" />
    <rect x="23" y="25" width="6" height="3" transform="rotate(45 23 25)" fill="#404040" stroke="#000" strokeWidth="1" />
  </S>
);

/** Wireframe cube — the raymarcher. */
export const IconCube = () => (
  <S>
    <path d="M16 3l12 6v14l-12 6-12-6V9z" fill="#1b2a45" stroke="#000" strokeWidth="1" />
    <path d="M16 3l12 6-12 6-12-6z" fill="#3d6ba8" stroke="#000" strokeWidth="1" />
    <path d="M16 15v14l12-6V9z" fill="#27466f" stroke="#000" strokeWidth="1" />
    <g stroke="#7fb6ff" strokeWidth="1" fill="none"><path d="M16 15v14M4 9l12 6M28 9L16 15" /></g>
  </S>
);

/** Head and shoulders — About. */
export const IconPerson = () => (
  <S>
    <rect x="3" y="3" width="26" height="26" fill="#fff" stroke="#000" strokeWidth="1" />
    <circle cx="16" cy="13" r="5" fill="#e8b98a" stroke="#000" strokeWidth="1" />
    <path d="M6 28c0-6 4-9 10-9s10 3 10 9z" fill="#4a6fa5" stroke="#000" strokeWidth="1" />
  </S>
);

/** Octocat-ish silhouette on a disc. */
export const IconGithub = () => (
  <S>
    <circle cx="16" cy="16" r="13" fill="#1a1a1a" stroke="#000" strokeWidth="1" />
    <path d="M16 7c-5 0-9 4-9 9 0 4 2.6 7.4 6.2 8.6.45.08.6-.2.6-.44v-1.5c-2.5.55-3-1.2-3-1.2-.4-1-1-1.3-1-1.3-.85-.6.06-.58.06-.58.9.06 1.4.95 1.4.95.82 1.4 2.15 1 2.7.77.08-.6.32-1 .58-1.25-2-.22-4.1-1-4.1-4.45 0-1 .35-1.8.93-2.44-.1-.23-.4-1.15.08-2.4 0 0 .76-.24 2.5.93a8.6 8.6 0 014.55 0c1.74-1.17 2.5-.93 2.5-.93.48 1.25.18 2.17.09 2.4.58.64.92 1.45.92 2.44 0 3.46-2.1 4.22-4.11 4.44.33.28.62.83.62 1.67v2.47c0 .24.15.53.61.44A9.01 9.01 0 0025 16c0-5-4-9-9-9z" fill="#fff" />
  </S>
);

/** Clipboard — resume. */
export const IconResume = () => (
  <S>
    <rect x="5" y="4" width="22" height="26" fill="#c9a06a" stroke="#000" strokeWidth="1" />
    <rect x="8" y="7" width="16" height="20" fill="#fff" stroke="#000" strokeWidth="1" />
    <rect x="12" y="2" width="8" height="5" fill="#a0a0a0" stroke="#000" strokeWidth="1" />
    <g fill="#606060">
      <rect x="10" y="11" width="12" height="1" /><rect x="10" y="14" width="12" height="1" />
      <rect x="10" y="17" width="12" height="1" /><rect x="10" y="20" width="8" height="1" />
    </g>
  </S>
);

/** Flask — research. */
export const IconResearch = () => (
  <S>
    <rect x="3" y="3" width="26" height="26" fill="#fff" stroke="#000" strokeWidth="1" />
    <path d="M13 6h6v8l6 11H7l6-11z" fill="#bfe6ff" stroke="#000" strokeWidth="1" />
    <path d="M9.5 21h13l2.5 4H7z" fill="#2f8f5b" stroke="#000" strokeWidth="1" />
    <rect x="12" y="4" width="8" height="2" fill="#a0a0a0" stroke="#000" strokeWidth="1" />
  </S>
);

/** Envelope — contact. */
export const IconMail = () => (
  <S>
    <rect x="3" y="7" width="26" height="18" fill="#fff" stroke="#000" strokeWidth="1" />
    <path d="M3 7l13 10L29 7" fill="none" stroke="#000" strokeWidth="1" />
    <path d="M3 25l9-8M29 25l-9-8" fill="none" stroke="#808080" strokeWidth="1" />
  </S>
);

/** Info bubble — credits. */
export const IconInfo = () => (
  <S>
    <circle cx="16" cy="16" r="13" fill="#fff" stroke="#000" strokeWidth="1" />
    <circle cx="16" cy="16" r="11" fill="#0a3f8f" />
    <rect x="14" y="8" width="4" height="4" fill="#fff" />
    <rect x="14" y="14" width="4" height="10" fill="#fff" />
  </S>
);

export const ICONS = {
  doc: IconDoc,
  folder: IconFolder,
  monitor: IconMonitor,
  search: IconSearch,
  cube: IconCube,
  person: IconPerson,
  github: IconGithub,
  resume: IconResume,
  research: IconResearch,
  mail: IconMail,
  info: IconInfo,
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 32 }: { name: IconName; size?: number }) {
  const C = ICONS[name];
  return (
    <span style={{ width: size, height: size, display: 'block' }}>
      <span style={{ display: 'block', width: 32, height: 32, transform: `scale(${size / 32})`, transformOrigin: 'top left' }}>
        <C />
      </span>
    </span>
  );
}
