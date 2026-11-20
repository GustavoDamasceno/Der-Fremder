import {
  joinRoom,
  type MessageAction,
  type Room,
  type SharedState,
  type UserState,
} from 'trystero';
import { buildMixedFallRounds } from '../data/practice';
import { normalizeRoomCode, pickFreeCoat } from './libraryColors';
import {
  COOP_QUESTION_POOL,
  COOP_RESOLVE_MS,
  coopRoundMs,
  type CoopMatchSnapshot,
  type CoopPlayerInfo,
  type CoopRoundPayload,
} from './coopTypes';

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
  /** Em partida coop — voz isolada do restante da sala */
  inGame: boolean;
};

type PresenceHandlers = {
  onPresence: (userId: string, state: PeerPresence | null) => void;
  onPeerCount: (count: number) => void;
  onPeerStream: (userId: string, stream: MediaStream | null) => void;
  onError: (message: string) => void;
  onCoopMatch?: (match: CoopMatchSnapshot | null) => void;
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
  private coopState: SharedState<CoopMatchSnapshot | null> | null = null;
  private answerAction: MessageAction<{
    roundIndex: number;
    roundSeq: number;
    choice: number;
  }> | null = null;
  private unsubs: Array<() => void> = [];
  private micStream: MediaStream | null = null;
  private micEnabled = false;
  private localInGame = false;
  private code = '';
  private localName = '';
  private localCoat = 0x8a3c3c;
  private selfUserId = '';
  private handlers: PresenceHandlers | null = null;
  private peerInGame = new Map<string, boolean>();
  private roundTimer: ReturnType<typeof setTimeout> | null = null;
  private advancing = false;

  private audioCtx: AudioContext | null = null;
  private localAnalyser: AnalyserNode | null = null;
  private localMicSource: MediaStreamAudioSourceNode | null = null;
  private localData: Uint8Array | null = null;
  private peerAudio = new Map<string, PeerAudioGraph>();

  get selfId(): string {
    return this.selfUserId;
  }

  get inGame(): boolean {
    return this.localInGame;
  }

  getCoopMatch(): CoopMatchSnapshot | null {
    return this.coopState?.get() ?? null;
  }

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
      inGame: false,
    });
    this.presence = presence;

    this.coopState = room.makeState<CoopMatchSnapshot | null>('coopFall', null);
    this.unsubs.push(
      this.coopState.onChange((value) => {
        handlers.onCoopMatch?.(value);
        if (value?.phase === 'playing' && value.hostId === this.selfUserId) {
          this.ensureHostRoundWatch(value);
        }
      }),
    );

    this.answerAction = room.makeAction<{
      roundIndex: number;
      roundSeq: number;
      choice: number;
    }>('coopAnswer');
    this.unsubs.push(
      this.answerAction.onMessage((data, ctx) => {
        if (this.coopState?.get()?.hostId !== this.selfUserId) return;
        this.hostReceiveAnswer(ctx.userId, data.roundIndex, data.roundSeq, data.choice);
      }),
    );

    await new Promise((r) => setTimeout(r, 400));

    const takenCoats: number[] = [];
    for (const [uid, st] of Object.entries(presence.getAll())) {
      if (uid === this.selfUserId) continue;
      if (st && typeof st.coat === 'number') takenCoats.push(st.coat);
      if (st) this.peerInGame.set(uid, !!st.inGame);
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
      inGame: false,
    });

    this.unsubs.push(
      presence.onChange((value, ctx) => {
        if (ctx.self) return;
        if (ctx.removed || value == null) {
          this.peerInGame.delete(ctx.userId);
          handlers.onPresence(ctx.userId, null);
          this.hostRemovePlayer(ctx.userId);
        } else {
          this.peerInGame.set(ctx.userId, !!value.inGame);
          handlers.onPresence(ctx.userId, value);
        }
        handlers.onPeerCount(this.playerCount);
      }),
    );

    // Hidrata match existente
    handlers.onCoopMatch?.(this.coopState.get());

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
      inGame: this.localInGame,
      ...partial,
    };
    next.name = this.localName;
    next.coat = this.localCoat;
    next.micOn = this.micEnabled;
    next.inGame = this.localInGame;
    void this.presence.set(next);
  }

  // ——— Coop: Chão que Cai ———

  async createOrJoinLobby(): Promise<CoopMatchSnapshot> {
    if (!this.coopState) throw new Error('Sala não conectada.');
    const me: CoopPlayerInfo = {
      id: this.selfUserId,
      name: this.localName,
      coat: this.localCoat,
    };
    const cur = this.coopState.get();
    if (!cur || cur.phase === 'results') {
      const lobby: CoopMatchSnapshot = {
        phase: 'lobby',
        hostId: this.selfUserId,
        players: [me],
        alive: { [this.selfUserId]: true },
        rounds: [],
        roundIndex: 0,
        scores: { [this.selfUserId]: 0 },
        answers: {},
        winnerId: null,
        roundSeq: 0,
        roundMs: coopRoundMs(0),
        deadline: 0,
      };
      await this.coopState.set(lobby);
      await this.setInGame(true);
      return lobby;
    }
    if (cur.phase === 'playing' || cur.phase === 'resolving') {
      throw new Error('Partida em andamento. Espere o fim.');
    }
    if (cur.players.some((p) => p.id === this.selfUserId)) {
      await this.setInGame(true);
      return cur;
    }
    if (cur.players.length >= LIBRARY_MAX_PLAYERS) {
      throw new Error('Lobby cheio (máx. 10).');
    }
    const next: CoopMatchSnapshot = {
      ...cur,
      players: [...cur.players, me],
      alive: { ...cur.alive, [this.selfUserId]: true },
      scores: { ...cur.scores, [this.selfUserId]: 0 },
    };
    await this.coopState.set(next);
    await this.setInGame(true);
    return next;
  }

  async leaveCoop(): Promise<void> {
    this.clearRoundTimer();
    const match = this.coopState?.get();
    await this.setInGame(false);
    if (!match || !this.coopState) return;

    if (match.hostId === this.selfUserId) {
      await this.coopState.set(null);
      return;
    }
    if (match.phase === 'lobby') {
      await this.coopState.set({
        ...match,
        players: match.players.filter((p) => p.id !== this.selfUserId),
      });
    }
  }

  async startCoopMatch(): Promise<void> {
    const match = this.coopState?.get();
    if (!match || !this.coopState) throw new Error('Sem lobby.');
    if (match.hostId !== this.selfUserId) throw new Error('Só o anfitrião inicia.');
    if (match.phase !== 'lobby') throw new Error('Já começou.');
    if (match.players.length < 1) throw new Error('Precisa de jogadores.');

    const arcade = buildMixedFallRounds(COOP_QUESTION_POOL, 3);
    const rounds: CoopRoundPayload[] = arcade.map((r) => ({
      prompt: r.prompt,
      sub: r.sub,
      answer: r.answer,
      choices: r.choices,
      yi: r.learn.yiddish,
      pt: r.learn.portuguese,
    }));
    const scores: Record<string, number> = {};
    const answers: Record<string, number> = {};
    const alive: Record<string, boolean> = {};
    for (const p of match.players) {
      scores[p.id] = 0;
      answers[p.id] = -1;
      alive[p.id] = true;
    }
    const roundMs = coopRoundMs(0);
    const playing: CoopMatchSnapshot = {
      ...match,
      phase: 'playing',
      alive,
      rounds,
      roundIndex: 0,
      scores,
      answers,
      winnerId: null,
      roundSeq: 1,
      roundMs,
      deadline: Date.now() + roundMs,
    };
    await this.coopState.set(playing);
    this.scheduleHostResolve(playing);
  }

  async submitCoopAnswer(choiceIndex: number): Promise<void> {
    const match = this.coopState?.get();
    if (!match || match.phase !== 'playing' || !this.answerAction) return;
    if (!match.alive[this.selfUserId]) return;
    if (!match.players.some((p) => p.id === this.selfUserId)) return;

    // Pode trocar de chão até o tempo acabar.
    if (match.hostId === this.selfUserId) {
      this.hostReceiveAnswer(
        this.selfUserId,
        match.roundIndex,
        match.roundSeq,
        choiceIndex,
      );
    } else {
      await this.answerAction.send({
        roundIndex: match.roundIndex,
        roundSeq: match.roundSeq,
        choice: choiceIndex,
      });
    }
  }

  private async setInGame(on: boolean): Promise<void> {
    this.localInGame = on;
    this.publish({ inGame: on });
  }

  private hostRemovePlayer(userId: string): void {
    const match = this.coopState?.get();
    if (!match || match.hostId !== this.selfUserId) return;
    if (match.phase === 'lobby') {
      void this.coopState!.set({
        ...match,
        players: match.players.filter((p) => p.id !== userId),
      });
    }
  }

  private hostReceiveAnswer(
    userId: string,
    roundIndex: number,
    roundSeq: number,
    choice: number,
  ): void {
    const match = this.coopState?.get();
    if (!match || match.hostId !== this.selfUserId) return;
    if (match.phase !== 'playing') return;
    if (match.roundIndex !== roundIndex || match.roundSeq !== roundSeq) return;
    if (!match.alive[userId]) return;
    if (!match.players.some((p) => p.id === userId)) return;

    const round = match.rounds[match.roundIndex];
    if (!round || choice < 0 || choice >= round.choices.length) return;

    void this.coopState!.set({
      ...match,
      answers: { ...match.answers, [userId]: choice },
    });
  }

  private ensureHostRoundWatch(match: CoopMatchSnapshot): void {
    if (match.hostId !== this.selfUserId || match.phase !== 'playing') return;
    if (this.roundTimer || this.advancing) return;
    this.scheduleHostResolve(match);
  }

  private scheduleHostResolve(match: CoopMatchSnapshot): void {
    this.clearRoundTimer();
    const wait = Math.max(0, match.deadline - Date.now());
    this.roundTimer = setTimeout(() => {
      this.roundTimer = null;
      const cur = this.coopState?.get();
      if (!cur || cur.phase !== 'playing') return;
      if (cur.roundSeq !== match.roundSeq) return;
      this.hostBeginResolve(cur);
    }, wait);
  }

  /** Tempo acabou: chãos caem e quem errou é eliminado. */
  private hostBeginResolve(match: CoopMatchSnapshot): void {
    if (this.advancing) return;
    this.advancing = true;
    this.clearRoundTimer();

    const round = match.rounds[match.roundIndex];
    if (!round || !this.coopState) {
      this.advancing = false;
      return;
    }

    const alive = { ...match.alive };
    const scores = { ...match.scores };
    for (const p of match.players) {
      if (!alive[p.id]) continue;
      const choice = match.answers[p.id] ?? -1;
      const pick = choice >= 0 ? round.choices[choice] : null;
      if (pick === round.answer) {
        scores[p.id] = (scores[p.id] ?? 0) + 1;
      } else {
        alive[p.id] = false;
      }
    }

    const resolving: CoopMatchSnapshot = {
      ...match,
      phase: 'resolving',
      alive,
      scores,
    };
    void this.coopState.set(resolving).finally(() => {
      this.roundTimer = setTimeout(() => {
        this.roundTimer = null;
        this.hostAfterResolve(resolving);
      }, COOP_RESOLVE_MS);
    });
  }

  private hostAfterResolve(match: CoopMatchSnapshot): void {
    if (!this.coopState) {
      this.advancing = false;
      return;
    }

    const survivors = match.players.filter((p) => match.alive[p.id]);
    const solo = match.players.length < 2;

    // Multi: sobrou 0 ou 1 → fim. Solo (treino): só acaba se caiu.
    if (survivors.length === 0 || (!solo && survivors.length === 1)) {
      void this.coopState
        .set({
          ...match,
          phase: 'results',
          winnerId: survivors[0]?.id ?? null,
          answers: {},
        })
        .finally(() => {
          this.advancing = false;
        });
      return;
    }

    const nextIndex = match.roundIndex + 1;
    if (nextIndex >= match.rounds.length) {
      // Acabou o pool: no multi vence o que mais sobreviveu; no solo não há vencedor.
      let winnerId: string | null = null;
      if (!solo) {
        let best = -1;
        for (const p of survivors) {
          const s = match.scores[p.id] ?? 0;
          if (s > best) {
            best = s;
            winnerId = p.id;
          }
        }
      }
      void this.coopState
        .set({
          ...match,
          phase: 'results',
          winnerId,
          answers: {},
        })
        .finally(() => {
          this.advancing = false;
        });
      return;
    }

    const answers: Record<string, number> = {};
    for (const p of match.players) answers[p.id] = -1;
    const roundMs = coopRoundMs(nextIndex);
    const next: CoopMatchSnapshot = {
      ...match,
      phase: 'playing',
      roundIndex: nextIndex,
      roundSeq: match.roundSeq + 1,
      answers,
      roundMs,
      deadline: Date.now() + roundMs,
    };
    void this.coopState.set(next).finally(() => {
      this.advancing = false;
      this.scheduleHostResolve(next);
    });
  }

  private clearRoundTimer(): void {
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = null;
    }
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
      const peerGame = this.peerInGame.get(userId) ?? false;
      let vol = 0;

      // Isolamento: quem joga só ouve quem joga; o resto da sala não ouve o jogo
      if (this.localInGame !== peerGame) {
        vol = 0;
      } else if (this.localInGame) {
        // Dentro do jogo — voz clara entre jogadores
        vol = 1;
      } else {
        const pos = peerPositions.get(userId);
        if (pos) {
          const dx = pos.x - localX;
          const dz = pos.z - localZ;
          vol = proximityVolume(Math.hypot(dx, dz));
        }
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
    this.clearRoundTimer();
    await this.leaveCoop().catch(() => undefined);

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
    this.localInGame = false;
    this.peerInGame.clear();
    this.answerAction = null;
    this.coopState = null;

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
