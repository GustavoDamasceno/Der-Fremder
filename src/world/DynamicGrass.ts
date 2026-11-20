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

    if (player) {
      const speed = Math.hypot(player.vx, player.vz);
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
