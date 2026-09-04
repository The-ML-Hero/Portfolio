import { useCallback, useEffect, useRef, type ReactNode, type PointerEvent as RPE } from 'react';
import { useOS, type WindowState } from './useOS';
import { SCREEN_RES } from '../scene/constants';

const TASKBAR = 28;

interface Props {
  win: WindowState;
  children: ReactNode;
}

/**
 * A draggable, resizable Win95 window. Drag state is kept in a ref and committed to the store
 * on pointer move, so dragging doesn't rerender the whole window list per frame.
 */
export function Window({ win, children }: Props) {
  const { focus, close, minimize, toggleMaximize, move, resize } = useOS();
  const focused = useOS((s) => s.focusedId === win.id);
  const drag = useRef<{ mode: 'move' | 'resize'; dx: number; dy: number } | null>(null);
  const frame = useRef<HTMLDivElement>(null);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      if (d.mode === 'move') {
        const x = Math.max(0, Math.min(SCREEN_RES.w - 60, e.clientX - d.dx));
        const y = Math.max(0, Math.min(SCREEN_RES.h - TASKBAR - 18, e.clientY - d.dy));
        move(win.id, x, y);
      } else {
        resize(win.id, e.clientX - win.x - d.dx, e.clientY - win.y - d.dy);
      }
    },
    [move, resize, win.id, win.x, win.y],
  );

  useEffect(() => {
    const up = () => { drag.current = null; };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', up);
    };
  }, [onPointerMove]);

  if (win.minimized) return null;

  const startMove = (e: RPE<HTMLDivElement>) => {
    if (win.maximized) return;
    focus(win.id);
    drag.current = { mode: 'move', dx: e.clientX - win.x, dy: e.clientY - win.y };
  };
  const startResize = (e: RPE<HTMLDivElement>) => {
    e.stopPropagation();
    focus(win.id);
    drag.current = { mode: 'resize', dx: e.clientX - win.x - win.w, dy: e.clientY - win.y - win.h };
  };

  return (
    <div
      ref={frame}
      className="window-frame"
      data-focused={focused}
      style={{ left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z }}
      onPointerDown={() => focus(win.id)}
    >
      <div className="title-bar-row" onPointerDown={startMove} onDoubleClick={() => toggleMaximize(win.id, { w: SCREEN_RES.w, h: SCREEN_RES.h - TASKBAR })}>
        <span className="t">{win.title}</span>
        <button className="tb-btn" aria-label="Minimize" onClick={(e) => { e.stopPropagation(); minimize(win.id); }}>_</button>
        <button className="tb-btn" aria-label="Maximize" onClick={(e) => { e.stopPropagation(); toggleMaximize(win.id, { w: SCREEN_RES.w, h: SCREEN_RES.h - TASKBAR }); }}>□</button>
        <button className="tb-btn" aria-label="Close" onClick={(e) => { e.stopPropagation(); close(win.id); }}>✕</button>
      </div>
      <div className="window-body-area doc">{children}</div>
      {!win.maximized && <div className="resize-grip" onPointerDown={startResize} />}
    </div>
  );
}
