/**
 * Fallback WebHID para Xbox no Chrome (Bluetooth), quando o Gamepad API falha.
 * Edge costuma funcionar só com Gamepad API — este caminho é o plano B.
 */
const MS_VENDOR = 0x045e;

function axisFromU16(lo: number, hi: number): number {
  const v = lo | (hi << 8);
  const a = (v - 32768) / 32768;
  return Math.abs(a) < 0.14 ? 0 : Math.max(-1, Math.min(1, a));
}

export class XboxHidBridge {
  private device: HIDDeviceLike | null = null;
  private x = 0;
  private z = 0;
  private buttons: boolean[] = new Array(16).fill(false);
  private prevButtons: boolean[] = new Array(16).fill(false);
  private _name = '';

  get active(): boolean {
    return !!this.device?.opened;
  }

  get displayName(): string {
    return this._name;
  }

  beginFrame(): void {
    this.prevButtons = this.buttons.slice();
  }

  getMove(): { x: number; z: number } {
    return { x: this.x, z: this.z };
  }

  isDown(button: number): boolean {
    return this.buttons[button] ?? false;
  }

  justPressed(button: number): boolean {
    return (this.buttons[button] ?? false) && !(this.prevButtons[button] ?? false);
  }

  async requestAndOpen(): Promise<boolean> {
    if (!('hid' in navigator) || !navigator.hid) return false;

    try {
      const existing = await navigator.hid.getDevices();
      let device = existing.find((d) => d.vendorId === MS_VENDOR) ?? null;

      if (!device) {
        const picked = await navigator.hid.requestDevice({
          filters: [{ vendorId: MS_VENDOR }],
        });
        device = picked[0] ?? null;
      }
      if (!device) return false;

      if (!device.opened) await device.open();
      device.removeEventListener('inputreport', this.onReport);
      device.addEventListener('inputreport', this.onReport);
      this.device = device;
      this._name = device.productName || 'Xbox (HID)';
      return true;
    } catch {
      return false;
    }
  }

  private onReport = (event: HIDInputReportEvent): void => {
    const data = new Uint8Array(event.data.buffer);
    if (data.length < 10) return;

    // Xbox Wireless / One / Series — report típico (stick + botões)
    this.x = axisFromU16(data[0]!, data[1]!);
    this.z = axisFromU16(data[2]!, data[3]!);

    const face = data[8] ?? 0;
    const misc = data[9] ?? 0;
    const next = new Array(16).fill(false) as boolean[];

    // A B X Y
    next[0] = !!(face & 0x01);
    next[1] = !!(face & 0x02);
    next[2] = !!(face & 0x08);
    next[3] = !!(face & 0x10);
    // Back / Start
    next[8] = !!(misc & 0x20) || !!(face & 0x20);
    next[9] = !!(misc & 0x10) || !!(face & 0x40);

    // D-pad (hat nibble)
    const hat = misc & 0x0f;
    if (hat > 0 && hat < 9) {
      next[12] = [1, 2, 8].includes(hat);
      next[15] = [2, 3, 4].includes(hat);
      next[13] = [4, 5, 6].includes(hat);
      next[14] = [6, 7, 8].includes(hat);
    }

    this.buttons = next;
  };
}

/* Tipagens mínimas do WebHID (evita @types/w3c-web-hid) */
interface HID {
  getDevices(): Promise<HIDDeviceLike[]>;
  requestDevice(options: {
    filters: Array<{ vendorId?: number }>;
  }): Promise<HIDDeviceLike[]>;
}
interface HIDDeviceLike {
  vendorId: number;
  productName: string;
  opened: boolean;
  open(): Promise<void>;
  addEventListener(type: string, listener: (ev: HIDInputReportEvent) => void): void;
  removeEventListener(type: string, listener: (ev: HIDInputReportEvent) => void): void;
}
interface HIDInputReportEvent extends Event {
  data: DataView;
  reportId: number;
}
declare global {
  interface Navigator {
    hid?: HID;
  }
}
