// Source: ~/Downloads/portfolio-brief (1).md — Research section.
// Figures are quoted exactly as reported in the paper. Verify against the DOI before editing.

export interface ArchResult {
  name: string;
  dice: number;
  /** Standard deviation, where the brief reports one. */
  sd?: number;
}

export const publication = {
  role: 'First author',
  title:
    'A Deep Learning Approach to Segment and Classify C-Shaped Canal Morphologies in Mandibular Second Molars Using Cone-beam Computed Tomography',
  authors:
    'Sherwood AA, Sherwood AI, Setzer FC, Devi KS, Shamili JV, John C, Schwendicke F.',
  journal: 'Journal of Endodontics',
  volume: 'Vol. 47, Issue 12 (2021)',
  pages: 'pp. 1907–1916',
  doi: '10.1016/j.joen.2021.09.009',
  doiUrl: 'https://doi.org/10.1016/j.joen.2021.09.009',
  summary:
    'Built and benchmarked three segmentation architectures to classify C-shaped root canal anatomy from limited-FOV CBCT volumes.',
  dataset: 'Trained on 100 of 135 CBCT images, tested on 35.',
  architectures: [
    { name: 'Xception U-Net', dice: 0.768, sd: 0.035 },
    { name: 'Residual U-Net', dice: 0.736 },
    { name: 'U-Net (baseline)', dice: 0.660 },
  ] as ArchResult[],
  findings: [
    'Xception U-Net led on Dice coefficient (0.768 ± 0.035) over residual U-Net (0.736) and baseline U-Net (0.660); both improvements significant by one-way ANOVA (P = .000779) with post-hoc Tukey.',
    'Mean sensitivity 0.786 and PPV 80.0% for the best model.',
    'Adding contrast-limited adaptive histogram equalization improved efficacy across all three architectures by a mean of 4.6% (P < .0001).',
  ],
  note: 'Co-authors include Frank C. Setzer (Penn Dental) and Falk Schwendicke.',
} as const;

export const internship = {
  institution: 'IIIT Kottayam',
  role: 'Research Internship',
  supervisor: 'Dr. Jeena Thomas',
  summary:
    "Fine-tuned NASA's Prithvi geospatial foundation model on the SICKLE dataset for paddy harvest forecasting.",
} as const;

export const priorWork = {
  title: 'Prior work',
  summary:
    'Computer vision and explainable AI: Grad-CAM, SHAP, LIME, saliency maps.',
} as const;
