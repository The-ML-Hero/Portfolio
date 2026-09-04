import { useEffect, useState } from 'react';
import { useOS } from './useOS';
import { profile } from '../data/profile';

const POST = [
  'EDEN Data Systems BIOS v4.21',
  'Copyright (C) 1995 EDEN Data Systems Corp.',
  '',
  'CPU  : Abnb Systems Core @ 66 MHz',
  'Memory Test : 16384K OK',
  '',
  'Detecting IDE drives ...',
  '  Primary Master  : ABNB-PORTFOLIO  1.2GB',
  '  Primary Slave   : None',
  '',
  'Mounting /projects  ... ok',
  'Mounting /research  ... ok',
  'Loading atlas.idx   ... ok',
  'Loading raymarch.gl ... ok',
  '',
  'Starting ABNB 95 ...',
];

/**
 * POST text, then a splash, then the desktop. Runs on a timer rather than on asset progress:
 * the model is only 1.2 MB and usually loads before the text finishes, so gating on load would
 * make the sequence flash by inconsistently. Skippable with any key or click.
 */
export function BootSequence() {
  const stage = useOS((s) => s.bootStage);
  const setStage = useOS((s) => s.setBootStage);
  const [line, setLine] = useState(0);

  useEffect(() => {
    if (stage !== 'post') return;
    if (line >= POST.length) {
      const t = setTimeout(() => setStage('splash'), 320);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setLine((l) => l + 1), POST[line] === '' ? 40 : 105);
    return () => clearTimeout(t);
  }, [stage, line, setStage]);

  useEffect(() => {
    if (stage !== 'splash') return;
    const t = setTimeout(() => setStage('ready'), 1150);
    return () => clearTimeout(t);
  }, [stage, setStage]);

  useEffect(() => {
    if (stage === 'ready') return;
    const skip = () => setStage('ready');
    window.addEventListener('keydown', skip);
    window.addEventListener('pointerdown', skip);
    return () => {
      window.removeEventListener('keydown', skip);
      window.removeEventListener('pointerdown', skip);
    };
  }, [stage, setStage]);

  if (stage === 'ready' || stage === 'idle-wait') return null;

  if (stage === 'splash') {
    return (
      <div className="boot-splash">
        <div className="splash-card">
          <div className="splash-logo">ABNB<span>95</span></div>
          <div className="splash-sub">{profile.publishesAs}</div>
          <div className="splash-bar"><i /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="boot-post">
      {POST.slice(0, line).map((l, i) => (
        <div key={i}>{l || ' '}</div>
      ))}
      <span className="caret">_</span>
    </div>
  );
}
