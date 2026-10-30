// PROTECT GRANDMA - version solo (Three.js, un seul fichier JS)
import * as THREE from 'three';
const $ = i => document.getElementById(i), R = Math.random;

/* ========== SCENE ========== */
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, .1, 200);
const ren = new THREE.WebGLRenderer({ antialias: true });
ren.setPixelRatio(Math.min(devicePixelRatio, 2)); ren.setSize(innerWidth, innerHeight);
document.body.appendChild(ren.domElement);
addEventListener('resize', () => { cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); ren.setSize(innerWidth, innerHeight); });
const sun = new THREE.DirectionalLight(0xffffff, 1); sun.position.set(20, 40, 20); scene.add(sun);
const amb = new THREE.AmbientLight(0x778899, .6); scene.add(amb);
const lamp = new THREE.PointLight(0xffd8a0, .8, 18); lamp.position.set(0, 2.8, -6); scene.add(lamp);
const flash = new THREE.PointLight(0xffcc66, 0, 12); scene.add(flash);

const solids = [];
function box(w, h, d, x, y, z, c, solid = true, op = 1) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: c, transparent: op < 1, opacity: op }));
  m.position.set(x, y, z); scene.add(m);
  if (solid) solids.push({ x1: x - w / 2, x2: x + w / 2, z1: z - d / 2, z2: z + d / 2 });
  return m;
}
const wallX = (x1, x2, z) => box(x2 - x1, 3, .3, (x1 + x2) / 2, 1.5, z, 0xb8a888);

/* ground + street */
box(300, .1, 300, 0, -.05, 0, 0x3a4a35, false);
box(300, .1, 10, 0, 0, 12, 0x222222, false);
/* house: x -6..6, z -12..0, front wall at z=0 */
box(12, .1, 12, 0, 0, -6, 0x6b5a45, false);
box(12.6, .2, 12.6, 0, 3.1, -6, 0x333333, false);
wallX(-6, -5, 0); wallX(-3, -1, 0); wallX(1, 3, 0); wallX(5, 6, 0);
box(2, .8, .3, -4, 2.6, 0, 0xb8a888, false); box(2, .8, .3, 4, 2.6, 0, 0xb8a888, false); box(2, .5, .3, 0, 2.75, 0, 0xb8a888, false);
wallX(-6, 6, -12); wallX(-6, -1, -6); wallX(1, 6, -6);
box(.3, 3, 12, -6, 1.5, -6, 0xb8a888); box(.3, 3, 12, 6, 1.5, -6, 0xb8a888);
/* furniture (solid) */
box(3, .8, 1, -3.5, .4, -2.6, 0x553322); box(1.6, .8, 1, 3.5, .4, -3.5, 0x7a5a3a);
box(2, .5, 3, -4, .25, -9.5, 0x445577); box(1, 2, 1, 4.5, 1, -7.2, 0xdddddd);
/* grandma on chair (stays seated) */
box(.8, .5, .8, 0, .25, -9.5, 0x6a3b2b); box(.8, 1, .15, 0, .9, -9.95, 0x6a3b2b, false);
const gBody = box(.5, .8, .4, 0, .9, -9.5, 0xaa88aa, false);
const gHead = new THREE.Mesh(new THREE.SphereGeometry(.2), new THREE.MeshLambertMaterial({ color: 0xe0b89a })); gHead.position.set(0, 1.5, -9.5); scene.add(gHead);
/* TV = boutique */
box(2, 1.2, .2, 4, 1.5, -11.8, 0x0a1a2a, false).material.emissive = new THREE.Color(0x113355);
box(2, .9, .6, 4, .45, -11.5, 0x222222);
const TV = { x: 4, z: -11 };
/* decor: neighbours, cars, lampposts, debris */
[[-18, 0x8a6a5a], [-34, 0x6a7a8a], [18, 0x9a8a6a], [34, 0x7a6a6a]].forEach(([x, c]) => { box(10, 5, 10, x, 2.5, -6, c); box(10.4, .6, 10.4, x, 5.3, -6, 0x332222, false); });
[[-8, 0x883333], [14, 0x335577], [-22, 0x555555]].forEach(([x, c]) => { box(4, 1, 2, x, .6, 10, c); box(2, .7, 1.8, x, 1.4, 10, c, false); });
[-12, 12, 28, -28].forEach(x => box(.2, 5, .2, x, 2.5, 6.5, 0x333333));
for (let i = 0; i < 14; i++) box(.5 + R(), .4 + R() * .5, .5 + R(), -30 + R() * 60, .2, 5 + R() * 14, 0x444433, false);

/* ========== BARRICADEABLE OPENINGS (door + 2 windows) ========== */
const bars = [];
function mkBar(x, base, color, op, h, y) {
  const mesh = box(2, h, .12, x, y, 0, color, false, op);
  const planks = [0, 1, 2].map(i => { const m = box(1.9, .22, .1, x, .55 + i * .5, .25, 0x9b7b4a, false); m.visible = false; return m; });
  const b = { x, base, hp: base, n: 0, mesh, planks, a: { x1: x - 1, x2: x + 1, z1: -.2, z2: .2 } };
  bars.push(b); return b;
}
mkBar(0, 20, 0x5a3a1a, 1, 2.6, 1.3); mkBar(-4, 12, 0x99ccff, .35, 2, 1.5); mkBar(4, 12, 0x99ccff, .35, 2, 1.5);
function refresh(b) { b.mesh.visible = b.hp > 0; b.planks.forEach((m, i) => m.visible = b.hp > 0 && i < b.n); }

/* ========== COLLISIONS ========== */
const hit = (s, x, z, r) => x > s.x1 - r && x < s.x2 + r && z > s.z1 - r && z < s.z2 + r;
function collide(x, z, r) { for (const s of solids) if (hit(s, x, z, r)) return true; for (const b of bars) if (b.hp > 0 && hit(b.a, x, z, r)) return true; return false; }
function move(o, dx, dz, r) { if (!collide(o.x + dx, o.z, r)) o.x += dx; if (!collide(o.x, o.z + dz, r)) o.z += dz; }

/* ========== STATE ========== */
const p = { x: 0, z: -2, y: 1.7, vy: 0, yaw: 0, pitch: 0 };
let pHP = 100, stam = 100, gHP = 100, money = 50, xp = 0, night = 0, kills = 0, earned = 0, spent = 0, surv = 0;
const inv = { planks: 0, knife: false, pistol: false, ammo: 0, bandage: 0 };
let cur = 0, cd = 0, phase = 'day', pt = 0, toSpawn = 0, running = false, over = false, shopOpen = false, noise = 0, crouch = false;
const keys = {}; const zs = [];
const level = () => 1 + Math.floor(xp / 100);
const toast = (t, ms = 2000) => { $('msg').textContent = t; clearTimeout(toast.t); toast.t = setTimeout(() => $('msg').textContent = '', ms); };

/* ========== ZOMBIES ========== */
function mkZ(fast) {
  const g = new THREE.Group(), c = fast ? 0x7a3a3a : 0x4a6a3a;
  const part = (w, h, d, x, y, z, col) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: col })); m.position.set(x, y, z); g.add(m); };
  part(.6, 1, .35, 0, 1.1, 0, c); part(.4, .4, .4, 0, 1.85, 0, 0x8aa070);
  part(.15, .15, .8, -.3, 1.45, .4, 0x8aa070); part(.15, .15, .8, .3, 1.45, .4, 0x8aa070);
  part(.2, .7, .2, -.15, .35, 0, 0x333344); part(.2, .7, .2, .15, .35, 0, 0x333344);
  const hpf = 1 + night * .08;
  const z = { g, x: (R() - .5) * 60, z: 22 + R() * 8, hp: (fast ? 40 : 70) * hpf, fast, sp: (fast ? 3.4 : 1.7) * (1 + night * .03), dmg: fast ? 3 : 4, ph: R() * 6, op: null };
  const bestOp = bars.reduce((a, b) => Math.abs(b.x - p.x) < Math.abs(a.x - p.x) ? b : a);
  z.op = R() < (noise > .5 ? .8 : .3) ? bestOp : bars[Math.floor(R() * 3)];
  g.traverse(o => o.userData.z = z); scene.add(g); zs.push(z);
}
function killZ(z, i) { scene.remove(z.g); zs.splice(i, 1); }
function updZ(z, dt) {
  const inside = z.z < -.4 && Math.abs(z.x) < 6, dP = Math.hypot(p.x - z.x, p.z - z.z);
  let tx = null, tz = 0;
  if (!inside) {
    const o = z.op;
    if (o.hp > 0) { tx = o.x; tz = 1.1; if (Math.hypot(z.x - tx, z.z - tz) < .9) { o.hp -= dt * z.dmg; while (o.n > 0 && o.hp <= o.base + 10 * (o.n - 1)) o.n--; refresh(o); tx = null; } }
    else { tx = o.x; tz = -2; }
  } else if ((p.z > -6) === (z.z > -6) && dP < 8) { tx = p.x; tz = p.z; }
  else if (z.z > -5.5) { tx = 0; tz = -5.3; }
  else { tx = 0; tz = -8.6; if (Math.hypot(z.x, z.z + 9.5) < 1.5) { gHP -= dt * 8; tx = null; } }
  if (dP < 1.5) { pHP -= dt * 10; tx = null; }
  if (tx !== null) { const dx = tx - z.x, dz = tz - z.z, d = Math.hypot(dx, dz) || 1; move(z, dx / d * z.sp * dt, dz / d * z.sp * dt, .4); z.g.rotation.y = Math.atan2(dx, dz); }
  z.ph += dt * z.sp * 3; z.g.position.set(z.x, Math.abs(Math.sin(z.ph)) * .08, z.z);
}

/* ========== NIGHT / DAY ========== */
let spT = 0;
function startNight() { phase = 'night'; pt = 0; night++; toSpawn = 4 + night * 3; toast('🌙 Nuit ' + night + ' : les zombies arrivent !', 3500); }
function dawn() {
  phase = 'day'; pt = 0; xp += 25; money += 30; earned += 30;
  for (let i = zs.length - 1; i >= 0; i--) { const z = zs[i]; if (!(z.z < -.4 && Math.abs(z.x) < 6)) killZ(z, i); }
  toast('☀️ Aube : les zombies dehors brûlent. Sauvegarde auto.', 3500); save();
}
function save() { localStorage.pgSave = JSON.stringify({ money, night, xp, inv, kills, earned, spent, surv, gHP, bars: bars.map(b => [b.hp, b.n]) }); }
function load() {
  const s = JSON.parse(localStorage.pgSave); ({ money, night, xp, kills, earned, spent, surv, gHP } = s); Object.assign(inv, s.inv);
  s.bars.forEach((v, i) => { bars[i].hp = v[0]; bars[i].n = v[1]; refresh(bars[i]); });
}

/* ========== SHOP (TV) ========== */
const ITEMS = [
  { n: 'Planche', c: 50, l: 1, ok: () => true, f: () => inv.planks++ },
  { n: 'Couteau', c: 500, l: 1, ok: () => !inv.knife, f: () => inv.knife = true },
  { n: 'Bandage (soigne mamie)', c: 80, l: 1, ok: () => true, f: () => inv.bandage++ },
  { n: 'Pistolet + chargeur', c: 800, l: 2, ok: () => !inv.pistol, f: () => { inv.pistol = true; inv.ammo += 12; } },
  { n: 'Pack 12 balles', c: 100, l: 2, ok: () => inv.pistol, f: () => inv.ammo += 12 }
];
function openShop() {
  shopOpen = true; document.exitPointerLock(); $('shop').classList.remove('hide');
  const draw = () => {
    $('shop').innerHTML = `<h2>📺 Boutique — ${Math.floor(money)} $ — Niveau ${level()}</h2>`;
    ITEMS.forEach(it => {
      const b = document.createElement('button');
      if (level() < it.l) { b.textContent = '⬛ ? — niveau ' + it.l; b.disabled = true; }
      else { b.textContent = `${it.n} — ${it.c} $`; b.disabled = money < it.c || !it.ok(); b.onclick = () => { money -= it.c; spent += it.c; it.f(); draw(); }; }
      $('shop').appendChild(b);
    });
    const c = document.createElement('button'); c.textContent = 'Fermer'; c.onclick = closeShop; $('shop').appendChild(c);
  };
  draw();
}
function closeShop() { shopOpen = false; $('shop').classList.add('hide'); ren.domElement.requestPointerLock(); }

/* ========== INPUT ========== */
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (!running || over || shopOpen) { if (shopOpen && e.code === 'KeyE') closeShop(); return; }
  if (e.code === 'KeyC') crouch = !crouch;
  if (e.code === 'Digit1') cur = 0; if (e.code === 'Digit2' && inv.knife) cur = 1; if (e.code === 'Digit3' && inv.pistol) cur = 2;
  if (e.code === 'KeyN' && phase === 'day') startNight();
  if (e.code === 'KeyE') interact();
});
addEventListener('keyup', e => keys[e.code] = false);
addEventListener('mousemove', e => { if (document.pointerLockElement) { p.yaw -= e.movementX * .002; p.pitch = Math.max(-1.4, Math.min(1.4, p.pitch - e.movementY * .002)); } });
addEventListener('mousedown', () => {
  if (!running || over || shopOpen) return;
  if (!document.pointerLockElement) { ren.domElement.requestPointerLock(); return; }
  attack();
});
document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement && running && !over && !shopOpen) toast('Pause — clique pour reprendre', 99999); else if (document.pointerLockElement) toast(''); });

function interact() {
  if (Math.hypot(p.x - TV.x, p.z - TV.z) < 3) return openShop();
  if (Math.hypot(p.x, p.z + 9.5) < 2.8 && inv.bandage > 0 && gHP < 100) { inv.bandage--; gHP = Math.min(100, gHP + 40); return toast('Mamie soignée 💊'); }
  const b = bars.reduce((a, c) => Math.hypot(c.x - p.x, p.z) < Math.hypot(a.x - p.x, p.z) ? c : a);
  if (Math.hypot(b.x - p.x, p.z) > 3) return toast('Rien à faire ici');
  if (inv.planks < 1) return toast('Il faut une planche (achète-en à la TV)');
  if (b.hp <= 0) { b.hp = b.base * .5; b.n = 0; inv.planks--; refresh(b); return toast('🔨 Réparé'); }
  if (b.n >= 3) return toast('Maximum de planches');
  b.n++; b.hp += 10; inv.planks--; refresh(b); toast('🔨 Planche clouée');
}
function attack() {
  if (cd > 0) return; const w = cur;
  if (w === 2 && inv.ammo < 1) return toast('Plus de munitions !');
  cd = w === 0 ? .5 : w === 1 ? .35 : .25; const dmg = [8, 25, 30][w], rng = w === 2 ? 60 : 2.4;
  if (w === 2) { inv.ammo--; noise = 3; flash.position.copy(cam.position); flash.intensity = 2; }
  const rc = new THREE.Raycaster(); rc.setFromCamera(new THREE.Vector2(0, 0), cam); rc.far = rng;
  const hits = rc.intersectObjects(zs.map(z => z.g), true);
  if (hits.length) {
    const z = hits[0].object.userData.z, head = hits[0].point.y > 1.65; z.hp -= dmg * (head ? 2 : 1);
    if (z.hp <= 0) { const i = zs.indexOf(z); killZ(z, i); kills++; xp += 10; money += 15; earned += 15; }
  }
}

/* ========== UPDATE ========== */
function update(dt) {
  surv += dt; pt += dt; cd -= dt; noise = Math.max(0, noise - dt * 2);
  /* movement */
  const sprint = keys.ShiftLeft && stam > 0 && !crouch;
  const sp = (crouch ? 1.8 : sprint ? 7 : 4) * (pHP < 30 ? .7 : 1);
  let f = (keys.KeyW || keys.KeyZ || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
  let r = (keys.KeyD ? 1 : 0) - (keys.KeyA || keys.KeyQ ? 1 : 0);
  if (f || r) {
    const l = Math.hypot(f, r), dx = (-Math.sin(p.yaw) * f + Math.cos(p.yaw) * r) / l, dz = (-Math.cos(p.yaw) * f - Math.sin(p.yaw) * r) / l;
    move(p, dx * sp * dt, dz * sp * dt, .35); noise = Math.max(noise, crouch ? .3 : sprint ? 2 : 1);
  }
  stam = sprint && (f || r) ? Math.max(0, stam - 25 * dt) : Math.min(100, stam + 15 * dt);
  if (keys.Space && p.y <= (crouch ? 1.1 : 1.7) + .01) p.vy = 5; p.vy -= 14 * dt; p.y += p.vy * dt;
  const base = crouch ? 1.1 : 1.7; if (p.y < base) { p.y = base; p.vy = 0; }
  cam.position.set(p.x, p.y, p.z); cam.rotation.set(p.pitch, p.yaw, 0, 'YXZ');
  flash.intensity = Math.max(0, flash.intensity - dt * 20);
  /* cycle */
  if (phase === 'day' && pt > 60) startNight();
  if (phase === 'night') {
    spT -= dt; if (toSpawn > 0 && spT <= 0 && zs.length < 60) { mkZ(R() < Math.min(.5, .1 + night * .05)); toSpawn--; spT = 1.5; }
    if (toSpawn <= 0 && pt > 70) dawn();
  }
  zs.forEach(z => updZ(z, dt));
  /* lighting */
  const k = phase === 'night' ? 0 : 1, c = new THREE.Color(k ? 0x87a0b8 : 0x05060a);
  scene.background = c; scene.fog = new THREE.Fog(c, 12, k ? 90 : 45);
  sun.intensity += ((k ? 1 : .08) - sun.intensity) * dt; amb.intensity += ((k ? .6 : .18) - amb.intensity) * dt;
  /* defeat */
  if (pHP <= 0 || gHP <= 0) endGame();
}
function endGame() {
  over = true; document.exitPointerLock(); localStorage.removeItem('pgSave');
  $('end').classList.remove('hide');
  $('end').innerHTML = `<h1 style="color:#c22">${gHP <= 0 ? 'Mamie est tombée…' : 'Tu es mort…'}</h1>
  <p>Nuits survécues : ${Math.max(0, night - (phase === 'night' ? 1 : 0))}<br>Zombies éliminés : ${kills}<br>Niveau : ${level()}<br>
  Temps de survie : ${Math.floor(surv / 60)} min ${Math.floor(surv % 60)} s<br>Argent gagné : ${earned} $ — dépensé : ${spent} $</p>
  <button onclick="location.reload()">Rejouer</button>`;
}
function hud() {
  const w = ['Poings', 'Couteau', 'Pistolet'][cur] + (cur === 2 ? ` (${inv.ammo})` : '');
  $('hud').innerHTML = `❤️ ${Math.max(0, Math.ceil(pHP))}<br>⚡ ${Math.ceil(stam)}<br>💵 ${Math.floor(money)} $`;
  $('info').innerHTML = `${phase === 'day' ? '☀️ Jour' : '🌙 Nuit'} — Nuit n°${night} · Niv. ${level()} (${xp % 100}/100 XP)<br>👵 Mamie : ${Math.max(0, Math.ceil(gHP))}<br>🔨 Planches : ${inv.planks} · 🩹 ${inv.bandage} · Arme : ${w}<br>🧟 ${zs.length}${phase === 'day' ? ` · Nuit dans ${Math.max(0, Math.ceil(60 - pt))} s (N = maintenant)` : ''}`;
}

/* ========== MAIN LOOP / START ========== */
const clock = new THREE.Clock(); let frames = 0;
(function loop() {
  requestAnimationFrame(loop); const dt = Math.min(clock.getDelta(), .05);
  if (running && !over && !shopOpen && document.pointerLockElement) update(dt);
  if (running) hud(); ren.render(scene, cam);
})();
cam.position.set(0, 1.7, -2);
$('bCont').style.display = localStorage.pgSave ? '' : 'none';
const start = cont => { if (cont) load(); running = true; $('menu').classList.add('hide'); ren.domElement.requestPointerLock(); toast('Achète une planche à la TV (E) et barricade !', 4000); };
$('bNew').onclick = () => { localStorage.removeItem('pgSave'); start(false); };
$('bCont').onclick = () => start(true);
