import type { VocabEntry } from '../state/GameState';

export type PracticeTopic = 'pronouns' | 'verbs' | 'numbers';
export type PracticeLevel = 'easy' | 'medium' | 'hard';

export const PRACTICE_TITLES: Record<PracticeTopic, { yi: string; pt: string; game: string }> = {
  pronouns: { yi: 'Pronomen', pt: 'Pronomes', game: 'Chão que Cai!' },
  verbs: { yi: 'Vertbn', pt: 'Verbos', game: 'Portas da Resposta!' },
  numbers: { yi: 'Tsifern', pt: 'Números', game: 'Corrida a Cavalo!' },
};

export const LEVEL_LABELS: Record<PracticeLevel, { pt: string; tip: string }> = {
  easy: { pt: 'Fácil', tip: 'Mais tempo · 2 opções' },
  medium: { pt: 'Médio', tip: 'Tempo normal · 3 opções' },
  hard: { pt: 'Difícil', tip: 'Rápido · 4 opções' },
};

export const LEVEL_CFG: Record<
  PracticeLevel,
  { rounds: number; choices: number; timeMs: number }
> = {
  easy: { rounds: 5, choices: 2, timeMs: 5200 },
  medium: { rounds: 6, choices: 3, timeMs: 3600 },
  hard: { rounds: 8, choices: 4, timeMs: 2400 },
};

export type PracticePair = {
  yi: string;
  pt: string;
  hint?: string;
};

export const PRONOUNS: PracticePair[] = [
  { yi: 'ikh', pt: 'eu' },
  { yi: 'du', pt: 'você' },
  { yi: 'er', pt: 'ele' },
  { yi: 'zi', pt: 'ela' },
  { yi: 'mir', pt: 'nós' },
  { yi: 'ir', pt: 'vocês' },
  { yi: 'zey', pt: 'eles / elas' },
  { yi: 'es', pt: 'isso' },
];

export const VERBS: PracticePair[] = [
  { yi: 'zayn', pt: 'ser / estar', hint: 'ikh bin…' },
  { yi: 'hobn', pt: 'ter', hint: 'ikh hob…' },
  { yi: 'geyn', pt: 'ir', hint: 'ikh gey…' },
  { yi: 'kumen', pt: 'vir', hint: 'ikh kum…' },
  { yi: 'redn', pt: 'falar', hint: 'ikh red…' },
  { yi: 'esn', pt: 'comer', hint: 'ikh es…' },
  { yi: 'trinken', pt: 'beber', hint: 'ikh trink…' },
  { yi: 'shlofn', pt: 'dormir', hint: 'ikh shlof…' },
  { yi: 'lernen', pt: 'aprender', hint: 'ikh lern…' },
  { yi: 'helfen', pt: 'ajudar', hint: 'ikh helf…' },
];

export const NUMBERS: PracticePair[] = [
  { yi: 'eyns', pt: '1' },
  { yi: 'tsvey', pt: '2' },
  { yi: 'dray', pt: '3' },
  { yi: 'fir', pt: '4' },
  { yi: 'finf', pt: '5' },
  { yi: 'zeks', pt: '6' },
  { yi: 'zibn', pt: '7' },
  { yi: 'akht', pt: '8' },
  { yi: 'nayn', pt: '9' },
  { yi: 'tsen', pt: '10' },
];

export type ArcadeRound = {
  prompt: string;
  sub: string;
  answer: string;
  choices: string[];
  learn: VocabEntry;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function poolFor(topic: PracticeTopic): PracticePair[] {
  return topic === 'pronouns' ? PRONOUNS : topic === 'verbs' ? VERBS : NUMBERS;
}

/** Rodadas arcade conforme o nível. */
export function buildArcadeRounds(
  topic: PracticeTopic,
  level: PracticeLevel,
): ArcadeRound[] {
  const cfg = LEVEL_CFG[level];
  const pool = poolFor(topic);
  const nChoices = Math.min(cfg.choices, pool.length);
  const picked = shuffle(pool).slice(0, Math.min(cfg.rounds, pool.length));

  return picked.map((item, i) => {
    const yiToPt = i % 2 === 0;
    if (yiToPt) {
      return {
        prompt: item.yi,
        sub:
          topic === 'numbers'
            ? 'Qual número?'
            : topic === 'verbs'
              ? 'O que significa?'
              : 'Quem é?',
        answer: item.pt,
        choices: shuffle([
          item.pt,
          ...shuffle(pool.filter((p) => p !== item))
            .slice(0, nChoices - 1)
            .map((p) => p.pt),
        ]),
        learn: { yiddish: item.yi, portuguese: item.pt },
      };
    }
    return {
      prompt: item.pt,
      sub: 'Como se diz em iídiche?',
      answer: item.yi,
      choices: shuffle([
        item.yi,
        ...shuffle(pool.filter((p) => p !== item))
          .slice(0, nChoices - 1)
          .map((p) => p.yi),
      ]),
      learn: { yiddish: item.yi, portuguese: item.pt },
    };
  });
}

/**
 * Chão que Cai cooperativo — mistura pronomes, verbos e números.
 * Reutiliza o pool se `count` for maior que o vocabulário.
 * Depois da 10ª / 20ª pergunta aumenta o número de opções.
 */
export function buildMixedFallRounds(count = 40, nChoices = 3): ArcadeRound[] {
  const tagged: { topic: PracticeTopic; item: PracticePair }[] = [
    ...PRONOUNS.map((item) => ({ topic: 'pronouns' as const, item })),
    ...VERBS.map((item) => ({ topic: 'verbs' as const, item })),
    ...NUMBERS.map((item) => ({ topic: 'numbers' as const, item })),
  ];
  const out: ArcadeRound[] = [];
  let bag = shuffle(tagged);

  while (out.length < count) {
    if (bag.length === 0) bag = shuffle(tagged);
    const entry = bag.pop()!;
    const { topic, item } = entry;
    const i = out.length;
    const choicesN = Math.min(
      i < 10 ? nChoices : i < 20 ? Math.max(nChoices, 3) : 4,
      poolFor(topic).length,
    );
    const pool = poolFor(topic);
    const yiToPt = i % 2 === 0;
    if (yiToPt) {
      out.push({
        prompt: item.yi,
        sub:
          topic === 'numbers'
            ? 'Qual número?'
            : topic === 'verbs'
              ? 'O que significa?'
              : 'Quem é?',
        answer: item.pt,
        choices: shuffle([
          item.pt,
          ...shuffle(pool.filter((p) => p.yi !== item.yi))
            .slice(0, choicesN - 1)
            .map((p) => p.pt),
        ]),
        learn: { yiddish: item.yi, portuguese: item.pt },
      });
    } else {
      out.push({
        prompt: item.pt,
        sub: 'Como se diz em iídiche?',
        answer: item.yi,
        choices: shuffle([
          item.yi,
          ...shuffle(pool.filter((p) => p.yi !== item.yi))
            .slice(0, choicesN - 1)
            .map((p) => p.yi),
        ]),
        learn: { yiddish: item.yi, portuguese: item.pt },
      });
    }
  }
  return out;
}
