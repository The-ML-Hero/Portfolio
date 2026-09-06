// ---------------------------------------------------------------------------
// SWAP SEAM. Replace this whole file with the author's original shader.
//
// Contract the host guarantees:
//   uniform vec2  uResolution;  // render target size in px
//   uniform float uTime;        // seconds since the window opened
//   uniform vec3  uCamPos;      // camera position, world space
//   uniform mat3  uCamMat;      // camera basis: columns are right, up, forward
//   void mainImage(out vec4 fragColor, in vec2 fragCoord);
//
// The host owns the canvas, the loop, the resolution scaler and the FPS counter, and never
// reads anything else out of here. Adding a uniform means adding it to that list, nothing more.
//
// v1 stand-in: SDF scene with procedural terrain, soft shadows and a raised structure.
// ---------------------------------------------------------------------------

precision highp float;

uniform vec2  uResolution;
uniform float uTime;
uniform vec3  uCamPos;
uniform mat3  uCamMat;

const int   MAX_STEPS = 96;
const float MAX_DIST  = 60.0;
const float SURF_DIST = 0.0015;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
  return v;
}

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float sdTorus(vec3 p, vec2 t) {
  return length(vec2(length(p.xz) - t.x, p.y)) - t.y;
}

// Scene SDF. Returns distance; `id` reports which primitive was nearest.
float map(vec3 p, out float id) {
  float terrain = p.y + 1.2 - fbm(p.xz * 0.28) * 1.7;
  id = 0.0;
  float d = terrain;

  vec3 q = p - vec3(0.0, 0.35, 0.0);
  float rot = uTime * 0.35;
  mat2 R = mat2(cos(rot), -sin(rot), sin(rot), cos(rot));
  q.xz = R * q.xz;
  float box = sdBox(q, vec3(0.62, 0.62, 0.62)) - 0.05;
  if (box < d) { d = box; id = 1.0; }

  float ring = sdTorus(p - vec3(0.0, 0.35, 0.0), vec2(1.55, 0.055));
  if (ring < d) { d = ring; id = 2.0; }

  return d;
}

vec3 calcNormal(vec3 p) {
  vec2 e = vec2(0.0012, 0.0);
  float dummy;
  return normalize(vec3(
    map(p + e.xyy, dummy) - map(p - e.xyy, dummy),
    map(p + e.yxy, dummy) - map(p - e.yxy, dummy),
    map(p + e.yyx, dummy) - map(p - e.yyx, dummy)));
}

// Soft shadows by tracking the closest approach along the light ray.
float softShadow(vec3 ro, vec3 rd, float k) {
  float res = 1.0, t = 0.03, id;
  for (int i = 0; i < 40; i++) {
    float h = map(ro + rd * t, id);
    if (h < 0.001) return 0.0;
    res = min(res, k * h / t);
    t += clamp(h, 0.02, 0.5);
    if (t > 14.0) break;
  }
  return clamp(res, 0.0, 1.0);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - uResolution.xy) / uResolution.y;
  vec3 rd = normalize(uCamMat * vec3(uv, 1.6));
  vec3 ro = uCamPos;

  float t = 0.0, id = 0.0, hitId = -1.0;
  for (int i = 0; i < MAX_STEPS; i++) {
    vec3 p = ro + rd * t;
    float d = map(p, id);
    if (d < SURF_DIST) { hitId = id; break; }
    t += d;
    if (t > MAX_DIST) break;
  }

  vec3 sky = mix(vec3(0.02, 0.03, 0.06), vec3(0.10, 0.16, 0.26), clamp(rd.y * 1.6 + 0.35, 0.0, 1.0));
  vec3 col = sky;

  if (t < MAX_DIST && hitId >= 0.0) {
    vec3 p = ro + rd * t;
    vec3 n = calcNormal(p);
    vec3 lightDir = normalize(vec3(0.55, 0.72, -0.4));

    vec3 albedo = vec3(0.30, 0.32, 0.36);
    if (hitId > 0.5 && hitId < 1.5) albedo = vec3(0.72, 0.36, 0.16);
    if (hitId > 1.5)                albedo = vec3(0.20, 0.62, 0.72);

    float diff = clamp(dot(n, lightDir), 0.0, 1.0);
    float sh   = softShadow(p + n * 0.004, lightDir, 12.0);
    float amb  = 0.30 + 0.30 * n.y;
    float fres = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 4.0);

    col = albedo * (amb * vec3(0.30, 0.36, 0.48) + diff * sh * vec3(1.05, 0.95, 0.82));
    col += fres * 0.22;
    col = mix(col, sky, 1.0 - exp(-0.0032 * t * t));  // distance fog
  }

  col = pow(clamp(col, 0.0, 1.0), vec3(0.4545));      // gamma
  fragColor = vec4(col, 1.0);
}

void main() { mainImage(gl_FragColor, gl_FragCoord.xy); }
