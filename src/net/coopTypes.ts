/** Snapshot serializável da partida coop (Chão que Cai — eliminação). */

export type CoopPlayerInfo = {
  id: string;
  name: string;
  coat: number;
};

export type CoopRoundPayload = {
  prompt: string;
  sub: string;
  answer: string;
  choices: string[];
  yi: string;
  pt: string;
};

export type CoopMatchSnapshot = {
  phase: 'lobby' | 'playing' | 'resolving' | 'results';
  hostId: string;
  players: CoopPlayerInfo[];
  /** Quem ainda está no jogo */
  alive: Record<string, boolean>;
  rounds: CoopRoundPayload[];
  roundIndex: number;
  /** Rodadas sobrevivendo */
  scores: Record<string, number>;
  /** Piso escolhido nesta rodada (−1 = sem escolha → cai) */
  answers: Record<string, number>;
  winnerId: string | null;
  /** Sequência da rodada (clientes reiniciam o timer) */
  roundSeq: number;
  /** Duração desta rodada em ms */
  roundMs: number;
  /** Quando a rodada acaba (epoch ms, sincronizado pelo host) */
  deadline: number;
};

/** Tempo para ver os chãos errados caírem. */
export const COOP_RESOLVE_MS = 1100;
/** A cada N perguntas o tempo fica mais curto. */
export const COOP_WAVE_SIZE = 10;
/** Pool grande o bastante para uma partida de eliminação. */
export const COOP_QUESTION_POOL = 40;

/** Tempo da rodada: ondas de 10 perguntas cada vez mais rápidas. */
export function coopRoundMs(roundIndex: number): number {
  const wave = Math.floor(roundIndex / COOP_WAVE_SIZE);
  // 10s → 7.5s → 5.5s → 4s → 3s (mínimo)
  return Math.max(3000, Math.round(10000 - wave * 2000));
}
