import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import {
  makePerson,
  applyWalkCycle,
  type PersonRig,
} from '../world/ShtetlWorld';
import type { PeerPresence } from './LibraryRoom';

type RemoteAvatar = {
  rig: PersonRig;
  label: CSS2DObject;
  labelEl: HTMLDivElement;
  nameEl: HTMLSpanElement;
  micBtn: HTMLButtonElement;
  waves: HTMLDivElement;
  target: PeerPresence;
  walkPhase: { value: number };
};

function micEmoji(on: boolean): string {
  return on ? '🎤' : '🔇';
}

function makeWaveBars(): HTMLDivElement {
  const waves = document.createElement('div');
  waves.className = 'nametag-waves';
  waves.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 3; i++) {
    const bar = document.createElement('span');
    waves.appendChild(bar);
  }
  return waves;
}

function applySpeakingVisual(
  micBtn: HTMLButtonElement,
  waves: HTMLDivElement,
  micOn: boolean,
  level: number,
): void {
  const speaking = micOn && level > 0.08;
  micBtn.classList.toggle('speaking', speaking);
  waves.classList.toggle('active', speaking);
  const intensity = speaking ? Math.min(1, 0.25 + level * 0.9) : 0;
  waves.style.setProperty('--level', String(intensity));
  if (speaking) {
    const shake = (level * 2.2).toFixed(2);
    micBtn.style.setProperty('--shake', `${shake}px`);
  } else {
    micBtn.style.removeProperty('--shake');
  }
}

/** Avatares remotos + nametag CSS2D dentro da biblioteca. */
export class LibraryPresence {
  private readonly remotes = new Map<string, RemoteAvatar>();
  private localLabel: CSS2DObject | null = null;
  private localNameEl: HTMLSpanElement | null = null;
  private localMicBtn: HTMLButtonElement | null = null;
  private localWaves: HTMLDivElement | null = null;
  private localMicOn = false;
  private onLocalMicClick: (() => void) | null = null;

  constructor(private readonly parent: THREE.Object3D) {}

  setMicClickHandler(handler: (() => void) | null): void {
    this.onLocalMicClick = handler;
  }

  attachLocalName(playerRoot: THREE.Object3D, name: string, micOn = false): void {
    this.detachLocalName();
    this.localMicOn = micOn;

    const el = document.createElement('div');
    el.className = 'nametag nametag-local';

    const nameEl = document.createElement('span');
    nameEl.className = 'nametag-name';
    nameEl.textContent = name;

    const micBtn = document.createElement('button');
    micBtn.type = 'button';
    micBtn.className = 'nametag-mic-btn';
    micBtn.title = micOn ? 'Desligar microfone' : 'Ligar microfone';
    micBtn.textContent = micEmoji(micOn);
    micBtn.classList.toggle('on', micOn);
    micBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.onLocalMicClick?.();
    });

    const waves = makeWaveBars();

    el.appendChild(nameEl);
    el.appendChild(micBtn);
    el.appendChild(waves);

    const obj = new CSS2DObject(el);
    obj.position.set(0, 2.15, 0);
    playerRoot.add(obj);
    this.localLabel = obj;
    this.localNameEl = nameEl;
    this.localMicBtn = micBtn;
    this.localWaves = waves;
  }

  setLocalMicOn(on: boolean): void {
    this.localMicOn = on;
    if (!this.localMicBtn) return;
    this.localMicBtn.textContent = micEmoji(on);
    this.localMicBtn.classList.toggle('on', on);
    this.localMicBtn.title = on ? 'Desligar microfone' : 'Ligar microfone';
    if (!on && this.localWaves) {
      applySpeakingVisual(this.localMicBtn, this.localWaves, false, 0);
    }
  }

  setLocalName(name: string): void {
    if (this.localNameEl) this.localNameEl.textContent = name;
  }

  detachLocalName(): void {
    if (this.localLabel) {
      this.localLabel.parent?.remove(this.localLabel);
      this.localLabel.element.remove();
      this.localLabel = null;
      this.localNameEl = null;
      this.localMicBtn = null;
      this.localWaves = null;
    }
  }

  /** Posições interpoladas dos remotes (para voz por proximidade). */
  getRemotePositions(): Map<string, { x: number; z: number }> {
    const map = new Map<string, { x: number; z: number }>();
    for (const [id, remote] of this.remotes) {
      map.set(id, {
        x: remote.rig.root.position.x,
        z: remote.rig.root.position.z,
      });
    }
    return map;
  }

  setSpeakingLevels(localLevel: number, peerLevels: Map<string, number>): void {
    if (this.localMicBtn && this.localWaves) {
      applySpeakingVisual(
        this.localMicBtn,
        this.localWaves,
        this.localMicOn,
        localLevel,
      );
    }
    for (const [id, remote] of this.remotes) {
      const level = peerLevels.get(id) ?? 0;
      applySpeakingVisual(
        remote.micBtn,
        remote.waves,
        !!remote.target.micOn,
        level,
      );
    }
  }

  upsert(userId: string, state: PeerPresence | null): void {
    if (!state) {
      this.remove(userId);
      return;
    }

    let remote = this.remotes.get(userId);
    if (!remote) {
      const rig = makePerson('player', { coat: state.coat });
      const labelEl = document.createElement('div');
      labelEl.className = 'nametag';

      const nameEl = document.createElement('span');
      nameEl.className = 'nametag-name';
      nameEl.textContent = state.name;

      const micBtn = document.createElement('button');
      micBtn.type = 'button';
      micBtn.className = 'nametag-mic-btn nametag-mic-remote';
      micBtn.disabled = true;
      micBtn.tabIndex = -1;
      micBtn.textContent = micEmoji(!!state.micOn);
      micBtn.classList.toggle('on', !!state.micOn);

      const waves = makeWaveBars();

      labelEl.appendChild(nameEl);
      labelEl.appendChild(micBtn);
      labelEl.appendChild(waves);

      const label = new CSS2DObject(labelEl);
      label.position.set(0, 2.15, 0);
      rig.root.add(label);
      this.parent.add(rig.root);
      remote = {
        rig,
        label,
        labelEl,
        nameEl,
        micBtn,
        waves,
        target: { ...state },
        walkPhase: { value: 0 },
      };
      this.remotes.set(userId, remote);
      rig.root.position.set(state.x, 0, state.z);
      rig.root.rotation.y = state.facing;
    } else {
      if (remote.target.coat !== state.coat) {
        this.remove(userId);
        this.upsert(userId, state);
        return;
      }
      remote.target = { ...state };
      remote.nameEl.textContent = state.name;
    }

    remote.micBtn.textContent = micEmoji(!!state.micOn);
    remote.micBtn.classList.toggle('on', !!state.micOn);
    if (!state.micOn) {
      applySpeakingVisual(remote.micBtn, remote.waves, false, 0);
    }
  }

  remove(userId: string): void {
    const remote = this.remotes.get(userId);
    if (!remote) return;
    this.parent.remove(remote.rig.root);
    remote.label.element.remove();
    this.remotes.delete(userId);
  }

  clear(): void {
    for (const id of [...this.remotes.keys()]) this.remove(id);
    this.detachLocalName();
  }

  update(dt: number): void {
    for (const remote of this.remotes.values()) {
      const t = remote.target;
      const root = remote.rig.root;
      root.position.x = THREE.MathUtils.damp(root.position.x, t.x, 12, dt);
      root.position.z = THREE.MathUtils.damp(root.position.z, t.z, 12, dt);

      let dy = t.facing - root.rotation.y;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      root.rotation.y += dy * Math.min(1, dt * 10);

      const dx = t.x - root.position.x;
      const dz = t.z - root.position.z;
      const moving = t.moving || dx * dx + dz * dz > 0.0004;
      applyWalkCycle(remote.rig, moving, dt, remote.walkPhase);
    }
  }

  get count(): number {
    return this.remotes.size;
  }
}
