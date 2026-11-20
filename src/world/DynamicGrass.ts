import * as THREE from 'three';
import { getToonGradient } from './cartoonLook';

type ClearRect = { minX: number; maxX: number; minZ: number; maxZ: number };
type ClearCircle = { x: number; z: number; r: number };

export type GrassPlayerState = {
  x: number;
  z: number;
  vx: number;
  vz: number;
  moving: boolean;
  sprinting: boolean;
};

function makeGroundTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#7ee05a';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 1200; i++) {
    const shade = 180 + Math.floor(Math.random() * 60);
    ctx.fillStyle = `rgb(${100 + Math.random() * 50},${shade},${70 + Math.random() * 40})`;
    ctx.globalAlpha = 0.2 + Math.random() * 0.2;
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.beginPath();
    ctx.ellipse(x, y, 2 + Math.random() * 8, 1.5 + Math.random() * 5, Math.random(), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 0.35;
  for (let i = 0; i < 500; i++) {
    ctx.strokeStyle = `rgb(${80 + Math.random() * 40},${170 + Math.random() * 50},${60})`;
    ctx.lineWidth = 1;
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(
      x + (Math.random() - 0.5) * 4,
      y - 3,
      x + (Math.random() - 0.5) * 3,
      y - 6 - Math.random() * 6,
    );
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(22, 22);
  tex.anisotropy = 4;
  return tex;
}

/** Textura de uma lâmina — curva, nervura e ponta suave. */
function makeTuftTexture(): THREE.CanvasTexture {
  const w = 128;
  const h = 160;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);

  // Poucas lâminas claras no cartão (evitar blob escuro)
  for (let b = 0; b < 5; b++) {
    const cx = 28 + b * 16 + (Math.random() - 0.5) * 4;
    const baseW = 2.2 + Math.random() * 2.8;
    const tipY = 6 + Math.random() * 28;
    const sway = (Math.random() - 0.5) * 18;
    const midY = h * (0.35 + Math.random() * 0.2);

    // Cartoon: verdes claros e limão (evitar silhueta escura)
    const r0 = 120 + Math.floor(Math.random() * 40);
    const g0 = 200 + Math.floor(Math.random() * 35);
    const r1 = 150 + Math.floor(Math.random() * 40);
    const g1 = 230 + Math.floor(Math.random() * 25);
    const r2 = 190 + Math.floor(Math.random() * 40);
    const g2 = 245 + Math.floor(Math.random() * 10);

    const grad = ctx.createLinearGradient(cx, h, cx + sway, tipY);
    grad.addColorStop(0, `rgba(${r0},${g0},90,1)`);
    grad.addColorStop(0.4, `rgba(${r1},${g1},100,1)`);
    grad.addColorStop(0.8, `rgba(${r2},${g2},120,0.9)`);
    grad.addColorStop(1, `rgba(${Math.min(255, r2 + 30)},${g2},140,0)`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx - baseW, h - 1);
    ctx.bezierCurveTo(
      cx - baseW * 0.7 + sway * 0.15,
      midY + 20,
      cx - 0.8 + sway * 0.55,
      midY - 10,
      cx + sway,
      tipY,
    );
    ctx.bezierCurveTo(
      cx + 0.8 + sway * 0.55,
      midY - 10,
      cx + baseW * 0.7 + sway * 0.15,
      midY + 20,
      cx + baseW,
      h - 1,
    );
    ctx.closePath();
    ctx.fill();

    // Nervura suave (sem escurecer o tufo)
    ctx.strokeStyle = `rgba(${Math.max(0, r0 - 10)},${Math.max(0, g0 - 5)},70,0.2)`;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(cx, h - 2);
    ctx.quadraticCurveTo(cx + sway * 0.4, midY, cx + sway, tipY + 4);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

/**
 * Tufo 3D: leque de lâminas finas ao redor do eixo Y
 * (volume de grama de verdade, não só cruz +).
 */
function makeTuftGeometry(): THREE.BufferGeometry {
  const blades = 4;
  const positions: number[] = [];
  const uvs: number[] = [];

  for (let i = 0; i < blades; i++) {
    const ang = (i / blades) * Math.PI; // 0..π (double-sided cards cover full)
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    const hw = 0.12 + (i % 3) * 0.04;
    const hh = 0.7 + (i % 4) * 0.12;
    const lean = ((i % 2) * 2 - 1) * 0.04;

    // Quádruplo (2 triângulos) no plano vertical rotacionado
    // verts: BL, BR, TR, BL, TR, TL  (local: x along blade width, y up)
    const corners: [number, number, number][] = [
      [-hw, 0, lean],
      [hw, 0, -lean],
      [hw * 0.35, hh, -lean * 0.2],
      [-hw, 0, lean],
      [hw * 0.35, hh, -lean * 0.2],
      [-hw * 0.35, hh, lean * 0.2],
    ];
    const cornerUv: [number, number][] = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 0],
      [1, 1],
      [0, 1],
    ];

    for (let c = 0; c < 6; c++) {
      const [lx, ly, lz] = corners[c]!;
      // rotaciona em Y
      const x = lx * cos - lz * sin;
      const z = lx * sin + lz * cos;
      positions.push(x, ly, z);
      uvs.push(cornerUv[c]![0], cornerUv[c]![1]);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}

function makePollenTexture(): THREE.CanvasTexture {
  const s = 32;
  const canvas = document.createElement('canvas');
  canvas.width = s;
  canvas.height = s;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(16, 16, 1, 16, 16, 14);
  g.addColorStop(0, 'rgba(255, 245, 180, 1)');
  g.addColorStop(0.4, 'rgba(210, 230, 120, 0.7)');
  g.addColorStop(1, 'rgba(160, 200, 80, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Vento em ondas espaciais + push do jogador (spring via falloff suave). */
const windVert = /* glsl */ `
  uniform float uTime;
  uniform float uWind;
  uniform vec2 uPlayerPos;
  uniform vec2 uPlayerVel;
  uniform float uPlayerRadius;
  uniform float uPlayerPush;
  attribute float aPhase;
  varying vec2 vUv;
  varying float vTip;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float tip = smoothstep(0.15, 1.0, pos.y);
    vTip = tip;

    // Posição do tufo no mundo (centro da instância)
    vec4 worldOrigin = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    float wx = worldOrigin.x;
    float wz = worldOrigin.z;

    // 1) Vento bem visível — ondas lentas + balanço lateral forte
    float waveA = sin(uTime * 2.4 + wx * 0.55 + wz * 0.4 + aPhase * 0.35);
    float waveB = cos(uTime * 1.7 + wx * 0.25 - wz * 0.3 + aPhase);
    float gust = sin(uTime * 0.55 + wx * 0.1 + wz * 0.08) * 0.5 + 0.5;
    float bend = tip * tip; // ponta balança bem mais que a base
    float windAmt = (waveA * 0.85 + waveB * 0.55) * uWind * (0.9 + gust * 0.6);
    pos.x += windAmt * bend;
    pos.z += windAmt * 0.75 * bend;
    // leve “vai e volta” vertical na ponta
    pos.y += sin(uTime * 2.1 + aPhase) * uWind * 0.08 * tip;

    // 2) Reação ao jogador — afasta e “mola” de volta (falloff suave)
    vec2 toTuft = vec2(wx, wz) - uPlayerPos;
    float dist = length(toTuft);
    float influence = 1.0 - smoothstep(0.0, uPlayerRadius, dist);
    influence = influence * influence * (3.0 - 2.0 * influence); // smoothstep hermite
    // spring-ish: curva que “puxa” de volta mais rápido nas bordas
    float spring = influence * influence * (1.2 - influence * 0.4);

    vec2 away = dist > 0.001 ? normalize(toTuft) : vec2(1.0, 0.0);
    // Empurra também na direção do movimento (passa “rasgando”)
    vec2 velDir = length(uPlayerVel) > 0.05 ? normalize(uPlayerVel) : vec2(0.0);
    vec2 pushDir = normalize(away * 0.75 + velDir * 0.55 + vec2(0.0001));
    float speedBoost = clamp(length(uPlayerVel) * 0.18, 0.35, 1.6);
    pos.x += pushDir.x * spring * uPlayerPush * tip * speedBoost;
    pos.z += pushDir.y * spring * uPlayerPush * tip * speedBoost;
    // leve achatamento quando o player está em cima
    pos.y *= 1.0 - spring * 0.28;

    vec4 mv = modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const windFrag = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uTint;
  varying vec2 vUv;
  varying float vTip;

  void main() {
    vec4 tex = texture2D(uMap, vUv);
    if (tex.a < 0.18) discard;
    vec3 col = tex.rgb * uTint;
    // Cartoon: base clara + ponta ainda mais luminosa
    col *= mix(1.05, 1.4, vTip);
    col = min(col, vec3(1.0));
    gl_FragColor = vec4(col, tex.a * 0.92);
  }
`;

function inClear(
  x: number,
  z: number,
  rects: ClearRect[],
  circles: ClearCircle[],
): boolean {
  for (const r of rects) {
    if (x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ) return true;
  }
  for (const c of circles) {
    const dx = x - c.x;
    const dz = z - c.z;
    if (dx * dx + dz * dz <= c.r * c.r) return true;
  }
  return false;
}

type Pollen = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
};

/**
 * Grama viva estilo Fortnite: ondas de vento, push elástico do player, pólen ao correr.
 */
export class DynamicGrass {
  readonly groundMat: THREE.MeshToonMaterial;
  private readonly sharedUniforms: {
    uTime: { value: number };
    uPlayerPos: { value: THREE.Vector2 };
    uPlayerVel: { value: THREE.Vector2 };
    uPlayerRadius: { value: number };
    uPlayerPush: { value: number };
    uMap: { value: THREE.Texture };
  };
  private readonly materials: THREE.ShaderMaterial[] = [];
  private time = 0;

  private readonly clearRects: ClearRect[];
  private readonly clearCircles: ClearCircle[];

  private readonly pollen: Pollen[] = [];
  private readonly pollenPositions: Float32Array;
  private readonly pollenGeom: THREE.BufferGeometry;
  private readonly pollenPoints: THREE.Points;
  private readonly maxPollen = 120;
  private emitCooldown = 0;
  private readonly _prevPlayer = new THREE.Vector2(0, 0);

  constructor(scene: THREE.Scene) {
    const groundTex = makeGroundTexture();
    this.groundMat = new THREE.MeshToonMaterial({
      map: groundTex,
      color: 0xf0ffd0,
      gradientMap: getToonGradient(),
    });

    const tuftTex = makeTuftTexture();
    this.sharedUniforms = {
      uTime: { value: 0 },
      uPlayerPos: { value: new THREE.Vector2(9999, 9999) },
      uPlayerVel: { value: new THREE.Vector2(0, 0) },
      uPlayerRadius: { value: 1.85 },
      uPlayerPush: { value: 0.42 },
      uMap: { value: tuftTex },
    };

    this.clearRects = [
      { minX: -4.2, maxX: 4.2, minZ: -32, maxZ: 36 },
      { minX: -3.8, maxX: 3.8, minZ: 24, maxZ: 48 },
      { minX: -42, maxX: 42, minZ: -4.2, maxZ: 4.2 },
      { minX: -29, maxX: 29, minZ: 30.5, maxZ: 37.5 },
      { minX: -21.5, maxX: -14.5, minZ: 18, maxZ: 42 },
      { minX: 14.5, maxX: 21.5, minZ: 18, maxZ: 42 },
    ];
    this.clearCircles = [
      { x: 0, z: 0, r: 4.8 },
      { x: 0, z: 34, r: 7.0 },
      { x: -6, z: -41, r: 6.5 },
    ];

    // Sem tufos — só o chão de grama

    // Partículas de pólen / folhas
    this.pollenPositions = new Float32Array(this.maxPollen * 3);
    this.pollenGeom = new THREE.BufferGeometry();
    this.pollenGeom.setAttribute(
      'position',
      new THREE.BufferAttribute(this.pollenPositions, 3),
    );
    this.pollenGeom.setDrawRange(0, 0);
    const pollenMat = new THREE.PointsMaterial({
      map: makePollenTexture(),
      size: 0.22,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.85,
      sizeAttenuation: true,
    });
    this.pollenPoints = new THREE.Points(this.pollenGeom, pollenMat);
    this.pollenPoints.frustumCulled = false;
    this.pollenPoints.renderOrder = 3;
    scene.add(this.pollenPoints);
  }

  private spawnLayer(
    scene: THREE.Scene,
    cfg: {
      count: number;
      area: number;
      scaleY: [number, number];
      scaleX: [number, number];
      wind: number;
      tint: number;
      edgeBias?: boolean;
    },
  ): void {
    const geo = makeTuftGeometry();
    const phases = new Float32Array(cfg.count);
    for (let i = 0; i < cfg.count; i++) phases[i] = Math.random() * Math.PI * 2;
    geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: this.sharedUniforms.uTime,
        uWind: { value: cfg.wind },
        uPlayerPos: this.sharedUniforms.uPlayerPos,
        uPlayerVel: this.sharedUniforms.uPlayerVel,
        uPlayerRadius: this.sharedUniforms.uPlayerRadius,
        uPlayerPush: this.sharedUniforms.uPlayerPush,
        uMap: this.sharedUniforms.uMap,
        uTint: { value: new THREE.Color(cfg.tint) },
      },
      vertexShader: windVert,
      fragmentShader: windFrag,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.materials.push(mat);

    const mesh = new THREE.InstancedMesh(geo, mat, cfg.count);
    mesh.frustumCulled = true;
    mesh.renderOrder = 1;

    const dummy = new THREE.Object3D();
    let placed = 0;
    let attempts = 0;
    const maxAttempts = cfg.count * 10;

    while (placed < cfg.count && attempts < maxAttempts) {
      attempts++;
      let x = (Math.random() - 0.5) * cfg.area;
      let z = (Math.random() - 0.5) * cfg.area;

      if (cfg.edgeBias && Math.random() < 0.45) {
        if (Math.random() < 0.5) {
          x = (Math.random() < 0.5 ? -1 : 1) * (4.5 + Math.random() * 3.5);
          z = (Math.random() - 0.5) * 70;
        } else {
          z = (Math.random() < 0.5 ? -1 : 1) * (4.5 + Math.random() * 3.5);
          x = (Math.random() - 0.5) * 70;
        }
      }

      if (inClear(x, z, this.clearRects, this.clearCircles)) continue;

      const sy = cfg.scaleY[0] + Math.random() * (cfg.scaleY[1] - cfg.scaleY[0]);
      const sx = cfg.scaleX[0] + Math.random() * (cfg.scaleX[1] - cfg.scaleX[0]);
      dummy.position.set(x, 0, z);
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
      dummy.scale.set(sx, sy, sx);
      dummy.updateMatrix();
      mesh.setMatrixAt(placed, dummy.matrix);
      placed++;
    }

    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    scene.add(mesh);
  }

  private onGrass(x: number, z: number): boolean {
    return !inClear(x, z, this.clearRects, this.clearCircles);
  }

  private emitPollen(px: number, pz: number, vx: number, vz: number, amount: number): void {
    for (let i = 0; i < amount; i++) {
      if (this.pollen.length >= this.maxPollen) this.pollen.shift();
      const ang = Math.random() * Math.PI * 2;
      const rad = 0.2 + Math.random() * 0.7;
      const speed = 0.8 + Math.random() * 1.6;
      this.pollen.push({
        x: px + Math.cos(ang) * rad,
        y: 0.25 + Math.random() * 0.45,
        z: pz + Math.sin(ang) * rad,
        vx: vx * 0.15 + (Math.random() - 0.5) * speed,
        vy: 0.6 + Math.random() * 1.4,
        vz: vz * 0.15 + (Math.random() - 0.5) * speed,
        life: 0,
        maxLife: 0.7 + Math.random() * 1.1,
      });
    }
  }

  private updatePollen(dt: number): void {
    for (let i = this.pollen.length - 1; i >= 0; i--) {
      const p = this.pollen[i]!;
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.pollen.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vy -= 1.8 * dt;
      p.vx += Math.sin(this.time * 2.5 + i) * 0.4 * dt;
      p.vz += Math.cos(this.time * 2.1 + i) * 0.4 * dt;
    }

    const n = this.pollen.length;
    for (let i = 0; i < n; i++) {
      const p = this.pollen[i]!;
      this.pollenPositions[i * 3] = p.x;
      this.pollenPositions[i * 3 + 1] = p.y;
      this.pollenPositions[i * 3 + 2] = p.z;
    }
    this.pollenGeom.setDrawRange(0, n);
    const attr = this.pollenGeom.getAttribute('position') as THREE.BufferAttribute;
    attr.needsUpdate = true;
  }

  update(dt: number, player?: GrassPlayerState): void {
    this.time += dt;
    this.sharedUniforms.uTime.value = this.time;

    if (player) {
      this.sharedUniforms.uPlayerPos.value.set(player.x, player.z);
      this.sharedUniforms.uPlayerVel.value.set(player.vx, player.vz);

      const speed = Math.hypot(player.vx, player.vz);
      // raio / força crescem um pouco ao correr
      this.sharedUniforms.uPlayerRadius.value = player.sprinting ? 2.35 : 1.85;
      this.sharedUniforms.uPlayerPush.value = player.sprinting ? 0.58 : 0.4;

      this.emitCooldown -= dt;
      const onGrass = this.onGrass(player.x, player.z);
      if (
        onGrass &&
        player.moving &&
        speed > 3.2 &&
        this.emitCooldown <= 0
      ) {
        const burst = player.sprinting ? 5 : 2;
        this.emitPollen(player.x, player.z, player.vx, player.vz, burst);
        this.emitCooldown = player.sprinting ? 0.07 : 0.14;
      }

      this._prevPlayer.set(player.x, player.z);
    }

    this.updatePollen(dt);
  }
}
