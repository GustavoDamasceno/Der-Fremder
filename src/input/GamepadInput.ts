/**
 * Leitura de controle via Gamepad API (Edge / USB) + fallback WebHID (Chrome BT).
 */
import { XboxHidBridge } from './XboxHidBridge';

export const GP = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  LT: 6,
  RT: 7,
  BACK: 8,
  START: 9,
  L3: 10,
  R3: 11,
  UP: 12,
  DOWN: 13,
  LEFT: 14,
  RIGHT: 15,
} as const;

const DEADZONE = 0.18;

export class GamepadInput {
  private prevButtons = new Map<number, boolean[]>();
  private currButtons = new Map<number, boolean[]>();
  private pads: Gamepad[] = [];
  private _id = '';
  private _connected = false;
  private readonly hid = new XboxHidBridge();
  private lastError = '';

  constructor() {
    const refresh = () => {
      try {
        void navigator.getGamepads?.();
      } catch (e) {
        this.lastError = e instanceof Error ? e.message : 'gamepad bloqueado';
      }
    };
    window.addEventListener('gamepadconnected', (e) => {
      this._connected = true;
      this._id = e.gamepad.id;
      refresh();
    });
    window.addEventListener('gamepaddisconnected', () => {
      refresh();
      this.syncConnectionFromSnapshot();
    });
    window.addEventListener('focus', refresh);
    window.addEventListener('pointerdown', refresh, { passive: true });
    window.addEventListener('keydown', refresh);
  }

  get isConnected(): boolean {
    return (this._connected && this.pads.length > 0) || this.hid.active;
  }

  get displayName(): string {
    if (this.hid.active) return this.hid.displayName;
    if (!this._id) return '';
    return (this._id.split('(')[0]?.trim() ?? this._id).slice(0, 42);
  }

  get supportsHid(): boolean {
    return typeof navigator !== 'undefined' && !!navigator.hid;
  }

  get blockedMessage(): string {
    return this.lastError;
  }

  /**
   * Chrome + Xbox Bluetooth: o Gamepad API às vezes não vê o pad.
   * Chamar a partir de um clique (gesto obrigatório do WebHID).
   */
  async activateChromeHid(): Promise<boolean> {
    return this.hid.requestAndOpen();
  }

  update(): void {
    this.hid.beginFrame();
    this.prevButtons = this.currButtons;
    this.currButtons = new Map();
    this.pads = [];
    this.lastError = '';

    try {
      const list = navigator.getGamepads?.();
      if (list) {
        for (let i = 0; i < list.length; i++) {
          const pad = list[i];
          if (!pad || pad.connected === false) continue;
          this.pads.push(pad);
          this._id = pad.id;
          this._connected = true;

          const pressed: boolean[] = [];
          for (let b = 0; b < Math.max(pad.buttons.length, 16); b++) {
            const btn = pad.buttons[b];
            pressed[b] = !!(btn && (btn.pressed || btn.value > 0.45));
          }
          this.currButtons.set(pad.index, pressed);
        }
      }
    } catch (e) {
      this.lastError = e instanceof Error ? e.message : 'gamepad bloqueado';
      this._connected = false;
    }

    if (this.pads.length === 0 && !this.hid.active) {
      this.syncConnectionFromSnapshot();
    }
  }

  getMove(): { x: number; z: number } {
    if (this.hid.active && this.pads.length === 0) {
      return this.hid.getMove();
    }

    const move = { x: 0, z: 0 };
    for (const pad of this.pads) {
      let lx = pad.axes[0] ?? 0;
      let ly = pad.axes[1] ?? 0;
      if (Math.hypot(lx, ly) < DEADZONE && pad.axes.length >= 4) {
        const ax2 = pad.axes[2] ?? 0;
        const ax3 = pad.axes[3] ?? 0;
        if (Math.hypot(ax2, ax3) >= DEADZONE) {
          lx = ax2;
          ly = ax3;
        }
      }
      if (Math.hypot(lx, ly) < DEADZONE) {
        lx = 0;
        ly = 0;
      }
      move.x += lx;
      move.z += ly;
      if (this.downOn(pad.index, GP.LEFT)) move.x -= 1;
      if (this.downOn(pad.index, GP.RIGHT)) move.x += 1;
      if (this.downOn(pad.index, GP.UP)) move.z -= 1;
      if (this.downOn(pad.index, GP.DOWN)) move.z += 1;
    }

    if (this.hid.active) {
      const h = this.hid.getMove();
      move.x += h.x;
      move.z += h.z;
    }

    const len = Math.hypot(move.x, move.z);
    if (len > 1) {
      move.x /= len;
      move.z /= len;
    }
    return move;
  }

  isDown(button: number): boolean {
    if (this.hid.active && this.hid.isDown(button)) return true;
    for (const [, buttons] of this.currButtons) {
      if (buttons[button]) return true;
    }
    return false;
  }

  justPressed(button: number): boolean {
    if (this.hid.active && this.hid.justPressed(button)) return true;
    for (const [index, buttons] of this.currButtons) {
      if (!buttons[button]) continue;
      const was = this.prevButtons.get(index)?.[button] ?? false;
      if (!was) return true;
    }
    return false;
  }

  private downOn(padIndex: number, button: number): boolean {
    return this.currButtons.get(padIndex)?.[button] ?? false;
  }

  private syncConnectionFromSnapshot(): void {
    try {
      const list = navigator.getGamepads?.();
      if (!list) {
        this._connected = this.hid.active;
        return;
      }
      let found = false;
      for (let i = 0; i < list.length; i++) {
        if (list[i] && list[i]!.connected !== false) {
          found = true;
          this._id = list[i]!.id;
          break;
        }
      }
      this._connected = found || this.hid.active;
    } catch {
      this._connected = this.hid.active;
    }
  }
}
