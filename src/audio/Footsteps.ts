/**
 * Passos procedurais (Web Audio) — som padrão de terra/caminho, sem arquivo externo.
 */
import { SoundManager } from './SoundManager';

export class Footsteps {
  private ctx: AudioContext | null = null;
  private lastFoot = -1;
  private unlocked = false;

  /** Precisa de gesto do usuário no browser (Enter / tecla). */
  unlock(): void {
    if (this.unlocked) return;
    const ctx = this.ensureCtx();
    if (ctx.state === 'suspended') void ctx.resume();
    this.unlocked = true;
  }

  private ensureCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  /**
   * Chamar a cada frame com a fase do walk cycle (`applyWalkCycle`).
   * Dispara um passo a cada meio ciclo (quando o pé toca o chão).
   */
  update(phase: number, walking: boolean): void {
    if (!walking) {
      this.lastFoot = -1;
      return;
    }
    if (!this.unlocked) return;
    if (!SoundManager.get().isEnabled) return;

    const foot = Math.floor(phase / Math.PI);
    if (foot === this.lastFoot) return;
    this.lastFoot = foot;
    this.play();
  }

  private play(): void {
    const ctx = this.ensureCtx();
    if (ctx.state === 'suspended') void ctx.resume();

    const t = ctx.currentTime;
    const dur = 0.09;

    // Ruído curto (pé na terra)
    const samples = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, samples, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < samples; i++) {
      const env = 1 - i / samples;
      data[i] = (Math.random() * 2 - 1) * env * env;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 280 + Math.random() * 120;
    filter.Q.value = 0.85;

    const gain = ctx.createGain();
    const vol = 0.42 + Math.random() * 0.1;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(t);
    src.stop(t + dur);
  }
}
