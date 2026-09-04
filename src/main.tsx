import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * Always open at the top.
 *
 * Scroll position is the camera (see lib/scrollZones.ts), so the browser restoring it on
 * reload does not restore a reading position — it drops the visitor straight onto the desk
 * with the title card already fully open, which then unmounts on its first frame. The whole
 * opening is skipped and there is no way to get it back short of scrolling up.
 *
 * Set before render, so nothing reads a restored offset. The explicit scrollTo covers a
 * back/forward navigation, where the offset may already have been applied by the time this
 * runs, and the load handler covers browsers that restore asynchronously after parsing.
 */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
window.addEventListener('load', () => window.scrollTo(0, 0), { once: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
