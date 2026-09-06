import { publication, internship, priorWork } from '../data/research';

/** Horizontal Dice comparison. Period-correct chrome; error bar where an SD is reported. */
function DiceChart() {
  const max = 1.0;
  return (
    <table style={{ tableLayout: 'fixed' }}>
      <thead>
        <tr><th style={{ width: '38%' }}>Architecture</th><th>Dice coefficient</th></tr>
      </thead>
      <tbody>
        {publication.architectures.map((a) => (
          <tr key={a.name}>
            <td>{a.name}</td>
            <td>
              <div style={{ position: 'relative', height: 13, background: '#fff', border: '1px solid var(--w95-shadow)' }}>
                <div style={{ position: 'absolute', inset: '0 auto 0 0', width: `${(a.dice / max) * 100}%`, background: 'var(--w95-title)' }} />
                {a.sd !== undefined && (
                  <div
                    title={`± ${a.sd}`}
                    style={{
                      position: 'absolute', top: 3, bottom: 3,
                      left: `${((a.dice - a.sd) / max) * 100}%`,
                      width: `${((2 * a.sd) / max) * 100}%`,
                      borderLeft: '1px solid #000', borderRight: '1px solid #000',
                      background: 'rgba(255,255,255,.45)',
                    }}
                  />
                )}
                <span className="mono" style={{ position: 'absolute', right: 3, top: 0, lineHeight: '13px', fontSize: 10, color: '#000', mixBlendMode: 'difference', filter: 'invert(1)' }}>
                  {a.dice.toFixed(3)}{a.sd !== undefined ? ` ± ${a.sd}` : ''}
                </span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Research() {
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Publication — {publication.role}</h2>
      <p><strong>{publication.title}</strong></p>
      <p className="mono dim">
        {publication.authors}<br />
        <em>{publication.journal}</em>, {publication.volume}, {publication.pages}<br />
        DOI: <a href={publication.doiUrl} target="_blank" rel="noreferrer">{publication.doi}</a>
      </p>
      <p>{publication.summary} {publication.dataset}</p>
      <DiceChart />
      <ul>{publication.findings.map((f) => <li key={f}>{f}</li>)}</ul>
      <p className="dim">{publication.note}</p>

      <h2>{internship.institution} — {internship.role}</h2>
      <p className="dim mono" style={{ fontSize: 11, margin: '0 0 6px' }}>
        {internship.city} · {internship.dates} · supervised by {internship.supervisor}
      </p>
      <p style={{ margin: '0 0 6px' }}>{internship.summary}</p>
      <ul style={{ marginTop: 0 }}>
        {internship.details.map((d) => <li key={d}>{d}</li>)}
      </ul>

      <h2>{priorWork.title}</h2>
      <p>{priorWork.summary}</p>
    </div>
  );
}
