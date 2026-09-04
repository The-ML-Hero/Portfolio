import { useMemo, useState } from 'react';
import { CorpusBackend, type Hit } from '../lib/search';
import { corpus } from '../data/corpus';
import { useOS } from '../os/useOS';

export function AtlasSearch() {
  const backend = useMemo(() => new CorpusBackend(corpus), []);
  const stats = backend.stats();
  const [q, setQ] = useState('bm25 segment index');
  const [expanded, setExpanded] = useState<number | null>(null);
  const open = useOS((s) => s.open);
  const hits: Hit[] = useMemo(() => (q.trim() ? backend.search(q) : []), [q, backend]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 6 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1, fontFamily: 'var(--w95-mono)', fontSize: 11 }}
          placeholder="query…"
        />
      </div>

      <div style={{ flex: 1, overflow: 'auto', border: '1px solid var(--w95-shadow)', background: '#fff' }}>
        <table style={{ margin: 0 }}>
          <thead>
            <tr><th style={{ width: 44 }}>score</th><th>document</th></tr>
          </thead>
          <tbody>
            {hits.map((h) => (
              <>
                <tr key={h.docId} className="row-link" onClick={() => setExpanded(expanded === h.docId ? null : h.docId)}>
                  <td className="mono">{h.score.toFixed(3)}</td>
                  <td>
                    <strong>{h.title}</strong>
                    <br /><span className="mono dim" style={{ fontSize: 10 }}>{h.path}</span>
                    <br /><span className="dim">{h.snippet}</span>
                  </td>
                </tr>
                {expanded === h.docId && (
                  <tr key={`${h.docId}-x`}>
                    <td colSpan={2} style={{ background: '#f4f4f4' }}>
                      <span className="mono" style={{ fontSize: 10 }}>score decomposition — idf · (tf·(k1+1)) / (tf + k1·(1−b+b·dl/avgdl))</span>
                      <table style={{ margin: '4px 0 0' }}>
                        <thead><tr><th>term</th><th>tf</th><th>idf</th><th>len norm</th><th>contribution</th></tr></thead>
                        <tbody>
                          {h.terms.map((t) => (
                            <tr key={t.term}>
                              <td className="mono">{t.term}</td>
                              <td className="mono">{t.tf}</td>
                              <td className="mono">{t.idf.toFixed(4)}</td>
                              <td className="mono">{t.lenNorm.toFixed(4)}</td>
                              <td className="mono">{t.contribution.toFixed(4)}</td>
                            </tr>
                          ))}
                          <tr><td colSpan={4} style={{ textAlign: 'right' }}><strong>total</strong></td><td className="mono"><strong>{h.score.toFixed(4)}</strong></td></tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {!hits.length && q.trim() && (
              <tr><td colSpan={2} className="dim">No documents matched.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mono dim" style={{ fontSize: 10, borderTop: '1px solid var(--w95-shadow)', paddingTop: 3 }}>
        {stats.docs} docs · {stats.terms} terms · avg len {stats.avgDocLength.toFixed(1)} · k1={1.2} b={0.75}
        <br />
        {stats.backend} — browser rebuild of{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); open('project-detail', { title: 'Atlas', arg: 'atlas' }); }}>Atlas</a>
        , which is Go with on-disk segments and gRPC.
      </div>
    </div>
  );
}
