import { projects } from './projects';
import { publication, internship, priorWork } from './research';
import { profile } from './profile';
import type { Doc } from '../lib/search';

/**
 * The searchable corpus: the site's own content, so Atlas.exe indexes something real
 * rather than lorem. Built from the same data modules the windows render.
 */
export const corpus: Doc[] = [
  ...projects.map((p, i) => ({
    id: i + 1,
    path: `/projects/${p.id}.md`,
    title: p.name,
    text: [p.blurb, ...(p.body ?? []), ...(p.details ?? []), p.stack.join(' '), p.meta ?? ''].join(' '),
  })),
  {
    id: 100,
    path: '/research/publication.md',
    title: publication.title,
    text: [publication.summary, publication.dataset, ...publication.findings, publication.authors, publication.journal, publication.note].join(' '),
  },
  {
    id: 101,
    path: '/research/iiit-kottayam.md',
    title: `${internship.institution} — ${internship.role}`,
    text: `${internship.summary} Supervised by ${internship.supervisor}.`,
  },
  { id: 102, path: '/research/prior.md', title: priorWork.title, text: priorWork.summary },
  {
    id: 103,
    path: '/about/profile.md',
    title: `${profile.name} — profile`,
    text: [profile.tagline, profile.positioning, profile.education, profile.location,
      profile.languages.join(' '), ...profile.domains, profile.environment.os,
      profile.environment.editor, ...profile.coursework, ...profile.ongoing].join(' '),
  },
];
