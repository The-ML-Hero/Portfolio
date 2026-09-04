import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

/** Dev-only: exposes the R3F state on window for browser-side inspection. */
export function Debug() {
  const state = useThree();
  useEffect(() => {
    (window as unknown as { __r3fState: unknown }).__r3fState = state;
  }, [state]);
  return null;
}
