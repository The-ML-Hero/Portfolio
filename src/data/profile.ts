// Content mirrors ~/Downloads/portfolio-brief (1).md, with contact, education record,
// interests and the skill split taken from Adithya_Sherwood_Resume (5).pdf.
// Every figure on the site resolves here. Do not inline numbers in components.

export const profile = {
  handle: 'Abnb',
  publishesAs: 'A. Adithya Sherwood',
  tagline: 'Systems programmer with a graphics habit.',
  education: 'Third-year BE CSE, Thiagarajar College of Engineering (TCE), Madurai',
  location: 'Madurai, Tamil Nadu, India',
  github: 'https://github.com/The-ML-Hero',
  githubLabel: 'github.com/The-ML-Hero',
  email: 'adithyasherwoodreal@gmail.com',
  phone: '+91 8778819336',
  site: 'https://adithyasherwood.vercel.app',
  siteLabel: 'adithyasherwood.vercel.app',
  positioning:
    'Low-level, performance-oriented, academic. Not a full-stack web dev portfolio.',

  /** Reverse-chronological, exactly as reported on the resume. */
  schooling: [
    {
      what: 'B.E. Computer Science and Engineering',
      where: 'Thiagarajar College of Engineering',
      city: 'Madurai, Tamil Nadu',
      when: '2024 – 2028',
      mark: 'CGPA 9.02 / 10',
    },
    {
      what: 'Higher Secondary (Class XII)',
      where: 'Mahatma Montessori Matriculation Higher Secondary School',
      city: 'Madurai, Tamil Nadu',
      when: '2023 – 2024',
      mark: '90.4%',
    },
    {
      what: 'Secondary (Class X)',
      where: 'Mahatma Montessori Matriculation Higher Secondary School',
      city: 'Madurai, Tamil Nadu',
      when: '2021 – 2022',
      mark: '97.5%',
    },
  ],

  interests: [
    'Systems Programming',
    'Web Development',
    'Machine Learning',
    'Computer Vision',
    'Information Retrieval',
    'Real-Time Systems',
  ],

  languages: ['Python', 'Rust', 'Go', 'C', 'JavaScript', 'GLSL'],
  frameworks: ['PyTorch', 'React', 'Node.js', 'Express', 'Hugging Face Transformers'],
  technologies: [
    'WebGL',
    'Multi-threading',
    'Computer Vision',
    'Real-Time Systems',
    'CRDTs',
    'Git',
    'Docker',
  ],

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
