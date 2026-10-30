
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js";

const $ = id => document.getElementById(id);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x89949a);
scene.fog = new THREE.Fog(0x89949a, 22, 75);

const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.1, 150);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0xc9d9ed, 0x34302b, 2);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe0b4, 2.2);
sun.position.set(-10, 18, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

const mat = (color, roughness = 0.85) =>
  new THREE.MeshStandardMaterial({ color, roughness });

const materials = {
  grass: mat(0x53634b),
  wall: mat(0xb9ad98),
  darkWall: mat(0x77736e),
  wood: mat(0x765039),
  plank: mat(0x98704c),
  skin: mat(0xd5a17d),
  clothes: mat(0x263f55),
  grandma: mat(0x8d536b),
  zombie: mat(0x647d65),
  black: mat(0x171a1e),
  glass: new THREE.MeshStandardMaterial({
    color: 0x8eb5c4, transparent: true, opacity: 0.35
  })
};

function box(w, h, d, material, x, y, z, parent = scene) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function sphere(r, material, x, y, z, parent = scene) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

function floor(w, d, material, x, z) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0, z);
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

// Monde extérieur
floor(100, 100, materials.grass, 0, 0);
floor(8, 45, mat(0x343a3e), 0, -20);
for (let i = 0; i < 8; i++) {
  box(0.12, 0.02, 2.2, mat(0xd8d0a0), 0, 0.02, -i * 5);
}

// Maison
floor(18, 15, mat(0x766b5e), 0, 0);
box(18, 4, 0.5, materials.wall, 0, 2, -7.5);
box(18, 4, 0.5, materials.wall, 0, 2, 7.5);
box(0.5, 4, 15, materials.wall, -9, 2, 0);
box(0.5, 4, 15, materials.wall, 9, 2, 0);
box(18.5, 0.5, 15.5, mat(0x493d35), 0, 4.1, 0);

// Fenêtres et portes décoratives
box(2.6, 1.5, 0.12, materials.glass, -5, 2.4, -7.2);
box(2.6, 1.5, 0.12, materials.glass, 5, 2.4, -7.2);
box(1.4, 2.8, 0.18, materials.wood, 0, 1.4, 7.2);

// Meubles
box(4, 0.7, 1.5, mat(0x4b3940), -4, 0.55, 1);
box(4, 0.4, 0.4, mat(0x65514a), -4, 1.05, 0.45);
box(1.6, 0.8, 1.1, materials.wood, 4, 0.4, -2);
box(1.2, 0.08, 0.8, mat(0x3c3028), 4, 0.84, -2);
box(1.3, 0.7, 0.7, mat(0x343d48), 0, 1.1, -4.8);
box(0.15, 1.8, 0.15, materials.wood, -7, 0.9, -3);
box(0.15, 1.8, 0.15, materials.wood, -5.8, 0.9, -3);
box(1.4, 0.12, 0.7, materials.wood, -6.4, 1.8, -3);

// Création d'un personnage articulé simple
function createPerson(clothing, x, z, isGrandma = false) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  scene.add(group);

  const body = new THREE.Group();
  body.position.y = 1.05;
  group.add(body);

  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.35, 0.65, 4, 8), clothing
  );
  torso.castShadow = true;
  body.add(torso);

  const head = sphere(0.28, materials.skin, 0, 0.68, 0, body);
  const hair = sphere(0.29, isGrandma ? mat(0xb9b8b1) : mat(0x30251f), 0, 0.82, 0, body);
  hair.scale.set(1, 0.65, 1);

  const armL = new THREE.Group();
  const armR = new THREE.Group();
  armL.position.set(-0.42, 0.25, 0);
  armR.position.set(0.42, 0.25, 0);
  body.add(armL, armR);

  for (const arm of [armL, armR]) {
    const limb = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.52, 3, 7), clothing);
    limb.position.y = -0.3;
    limb.castShadow = true;
    arm.add(limb);
  }

  const legs = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.17, 0.65, 0);
    group.add(leg);
    const limb = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.55, 3, 7), materials.black);
    limb.position.y = -0.35;
    limb.castShadow = true;
    leg.add(limb);
    legs.push(leg);
  }

  return { group, body, head, armL, armR, legs };
}

const player = createPerson(materials.clothes, 0, 3);
const grandma = createPerson(materials.grandma, -5, -3, true);
grandma.group.rotation.y = Math.PI / 2;
grandma.group.scale.setScalar(0.9);

// Fauteuil de mamie
box(1.7, 1.5, 1.2, mat(0x583b45), -5, 0.75, -3.3);
box(1.7, 0.25, 1.2, mat(0x79535b), -5, 1.45, -3.3);

// Zombies extérieurs
const zombies = [];
for (let i = 0; i < 5; i++) {
  const z = createPerson(materials.zombie, -8 + i * 4, -15 - Math.random() * 9);
  z.group.scale.setScalar(1.05);
  zombies.push(z);
}

// Planches récupérables
const plankObjects = [];
for (let i = 0; i < 4; i++) {
  const p = box(1.8, 0.12, 0.22, materials.plank, -3 + i * 1.8, 0.5, 4);
  p.userData.pickable = true;
  plankObjects.push(p);
}

// Système de jeu
const keys = {};
let playing = false;
let pointerLocked = false;
let yaw = 0;
let pitch = 0;
let sensitivity = 0.002;
let planks = 4;
let grandmaHealth = 100;
let selectedPlank = false;
let placedPlanks = [];
let lastTime = 0;
const clock = new THREE.Clock();

function notify(text) {
  $("message").textContent = text;
  $("message").classList.add("show");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => $("message").classList.remove("show"), 1800);
}

function updateHud() {
  $("planks").textContent = planks;
  $("grandmaHealth").textContent = grandmaHealth;
}

function startGame() {
  playing = true;
  $("menu").style.display = "none";
  $("settings").style.display = "none";
  $("hud").style.display = "block";
  renderer.domElement.requestPointerLock();
  notify("Protège mamie. Récupère les planches !");
}

$("start").onclick = startGame;
$("openSettings").onclick = () => {
  $("menu").style.display = "none";
  $("settings").style.display = "flex";
};
$("backMenu").onclick = () => {
  $("settings").style.display = "none";
  $("menu").style.display = "flex";
};

$("saveSettings").onclick = () => {
  const settings = {
    quality: $("quality").value,
    blood: $("blood").value,
    sensitivity: $("sensitivity").value,
    volume: $("volume").value
  };
  localStorage.setItem("pgSettings", JSON.stringify(settings));
  sensitivity = Number(settings.sensitivity);
  renderer.shadowMap.enabled = settings.quality !== "low";
  notify("Paramètres enregistrés !");
};

try {
  const saved = JSON.parse(localStorage.getItem("pgSettings") || "{}");
  if (saved.quality) $("quality").value = saved.quality;
  if (saved.blood) $("blood").value = saved.blood;
  if (saved.sensitivity) {
    $("sensitivity").value = saved.sensitivity;
    sensitivity = Number(saved.sensitivity);
  }
  if (saved.volume) $("volume").value = saved.volume;
} catch {}

// Contrôles
addEventListener("keydown", e => {
  keys[e.code] = true;

  if (!playing) return;
  if (e.code === "KeyF") pickUpPlank();
  if (e.code === "KeyB") placePlank();
  if (e.code === "KeyE") interact();
});
addEventListener("keyup", e => keys[e.code] = false);

document.addEventListener("pointerlockchange", () => {
  pointerLocked = document.pointerLockElement === renderer.domElement;
});

addEventListener("mousemove", e => {
  if (!pointerLocked || !playing) return;
  yaw -= e.movementX * sensitivity;
  pitch -= e.movementY * sensitivity;
  pitch = THREE.MathUtils.clamp(pitch, -1.1, 1.1);
});

addEventListener("keydown", e => {
  if (e.code === "Escape" && playing) {
    notify("Clique dans le jeu pour reprendre la souris.");
  }
});

const raycaster = new THREE.Raycaster();
const center = new THREE.Vector2(0, 0);

function pickUpPlank() {
  if (selectedPlank) {
    notify("Tu portes déjà une planche.");
    return;
  }
  if (planks <= 0) {
    notify("Aucune planche disponible.");
    return;
  }

  const available = plankObjects.find(p => p.visible);
  if (!available) {
    notify("Aucune planche à proximité.");
    return;
  }

  const distance = available.position.distanceTo(player.group.position);
  if (distance > 4) {
    notify("Rapproche-toi des planches.");
    return;
  }

  available.visible = false;
  selectedPlank = true;
  notify("Planche récupérée. Appuie sur B près d'une fenêtre.");
}

function placePlank() {
  if (!selectedPlank) {
    notify("Tu dois d'abord récupérer une planche avec F.");
    return;
  }

  const front = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
  const position = player.group.position.clone().add(front.multiplyScalar(2));
  const plank = box(2.4, 0.16, 0.22, materials.plank, position.x, 1.6, position.z);
  plank.rotation.y = yaw;
  placedPlanks.push(plank);

  selectedPlank = false;
  planks--;
  updateHud();
  notify("Planche installée !");
}

function interact() {
  const d = player.group.position.distanceTo(grandma.group.position);
  if (d < 3.5) {
    notify("Mamie : Merci d'être là. Il faut protéger la maison !");
  } else {
    notify("Rien à proximité.");
  }
}

// Caméra et déplacement
function updatePlayer(dt) {
  const speed = keys.ShiftLeft ? 7 : keys.ControlLeft ? 2 : 4;
  const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
  const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  const movement = new THREE.Vector3();

  if (keys.KeyW || keys.KeyZ) movement.add(forward);
  if (keys.KeyS) movement.sub(forward);
  if (keys.KeyD) movement.add(right);
  if (keys.KeyA || keys.KeyQ) movement.sub(right);

  if (movement.lengthSq() > 0) {
    movement.normalize().multiplyScalar(speed * dt);
    player.group.position.add(movement);
    player.group.position.x = THREE.MathUtils.clamp(player.group.position.x, -8, 8);
    player.group.position.z = THREE.MathUtils.clamp(player.group.position.z, -6.5, 6.5);
    player.group.rotation.y = Math.atan2(movement.x, movement.z);
    const t = clock.elapsedTime * (speed > 5 ? 12 : 8);
    player.legs[0].rotation.x = Math.sin(t) * 0.55;
    player.legs[1].rotation.x = -Math.sin(t) * 0.55;
    player.armL.rotation.x = -Math.sin(t) * 0.35;
    player.armR.rotation.x = Math.sin(t) * 0.35;
  } else {
    player.legs.forEach(l => l.rotation.x = THREE.MathUtils.damp(l.rotation.x, 0, 8, dt));
    player.armL.rotation.x = THREE.MathUtils.damp(player.armL.rotation.x, 0, 8, dt);
    player.armR.rotation.x = THREE.MathUtils.damp(player.armR.rotation.x, 0, 8, dt);
  }

  player.body.position.y = 1.05 + Math.sin(clock.elapsedTime * 2) * 0.025;
  camera.position.set(
    player.group.position.x - Math.sin(yaw) * 4,
    3.1 + pitch * 2,
    player.group.position.z + Math.cos(yaw) * 4
  );
  camera.lookAt(
    player.group.position.x,
    1.7 + pitch * 2,
    player.group.position.z
  );
}

// Animation des zombies
function updateZombies(dt) {
  for (const z of zombies) {
    const direction = player.group.position.clone().sub(z.group.position);
    const distance = direction.length();

    if (distance > 1.5 && distance < 22) {
      direction.normalize();
      z.group.position.add(direction.multiplyScalar(1.1 * dt));
      z.group.rotation.y = Math.atan2(direction.x, direction.z);
      const t = clock.elapsedTime * 5;
      z.legs[0].rotation.x = Math.sin(t) * 0.5;
      z.legs[1].rotation.x = -Math.sin(t) * 0.5;
      z.armL.rotation.x = -0.6 + Math.sin(t) * 0.15;
      z.armR.rotation.x = -0.6 - Math.sin(t) * 0.15;
    }
  }
}

function animate(time) {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.04);

  if (playing) {
    updatePlayer(dt);
    updateZombies(dt);
  } else {
    camera.position.set(Math.sin(time * 0.00015) * 16, 9, 17);
    camera.lookAt(0, 1, 0);
  }

  renderer.render(scene, camera);
}
animate(0);

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
