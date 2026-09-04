import { profile } from './profile';
import { publication, internship } from './research';
import { projects } from './projects';

/** The resume is a view over the same data as everything else — no second source of truth. */
export const resume = {
  name: profile.publishesAs,
  known: profile.handle,
  headline: profile.tagline,
  contact: [profile.location, profile.githubLabel],
  education: [{ what: 'BE Computer Science and Engineering', where: 'Thiagarajar College of Engineering, Madurai', when: 'Second year' }],
  research: [
    {
      what: `${publication.role}, ${publication.journal}`,
      detail: publication.title,
      meta: `${publication.volume}, ${publication.pages} · DOI ${publication.doi}`,
    },
    {
      what: `${internship.role}, ${internship.institution}`,
      detail: internship.summary,
      meta: `Supervised by ${internship.supervisor}`,
    },
  ],
  selected: projects.filter((p) => p.tier === 'selected').map((p) => ({
    name: p.name, stack: p.stack.join(' · '), blurb: p.blurb,
  })),
  other: projects.filter((p) => p.tier !== 'selected').map((p) => ({
    name: p.name, stack: p.stack.join(' · '), blurb: p.blurb,
  })),
  skills: profile.languages,
  domains: profile.domains,
} as const;
