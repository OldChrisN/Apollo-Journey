import * as THREE from 'three';

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// ---------- shared state (top level, so it is created once) ----------
const parts = {};      // name -> THREE object, filled after the model loads
const bounds = {};     // name -> Box3 measured at load
const dropped = {};    // name -> true once a part has been dropped
const debris = [];     // parts currently drifting away
let lastMT = null;     // last mission time we saw, for smooth debris motion
let downrange = 0;     // km travelled sideways since liftoff

let plumeClock = 0;
let lastNowT = performance.now() / 1000;
let lastPlumeMT = null;

const PART_NAMES = ["S-IC", "S-II_Interstage", "S-II", "S-IVB_Interstage", "S-IVB", "LES"];

// gaps to close, in the model's own units (pulled down relative to the part below).
// tweak by eye: a bigger number pulls that part (and everything above it) further down
const GAPS = {
  "S-II_Interstage": 8.4,
  "S-II":            12.5,
  "S-IVB_Interstage": 8.2,
  "S-IVB":           12.4,
  "LES":             11.0
};

// staging times (seconds of mission time)
const SEP1 = 150.1;                 // S-IC separation, matches your data
const INTERSTAGE_DROP = SEP1 + 30;  // about T+180
const LES_DROP = SEP1 + 36;         // about T+186

// finds a part even if three.js changed the spaces/underscores in its name
const norm = s => s.replace(/[\s_]/g, "").toLowerCase();
function findPart(root, name){
  let hit = null;
  root.traverse(o => { if (!hit && norm(o.name) === norm(name)) hit = o; });
  return hit;
}

const rocket = new THREE.Group();

const loader = new GLTFLoader();
loader.load("models/saturnv.glb", (gltf) => {
  const model = gltf.scene;

  // 1) find every part first (after the first attach the rest can't be found under model)
  const found = PART_NAMES.map(n => findPart(model, n));

  // 2) close the gaps (each part is positioned relative to the one below it)
  PART_NAMES.forEach((n, i) => {
    if (found[i] && GAPS[n]) found[i].position.y -= GAPS[n];
  });

  // 3) scale to real height in km, then center the stack on the group's origin
  const box = new THREE.Box3().setFromObject(model);
  const height = box.max.y - box.min.y;
  model.scale.setScalar(0.1106 / height);     // real Saturn V is about 110.6 m tall

  const box2 = new THREE.Box3().setFromObject(model);
  model.position.y -= box2.getCenter(new THREE.Vector3()).y;

  rocket.add(model);
  rocket.updateMatrixWorld(true);

  // 4) un-nest: every part becomes its own child of the rocket group, so it can be dropped alone
  found.forEach((p, i) => {
    if (!p) { console.warn("part not found:", PART_NAMES[i]); return; }
    rocket.attach(p);
  });
  rocket.updateMatrixWorld(true);

  // 5) remember each part and where it sits (used for the camera target)
  PART_NAMES.forEach((n, i) => {
    if (!found[i]) return;
    parts[n] = found[i];
    bounds[n] = new THREE.Box3().setFromObject(found[i]);
  });
});


const scene = new THREE.Scene();

// flat side-on view (no perspective), like Space Flight Simulator
const viewSize = 0.09;   // half the visible height in km: smaller = zoomed in, bigger = zoomed out
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(
  -viewSize * aspect, viewSize * aspect, viewSize, -viewSize, 0.001, 10
);

const canvas = document.getElementById("sim_canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

window.addEventListener("resize", () => {
  const aspect = window.innerWidth / window.innerHeight;
  camera.left   = -viewSize * aspect;
  camera.right  =  viewSize * aspect;
  camera.top    =  viewSize;
  camera.bottom = -viewSize;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});


//Air density setup
// top of the sky (what you had before)
const colorLow  = new THREE.Color(0x3d9be9);
const colorMid   = new THREE.Color(0x1f78d1);   // rich blue for the top
const colorHigh = new THREE.Color(0x0b1d3a);
const skyColor  = new THREE.Color();

// horizon (new)
const horizonLow   = new THREE.Color(0x9fd0f5);   // paler than the top
const horizonMid = new THREE.Color(0x4fa6ee);
const horizonHigh  = new THREE.Color(0x1b3b66);
const horizonColor = new THREE.Color();

const colorSpace = new THREE.Color(0x000000);
const root = document.documentElement

function blend3(out, a, b, c, t) {
  if (t < 0.5) out.copy(a).lerp(b, t * 2);
  else         out.copy(b).lerp(c, (t - 0.5) * 2);
}
//Air density setup


scene.add(rocket);

// ---------- launch site ----------
const SITE_SCALE = 0.122 / 114.3;     // tower ~122 m tall in km; the pad uses the same scale
const BASE_Y = -0.1106 / 2;           // where the bottom of the rocket sits at liftoff
const TOWER_X = -0.001;     // centers the tower's body on the rocket
const TOWER_Z = -0.03;      // far enough back that it never touches the rocket

const site = new THREE.Group();
site.position.y = BASE_Y;             // the group's origin is the pad deck
scene.add(site);

const FLOOR_W = 1.0;     // km wide, enough to fill the screen while the pad scrolls
const FLOOR_H = 0.05;    // km thick
const FLOOR_D = 0.3;     // km deep (invisible side-on, but keeps the box solid)
const floor = new THREE.Mesh(
  new THREE.BoxGeometry(FLOOR_W, FLOOR_H, FLOOR_D),
  new THREE.MeshStandardMaterial({ color: 0x7a7a7a, roughness: 1 })   // gray ground
);
floor.position.y = -FLOOR_H / 2 - 0.03;   // top sits just under the pad deck (deck is at y = 0)
site.add(floor);

loader.load("models/launchpad.glb", (gltf) => {
  const pad = gltf.scene;
  pad.scale.setScalar(SITE_SCALE);
  pad.position.y = -25.4 * SITE_SCALE;   // puts the pad's deck at the group's origin
  pad.rotation.y = Math.PI / 1;
  site.add(pad);
});

loader.load("models/tower.glb", (gltf) => {
  const tower = gltf.scene;
  tower.scale.setScalar(SITE_SCALE);
  tower.position.set(TOWER_X, 1.5 * SITE_SCALE, TOWER_Z);   // the base sits on the deck
  tower.rotation.y = Math.PI / 2;     // 90° around the vertical axis
  site.add(tower);
});

scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(1, 1, 1);
scene.add(sun);

camera.position.z = 1;     // with an orthographic camera the distance doesn't change the size

let currentRow = null;

window.updateScene = function (row) {
  currentRow = row;
};

// ---------- engine plume (separate frames) ----------
const PLUME_DIR = "images/plumes1/";            // folder with 0034.png ... 0050.png
const PLUME_FIRST = 34, PLUME_LAST = 50;
const PLUME_FPS = 160;

const plumeFrames = [];
for (let i = PLUME_FIRST; i <= PLUME_LAST; i++){
  const t = new THREE.TextureLoader().load(PLUME_DIR + String(i).padStart(4, "0") + ".png");
  t.colorSpace = THREE.SRGBColorSpace;
  plumeFrames.push(t);
}

const plumeS1 = new THREE.Mesh(
  new THREE.PlaneGeometry(0.045, 0.09).translate(0, -0.045, 0),     // top edge at the engines
  new THREE.MeshBasicMaterial({
    map: plumeFrames[0],
    alphaMap: plumeFrames[0],
    transparent: true, depthWrite: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.OneFactor,
    blendDstAlpha: THREE.OneMinusSrcAlphaFactor
  })
);
plumeS1.visible = false;
rocket.add(plumeS1);

function stepPlume(time){
  const n = plumeFrames.length;
  const f = plumeFrames[Math.floor(time * PLUME_FPS) % n];
  plumeS1.material.map = f;
  plumeS1.material.alphaMap = f;
}
// (upper stage plumes go here later)

// ---------- upper stage plumes (single images, cropped, with a soft tail) ----------
function makeFadePlane(w, h){
  const geo = new THREE.PlaneGeometry(w, h, 1, 8).translate(0, -h / 2, 0);   // top edge at the engines
  const pos = geo.attributes.position;
  const cols = new Float32Array(pos.count * 4);
  for (let i = 0; i < pos.count; i++){
    const t = THREE.MathUtils.clamp(-pos.getY(i) / h, 0, 1);
    const fade = 1 - THREE.MathUtils.smoothstep(t, 0.55, 1.0);              // fades out, so no hard cut
    cols[i * 4] = cols[i * 4 + 1] = cols[i * 4 + 2] = fade; cols[i * 4 + 3] = fade;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(cols, 4));
  return geo;
}

function makeFramePlume(dir, first, last, frac, w, h, color){
  const frames = [];
  for (let i = first; i <= last; i++){
    const t = new THREE.TextureLoader().load(dir + String(i).padStart(4, "0") + ".png");
    t.colorSpace = THREE.SRGBColorSpace;
    t.repeat.set(1, frac);                 // show only the top part of each frame (where the flame is)
    t.offset.set(0, 1 - frac);
    frames.push(t);
  }
  const mesh = new THREE.Mesh(makeFadePlane(w, h), new THREE.MeshBasicMaterial({
    map: frames[0], alphaMap: frames[0], vertexColors: true, color,
    transparent: true, depthWrite: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.OneFactor,
    blendDstAlpha: THREE.OneMinusSrcAlphaFactor
  }));
  mesh.userData.frames = frames;
  mesh.visible = false;
  rocket.add(mesh);
  return mesh;
}

function stepFramePlume(mesh, time){
  const frames = mesh.userData.frames;
  const f = frames[Math.floor(time * PLUME_FPS) % frames.length];
  mesh.material.map = f;
  mesh.material.alphaMap = f;
}

// folder, first frame, last frame, fraction of the frame with flame, width (km), height (km), brightness
const plumeS2 = makeFramePlume("images/plumes2/", 1, 32, 148 / 512, 0.014, 0.035, new THREE.Color(0.7, 0.8, 1.0));
const plumeS3 = makeFramePlume("images/plumes3/", 1, 32, 258 / 512, 0.009, 0.030, new THREE.Color(0.7, 0.8, 1.0));

// ---------- launch smoke (sprite puffs) ----------
const puffTexes = ["images/smoke1.png", "images/whitePuff02.png"].map(u => {
  const t = new THREE.TextureLoader().load(u);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
});

const puffs = [];
let puffTimer = 0;
const MAX_PUFFS = 520;     // raise the cap since there are more puffs now

function spawnPuff(){
  if (puffs.length >= MAX_PUFFS) return;
  const mat = new THREE.SpriteMaterial({
    map: puffTexes[Math.floor(Math.random() * puffTexes.length)],
    opacity: 0.9, rotation: Math.random() * Math.PI * 2
  });
  const s = new THREE.Sprite(mat);
  s.position.set((Math.random() - 0.5) * 0.02, 0.003, -0.02 + Math.random() * 0.05);
  s.scale.setScalar(0.02);
  site.add(s);

  const dir = Math.random() < 0.5 ? -1 : 1;
  puffs.push({
    s, age: 0, life: 2.5 + Math.random() * 2, 
    vx: dir * (0.03 + Math.random() * 0.695),       //sideways blast
    vy: 0.004 + Math.random() * 0.02,              // a bit upward
    vz: dir * (0.03 + Math.random() * 0.135),
    spin: (Math.random() - 0.5) * 0.8,
    grow: 0.006 + Math.random() * 0.025             // billows faster
  });
}

function updatePuffs(dt, alt, mt){
  if (mt >= -3 && alt < 250){
    const ramp = THREE.MathUtils.clamp((mt + 3) / 3, 0, 1);     // 0 at T-3, full strength at liftoff
    puffTimer += dt * 140 * ramp * (1 - alt / 250);
    while (puffTimer >= 1){ puffTimer -= 1; spawnPuff(); }
  }
  for (let i = puffs.length - 1; i >= 0; i--){
    const p = puffs[i];
    p.age += dt;
    const t = p.age / p.life;
    if (t >= 1){ site.remove(p.s); p.s.material.dispose(); puffs.splice(i, 1); continue; }

    const drag = Math.exp(-0.8 * dt);              // fast at first, then slows down
    p.vx *= drag;
    p.vy *= drag;
    p.vz *= drag;
    p.s.position.x += p.vx * dt;
    p.s.position.y += p.vy * dt;
    p.s.position.z += p.vz * dt;
    p.s.scale.setScalar(0.02 + p.grow * p.age);
    p.s.material.rotation += p.spin * dt;
    p.s.material.opacity = 0.9 * (1 - t * t);      // stays dense longer, then fades
  }
}

// ---------- staging ----------
function dropPart(name, { speed = 0.02, up = false, tilt = 0, accel = 0, spin = null } = {}){
  const part = parts[name];
  if (!part || dropped[name]) return;
  dropped[name] = true;

  // direction along the rocket's axis (down by default), then swung sideways by `tilt` radians
  const axis = new THREE.Vector3(0, up ? 1 : -1, 0).applyQuaternion(rocket.quaternion);
  const dir = axis.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), tilt);

  scene.attach(part);                           // leaves the rocket group, keeps its place
  debris.push({
    mesh: part,
    vel: dir.clone().multiplyScalar(speed),
    acc: dir.clone().multiplyScalar(accel),     // keeps speeding up in the same direction
    spin: spin ?? (Math.random() - 0.5) * 0.5   // radians per second
  });
}

function updateDebris(dt){
  for (let i = debris.length - 1; i >= 0; i--){
    const d = debris[i];
    d.vel.addScaledVector(d.acc, dt);
    d.mesh.position.addScaledVector(d.vel, dt);
    d.mesh.rotation.z += d.spin * dt;
    if (d.mesh.position.length() > 0.3){        // far away and off screen
      scene.remove(d.mesh);
      debris.splice(i, 1);
    }
  }
}

// the camera aims at the middle of whatever is still attached
function stackCenterY(){
  const box = new THREE.Box3();
  let any = false;
  for (const n in parts){
    if (!dropped[n]) { box.union(bounds[n]); any = true; }
  }
  return any ? box.getCenter(new THREE.Vector3()).y : 0;
}

function stackBottomY(){
  let y = Infinity;
  for (const n in parts) if (!dropped[n]) y = Math.min(y, bounds[n].min.y);
  return y === Infinity ? 0 : y;
}

const localCenter = new THREE.Vector3(0, 0, 0);
const rocketCenter = new THREE.Vector3();

let targetY = 0;
let centerY = 0;

function animate() {
  if(currentRow){
    rocket.rotation.z = THREE.MathUtils.degToRad(currentRow.pitch - 90);
    const alt = currentRow.alt;

    const density = Math.exp(-alt / 8500);
    const spaceAmount = THREE.MathUtils.smoothstep(alt, 40000, 100000);

    // horizon fades more slowly than the top, and reaches black later
    const horizonAmount = 1 - Math.exp(-alt / 20000);
    const horizonSpace  = THREE.MathUtils.smoothstep(alt, 60000, 120000);

    blend3(skyColor, colorLow, colorMid, colorHigh, 1 - density);
    skyColor.lerp(colorSpace, spaceAmount);

    blend3(horizonColor, horizonLow, horizonMid, horizonHigh, horizonAmount);
    horizonColor.lerp(colorSpace, horizonSpace);

    // faint atmosphere glow along the bottom, only up high
    const glow = THREE.MathUtils.smoothstep(alt, 30000, 110000) * 0.4;

    root.style.setProperty("--sky-top",    "#" + skyColor.getHexString());
    root.style.setProperty("--sky-bottom", "#" + horizonColor.getHexString());
    root.style.setProperty("--glow", glow);
  }

  rocket.updateMatrixWorld();

  if(currentRow && currentRow.mt !== undefined){
    const mt = currentRow.mt;

    const stage = currentRow.stage;

    // plume clock: advances in real time, but only while the sim is running (stops on pause)
    const nowT = performance.now() / 1000;
    const realDt = Math.min(nowT - lastNowT, 0.1);
    lastNowT = nowT;
    if (lastPlumeMT === null || mt !== lastPlumeMT) plumeClock += realDt;
    lastPlumeMT = mt;

    // S-IC flame on from T-3 until cutoff
    plumeS1.visible = mt >= -3 && stage === "S-IC";
    if (plumeS1.visible){
      plumeS1.position.y = stackBottomY();
      plumeS1.scale.y = 0.3 + 0.7 * THREE.MathUtils.clamp((mt + 3) / 3, 0, 1);   // short at T-3, full at liftoff
      stepPlume(plumeClock);
    }

    plumeS2.visible = currentRow.thrust > 0 && stage === "S-II";
    plumeS3.visible = currentRow.thrust > 0 && stage === "S-IVB";
    for (const p of [plumeS2, plumeS3]){
      if (!p.visible) continue;
      p.position.y = stackBottomY();
      stepFramePlume(p, plumeClock);
    }

    // move the debris with the smooth mission clock (pauses and speeds up with the sim)
    if (lastMT !== null){
      const dt = mt - lastMT;
      updateDebris(dt);
      updatePuffs(dt, currentRow.alt, currentRow.mt);
      const horiz = Math.sqrt(Math.max(0, currentRow.relative_speed ** 2 - currentRow.vert_speed ** 2));
      downrange += horiz * dt / 1000;
    }

    site.position.x = -downrange;
    site.position.y = BASE_Y - currentRow.alt / 1000;
    if (currentRow.alt > 300 && site.parent) scene.remove(site);    // out of sight, so stop drawing it
    lastMT = mt;

    // staging events
    if (currentRow.stage !== "S-IC") dropPart("S-IC", { speed: 0.01, accel: 0.01 });            // about T+150
    if (mt >= INTERSTAGE_DROP) dropPart("S-II_Interstage", { speed: 0.02, accel: 0.02 });         // about T+180
    if (mt >= LES_DROP) dropPart("LES", {
        up: true,                                  // goes up, ahead of the rocket
        tilt: THREE.MathUtils.degToRad(35),        // swings off to the left, away from the stack
        speed: 0.03,
        accel: 0.12,                               // speeds up so it leaves the screen fast
        spin: 0.4                                  // nose pitches over in the direction it's going
    });
    if (currentRow.stage === "S-IVB"){                              // about T+540
        dropPart("S-II",              { speed: 0.01, accel: 0.015 });
        dropPart("S-IVB_Interstage",  { speed: 0.01, accel: 0.015 });
    }

    targetY = stackCenterY();
  }


  centerY += (targetY - centerY) * 0.1;
  localCenter.set(0, centerY, 0);

  rocketCenter.copy(localCenter).applyMatrix4(rocket.matrixWorld);
  camera.position.set(rocketCenter.x, rocketCenter.y, 1);
  camera.lookAt(rocketCenter);

  renderer.render(scene, camera);
}

renderer.setAnimationLoop( animate );