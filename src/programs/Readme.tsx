import { profile } from '../data/profile';
import { useOS } from '../os/useOS';

export function Readme() {
  const open = useOS((s) => s.open);
  return (
    <div>
      <h1>{profile.handle}</h1>
      <p className="dim mono">publishes as {profile.publishesAs}</p>
      <p><strong>{profile.tagline}</strong></p>
      <p>{profile.education}<br />{profile.location}</p>
      <h2>Links</h2>
      <ul>
        <li><a href={profile.github} target="_blank" rel="noreferrer">{profile.githubLabel}</a></li>
        <li><a href="#" onClick={(e) => { e.preventDefault(); open('resume'); }}>Resume</a></li>
        <li><a href="#" onClick={(e) => { e.preventDefault(); open('contact'); }}>Contact</a></li>
      </ul>
      <p className="dim">Double-click an icon, or use Start. Two programs actually run: Raymarcher and Atlas.</p>
    </div>
  );
}
