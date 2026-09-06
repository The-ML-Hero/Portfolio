import { profile } from '../data/profile';

export function Contact() {
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Contact</h2>
      <table>
        <tbody>
          <tr><td style={{ width: '30%' }}>Email</td><td><a href={`mailto:${profile.email}`}>{profile.email}</a></td></tr>
          <tr><td>Phone</td><td className="mono">{profile.phone}</td></tr>
          <tr><td>GitHub</td><td><a href={profile.github} target="_blank" rel="noreferrer">{profile.githubLabel}</a></td></tr>
          <tr><td>Site</td><td><a href={profile.site} target="_blank" rel="noreferrer">{profile.siteLabel}</a></td></tr>
          <tr><td>Location</td><td>{profile.location}</td></tr>
          <tr><td>Institution</td><td>{profile.education}</td></tr>
        </tbody>
      </table>
    </div>
  );
}

export function SystemProperties() {
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>System</h2>
      <table>
        <tbody>
          <tr><td style={{ width: '32%' }}>User</td><td>{profile.handle} · {profile.publishesAs}</td></tr>
          <tr><td>OS</td><td>{profile.environment.os}</td></tr>
          <tr><td>Editor</td><td>{profile.environment.editor}</td></tr>
          <tr><td>Languages</td><td>{profile.languages.join(', ')}</td></tr>
          <tr><td>Frameworks</td><td>{profile.frameworks.join(', ')}</td></tr>
          <tr><td>Technologies</td><td>{profile.technologies.join(', ')}</td></tr>
        </tbody>
      </table>
      <h2>Areas of interest</h2>
      <ul>{profile.interests.map((i) => <li key={i}>{i}</li>)}</ul>
      <h2>Domains</h2>
      <ul>{profile.domains.map((d) => <li key={d}>{d}</li>)}</ul>
      <h2>Coursework</h2>
      <ul>{profile.coursework.map((c) => <li key={c}>{c}</li>)}</ul>
      <h2>Ongoing</h2>
      <ul>{profile.ongoing.map((c) => <li key={c}>{c}</li>)}</ul>
    </div>
  );
}

export function Credits() {
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Credits</h2>
      <p>
        3D model: <strong>&ldquo;Computer Terminal&rdquo;</strong> by Chris Sweetwood, licensed
        {' '}<a href="http://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC-BY-SA-4.0</a>.
      </p>
      <p className="mono" style={{ fontSize: 11 }}>
        <a href="https://sketchfab.com/3d-models/computer-terminal-b3a26b00c5b04eedad0a1cdca884130f" target="_blank" rel="noreferrer">
          sketchfab.com/3d-models/computer-terminal
        </a>
      </p>
      <p className="dim">Backdrop planes removed; textures recompressed. Key plate is original work.</p>
      <p className="dim">Built with three.js, React and 98.css.</p>
    </div>
  );
}
