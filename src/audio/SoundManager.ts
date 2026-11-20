/**
 * Música de fundo + mute global.
 * shtetl → bgm.mp3 | sinagoga → shul.mp3
 */
import bgmUrl from './bgm.mp3';
import shulUrl from './shul.mp3';

const STORAGE_KEY = 'der-fremder-sound-on';
const BGM_VOLUME = 0.12;

export type MusicTrack = 'shtetl' | 'shul';

export class SoundManager {
  private static instance: SoundManager | null = null;

  private tracks: Partial<Record<MusicTrack, HTMLAudioElement>> = {};
  private current: MusicTrack = 'shtetl';
  private enabled = true;
  private unlocked = false;
  /** true na biblioteca — bloqueia play() assíncrono (bug comum no celular). */
  private scenePaused = false;
  private listeners = new Set<(enabled: boolean) => void>();

  static get(): SoundManager {
    if (!SoundManager.instance) SoundManager.instance = new SoundManager();
    return SoundManager.instance;
  }

  private constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === '0') this.enabled = false;
    if (saved === '1') this.enabled = true;
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  onChange(cb: (enabled: boolean) => void): () => void {
    this.listeners.add(cb);
    cb(this.enabled);
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    for (const cb of this.listeners) cb(this.enabled);
  }

  private urlFor(track: MusicTrack): string {
    return track === 'shul' ? shulUrl : bgmUrl;
  }

  private ensure(track: MusicTrack): HTMLAudioElement {
    let audio = this.tracks[track];
    if (!audio) {
      audio = new Audio(this.urlFor(track));
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = this.enabled ? BGM_VOLUME : 0;
      audio.muted = !this.enabled;
      this.tracks[track] = audio;
    }
    return audio;
  }

  private applyMuteState(audio: HTMLAudioElement): void {
    if (this.enabled) {
      audio.muted = false;
      audio.volume = BGM_VOLUME;
    } else {
      audio.muted = true;
      audio.volume = 0;
    }
  }

  private canPlay(): boolean {
    return this.enabled && this.unlocked && !this.scenePaused;
  }

  private silenceAll(): void {
    for (const a of Object.values(this.tracks)) {
      if (!a) continue;
      a.pause();
      a.muted = true;
      a.volume = 0;
    }
  }

  /** Troca a faixa (shtetl ↔ shul). */
  setTrack(track: MusicTrack): void {
    if (track === this.current && this.tracks[track]) {
      if (this.canPlay()) {
        const a = this.ensure(track);
        this.applyMuteState(a);
        void a.play().catch(() => undefined);
      } else if (this.scenePaused) {
        this.silenceAll();
      }
      return;
    }

    const prev = this.tracks[this.current];
    if (prev) {
      prev.pause();
      try {
        prev.currentTime = 0;
      } catch {
        /* ignore */
      }
    }

    this.current = track;
    const next = this.ensure(track);
    if (this.canPlay()) {
      this.applyMuteState(next);
      void next.play().catch(() => undefined);
    } else {
      next.pause();
      next.muted = true;
      next.volume = 0;
    }
  }

  /** Precisa de gesto do usuário (Começar / clique no botão de som). */
  unlock(): void {
    this.unlocked = true;
    // Pré-carrega as duas faixas
    this.ensure('shtetl');
    this.ensure('shul');
    const audio = this.ensure(this.current);
    if (this.canPlay()) {
      this.applyMuteState(audio);
      void audio.play().catch(() => undefined);
    } else {
      this.silenceAll();
    }
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    localStorage.setItem(STORAGE_KEY, on ? '1' : '0');
    if (on && this.canPlay()) {
      const audio = this.ensure(this.current);
      this.applyMuteState(audio);
      void audio.play().catch(() => undefined);
    } else {
      this.silenceAll();
    }
    this.notify();
  }

  toggle(): boolean {
    this.unlocked = true;
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  /** Pausa BGM (biblioteca). Resiste a play() atrasado no mobile. */
  pause(): void {
    this.scenePaused = true;
    this.silenceAll();
  }

  resume(): void {
    this.scenePaused = false;
    if (!this.canPlay()) return;
    const audio = this.ensure(this.current);
    this.applyMuteState(audio);
    void audio.play().catch(() => undefined);
  }
}
