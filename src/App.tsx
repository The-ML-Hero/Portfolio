import { Canvas } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useProgress } from '@react-three/drei';
import { Terminal } from './scene/Terminal';
import { Office } from './scene/Office';
import { Lighting } from './scene/Lighting';
import { Mouse } from './scene/Mouse';
import { ScreenSurface } from './scene/ScreenSurface';
import { CrtReflection } from './scene/CrtReflection';
import { CameraRig } from './scene/CameraRig';
import { Probe } from './scene/probe';
import { Debug } from './scene/debug';
import { LoadingScreen } from './os/LoadingScreen';
import { TitleCard } from './os/TitleCard';
import { OVERVIEW, overviewDistance } from './scene/constants';
import { useOS } from './os/useOS';
import './styles/win95.css';

/** First-frame camera placement, matching what CameraRig will settle on for this viewport. */
function initialCameraPos(): [number, number, number] {
  const aspect = window.innerWidth / Math.max(1, window.innerHeight);
  const d = overviewDistance(aspect);
  const len = Math.hypot(...OVERVIEW.dir);
  return [
    OVERVIEW.from[0] + (OVERVIEW.dir[0] / len) * d,
    OVERVIEW.from[1] + (OVERVIEW.dir[1] / len) * d,
    OVERVIEW.from[2] + (OVERVIEW.dir[2] / len) * d,
  ];
}

const params = new URLSearchParams(location.search);
const showProbe = params.has('calibrate');
const noFx = params.has('nofx');
const noScreen = params.has('noscreen');
const noreflect = params.has('noreflect');
/** Hold the title card up for inspection instead of letting it play out. */
const holdTitle = params.has('title');

/**
 * Scroll affordance. Shown from the moment the assets are in, because scrolling is now what
 * opens the title card as well as what flies the camera — nothing else on screen says the page
 * goes anywhere. It gets out of the way as soon as the visitor takes the hint.
 */
function ScrollHint({ ready }: { ready: boolean }) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const onScroll = () => { if (window.scrollY > 40) setHidden(true); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!ready || hidden) return null;
  return (
    <div className="scroll-hint">
      <span>SCROLL</span>
      <em />
    </div>
  );
}

/** Shown once seated, since the page no longer scrolls and there is nothing else to say so. */
function ExitHint() {
  const phase = useOS((s) => s.phase);
  if (phase !== 'seated') return null;
  return <div className="exit-hint">ESC to step back</div>;
}

/**
 * Mounts only once Suspense has resolved, i.e. the model is decoded and in the scene.
 * This is the authoritative "ready" signal: on a warm cache useProgress never goes active,
 * so progress alone would leave the loader waiting on its timeout.
 */
function SceneReady({ onReady }: { onReady: () => void }) {
  useEffect(() => { onReady(); }, [onReady]);
  return null;
}

/**
 * Reports asset-loading progress out of the Canvas, where the loader overlay lives.
 *
 * useProgress reports active:false both before loading starts and after it finishes, so
 * reporting 100 on !active would complete the loader instantly and then snap backwards.
 * We only trust !active once a load has actually been seen.
 */
function ProgressBridge({ onProgress }: { onProgress: (n: number) => void }) {
  const { progress, active } = useProgress();
  const started = useRef(false);
  useEffect(() => {
    if (active) started.current = true;
    if (active) onProgress(progress);
    else if (started.current) onProgress(100);
  }, [progress, active, onProgress]);
  return null;
}

export default function App() {
  const setPhase = useOS((s) => s.setPhase);
  const open = useOS((s) => s.open);
  const bootStage = useOS((s) => s.bootStage);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  /** The title card sits between the loader and the room; the scroll hint waits for it. */
  const [titled, setTitled] = useState(false);

  useEffect(() => {
    setPhase('idle');
  }, [setPhase]);

  useEffect(() => {
    if (bootStage === 'ready') open('readme');
  }, [bootStage, open]);

  const setBootStage = useOS((s) => s.setBootStage);
  const handleProgress = useCallback((n: number) => setProgress((p) => Math.max(p, n)), []);

  const handleReady = useCallback(() => setProgress(100), []);
  const handleTitled = useCallback(() => setTitled(true), []);

  // Last-resort safety net: if a decoder stalls outright, the loader must still clear rather
  // than trapping the visitor on a boot screen.
  useEffect(() => {
    const t = setTimeout(() => setProgress(100), 12000);
    return () => clearTimeout(t);
  }, []);

  // Hold the in-world POST until the site loader has gone, so it is actually seen.
  useEffect(() => {
    if (loaded) setBootStage('post');
  }, [loaded, setBootStage]);

  return (
    <>
      <Canvas
        shadows
        dpr={[1, 2]}
        // preserveDrawingBuffer keeps the frame readable for screenshot-based verification.
        // It costs a buffer copy per frame, so it is dev-only.
        gl={{ preserveDrawingBuffer: import.meta.env.DEV }}
        camera={{ position: initialCameraPos(), fov: OVERVIEW.fov }}
        style={{ position: 'fixed', inset: 0, background: '#dfe4ea' }}
      >
        {import.meta.env.DEV && <Debug />}
        <ProgressBridge onProgress={handleProgress} />
        <Lighting />
        <Suspense fallback={null}>
          <Office />
          <Terminal />
          {!noScreen && <ScreenSurface />}
          {!noScreen && !noreflect && <CrtReflection />}
          {showProbe && <Probe />}
          <SceneReady onReady={handleReady} />
        </Suspense>
        <Mouse />
        <CameraRig />
        {!noFx && (
          <EffectComposer>
            {/* Just enough bloom for the troffers to glare. The vignette is gone on purpose:
                darkened corners are the single most moody-looking thing you can do to an
                evenly lit room, and this one is meant to look flat and unforgiving. */}
            <Bloom intensity={0.22} luminanceThreshold={0.85} luminanceSmoothing={0.2} mipmapBlur />
          </EffectComposer>
        )}
      </Canvas>

      {/*
        The page's only real content is its height: the camera reads window.scrollY, so this
        spacer is what the visitor is actually scrolling. Six screens is enough travel for the
        descent to feel deliberate without turning into a chore.
      */}
      <div className="scroll-track" aria-hidden />

      <ScrollHint ready={loaded} />
      <ExitHint />
      {!loaded && <LoadingScreen progress={progress} onDone={() => setLoaded(true)} />}
      {loaded && !titled && <TitleCard onDone={handleTitled} hold={holdTitle} />}
    </>
  );
}
