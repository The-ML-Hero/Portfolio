import { profile } from './profile';
import { publication, internship } from './research';
import { projects } from './projects';

/** The resume is a view over the same data as everything else — no second source of truth. */
export const resume = {
  name: profile.publishesAs,
  known: profile.handle,
  headline: profile.tagline,
  contact: [profile.location, profile.email, profile.phone, profile.siteLabel, profile.githubLabel],
  education: profile.schooling,
  interests: profile.interests,
  research: [
    {
      what: `${publication.role}, ${publication.journal}`,
      detail: publication.title,
      meta: `${publication.volume}, ${publication.pages} · DOI ${publication.doi}`,
    },
    {
      what: `${internship.role}, ${internship.institution}`,
      detail: internship.summary,
      meta: `${internship.city} · ${internship.dates} · supervised by ${internship.supervisor}`,
    },
  ],
  selected: projects.filter((p) => p.tier === 'selected').map((p) => ({
    name: p.name, stack: p.stack.join(' · '), blurb: p.blurb,
  })),
  other: projects.filter((p) => p.tier !== 'selected').map((p) => ({
    name: p.name, stack: p.stack.join(' · '), blurb: p.blurb,
  })),
  skills: {
    Languages: profile.languages,
    Frameworks: profile.frameworks,
    Technologies: profile.technologies,
  } as Record<string, readonly string[]>,
  domains: profile.domains,
} as const;
