/**
 * Query-side search, behind an interface so the real engine can replace the stand-in
 * without the UI changing. See the plan's "Swap seams".
 *
 * v1 (`CorpusBackend`): scores a bundled corpus in TypeScript.
 * v2 (`SegmentBackend`, not yet built): fetches Abnb's Go-produced index.bin / offsets.bin /
 *    docstore.bin and decodes the 16-byte posting struct with a DataView.
 */

export interface TermScore {
  term: string;
  /** Term frequency in this document. */
  tf: number;
  /** Inverse document frequency. */
  idf: number;
  /** Document-length normalisation denominator factor. */
  lenNorm: number;
  /** This term's addition to the document's total score. */
  contribution: number;
}

export interface Hit {
  docId: number;
  path: string;
  title: string;
  score: number;
  terms: TermScore[];
  snippet: string;
}

export interface IndexStats {
  docs: number;
  terms: number;
  avgDocLength: number;
  /** Names the backend so the UI can say what it is actually running. */
  backend: string;
}

export interface SearchBackend {
  stats(): IndexStats;
  search(query: string, limit?: number): Hit[];
}

/** Atlas's parameters. */
export const K1 = 1.2;
export const B = 0.75;

export const tokenize = (s: string): string[] =>
  s.toLowerCase().match(/[a-z0-9_.+#-]+/g)?.filter((t) => t.length > 1) ?? [];

export interface Doc {
  id: number;
  path: string;
  title: string;
  text: string;
}

/**
 * BM25 over an in-memory corpus, using the same k1/b as the Go engine.
 *
 * idf uses the standard BM25 probabilistic form with the +1 guard:
 *   idf = ln(1 + (N - df + 0.5) / (df + 0.5))
 */
export class CorpusBackend implements SearchBackend {
  private postings = new Map<string, Map<number, number>>();
  private lengths = new Map<number, number>();
  private avgLen = 0;
  private docs: Doc[];

  constructor(docs: Doc[]) {
    this.docs = docs;
    for (const d of docs) {
      const toks = tokenize(`${d.title} ${d.text}`);
      this.lengths.set(d.id, toks.length);
      for (const t of toks) {
        let m = this.postings.get(t);
        if (!m) { m = new Map(); this.postings.set(t, m); }
        m.set(d.id, (m.get(d.id) ?? 0) + 1);
      }
    }
    const total = [...this.lengths.values()].reduce((a, b) => a + b, 0);
    this.avgLen = total / (docs.length || 1);
  }

  stats(): IndexStats {
    return {
      docs: this.docs.length,
      terms: this.postings.size,
      avgDocLength: this.avgLen,
      backend: 'CorpusBackend (in-memory, TypeScript)',
    };
  }

  search(query: string, limit = 10): Hit[] {
    const qTerms = [...new Set(tokenize(query))];
    const N = this.docs.length;
    const acc = new Map<number, TermScore[]>();

    for (const term of qTerms) {
      const posting = this.postings.get(term);
      if (!posting) continue;
      const df = posting.size;
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      for (const [docId, tf] of posting) {
        const dl = this.lengths.get(docId) ?? 0;
        const lenNorm = K1 * (1 - B + (B * dl) / this.avgLen);
        const contribution = idf * ((tf * (K1 + 1)) / (tf + lenNorm));
        const list = acc.get(docId) ?? [];
        list.push({ term, tf, idf, lenNorm, contribution });
        acc.set(docId, list);
      }
    }

    return [...acc.entries()]
      .map(([docId, terms]) => {
        const d = this.docs.find((x) => x.id === docId)!;
        return {
          docId,
          path: d.path,
          title: d.title,
          score: terms.reduce((a, t) => a + t.contribution, 0),
          terms: terms.sort((a, b) => b.contribution - a.contribution),
          snippet: snippet(d.text, qTerms),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

function snippet(text: string, terms: string[]): string {
  const low = text.toLowerCase();
  let at = -1;
  for (const t of terms) {
    const i = low.indexOf(t);
    if (i >= 0 && (at < 0 || i < at)) at = i;
  }
  if (at < 0) return text.slice(0, 120);
  const start = Math.max(0, at - 45);
  return (start > 0 ? '…' : '') + text.slice(start, start + 130).trim() + '…';
}
