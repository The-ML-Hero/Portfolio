import { resume } from '../data/resume';

/**
 * Generated from data/resume.ts. `window.print()` uses the print stylesheet in index.css,
 * which hides the 3D scene and chrome so the output is a clean single-column document.
 */
export function Resume() {
  return (
    <div className="resume-doc">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <h1 style={{ margin: 0 }}>{resume.name}</h1>
        <button onClick={() => window.print()} className="no-print">Print…</button>
      </div>
      <p className="dim mono" style={{ marginTop: 2 }}>
        goes by {resume.known} · {resume.contact.join(' · ')}
      </p>
      <p><strong>{resume.headline}</strong></p>

      <h2>Education</h2>
      {resume.education.map((e) => (
        <p key={e.what} style={{ margin: '0 0 6px' }}>
          <strong>{e.what}</strong><br />
          <span className="dim">{e.where} · {e.when}</span>
        </p>
      ))}

      <h2>Research</h2>
      {resume.research.map((r) => (
        <p key={r.what} style={{ margin: '0 0 8px' }}>
          <strong>{r.what}</strong><br />
          {r.detail}<br />
          <span className="dim mono" style={{ fontSize: 10 }}>{r.meta}</span>
        </p>
      ))}

      <h2>Selected work</h2>
      <ul>
        {resume.selected.map((p) => (
          <li key={p.name}><strong>{p.name}</strong> — {p.blurb} <span className="dim mono">{p.stack}</span></li>
        ))}
      </ul>

      <h2>Other projects</h2>
      <ul>
        {resume.other.map((p) => (
          <li key={p.name}><strong>{p.name}</strong> — {p.blurb} <span className="dim mono">{p.stack}</span></li>
        ))}
      </ul>

      <h2>Skills</h2>
      <p>{resume.skills.join(' · ')}</p>
      <ul>{resume.domains.map((d) => <li key={d}>{d}</li>)}</ul>
    </div>
  );
}
