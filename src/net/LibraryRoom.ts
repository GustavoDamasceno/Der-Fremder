import { joinRoom, type Room, type UserState } from 'trystero';
import { normalizeRoomCode, pickFreeCoat } from './libraryColors';

export const LIBRARY_MAX_PLAYERS = 10;

/** Volume cheio até esta distância; some ao chegar em VOICE_FAR. */
const VOICE_NEAR = 2.8;
const VOICE_FAR = 13;

export type PeerPresence = {
  name: string;
  coat: number;
  x: number;
  z: number;
  facing: number;
  micOn: boolean;
  moving: boolean;
};

type PresenceHandlers = {
  onPresence: (userId: string, state: PeerPresence | null) => void;
  onPeerCount: (count: number) => void;
  onPeerStream: (userId: string, stream: MediaStream | null) => void;
  onError: (message: string) => void;
};

type PeerAudioGraph = {
  source: MediaStreamAudioSourceNode;
  gain: GainNode;
  analyser: AnalyserNode;
  data: Uint8Array;
};

const APP_ID = 'der-fremder.library';
const STORAGE_NAME = 'df-library-name';
const STORAGE_CODE = 'df-library-code';

export class LibraryRoom {
  private room: Room | null = null;
  private presence: UserState<PeerPresence> | null = null;
  private unsubs: Array<() => void> = [];
  private micStream: MediaStream | null = null;
  private micEnabled = false;
  private code = '';
  private localName = '';
  private localCoat = 0x8a3c3c;
  private selfUserId = '';
  private handlers: PresenceHandlers | null = null;

  private audioCtx: AudioContext | null = null;
  private localAnalyser: AnalyserNode | null = null;
  private localMicSource: MediaStreamAudioSourceNode | null = null;
  private localData: Uint8Array | null = null;
  private peerAudio = new Map<string, PeerAudioGraph>();

  get roomCode(): string {
    return this.code;
  }

  get displayName(): string {
    return this.localName;
  }

  get coatColor(): number {
    return this.localCoat;
  }

  get isConnected(): boolean {
    return this.room != null;
  }

  get micOn(): boolean {
    return this.micEnabled;
  }

  get playerCount(): number {
    if (!this.room) return 0;
    return Math.max(1, Object.keys(this.room.getUsers()).length);
  }

  static loadSavedName(): string {
    try {
      return localStorage.getItem(STORAGE_NAME) ?? '';
    } catch {
      return '';
    }
  }

  static loadSavedCode(): string {
    try {
      return localStorage.getItem(STORAGE_CODE) ?? '';
    } catch {
      return '';
    }
  }

  async join(
    rawName: string,
    rawCode: string,
    handlers: PresenceHandlers,
  ): Promise<{ coat: number; name: string; code: string }> {
    const name = rawName.trim().slice(0, 20);
    const code = normalizeRoomCode(rawCode);
    if (!name) throw new Error('Digite seu nome.');
    if (code.length < 2) throw new Error('Código inválido (mín. 2 caracteres).');

    if (this.room) await this.leave();

    this.handlers = handlers;
    this.localName = name;
    this.code = code;

    try {
      localStorage.setItem(STORAGE_NAME, name);
      localStorage.setItem(STORAGE_CODE, code);
    } catch {
      /* ignore */
    }

    const room = joinRoom({ appId: APP_ID }, code);
    this.room = room;

    await room.ready;
    const self = await room.getSelf();
    this.selfUserId = self.userId;

    const users = room.getUsers();
    if (Object.keys(users).length > LIBRARY_MAX_PLAYERS) {
      await room.leave();
      this.room = null;
      throw new Error(`Sala cheia (máx. ${LIBRARY_MAX_PLAYERS}).`);
    }

    const presence = room.makeUserState<PeerPresence>('presence', {
      name,
      coat: 0x8a3c3c,
      x: 0,
      z: -11.5,
      facing: 0,
      micOn: false,
      moving: false,
    });
    this.presence = presence;

    await new Promise((r) => setTimeout(r, 400));

    const takenCoats: number[] = [];
    for (const [uid, st] of Object.entries(presence.getAll())) {
      if (uid === this.selfUserId) continue;
      if (st && typeof st.coat === 'number') takenCoats.push(st.coat);
    }
    this.localCoat = pickFreeCoat(takenCoats);

    await presence.set({
      name,
      coat: this.localCoat,
      x: 0,
      z: -11.5,
      facing: 0,
      micOn: false,
      moving: false,
    });

    this.unsubs.push(
      presence.onChange((value, ctx) => {
        if (ctx.self) return;
        if (ctx.removed || value == null) {
          handlers.onPresence(ctx.userId, null);
        } else {
          handlers.onPresence(ctx.userId, value);
        }
        handlers.onPeerCount(this.playerCount);
      }),
    );

    this.unsubs.push(
      room.onUserJoin(() => handlers.onPeerCount(this.playerCount)),
    );
    this.unsubs.push(
      room.onUserLeave(({ userId }) => {
        handlers.onPresence(userId, null);
        this.detachPeerAudio(userId);
        handlers.onPeerStream(userId, null);
        handlers.onPeerCount(this.playerCount);
      }),
    );

    this.unsubs.push(
      room.onPeerStream((stream, { userId }) => {
        this.attachPeerAudio(userId, stream);
        handlers.onPeerStream(userId, stream);
      }),
    );

    this.unsubs.push(
      room.onError((err) => {
        handlers.onError(err.message || String(err.code));
      }),
    );

    for (const [uid, st] of Object.entries(presence.getAll())) {
      if (uid === this.selfUserId) continue;
      if (st) handlers.onPresence(uid, st);
    }
    handlers.onPeerCount(this.playerCount);

    return { coat: this.localCoat, name, code };
  }

  publish(partial: Partial<PeerPresence>): void {
    if (!this.presence) return;
    const cur = this.presence.get(this.selfUserId) as PeerPresence | undefined;
    const next: PeerPresence = {
      name: this.localName,
      coat: this.localCoat,
      x: cur?.x ?? 0,
      z: cur?.z ?? -11.5,
      facing: cur?.facing ?? 0,
      micOn: this.micEnabled,
      moving: cur?.moving ?? false,
      ...partial,
    };
    next.name = this.localName;
    next.coat = this.localCoat;
    next.micOn = this.micEnabled;
    void this.presence.set(next);
  }

  async setMicEnabled(on: boolean): Promise<boolean> {
    if (!this.room) return false;

    if (on) {
      if (!this.micStream) {
        try {
          this.micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
            video: false,
          });
        } catch {
          this.handlers?.onError('Permissão de microfone negada.');
          return false;
        }
        const stream = this.micStream;
        await this.room.addStream(stream);
        this.unsubs.push(
          this.room.onPeerJoin(({ peerId }) => {
            if (this.micStream && this.room) {
              void this.room.addStream(this.micStream, { target: peerId });
            }
          }),
        );
        this.hookLocalAnalyser(stream);
      }
      for (const track of this.micStream.getAudioTracks()) {
        track.enabled = true;
      }
      this.micEnabled = true;
      void this.ensureAudioCtx().resume();
    } else {
      if (this.micStream) {
        for (const track of this.micStream.getAudioTracks()) {
          track.enabled = false;
        }
      }
      this.micEnabled = false;
    }

    this.publish({});
    return this.micEnabled;
  }

  /**
   * Ajusta volume por distância e devolve níveis de fala (0–1)
   * para animar os microfones.
   */
  updateSpatialAudio(
    localX: number,
    localZ: number,
    peerPositions: Map<string, { x: number; z: number }>,
  ): { localLevel: number; peerLevels: Map<string, number> } {
    const peerLevels = new Map<string, number>();

    for (const [userId, graph] of this.peerAudio) {
      const pos = peerPositions.get(userId);
      let vol = 0;
      if (pos) {
        const dx = pos.x - localX;
        const dz = pos.z - localZ;
        const dist = Math.hypot(dx, dz);
        vol = proximityVolume(dist);
      }
      graph.gain.gain.value = vol;
      peerLevels.set(userId, vol > 0.02 ? rmsLevel(graph.analyser, graph.data) : 0);
    }

    const localLevel =
      this.micEnabled && this.localAnalyser && this.localData
        ? rmsLevel(this.localAnalyser, this.localData)
        : 0;

    return { localLevel, peerLevels };
  }

  async leave(): Promise<void> {
    for (const u of this.unsubs) {
      try {
        u();
      } catch {
        /* ignore */
      }
    }
    this.unsubs = [];

    for (const [uid] of this.peerAudio) {
      this.detachPeerAudio(uid);
    }

    this.teardownLocalAnalyser();

    if (this.micStream) {
      for (const t of this.micStream.getTracks()) t.stop();
      if (this.room) {
        try {
          this.room.removeStream(this.micStream);
        } catch {
          /* ignore */
        }
      }
      this.micStream = null;
    }
    this.micEnabled = false;

    if (this.audioCtx) {
      void this.audioCtx.close().catch(() => undefined);
      this.audioCtx = null;
    }

    if (this.room) {
      try {
        await this.room.leave();
      } catch {
        /* ignore */
      }
    }
    this.room = null;
    this.presence = null;
    this.selfUserId = '';
    this.handlers = null;
  }

  private ensureAudioCtx(): AudioContext {
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      void this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  private hookLocalAnalyser(stream: MediaStream): void {
    this.teardownLocalAnalyser();
    const ctx = this.ensureAudioCtx();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.55;
    source.connect(analyser);
    // Não liga no destination — evita eco da própria voz
    this.localMicSource = source;
    this.localAnalyser = analyser;
    this.localData = new Uint8Array(analyser.fftSize);
  }

  private teardownLocalAnalyser(): void {
    try {
      this.localMicSource?.disconnect();
    } catch {
      /* ignore */
    }
    this.localMicSource = null;
    this.localAnalyser = null;
    this.localData = null;
  }

  private attachPeerAudio(userId: string, stream: MediaStream): void {
    this.detachPeerAudio(userId);
    const ctx = this.ensureAudioCtx();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.55;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    source.connect(analyser);
    source.connect(gain);
    gain.connect(ctx.destination);
    this.peerAudio.set(userId, {
      source,
      gain,
      analyser,
      data: new Uint8Array(analyser.fftSize),
    });
  }

  private detachPeerAudio(userId: string): void {
    const graph = this.peerAudio.get(userId);
    if (!graph) return;
    try {
      graph.source.disconnect();
      graph.gain.disconnect();
      graph.analyser.disconnect();
    } catch {
      /* ignore */
    }
    this.peerAudio.delete(userId);
  }
}

function proximityVolume(dist: number): number {
  if (dist <= VOICE_NEAR) return 1;
  if (dist >= VOICE_FAR) return 0;
  const t = (dist - VOICE_NEAR) / (VOICE_FAR - VOICE_NEAR);
  // Curva suave — cai mais no fim
  return Math.pow(1 - t, 1.35);
}

function rmsLevel(analyser: AnalyserNode, buffer: Uint8Array): number {
  analyser.getByteTimeDomainData(buffer);
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    const v = ((buffer[i] ?? 128) - 128) / 128;
    sum += v * v;
  }
  const rms = Math.sqrt(sum / buffer.length);
  // Limiar de ruído + compressão para animação
  const gated = Math.max(0, rms - 0.02);
  return Math.min(1, gated * 9);
}
