// Content mirrors ~/Downloads/portfolio-brief (1).md verbatim.
// Every figure on the site resolves here. Do not inline numbers in components.

export const profile = {
  handle: 'Abnb',
  publishesAs: 'Adithya A. Sherwood',
  tagline: 'Systems programmer with a graphics habit.',
  education: 'Second-year BE CSE, Thiagarajar College of Engineering (TCE), Madurai',
  location: 'Madurai, Tamil Nadu, India',
  github: 'https://github.com/The-ML-Hero',
  githubLabel: 'github.com/The-ML-Hero',
  positioning:
    'Low-level, performance-oriented, academic. Not a full-stack web dev portfolio.',
  languages: ['Go', 'Rust', 'C', 'JavaScript', 'GLSL', 'Python'],
  domains: [
    'Distributed systems and search infrastructure',
    'WASM / edge computing and scheduling',
    'GPU graphics, raymarching, physically-based rendering, real-time simulation',
    'Computer vision and explainable AI',
  ],
  environment: {
    os: 'Omarchy (Hyprland/Wayland)',
    editor: 'Neovim + LazyVim',
  },
  coursework: [
    'Software engineering (Sommerville)',
    "Formal languages and automata (DFA/NFA, Arden's theorem, Thompson's construction)",
    'Image processing',
    'Operating systems',
    'Networking (CSMA/CD, CRC)',
    'Linear programming (Simplex, Big-M, Two-Phase)',
    'Databases (2NF, B-trees, secondary indexes)',
  ],
  ongoing: [
    'Competitive programming and DSA',
    'Cybersecurity via pwn.college binary exploitation track',
  ],
} as const;
