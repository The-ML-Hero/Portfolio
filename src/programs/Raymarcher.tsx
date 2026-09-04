import { useEffect, useRef, useState } from 'react';
import frag from '../lib/raymarch.frag.glsl?raw';

const VERT = `attribute vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

/**
 * Host for the raymarcher. Owns the canvas, the loop, the resolution scaler and the FPS counter;
 * knows nothing about the shader's contents beyond the uniforms in the contract at the top of
 * raymarch.frag.glsl. Pauses whenever the window is not visible so it can't starve the main scene.
 */
export function Raymarcher() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  const [fps, setFps] = useState(0);
  const [tab, setTab] = useState<'render' | 'source'>('render');
  const [error, setError] = useState<string | null>(null);
  const cam = useRef({ yaw: 0.5, pitch: -0.15, dist: 6.2 });

  useEffect(() => {
    if (tab !== 'render') return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const gl = canvas.getContext('webgl', { antialias: false, powerPreference: 'low-power' });
    if (!gl) { setError('WebGL unavailable in this context.'); return; }

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'compile failed');
      return s;
    };

    let prog: WebGLProgram;
    try {
      prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link failed');
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
      return;
    }

    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'uResolution');
    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uCamPos = gl.getUniformLocation(prog, 'uCamPos');
    const uCamMat = gl.getUniformLocation(prog, 'uCamMat');

    const t0 = performance.now();
    let raf = 0, frames = 0, lastFps = t0, running = true;

    // Pause when the window is scrolled out, minimized or the tab is hidden.
    const io = new IntersectionObserver(([e]) => { running = e.isIntersecting; }, { threshold: 0.01 });
    io.observe(wrap);

    const render = () => {
      raf = requestAnimationFrame(render);
      if (!running || document.hidden) return;

      const w = Math.max(1, Math.floor(wrap.clientWidth * scale));
      const h = Math.max(1, Math.floor(wrap.clientHeight * scale));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);

      const time = (performance.now() - t0) / 1000;
      const { yaw, pitch, dist } = cam.current;
      const cp = Math.cos(pitch), sp = Math.sin(pitch);
      const pos = [Math.sin(yaw) * cp * dist, 1.15 + sp * dist, Math.cos(yaw) * cp * dist];
      // Basis pointing from the camera back at the origin.
      const f = [-pos[0], 1.0 - pos[1], -pos[2]];
      const fl = Math.hypot(...f); const fw = f.map((v) => v / fl);
      const rl = Math.hypot(fw[2], -fw[0]) || 1;
      const r = [fw[2] / rl, 0, -fw[0] / rl];
      const u = [r[1] * fw[2] - r[2] * fw[1], r[2] * fw[0] - r[0] * fw[2], r[0] * fw[1] - r[1] * fw[0]];

      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uTime, time);
      gl.uniform3f(uCamPos, pos[0], pos[1], pos[2]);
      gl.uniformMatrix3fv(uCamMat, false, new Float32Array([r[0], r[1], r[2], u[0], u[1], u[2], fw[0], fw[1], fw[2]]));
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      frames++;
      const now = performance.now();
      if (now - lastFps > 500) { setFps(Math.round((frames * 1000) / (now - lastFps))); frames = 0; lastFps = now; }
    };
    render();

    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, [scale, tab]);

  const onDrag = (e: React.PointerEvent) => {
    if (e.buttons !== 1) return;
    cam.current.yaw -= e.movementX * 0.006;
    cam.current.pitch = Math.max(-0.9, Math.min(1.2, cam.current.pitch + e.movementY * 0.005));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 4 }}>
      <menu role="tablist" style={{ margin: 0 }}>
        <li role="tab" aria-selected={tab === 'render'}><a href="#render" onClick={(e) => { e.preventDefault(); setTab('render'); }}>Render</a></li>
        <li role="tab" aria-selected={tab === 'source'}><a href="#source" onClick={(e) => { e.preventDefault(); setTab('source'); }}>Shader source</a></li>
      </menu>

      {tab === 'render' ? (
        <div ref={wrapRef} className="grab-surface" style={{ flex: 1, minHeight: 0, position: 'relative', background: '#05070c' }} onPointerMove={onDrag}>
          {error
            ? <p className="mono" style={{ padding: 8, color: '#a00' }}>{error}</p>
            : <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', imageRendering: 'pixelated' }} />}
        </div>
      ) : (
        <pre className="mono" style={{ flex: 1, minHeight: 0, overflow: 'auto', margin: 0, fontSize: 10, background: '#fff', padding: 6 }}>{frag}</pre>
      )}

      <div className="mono dim" style={{ fontSize: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
        <span>{fps} fps</span>
        <label>
          scale{' '}
          <select value={scale} onChange={(e) => setScale(Number(e.target.value))} style={{ fontSize: 10 }}>
            <option value={0.4}>0.4×</option>
            <option value={0.6}>0.6×</option>
            <option value={0.75}>0.75×</option>
            <option value={1}>1×</option>
          </select>
        </label>
        <span>drag to orbit</span>
      </div>
    </div>
  );
}
