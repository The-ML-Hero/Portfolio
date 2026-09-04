import { create } from 'zustand';

/** Camera/scene phase. The screen only accepts input while `seated`. */
export type Phase = 'booting' | 'idle' | 'seated';

/** Boot text → splash → desktop. Drives BootSequence, independent of camera phase. */
export type BootStage = 'idle-wait' | 'post' | 'splash' | 'ready';

export type ProgramId =
  | 'readme'
  | 'projects'
  | 'research'
  | 'resume'
  | 'raymarcher'
  | 'atlas'
  | 'contact'
  | 'sysprops'
  | 'credits'
  | 'about'
  | 'github'
  | 'project-detail';

export interface WindowState {
  /** Unique per open window; program windows are singletons except project-detail. */
  id: string;
  program: ProgramId;
  title: string;
  /** Set for project-detail windows. */
  arg?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  /** Pre-maximize geometry, restored on unmaximize. */
  restore?: { x: number; y: number; w: number; h: number };
}

interface OSState {
  phase: Phase;
  bootStage: BootStage;
  windows: WindowState[];
  focusedId: string | null;
  startOpen: boolean;
  muted: boolean;
  nextZ: number;
  /** Monotonic counter for window ids. */
  seq: number;

  setPhase: (p: Phase) => void;
  setBootStage: (s: BootStage) => void;
  open: (program: ProgramId, opts?: { title?: string; arg?: string }) => void;
  close: (id: string) => void;
  focus: (id: string) => void;
  minimize: (id: string) => void;
  toggleMaximize: (id: string, bounds: { w: number; h: number }) => void;
  move: (id: string, x: number, y: number) => void;
  resize: (id: string, w: number, h: number) => void;
  setStartOpen: (v: boolean) => void;
  toggleMute: () => void;
}

/** Default geometry per program. Cascade offset is applied on open. */
const DEFAULTS: Record<ProgramId, { w: number; h: number; title: string }> = {
  readme: { w: 400, h: 286, title: 'README.txt — Notepad' },
  projects: { w: 500, h: 350, title: 'Projects' },
  research: { w: 520, h: 400, title: 'Research' },
  resume: { w: 470, h: 400, title: 'Resume' },
  raymarcher: { w: 470, h: 370, title: 'Raymarcher.exe' },
  atlas: { w: 520, h: 380, title: 'Atlas.exe' },
  contact: { w: 340, h: 200, title: 'Contact' },
  sysprops: { w: 420, h: 360, title: 'System Properties' },
  credits: { w: 400, h: 260, title: 'Credits' },
  about: { w: 460, h: 380, title: 'About Me' },
  github: { w: 500, h: 400, title: 'GitHub' },
  'project-detail': { w: 480, h: 370, title: 'Project' },
};

export const useOS = create<OSState>((set) => ({
  phase: 'booting',
  bootStage: 'idle-wait',
  windows: [],
  focusedId: null,
  startOpen: false,
  muted: true,
  nextZ: 10,
  seq: 0,

  setPhase: (phase) => set({ phase }),
  setBootStage: (bootStage) => set({ bootStage }),

  open: (program, opts) =>
    set((s) => {
      // Singleton programs re-focus instead of opening a second copy.
      if (program !== 'project-detail') {
        const existing = s.windows.find((w) => w.program === program);
        if (existing) {
          return {
            windows: s.windows.map((w) =>
              w.id === existing.id ? { ...w, minimized: false, z: s.nextZ } : w,
            ),
            focusedId: existing.id,
            nextZ: s.nextZ + 1,
            startOpen: false,
          };
        }
      } else if (opts?.arg) {
        const existing = s.windows.find(
          (w) => w.program === program && w.arg === opts.arg,
        );
        if (existing) {
          return {
            windows: s.windows.map((w) =>
              w.id === existing.id ? { ...w, minimized: false, z: s.nextZ } : w,
            ),
            focusedId: existing.id,
            nextZ: s.nextZ + 1,
            startOpen: false,
          };
        }
      }

      const d = DEFAULTS[program];
      const n = s.seq;
      const id = `${program}-${n}`;
      const cascade = (n % 5) * 16;
      return {
        windows: [
          ...s.windows,
          {
            id,
            program,
            title: opts?.title ?? d.title,
            arg: opts?.arg,
            x: 90 + cascade,
            y: 16 + cascade,
            w: d.w,
            h: d.h,
            z: s.nextZ,
            minimized: false,
            maximized: false,
          },
        ],
        focusedId: id,
        nextZ: s.nextZ + 1,
        seq: n + 1,
        startOpen: false,
      };
    }),

  close: (id) =>
    set((s) => {
      const windows = s.windows.filter((w) => w.id !== id);
      // Focus falls to the highest remaining window, matching Win95.
      const top = windows
        .filter((w) => !w.minimized)
        .reduce<WindowState | null>((a, w) => (!a || w.z > a.z ? w : a), null);
      return { windows, focusedId: s.focusedId === id ? (top?.id ?? null) : s.focusedId };
    }),

  focus: (id) =>
    set((s) => {
      if (s.focusedId === id && !s.windows.find((w) => w.id === id)?.minimized) return s;
      return {
        windows: s.windows.map((w) =>
          w.id === id ? { ...w, z: s.nextZ, minimized: false } : w,
        ),
        focusedId: id,
        nextZ: s.nextZ + 1,
      };
    }),

  minimize: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, minimized: true } : w)),
      focusedId: s.focusedId === id ? null : s.focusedId,
    })),

  toggleMaximize: (id, bounds) =>
    set((s) => ({
      windows: s.windows.map((w) => {
        if (w.id !== id) return w;
        if (w.maximized && w.restore) {
          return { ...w, ...w.restore, maximized: false, restore: undefined };
        }
        return {
          ...w,
          restore: { x: w.x, y: w.y, w: w.w, h: w.h },
          x: 0,
          y: 0,
          w: bounds.w,
          h: bounds.h,
          maximized: true,
        };
      }),
    })),

  move: (id, x, y) =>
    set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, x, y } : w)) })),

  resize: (id, w2, h2) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, w: Math.max(220, w2), h: Math.max(140, h2) } : w,
      ),
    })),

  setStartOpen: (startOpen) => set({ startOpen }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
}));

export const programTitle = (p: ProgramId) => DEFAULTS[p].title;
