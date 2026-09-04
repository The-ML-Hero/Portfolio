import { profile } from '../data/profile';

/**
 * The one place the brief allows personality. Kept terse — the voice note is explicit that
 * filler and "passionate about technology" are out.
 */
export function About() {
  return (
    <div>
      <h1 style={{ marginTop: 0 }}>{profile.handle}</h1>
      <p className="dim mono">{profile.publishesAs} · {profile.location}</p>
      <p>{profile.positioning}</p>

      <fieldset>
        <legend>Setup</legend>
        <table>
          <tbody>
            <tr><td style={{ width: '30%' }}>OS</td><td>{profile.environment.os}</td></tr>
            <tr><td>Editor</td><td>{profile.environment.editor}</td></tr>
            <tr><td>Languages</td><td className="mono">{profile.languages.join('  ')}</td></tr>
          </tbody>
        </table>
      </fieldset>

      <fieldset>
        <legend>Off the clock</legend>
        <p style={{ margin: '0 0 6px' }}>
          Dark and psychological manga — Berserk, Vagabond, Junji Ito, Vinland Saga.
          Visual novels: House in Fata Morgana, Umineko. Elden Ring.
        </p>
        <p style={{ margin: 0 }}>
          Writing original fantasy worldbuilding: the <strong>Chronicle System</strong>, where deeds
          convert to power and the Ledger is the cosmic substrate — ranks run from Unwritten to
          Eternal Chronicle, with The Author at Rank Zero. Separately a Guardian/Domain Leader
          setting: twelve domains and the Farside realm.
        </p>
      </fieldset>

      <fieldset>
        <legend>Currently studying</legend>
        <ul style={{ margin: 0 }}>
          {profile.ongoing.map((o) => <li key={o}>{o}</li>)}
        </ul>
      </fieldset>
    </div>
  );
}
