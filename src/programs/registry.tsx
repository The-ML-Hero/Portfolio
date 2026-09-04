import type { ComponentType } from 'react';
import type { ProgramId } from '../os/useOS';
import type { IconName } from '../os/Icons';
import { Readme } from './Readme';
import { Projects, ProjectDetail } from './Projects';
import { Research } from './Research';
import { Resume } from './Resume';
import { Raymarcher } from './Raymarcher';
import { AtlasSearch } from './AtlasSearch';
import { Contact, SystemProperties, Credits } from './Misc';
import { About } from './About';
import { Github } from './Github';

export const programs: Record<ProgramId, ComponentType<{ arg?: string }>> = {
  readme: Readme,
  projects: Projects,
  research: Research,
  resume: Resume,
  raymarcher: Raymarcher,
  atlas: AtlasSearch,
  contact: Contact,
  sysprops: SystemProperties,
  credits: Credits,
  about: About,
  github: Github,
  'project-detail': ProjectDetail,
};

/** Start-menu ordering. `sep` rows render as dividers. */
export const PROGRAM_LIST: { id: string; label?: string; icon?: IconName; sep?: boolean }[] = [
  { id: 'readme', label: 'README.txt', icon: 'doc' },
  { id: 'about', label: 'About Me', icon: 'person' },
  { id: 'projects', label: 'Projects', icon: 'folder' },
  { id: 'research', label: 'Research', icon: 'research' },
  { id: 'resume', label: 'Resume', icon: 'resume' },
  { id: 'github', label: 'GitHub', icon: 'github' },
  { id: 's1', sep: true },
  { id: 'raymarcher', label: 'Raymarcher.exe', icon: 'cube' },
  { id: 'atlas', label: 'Atlas.exe', icon: 'search' },
  { id: 's2', sep: true },
  { id: 'sysprops', label: 'System Properties', icon: 'monitor' },
  { id: 'contact', label: 'Contact', icon: 'mail' },
  { id: 'credits', label: 'Credits', icon: 'info' },
];
