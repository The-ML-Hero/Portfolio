import { useEffect, useState } from 'react';
import { useOS, type ProgramId } from './useOS';
import { Window } from './Window';
import { Icon, type IconName } from './Icons';
import { CrtFilterDefs } from './CrtGlass';
import { BootSequence } from './BootSequence';
import { ContextMenu, type MenuItem } from './ContextMenu';
import { programs, PROGRAM_LIST } from '../programs/registry';
import '98.css';
import '../styles/win95.css';
import '../styles/crt.css';

const ICONS: { id: ProgramId; label: string; icon: IconName }[] = [
  { id: 'readme', label: 'README.txt', icon: 'doc' },
  { id: 'about', label: 'About Me', icon: 'person' },
  { id: 'projects', label: 'Projects', icon: 'folder' },
  { id: 'research', label: 'Research', icon: 'research' },
  { id: 'resume', label: 'Resume', icon: 'resume' },
  { id: 'github', label: 'GitHub', icon: 'github' },
  { id: 'raymarcher', label: 'Raymarcher', icon: 'cube' },
  { id: 'atlas', label: 'Atlas', icon: 'search' },
  { id: 'sysprops', label: 'My Computer', icon: 'monitor' },
  { id: 'contact', label: 'Contact', icon: 'mail' },
];

function Clock() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => {
    const i = setInterval(() => setT(new Date()), 15_000);
    return () => clearInterval(i);
  }, []);
  return <span>{t.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>;
}

export function Desktop({ width, height }: { width: number; height: number }) {
  const { windows, open, focus, focusedId, startOpen, setStartOpen, muted, toggleMute, bootStage } = useOS();
  const [selected, setSelected] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(null);

  const desktopMenu: MenuItem[] = [
    { label: 'Open README', icon: 'doc', onClick: () => open('readme') },
    { label: 'About Me', icon: 'person', onClick: () => open('about') },
    { sep: true, label: '' },
    { label: 'Run Raymarcher.exe', icon: 'cube', onClick: () => open('raymarcher') },
    { label: 'Run Atlas.exe', icon: 'search', onClick: () => open('atlas') },
    { sep: true, label: '' },
    { label: 'Properties', icon: 'monitor', onClick: () => open('sysprops') },
  ];

  return (
    <div className="crt" style={{ width, height }}>
      <CrtFilterDefs />

      <div className="crt-warp">
        <div className="crt-refl" aria-hidden />
        <div
          className="desktop w95"
          onPointerDown={() => { setSelected(null); setStartOpen(false); setMenu(null); }}
          onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, items: desktopMenu }); }}
        >
          <div className="desktop-icons">
            {ICONS.map((ic) => (
              <button
                key={ic.id}
                className="desktop-icon"
                data-selected={selected === ic.id}
                onPointerDown={(e) => { e.stopPropagation(); setSelected(ic.id); setMenu(null); }}
                onDoubleClick={() => open(ic.id)}
                onContextMenu={(e) => {
                  e.preventDefault(); e.stopPropagation();
                  setSelected(ic.id);
                  setMenu({
                    x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY,
                    items: [{ label: 'Open', icon: ic.icon, onClick: () => open(ic.id) }],
                  });
                }}
              >
                <Icon name={ic.icon} size={30} />
                <span className="label">{ic.label}</span>
              </button>
            ))}
          </div>

          {windows.map((w) => {
            const Body = programs[w.program];
            return (
              <Window key={w.id} win={w}>
                <Body arg={w.arg} />
              </Window>
            );
          })}

          {startOpen && (
            <div className="start-menu" onPointerDown={(e) => e.stopPropagation()}>
              <div className="rail">SHERWOOD<span>95</span></div>
              <ul>
                {PROGRAM_LIST.map((p) =>
                  p.sep ? <hr key={p.id} /> : (
                    <li key={p.id} onClick={() => open(p.id as ProgramId)}>
                      <span className="mi">{p.icon && <Icon name={p.icon} size={18} />}</span>
                      {p.label}
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}

          {menu && <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={() => setMenu(null)} />}

          <div className="taskbar" onPointerDown={(e) => e.stopPropagation()}>
            <button className="start-btn" data-open={startOpen} onClick={() => setStartOpen(!startOpen)}>
              <span className="start-flag" aria-hidden />
              Start
            </button>
            <span className="tb-sep" />
            <div className="task-buttons">
              {windows.map((w) => (
                <button
                  key={w.id}
                  className="task-btn"
                  data-active={focusedId === w.id && !w.minimized}
                  onClick={() => (focusedId === w.id && !w.minimized ? useOS.getState().minimize(w.id) : focus(w.id))}
                  title={w.title}
                >
                  {w.title}
                </button>
              ))}
            </div>
            <div className="tray">
              <button onClick={toggleMute} title={muted ? 'Sound off' : 'Sound on'}>{muted ? '🔇' : '🔊'}</button>
              <Clock />
            </div>
          </div>
        </div>

        {bootStage !== 'ready' && <BootSequence />}
      </div>

      <div className="crt-glass" />
    </div>
  );
}
