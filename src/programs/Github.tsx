import { profile } from '../data/profile';
import { projects } from '../data/projects';
import { useOS } from '../os/useOS';

/**
 * Explorer-style view of the work and where it lives.
 *
 * Deliberately honest about repo status: most of the systems and graphics work is not public
 * yet, and a list that implied otherwise would break the moment a visitor clicked through.
 */
export function Github() {
  const open = useOS((s) => s.open);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <h1 style={{ margin: 0 }}>{profile.githubLabel}</h1>
        <a href={profile.github} target="_blank" rel="noreferrer">Open ↗</a>
      </div>
      <p className="dim">
        The profile currently hosts earlier computer-vision and medical-imaging work. The systems
        and graphics projects below are the current focus.
      </p>

      <table>
        <thead>
          <tr><th style={{ width: '38%' }}>Project</th><th>Stack</th><th style={{ width: 70 }}>Repo</th></tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id} style={{ cursor: 'pointer' }} onDoubleClick={() => open('project-detail', { title: p.name, arg: p.id })}>
              <td><strong>{p.name}</strong></td>
              <td className="mono" style={{ fontSize: 10 }}>{p.stack.join(' · ')}</td>
              <td className="dim">private</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="dim">Double-click a row for detail. Two of them run in-browser: Raymarcher.exe and Atlas.exe.</p>
    </div>
  );
}
