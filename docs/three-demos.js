/*!
 * vanilla.waves - docs/three-demos.js
 * De LIVE three.js-voorbeelden op de Interop-pagina. Alleen deze pagina laadt
 * three.js; de rest van de site blijft canvasloos en zonder dependencies.
 *
 * Volgt bewust dezelfde conventies als de canvasloze engine, zodat de demo's
 * zich gedragen als al het andere op de site:
 *   - een GEDEELDE loop met dezelfde 30 fps-cap
 *   - IntersectionObserver: buiten beeld staat de scene stil
 *   - prefers-reduced-motion: een enkel statisch frame, geen animatie
 *   - het coffeehouse-palet uit waves-demos.js
 *
 * De waves komen uit waves-core.mjs, de module-ingang. Elke demo leest via
 * sampler.sample(positie, tijd) en verder niets: three.js tekent, vanilla.waves
 * bepaalt.
 * License: MIT · seb@prjcts
 */

import * as THREE from 'three';
import { createSampler } from '../waves-core.mjs';

// ─── Palet, gelijk aan waves-demos.js ────────────────────────────────────────
const INK    = 0x453020;
const ACCENT = 0x72bab8;
const SAND   = 0xb39c7d;
const SURFACE = 0xf7f4ec;

const FPS = 30;
const FRAME_MS = 1000 / FPS;
const REDUCED = typeof matchMedia === 'function' &&
                matchMedia('(prefers-reduced-motion: reduce)').matches;

const scenes = [];
let last = 0;

const io = ('IntersectionObserver' in window)
  ? new IntersectionObserver((entries) => {
      for (const e of entries) {
        const s = scenes.find((x) => x.node === e.target);
        if (s) s.visible = e.isIntersecting;
      }
    }, { rootMargin: '80px' })
  : null;

function mount(node) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearAlpha(0);
  node.appendChild(renderer.domElement);
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.maxWidth = '100%';

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  const scene = new THREE.Scene();

  const resize = () => {
    const w = Math.max(1, node.clientWidth);
    const h = Math.max(1, node.clientHeight);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };
  new ResizeObserver(resize).observe(node);
  resize();

  return { renderer, camera, scene, resize };
}

function register(node, build) {
  const ctx = mount(node);
  const update = build(ctx);
  const entry = {
    node, ctx, update, visible: true, t: 0, frames: 0,
    name: node.dataset.three,
    get triangles() { return ctx.renderer.info.render.triangles; }
  };
  scenes.push(entry);
  if (io) io.observe(node);
  update(0);
  ctx.renderer.render(ctx.scene, ctx.camera);
  node.classList.add('wv--ready');
}

function loop(now) {
  requestAnimationFrame(loop);
  if (now - last < FRAME_MS) return;      // dezelfde 30 fps-cap als de engine
  last = now;
  const t = now / 1000;
  for (const s of scenes) {
    if (!s.visible) continue;             // buiten beeld: niets doen
    s.update(t);
    s.ctx.renderer.render(s.ctx.scene, s.ctx.camera);
    s.frames++;
  }
}

// Debug-handle. Een WebGL-canvas is niet te controleren met readPixels zodra de
// drawing buffer niet bewaard blijft, en screenshots vangen hem hier evenmin.
// Hiermee is per demo te zien of de loop draait en of three.js echt geometrie
// tekent: __threeDemos.map(d => [d.name, d.frames, d.triangles]).
window.__threeDemos = scenes;

// ─── 1. Displaced geometry ───────────────────────────────────────────────────
function displacedLine({ scene, camera }) {
  camera.position.set(0, 0, 7);
  const N = 220;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3);
  const attr = new THREE.BufferAttribute(pos, 3);
  attr.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('position', attr);
  scene.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: ACCENT })));

  const s = createSampler({ shift: true, group: 'gentle', range: [-1.3, 1.3] });

  return (t) => {
    for (let i = 0; i < N; i++) {
      pos[i * 3]     = (i / (N - 1)) * 12 - 6;
      pos[i * 3 + 1] = s.sample(i * 0.6, t);
      pos[i * 3 + 2] = 0;
    }
    attr.needsUpdate = true;
    geo.computeBoundingSphere();
  };
}

// ─── 2. De naadloze closing-ring ─────────────────────────────────────────────
function closingRing({ scene, camera }) {
  camera.position.set(0, 2.6, 6.4);
  camera.lookAt(0, 0, 0);
  const SEG = 260, LOBES = 6;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array((SEG + 1) * 3);
  const attr = new THREE.BufferAttribute(pos, 3);
  attr.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('position', attr);
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: INK }));
  scene.add(line);

  const ring = createSampler({ shift: true, group: 'closing', range: [-0.6, 0.6] });

  return (t) => {
    const sweep = ring.period * LOBES;     // sluit door elke shift heen
    for (let i = 0; i <= SEG; i++) {
      const u = i / SEG;
      const a = u * Math.PI * 2;
      const r = 2.1 + ring.sample(u * sweep, t);
      pos[i * 3]     = Math.cos(a) * r;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    attr.needsUpdate = true;
    geo.computeBoundingSphere();
    line.rotation.y = t * 0.18;
  };
}

// ─── 3. Instanced 2D-veld ────────────────────────────────────────────────────
function instancedField({ scene, camera }) {
  camera.position.set(0, 7.5, 9.5);
  camera.lookAt(0, 0.5, 0);
  scene.add(new THREE.AmbientLight(0xffffff, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(4, 8, 5);
  scene.add(key);

  const GX = 14, GZ = 14;
  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.42, 1, 0.42),
    new THREE.MeshStandardMaterial({ color: SAND, roughness: 0.75 }),
    GX * GZ
  );
  scene.add(mesh);

  const sx = createSampler({ seed: 7,  shift: true, group: 'gentle', range: [0, 1] });
  const sz = createSampler({ seed: 21, shift: true, group: 'gentle', range: [0, 1] });
  const dummy = new THREE.Object3D();
  const col = new THREE.Color();

  return (t) => {
    let i = 0;
    for (let gz = 0; gz < GZ; gz++) for (let gx = 0; gx < GX; gx++, i++) {
      const h = 0.25 + sx.sample(gx * 1.5, t) * sz.sample(gz * 1.5, t) * 3;
      dummy.position.set(gx - GX / 2 + 0.5, h / 2, gz - GZ / 2 + 0.5);
      dummy.scale.set(1, h, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      col.setHex(h > 1.7 ? ACCENT : SAND);
      mesh.setColorAt(i, col);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  };
}

// ─── 4. De wave als GPU-lookup ───────────────────────────────────────────────
function gpuLut({ scene, camera }) {
  camera.position.set(0, 0, 3.1);
  const LUT = 256;
  const data = new Float32Array(LUT);
  const tex = new THREE.DataTexture(data, LUT, 1, THREE.RedFormat, THREE.FloatType);
  tex.needsUpdate = true;

  const s = createSampler({ shift: true, group: 'gentle', range: [0.05, 0.95] });

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uLut:  { value: tex },
      uInk:  { value: new THREE.Color(INK) },
      uAcc:  { value: new THREE.Color(ACCENT) },
      uSurf: { value: new THREE.Color(SURFACE) }
    },
    vertexShader: `varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform sampler2D uLut; uniform vec3 uInk, uAcc, uSurf; varying vec2 vUv;
      void main(){
        float v = texture2D(uLut, vec2(vUv.x, 0.5)).r;
        float under = step(vUv.y, v);
        float edge  = smoothstep(0.012, 0.0, abs(vUv.y - v));
        vec3 c = mix(uSurf, uAcc, under * 0.55);
        c = mix(c, uInk, edge);
        gl_FragColor = vec4(c, max(under * 0.85, edge));
      }`
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.4), mat));

  return (t) => {
    for (let k = 0; k < LUT; k++) data[k] = s.sample(k * 0.7, t);
    tex.needsUpdate = true;               // een kleine upload per frame
  };
}

// ─── Opstarten ───────────────────────────────────────────────────────────────
const BUILDERS = {
  'displaced-line': displacedLine,
  'closing-ring':   closingRing,
  'instanced-field': instancedField,
  'gpu-lut':        gpuLut
};

for (const node of document.querySelectorAll('[data-three]')) {
  const build = BUILDERS[node.dataset.three];
  if (!build) continue;
  try {
    register(node, build);
  } catch (err) {
    node.textContent = 'This demo needs WebGL.';
    node.classList.add('three-fallback');
    console.error('[three-demos]', node.dataset.three, err);
  }
}

// Reduced motion: het ene statische frame hierboven is genoeg, geen loop.
if (!REDUCED && scenes.length) requestAnimationFrame(loop);
