// Source: ~/Downloads/portfolio-brief (1).md — Projects section.

export type Tier = 'selected' | 'other' | 'fx';

export interface Project {
  id: string;
  name: string;
  /** Shown under the title, pipe-separated in the UI. */
  stack: string[];
  tier: Tier;
  /** One terse line for list views. */
  blurb: string;
  /** Body paragraphs for the detail window. */
  body?: string[];
  /** Bulleted technical detail. */
  details?: string[];
  /** Rendered as a two-column spec table in the detail window. */
  table?: { caption: string; rows: [string, string][] };
  meta?: string;
  team?: string[];
  /** Names a live program that demonstrates this project. */
  demo?: 'raymarcher' | 'atlas';
}

export const projects: Project[] = [
  {
    id: 'atlas',
    name: 'Atlas',
    stack: ['Go', 'gRPC', 'BM25', 'vector search'],
    tier: 'selected',
    blurb: 'Distributed semantic file search engine.',
    body: ['Segment-based inverted index search engine built from scratch.'],
    table: {
      caption: 'On-disk layout',
      rows: [
        ['index.bin', 'raw posting lists'],
        ['offsets.bin', 'term → offset + length'],
        ['manifest.json', 'segment list + counter'],
        ['docstore.bin', 'docID → path'],
        ['deleted.bin', 'dead docIDs'],
      ],
    },
    details: [
      'Fixed 16-byte posting struct: DocID int64, TermFreq int32, DocLength int32',
      'In-memory docstore map, path→docID map, deleted set, write buffer, segment list, atomic counter',
      'fsnotify file watching, BM25 scoring with vector search fallback',
      'gRPC coordinator↔node communication; nodes run as separate processes across ports',
      'Two-stage retrieval: fast BM25 lexical matching, with semantic embedding fallback for conceptual queries',
      'Answers queries such as "find the file where I implemented X" across local file systems',
    ],
    meta: 'Personal project, built for the love of it. In progress.',
    demo: 'atlas',
  },
  {
    id: 'wasm-edge',
    name: 'WASM Edge Function Scheduling',
    stack: ['Systems research', 'two-person team'],
    tier: 'selected',
    blurb: 'Per-request router for WASM edge functions.',
    body: [
      'Smart per-request router for WASM-based edge functions that picks the best node per request (load, latency, affinity) instead of naive round-robin or random placement.',
      'Research question: WASM cold starts are near-zero (~ms) versus Docker’s hundreds of ms to seconds. Does smart per-request placement across edge nodes meaningfully beat naive placement, and where is the crossover point as cold-start cost is dialed up or down?',
    ],
    details: [
      'Literature survey confirmed the gap is open; closest prior work (FunLess, Sledge/SledgeScale, SFS/Bologna APP line) doesn’t combine both elements',
      'Novelty: adaptive routing layer tracking live warm/cold state per node per function, benchmarked against static-smart and naive baselines',
      'Evaluation planned on real Azure Functions workload traces, plus failure/straggler handling and a cost/energy angle',
    ],
    meta: 'Targeting HotStorage / APSys / IEEE CLOUD / ICDCS.',
  },
  {
    id: 'raymarcher',
    name: 'WebGL Raymarching Render Engine',
    stack: ['JavaScript', 'GLSL'],
    tier: 'selected',
    blurb: 'GPU raymarcher written from scratch. 80 FPS at 1080p.',
    body: [
      'GPU raymarcher written from scratch with GLSL fragment shaders. SDF geometry, FPS camera, soft shadows, procedural terrain. 80 FPS at 1080p.',
    ],
    demo: 'raymarcher',
  },
  {
    id: 'benkyou',
    name: 'Benkyou Code',
    stack: ['Adaptive CLI coding tutor'],
    tier: 'selected',
    blurb: 'TUI agent that teaches by handing over controlled amounts of code.',
    body: [
      'Full title: "An Adaptive, Explanation-Guided CLI Agent with Code-Restricted, Density-Controlled Task Generation for Teaching Programming."',
      'An interactive TUI agent that guides users through medium-to-large solo Python projects. "Density" controls how much completed code and architecture the assistant hands over. Users edit in their own external editor rather than inside the TUI.',
      'LLM backend on OpenRouter/DeepSeek (originally Groq / Llama 3.3 70B).',
    ],
    details: [
      'Scaffolds solo Python projects by decomposing goals into milestone dependency graphs',
      'Bounds how much reference code the agent reveals per milestone, so learners write the final implementation',
      'Generates a reference implementation and grading test suite per milestone for verification',
    ],
    meta: 'Team project, supervised by Dr. K. Sundarakantham.',
    team: ['Abnb', 'Athi Sankara Kailash K', 'Anbu U G'],
  },
  {
    id: 'http-server',
    name: 'Multi-threaded HTTP Server',
    stack: ['Rust'],
    tier: 'other',
    blurb: 'HTTP server from scratch, hand-rolled concurrency.',
    body: [
      'HTTP server written from scratch with a multi-threaded request-handling model. Concurrency, connection lifecycle, and request parsing all hand-rolled rather than pulled from a framework.',
    ],
    details: [
      'Socket management, routing and persistent connections built from scratch',
      "Leans on Rust's ownership model to eliminate data races across concurrent request processing",
    ],
  },
  {
    id: 'crdt-editor',
    name: 'Collaborative Document Editor',
    stack: ['CRDTs', 'Yjs', 'y-webrtc'],
    tier: 'other',
    blurb: 'Peer-to-peer multi-user editing, no central server.',
    body: [
      'Real-time multi-user text editing with conflict-free replicated data types. Peer-to-peer sync over WebRTC, no central server holding document state.',
    ],
    details: [
      'Conflict resolution via Yjs, peer-to-peer sync via y-webrtc',
      'Pagination and layout engine written from scratch, reflowing content across pages without libraries',
    ],
  },
  {
    id: 'tts',
    name: 'TTS Audiobook Pipeline',
    stack: ['Python', 'Chatterbox TTS', 'Colab (T4)'],
    tier: 'other',
    blurb: 'Full light novel series to audiobook under a $5 compute budget.',
    body: [
      'End-to-end pipeline converting the Mushoku Tensei light novel series into an audiobook. Rule-based emotion tagging drives per-line synthesis parameters; exaggeration values tuned by hand for narration consistency.',
      'Benchmarked Zonos, Qwen3-TTS, Orpheus and Gemini Flash TTS before settling on Chatterbox. Full series generated under a $5 compute budget.',
    ],
  },
  {
    id: 'tinylink',
    name: 'TinyLink',
    stack: ['URL shortener', 'SE lab'],
    tier: 'other',
    blurb: 'URL shortener with a full SRS and UML deliverable set.',
    body: [
      'URL shortener built alongside a complete software-engineering deliverable set: full SRS document and UML suite (use case, sequence, class diagrams).',
    ],
    meta: 'Team project.',
    team: ['Billgates Raja N', 'Vetri Thalapathy R'],
  },
  {
    id: 'fx',
    name: 'Houdini / Blender FX Work',
    stack: ['VEX', 'Houdini', 'Blender'],
    tier: 'fx',
    blurb: 'Procedural FX and simulation.',
    body: [
      'Procedural FX and simulation. VEX quaternion rotation and Orient Along Curve setups; comparative work on Karma versus Mantra rendering. LiquiGen fluid simulation rendered in Blender with hand-tuned white water, foam and spray parameters.',
    ],
  },
];

export const byTier = (tier: Tier) => projects.filter((p) => p.tier === tier);
export const byId = (id: string) => projects.find((p) => p.id === id);
