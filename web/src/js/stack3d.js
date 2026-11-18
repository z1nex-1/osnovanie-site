/* «Стратиграфия основания»: знак-плита раскрывается в слои — источники, факты,
   допущения и гипотезы, варианты, решение. Узлы — настоящие утверждения, рёбра — опоры. */
import * as THREE from "three";

const COL = { fact: 0x0cdc78, source: 0x9fb3a8, hypothesis: 0xffa717, assumption: 0xc9d4cd, forecast: 0x7fd6ff, option: 0xeef4f0, close: 0xff5a64, decision: 0x0cdc78, conclusion: 0xeef4f0 };

function shapeFrom(points) {
  const s = new THREE.Shape();
  points.forEach(([x, y], i) => (i ? s.lineTo((x - 100) / 100, (87 - y) / 100) : s.moveTo((x - 100) / 100, (87 - y) / 100)));
  s.closePath();
  return s;
}

export function createStack(host, data, { onHover, interactive = true } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 760 ? 1.5 : 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.append(renderer.domElement);
  renderer.domElement.setAttribute("aria-hidden", "true");

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x07100c, 7, 17);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  scene.add(new THREE.HemisphereLight(0xdfffee, 0x07100c, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(3, 6, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x0cdc78, 1.4);
  rim.position.set(-4, 1, -3);
  scene.add(rim);

  const world = new THREE.Group();
  scene.add(world);

  /* знак */
  const stone = new THREE.MeshStandardMaterial({ color: 0x13241b, roughness: 0.72, metalness: 0.08 });
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x0cdc78, transparent: true, opacity: 0.9 });
  const mark = new THREE.Group();
  const extr = { depth: 0.5, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2 };
  const parts = [
    shapeFrom([[58, 0], [156, 0], [200, 44], [200, 112], [58, 112]]),
    shapeFrom([[0, 134], [200, 134], [200, 174], [21, 174], [0, 153]]),
  ].map((sh) => {
    const g = new THREE.ExtrudeGeometry(sh, extr);
    g.translate(0, 0, -0.25);
    const m = new THREE.Mesh(g, stone);
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 30), edgeMat));
    mark.add(m);
    return m;
  });
  mark.scale.setScalar(1.25);
  world.add(mark);

  /* слои */
  const layers = data.layers;
  const L = layers.length;
  const gap = 0.95;
  const plateW = 4.6, plateD = 3.0;
  const layerGroups = [];
  const nodeIndex = new Map();
  const nodeMeshes = [];
  const plateMat = (c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.0, depthWrite: false, side: THREE.DoubleSide });
  layers.forEach((layer, li) => {
    const g = new THREE.Group();
    g.userData.y = (li - (L - 1) / 2) * gap;
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(plateW, plateD), plateMat(0x0c1812));
    plate.rotation.x = -Math.PI / 2;
    g.add(plate);
    const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(plateW, plateD)), new THREE.LineBasicMaterial({ color: 0x34503f, transparent: true, opacity: 0 }));
    frame.rotation.x = -Math.PI / 2;
    g.add(frame);
    const grid = new THREE.GridHelper(plateW, 12, 0x23362c, 0x23362c);
    grid.scale.z = plateD / plateW;
    grid.material.transparent = true;
    grid.material.opacity = 0;
    g.add(grid);
    g.userData.fade = [plate.material, frame.material, grid.material];
    const n = layer.nodes.length;
    const cols = Math.ceil(Math.sqrt(n * (plateW / plateD)));
    const rows = Math.ceil(n / cols);
    layer.nodes.forEach((node, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      const x = n === 1 ? 0 : ((c + 0.5) / cols - 0.5) * (plateW - 0.6);
      const z = n === 1 ? 0 : ((r + 0.5) / rows - 0.5) * (plateD - 0.5);
      const big = layer.key === "options" || layer.key === "decision";
      const geo = big ? new THREE.BoxGeometry(0.34, 0.12, 0.34) : layer.key === "sources" ? new THREE.BoxGeometry(0.16, 0.02, 0.2) : new THREE.OctahedronGeometry(0.075, 0);
      const color = COL[node.kind || node.type] ?? 0xeef4f0;
      const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35, roughness: 0.5, transparent: true, opacity: 0 });
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x + (Math.sin(i * 12.9) * 0.08), 0.06, z + Math.cos(i * 7.3) * 0.06);
      m.userData = { node, layer: li, base: color };
      g.add(m);
      nodeIndex.set(node.id, m);
      nodeMeshes.push(m);
    });
    world.add(g);
    layerGroups.push(g);
  });

  /* рёбра-опоры */
  const edges = [];
  for (const [a, b] of data.edges) {
    const ma = nodeIndex.get(a), mb = nodeIndex.get(b);
    if (ma && mb) edges.push([ma, mb]);
  }
  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(edges.length * 6), 3));
  const edgeLine = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: 0x0cdc78, transparent: true, opacity: 0 }));
  world.add(edgeLine);
  const pulseGeo = new THREE.BufferGeometry();
  pulseGeo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(edges.length * 3), 3));
  const pulses = new THREE.Points(pulseGeo, new THREE.PointsMaterial({ color: 0xc6ffe0, size: 0.05, transparent: true, opacity: 0 }));
  world.add(pulses);
  const pulsePhase = edges.map(() => Math.random());

  const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
  function syncEdges() {
    const arr = edgeGeo.attributes.position.array;
    edges.forEach(([a, b], i) => {
      a.getWorldPosition(tmpA); b.getWorldPosition(tmpB);
      world.worldToLocal(tmpA); world.worldToLocal(tmpB);
      arr.set([tmpA.x, tmpA.y, tmpA.z, tmpB.x, tmpB.y, tmpB.z], i * 6);
    });
    edgeGeo.attributes.position.needsUpdate = true;
  }

  /* состояние, управляемое прокруткой */
  const S = { open: 0, focus: -1, tilt: 0, pulse: 0, wave: null };
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v) => Math.min(1, Math.max(0, v));

  function apply(t) {
    const o = S.open;
    const markOut = clamp(o / 0.35);
    mark.position.y = lerp(0, 3.4, markOut * markOut);
    mark.rotation.y = lerp(-0.42, 0.9, markOut);
    mark.rotation.x = lerp(0.12, -0.4, markOut);
    parts[0].position.y = lerp(0, 0.25, markOut);
    stone.opacity = 1;
    mark.visible = markOut < 0.999;
    mark.traverse((m) => { if (m.material) { m.material.transparent = true; m.material.opacity = 1 - markOut; } });
    const layersIn = clamp((o - 0.12) / 0.4);
    layerGroups.forEach((g, i) => {
      const k = clamp(layersIn * L - i * 0.6);
      const spread = lerp(0.08, 1, clamp((o - 0.2) / 0.45));
      g.position.y = g.userData.y * spread - (1 - k) * 0.6;
      const f = S.focus;
      const dim = f >= 0 && f !== i ? 0.35 : 1;
      g.userData.fade[0].opacity = 0.55 * k * dim;
      g.userData.fade[1].opacity = 0.9 * k * dim;
      g.userData.fade[2].opacity = 0.35 * k * dim;
      g.children.forEach((m) => { if (m.userData.node) m.material.opacity = k * dim; });
    });
    const edgesIn = clamp((o - 0.45) / 0.3);
    edgeLine.material.opacity = 0.42 * edgesIn;
    pulses.material.opacity = 0.9 * edgesIn;
    const cy = lerp(0.6, 2.6, clamp(o / 0.6));
    const radius = lerp(7.2, 9.6, clamp(o / 0.6));
    const ang = lerp(0.1, 0.78, clamp(o / 0.7)) + mouse.x * 0.12 + Math.sin(t * 0.00012) * 0.03;
    camera.position.set(Math.sin(ang) * radius, cy + mouse.y * 0.35, Math.cos(ang) * radius);
    camera.lookAt(0, lerp(0, 0.2, o), 0);
  }

  /* волна пересмотра по рёбрам: слои BFS */
  function wave(layersOfIds) {
    S.wave = { start: performance.now(), layers: layersOfIds };
  }
  function applyWave(now) {
    if (!S.wave) return;
    const dt = (now - S.wave.start) / 1000;
    let active = false;
    S.wave.layers.forEach((ids, depth) => {
      const k = dt - depth * 0.45;
      for (const id of ids) {
        const m = nodeIndex.get(id);
        if (!m) continue;
        if (k > 0) {
          active = active || k < 2.5;
          const hit = Math.max(0, 1 - Math.abs(k - 0.25) * 2.2);
          m.material.color.setHex(0xff5a64);
          m.material.emissive.setHex(0xff5a64);
          m.material.emissiveIntensity = 0.35 + hit * 1.2;
          m.scale.setScalar(1 + hit * 0.9);
        }
      }
    });
    if (!active && dt > 1) S.wave.settled = true;
  }
  function resetWave() {
    S.wave = null;
    nodeMeshes.forEach((m) => { m.material.color.setHex(m.userData.base); m.material.emissive.setHex(m.userData.base); m.material.emissiveIntensity = 0.35; m.scale.setScalar(1); });
  }

  /* наведение */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hovered = null;
  if (interactive) {
    host.addEventListener("pointermove", (e) => {
      const r = host.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      mouse.tx = ndc.x; mouse.ty = ndc.y;
      if (S.open < 0.4) return;
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(nodeMeshes.filter((m) => m.material.opacity > 0.5), false)[0];
      const m = hit?.object || null;
      if (m !== hovered) {
        if (hovered && !S.wave) hovered.scale.setScalar(1);
        hovered = m;
        if (m) m.scale.setScalar(1.6);
        host.style.cursor = m ? "pointer" : "";
        onHover?.(m ? m.userData.node : null, e);
      } else if (m) onHover?.(m.userData.node, e);
    });
    host.addEventListener("pointerleave", () => { mouse.tx = 0; mouse.ty = 0; onHover?.(null); });
  }

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < 760 ? 44 : 32;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  let visible = true, raf = 0, frozen = false;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) loop(performance.now()); }, { rootMargin: "200px" });
  io.observe(host);

  function loop(t) {
    raf = 0;
    if (!visible || document.hidden) return;
    mouse.x = lerp(mouse.x, mouse.tx, 0.05);
    mouse.y = lerp(mouse.y, mouse.ty, 0.05);
    apply(t);
    if (!frozen) world.rotation.y = Math.sin(t * 0.00009) * 0.06;
    syncEdges();
    const parr = pulseGeo.attributes.position.array;
    const ea = edgeGeo.attributes.position.array;
    edges.forEach((_, i) => {
      const p = (pulsePhase[i] + t * 0.00028) % 1;
      for (let k = 0; k < 3; k++) parr[i * 3 + k] = ea[i * 6 + k] + (ea[i * 6 + 3 + k] - ea[i * 6 + k]) * p;
    });
    pulseGeo.attributes.position.needsUpdate = true;
    applyWave(t);
    renderer.render(scene, camera);
    if (!frozen) raf = requestAnimationFrame(loop);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden && !raf) raf = requestAnimationFrame(loop); });
  raf = requestAnimationFrame(loop);

  return {
    set open(v) { S.open = v; if (frozen) loop(performance.now()); },
    get open() { return S.open; },
    focus(i) { S.focus = i; },
    wave, resetWave,
    freeze(v) { frozen = v; if (!v && !raf) raf = requestAnimationFrame(loop); else loop(performance.now()); },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); renderer.dispose(); },
  };
}

export function webglOK() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
}
