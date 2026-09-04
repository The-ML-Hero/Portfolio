// Independent re-implementation, written from the BM25 definition rather than from search.ts,
// to check the shipped scorer rather than just re-running it.
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';

const out = await build({
  entryPoints: ['src/data/corpus.ts'],
  bundle: true, write: false, format: 'esm', platform: 'neutral',
  loader: { '.ts': 'ts' },
});
const mod = await import('data:text/javascript;base64,' + Buffer.from(out.outputFiles[0].text).toString('base64'));
const corpus = mod.corpus;

const tok = (s) => s.toLowerCase().match(/[a-z0-9_.+#-]+/g)?.filter(t => t.length > 1) ?? [];
const k1 = 1.2, b = 0.75;
const docs = corpus.map(d => ({ ...d, toks: tok(`${d.title} ${d.text}`) }));
const N = docs.length;
const avg = docs.reduce((a, d) => a + d.toks.length, 0) / N;

function score(q) {
  const terms = [...new Set(tok(q))];
  return docs.map(d => {
    let s = 0;
    for (const t of terms) {
      const tf = d.toks.filter(x => x === t).length;
      if (!tf) continue;
      const df = docs.filter(x => x.toks.includes(t)).length;
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      s += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * d.toks.length) / avg)));
    }
    return { title: d.title, score: s };
  }).filter(x => x.score > 0).sort((a, c) => c.score - a.score);
}

const q = 'bm25 segment index';
const ref = score(q);
console.log(`corpus: ${N} docs, avgLen ${avg.toFixed(2)}`);
console.log(`query: "${q}"`);
ref.slice(0, 5).forEach((r, i) => console.log(`  ${i + 1}. ${r.score.toFixed(4)}  ${r.title.slice(0, 58)}`));
console.log(JSON.stringify(ref.slice(0, 5).map(r => +r.score.toFixed(4))));
