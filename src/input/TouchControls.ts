/**
 * Controles virtuais para celular em paisagem:
 * joystick à esquerda + botões Interagir / OK / Glossário à direita.
 */
export class TouchControls {
  private root: HTMLElement | null = null;
  private padEl: HTMLElement | null = null;
  private knobEl: HTMLElement | null = null;
  private enabled = false;
  private visible = false;

  private moveX = 0;
  private moveZ = 0;
  private stickId: number | null = null;
  private stickOrigin = { x: 0, y: 0 };
  private readonly stickRadius = 54;

  private interactDown = false;
  private interactPressed = false;
  private confirmPressed = false;
  private glossaryPressed = false;

  mount(parent: HTMLElement): void {
    if (this.root) return;
    const el = document.createElement('div');
    el.id = 'touch-controls';
    el.className = 'touch-controls hidden';
    el.innerHTML = `
      <div class="touch-stick" id="touch-stick" aria-label="Andar">
        <div class="touch-stick-base"></div>
        <div class="touch-stick-knob" id="touch-stick-knob"></div>
      </div>
      <div class="touch-actions">
        <button type="button" class="touch-btn touch-btn-ok" id="touch-ok" aria-label="Confirmar">OK</button>
        <button type="button" class="touch-btn touch-btn-e" id="touch-e" aria-label="Interagir">E</button>
        <button type="button" class="touch-btn touch-btn-tab" id="touch-tab" aria-label="Glossário">☰</button>
      </div>
    `;
    parent.appendChild(el);
    this.root = el;
    this.padEl = el.querySelector('#touch-stick') as HTMLElement;
    this.knobEl = el.querySelector('#touch-stick-knob') as HTMLElement;

    this.bindStick();
    this.bindButton(el.querySelector('#touch-e') as HTMLButtonElement, 'interact');
    this.bindButton(el.querySelector('#touch-ok') as HTMLButtonElement, 'confirm');
    this.bindButton(el.querySelector('#touch-tab') as HTMLButtonElement, 'glossary');
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    document.body.classList.toggle('touch-mode', on);
    this.refreshVisibility();
  }

  /** Mostra o pad só durante o jogo (não na tela título). */
  setGameplayVisible(on: boolean): void {
    this.visible = on;
    this.refreshVisibility();
  }

  private refreshVisibility(): void {
    if (!this.root) return;
    const show = this.enabled && this.visible;
    this.root.classList.toggle('hidden', !show);
    if (!show) this.resetStick();
  }

  getMove(): { x: number; z: number } {
    if (!this.enabled) return { x: 0, z: 0 };
    return { x: this.moveX, z: this.moveZ };
  }

  isInteractDown(): boolean {
    return this.enabled && this.interactDown;
  }

  /** Consome “acabou de apertar” (um frame). */
  consumeInteract(): boolean {
    if (!this.interactPressed) return false;
    this.interactPressed = false;
    return true;
  }

  consumeConfirm(): boolean {
    if (!this.confirmPressed) return false;
    this.confirmPressed = false;
    return true;
  }

  consumeGlossary(): boolean {
    if (!this.glossaryPressed) return false;
    this.glossaryPressed = false;
    return true;
  }

  /** Tenta fullscreen + trava em paisagem (quando o browser permitir). */
  async requestLandscape(): Promise<void> {
    try {
      const root = document.documentElement;
      if (root.requestFullscreen) await root.requestFullscreen();
    } catch {
      /* ignore */
    }
    try {
      const orient = (screen as Screen & {
        orientation?: { lock?: (o: string) => Promise<void> };
      }).orientation;
      if (orient?.lock) await orient.lock('landscape');
    } catch {
      /* iOS / browsers sem lock — usuário gira manualmente */
    }
  }

  private bindStick(): void {
    const pad = this.padEl!;
    const onStart = (e: PointerEvent) => {
      if (!this.enabled || this.stickId != null) return;
      e.preventDefault();
      pad.setPointerCapture(e.pointerId);
      this.stickId = e.pointerId;
      const rect = pad.getBoundingClientRect();
      this.stickOrigin = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      this.applyStick(e.clientX, e.clientY);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== this.stickId) return;
      e.preventDefault();
      this.applyStick(e.clientX, e.clientY);
    };
    const onEnd = (e: PointerEvent) => {
      if (e.pointerId !== this.stickId) return;
      this.resetStick();
    };
    pad.addEventListener('pointerdown', onStart);
    pad.addEventListener('pointermove', onMove);
    pad.addEventListener('pointerup', onEnd);
    pad.addEventListener('pointercancel', onEnd);
  }

  private applyStick(cx: number, cy: number): void {
    let dx = cx - this.stickOrigin.x;
    let dy = cy - this.stickOrigin.y;
    const len = Math.hypot(dx, dy);
    if (len > this.stickRadius) {
      dx = (dx / len) * this.stickRadius;
      dy = (dy / len) * this.stickRadius;
    }
    if (this.knobEl) {
      this.knobEl.style.transform = `translate(${dx}px, ${dy}px)`;
    }
    // Mesmo mapeamento do stick do controle: x = esquerda/direita, z = frente/trás
    this.moveX = dx / this.stickRadius;
    this.moveZ = dy / this.stickRadius;
    if (Math.hypot(this.moveX, this.moveZ) < 0.18) {
      this.moveX = 0;
      this.moveZ = 0;
    }
  }

  private resetStick(): void {
    this.stickId = null;
    this.moveX = 0;
    this.moveZ = 0;
    if (this.knobEl) this.knobEl.style.transform = 'translate(0, 0)';
  }

  private bindButton(
    btn: HTMLButtonElement,
    kind: 'interact' | 'confirm' | 'glossary',
  ): void {
    const press = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if (kind === 'interact') {
        if (!this.interactDown) this.interactPressed = true;
        this.interactDown = true;
      } else if (kind === 'confirm') {
        this.confirmPressed = true;
      } else {
        this.glossaryPressed = true;
      }
    };
    const release = (e: Event) => {
      e.preventDefault();
      if (kind === 'interact') this.interactDown = false;
    };
    btn.addEventListener('pointerdown', press);
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('pointerleave', release);
  }
}
