import * as THREE from 'three';
import type { ShtetlWorld } from './ShtetlWorld';
import type { GamepadInput } from '../input/GamepadInput';

/**
 * Câmera fixa (ângulo 3/4) que segue o jogador.
 * Movimento no eixo do mundo — teclado ou controle.
 */
export class FixedCameraPlayer {
  readonly camera: THREE.PerspectiveCamera;
  readonly position = new THREE.Vector3(0, 0, 8);
  /** Direção que o personagem está olhando (radianos, eixo Y). */
  facing = Math.PI;
  /** True neste frame se andou. */
  moving = false;

  private readonly keys = new Set<string>();
  private readonly speed = 7;
  /** Offset da câmera no shtetl (mundo aberto). */
  private readonly camOffsetOutdoor = new THREE.Vector3(0, 14, 16);
  /** Offset da câmera na sinagoga (sala fechada — mais baixa e perto). */
  private readonly camOffsetIndoor = new THREE.Vector3(-3.2, 4.2, 3.8);
  /** Limites para a câmera não atravessar as paredes. */
  private readonly indoorCamBounds = { min: -5.2, max: 5.2, yMin: 2.8, yMax: 5.4 };
  private indoor = false;
  private gamepad: GamepadInput | null = null;

  constructor(_canvas: HTMLCanvasElement) {
    this.camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      180,
    );

    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (['Tab', 'Space'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
  }

  setGamepad(pad: GamepadInput): void {
    this.gamepad = pad;
  }

  setIndoor(indoor: boolean): void {
    this.indoor = indoor;
    this.snapCamera();
  }

  /** Teleporta a câmera na hora (evita ver o “vazio” ao trocar de cenário). */
  snapCamera(): void {
    this.camera.position.copy(this.clampCam(this.desiredCamPos()));
    this.camera.lookAt(this.position.x, 1.2, this.position.z);
  }

  private desiredCamPos(): THREE.Vector3 {
    const offset = this.indoor ? this.camOffsetIndoor : this.camOffsetOutdoor;
    return this.position.clone().add(offset);
  }

  private clampCam(p: THREE.Vector3): THREE.Vector3 {
    if (!this.indoor) return p;
    const b = this.indoorCamBounds;
    p.x = THREE.MathUtils.clamp(p.x, b.min, b.max);
    p.y = THREE.MathUtils.clamp(p.y, b.yMin, b.yMax);
    p.z = THREE.MathUtils.clamp(p.z, b.min, b.max);
    return p;
  }

  setPosition(v: THREE.Vector3): void {
    this.position.copy(v);
  }

  resize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  update(dt: number, world: ShtetlWorld, canMove: boolean): void {
    this.moving = false;

    if (canMove) {
      let ix = 0;
      let iz = 0;
      if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) iz -= 1;
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) iz += 1;
      if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) ix -= 1;
      if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) ix += 1;

      if (this.gamepad) {
        const g = this.gamepad.getMove();
        ix += g.x;
        iz += g.z;
      }

      if (ix * ix + iz * iz > 0) {
        // Movimento relativo à câmera: W / stick ↑ = para dentro da tela
        const forward = new THREE.Vector3()
          .subVectors(this.position, this.camera.position)
          .setY(0);
        if (forward.lengthSq() < 1e-6) {
          forward.set(0, 0, -1);
        } else {
          forward.normalize();
        }
        const right = new THREE.Vector3(-forward.z, 0, forward.x);

        const move = new THREE.Vector3()
          .addScaledVector(right, ix)
          .addScaledVector(forward, -iz);

        if (move.lengthSq() > 0) {
          move.normalize();
          this.facing = Math.atan2(move.x, move.z);
          this.moving = true;

          const delta = move.multiplyScalar(this.speed * dt);
          const steps = 3;
          const step = delta.clone().multiplyScalar(1 / steps);
          for (let i = 0; i < steps; i++) {
            const nx = this.position.x + step.x;
            const nz = this.position.z + step.z;
            if (!world.collides(nx, this.position.z, 0.5)) this.position.x = nx;
            if (!world.collides(this.position.x, nz, 0.5)) this.position.z = nz;
          }
        }
      }
    }

    const desired = this.clampCam(this.desiredCamPos());
    this.camera.position.lerp(desired, Math.min(1, dt * 8));
    this.camera.lookAt(
      this.position.x,
      1.2,
      this.position.z,
    );
  }

  justPressed(code: string): boolean {
    return this.keys.has(code);
  }
}
