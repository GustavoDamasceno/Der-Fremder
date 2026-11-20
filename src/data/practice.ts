import type { VocabEntry } from '../state/GameState';

export type PracticeTopic = 'pronouns' | 'verbs' | 'numbers';

export const PRACTICE_TITLES: Record<PracticeTopic, { yi: string; pt: string }> = {
  pronouns: { yi: 'Pronomen', pt: 'Pronomes' },
  verbs: { yi: 'Vertbn', pt: 'Verbos' },
  numbers: { yi: 'Tsifern', pt: 'Números' },
};

export type PracticePair = {
  yi: string;
  pt: string;
  hint?: string;
};

export const PRONOUNS: PracticePair[] = [
  { yi: 'ikh', pt: 'eu' },
  { yi: 'du', pt: 'você (singular)' },
  { yi: 'er', pt: 'ele' },
  { yi: 'zi', pt: 'ela' },
  { yi: 'mir', pt: 'nós' },
  { yi: 'ir', pt: 'vocês' },
  { yi: 'zey', pt: 'eles / elas' },
  { yi: 'es', pt: 'isso / ele (neutro)' },
];

export const VERBS: PracticePair[] = [
  { yi: 'zayn', pt: 'ser / estar', hint: 'ikh bin…' },
  { yi: 'hobn', pt: 'ter', hint: 'ikh hob…' },
  { yi: 'geyn', pt: 'ir / andar', hint: 'ikh gey…' },
  { yi: 'kumen', pt: 'vir', hint: 'ikh kum…' },
  { yi: 'redn', pt: 'falar', hint: 'ikh red…' },
  { yi: 'esn', pt: 'comer', hint: 'ikh es…' },
  { yi: 'trinken', pt: 'beber', hint: 'ikh trink…' },
  { yi: 'shlofn', pt: 'dormir', hint: 'ikh shlof…' },
  { yi: 'lernen', pt: 'aprender / estudar', hint: 'ikh lern…' },
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

export type QuizQuestion = {
  prompt: string;
  sub?: string;
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

function pickDistractors(pool: PracticePair[], correct: PracticePair, n: number, field: 'yi' | 'pt'): string[] {
  const others = shuffle(pool.filter((p) => p !== correct)).slice(0, n);
  return others.map((p) => p[field]);
}

/** Monta perguntas de múltipla escolha a partir do banco. */
export function buildQuiz(topic: PracticeTopic, count = 6): QuizQuestion[] {
  const pool =
    topic === 'pronouns' ? PRONOUNS : topic === 'verbs' ? VERBS : NUMBERS;

  const picked = shuffle(pool).slice(0, Math.min(count, pool.length));
  return picked.map((item, i) => {
    // Alterna direção: iídiche→PT ou PT→iídiche
    const yiToPt = i % 2 === 0;
    if (topic === 'numbers') {
      // Números: sempre "qual palavra?" ou "qual número?"
      if (yiToPt) {
        return {
          prompt: item.yi,
          sub: 'Qual é o número?',
          answer: item.pt,
          choices: shuffle([item.pt, ...pickDistractors(pool, item, 3, 'pt')]),
          learn: { yiddish: item.yi, portuguese: item.pt },
        };
      }
      return {
        prompt: item.pt,
        sub: 'Como se diz em iídiche?',
        answer: item.yi,
        choices: shuffle([item.yi, ...pickDistractors(pool, item, 3, 'yi')]),
        learn: { yiddish: item.yi, portuguese: item.pt },
      };
    }

    if (yiToPt) {
      return {
        prompt: item.yi,
        sub: item.hint ? `Ex.: ${item.hint}` : 'O que significa?',
        answer: item.pt,
        choices: shuffle([item.pt, ...pickDistractors(pool, item, 3, 'pt')]),
        learn: { yiddish: item.yi, portuguese: item.pt },
      };
    }
    return {
      prompt: item.pt,
      sub: 'Como se diz em iídiche?',
      answer: item.yi,
      choices: shuffle([item.yi, ...pickDistractors(pool, item, 3, 'yi')]),
      learn: { yiddish: item.yi, portuguese: item.pt },
    };
  });
}

/** Pares para o jogo da memória (pronomes). */
export function buildMemoryPairs(pairCount = 4): PracticePair[] {
  return shuffle(PRONOUNS).slice(0, pairCount);
}
