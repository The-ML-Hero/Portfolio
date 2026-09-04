import { projects, byId, type Tier } from '../data/projects';
import { useOS } from '../os/useOS';

const GROUPS: { tier: Tier; label: string }[] = [
  { tier: 'selected', label: 'Selected Work' },
  { tier: 'other', label: 'Other Projects' },
  { tier: 'fx', label: 'FX' },
];

export function Projects() {
  const open = useOS((s) => s.open);
  return (
    <div>
      {GROUPS.map((g) => (
        <div key={g.tier}>
          <h2 style={{ marginTop: g.tier === 'selected' ? 0 : 12 }}>{g.label}</h2>
          <table>
            <tbody>
              {projects.filter((p) => p.tier === g.tier).map((p) => (
                <tr
                  key={p.id}
                  style={{ cursor: 'pointer' }}
                  onDoubleClick={() => open('project-detail', { title: p.name, arg: p.id })}
                >
                  <td style={{ width: '34%' }}>
                    <strong>{p.name}</strong>
                    {p.demo && <span className="dim"> · runs</span>}
                  </td>
                  <td>{p.blurb}<br /><span className="dim mono">{p.stack.join(' · ')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      <p className="dim">Double-click a row for detail.</p>
    </div>
  );
}

export function ProjectDetail({ arg }: { arg?: string }) {
  const open = useOS((s) => s.open);
  const p = arg ? byId(arg) : undefined;
  if (!p) return <p>Project not found.</p>;
  return (
    <div>
      <h1>{p.name}</h1>
      <p className="dim mono">{p.stack.join(' · ')}</p>
      {p.body?.map((b) => <p key={b}>{b}</p>)}
      {p.table && (
        <>
          <h2>{p.table.caption}</h2>
          <table>
            <tbody>
              {p.table.rows.map(([k, v]) => (
                <tr key={k}><td className="mono" style={{ width: '34%' }}>{k}</td><td>{v}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      {p.details && <ul>{p.details.map((d) => <li key={d} className="mono" style={{ fontSize: 11 }}>{d}</li>)}</ul>}
      {p.team && <p className="dim">Team: {p.team.join(', ')}</p>}
      {p.meta && <p className="dim">{p.meta}</p>}
      {p.demo && (
        <p>
          <button onClick={() => open(p.demo!)}>Run {p.demo === 'atlas' ? 'Atlas.exe' : 'Raymarcher.exe'}</button>
          {' '}
          <span className="dim">Browser rebuild — see the program window for what differs.</span>
        </p>
      )}
    </div>
  );
}
