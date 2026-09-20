import type { GameFlags, VocabEntry } from '../../state/GameState';

export type DialogueKind = 'recognition' | 'response' | 'narration' | 'choice';

export interface DialogueOption {
  text: string;
  correct: boolean;
  partial?: boolean;
  reaction: string;
  suspicionDelta: number;
  reputationDelta?: number;
  learn?: VocabEntry[];
  setFlags?: Partial<GameFlags>;
}

export interface DialogueTurn {
  id: string;
  kind: DialogueKind;
  speaker: string;
  yiddish?: string;
  portuguese?: string;
  prompt?: string;
  options?: DialogueOption[];
  /** Próximo turno após narrar OU após escolher uma opção. */
  next?: string;
}

export interface DialogueTree {
  id: string;
  encounterTitle: string;
  startId: string;
  turns: Record<string, DialogueTurn>;
}

export const rivkeChapter1: DialogueTree = {
  id: 'rivke-ch1',
  encounterTitle: 'Rivke quer falar com você!',
  startId: 'intro',
  turns: {
    intro: {
      id: 'intro',
      kind: 'narration',
      speaker: 'Narrador',
      portuguese:
        'Uma senhora de olhar afiado se aproxima. Ela examina você como quem já viu mil forasteiros.',
      next: 'q1',
    },
    q1: {
      id: 'q1',
      kind: 'recognition',
      speaker: 'Rivke',
      yiddish: 'Vos makhstu?',
      prompt: 'O que significa?',
      next: 'q2',
      options: [
        {
          text: 'Onde você mora?',
          correct: false,
          reaction: 'Rivke franze a testa. Isso não era o que ela perguntou.',
          suspicionDelta: 10,
        },
        {
          text: 'Como você está?',
          correct: true,
          reaction: 'Rivke balança a cabeça, quase satisfeita.',
          suspicionDelta: -5,
          learn: [{ yiddish: 'vos makhstu?', portuguese: 'como você está?' }],
        },
        {
          text: 'Qual é o seu nome?',
          correct: false,
          reaction: 'Ela observa em silêncio. Algo nela endurece.',
          suspicionDelta: 10,
        },
        {
          text: 'Para onde você vai?',
          correct: false,
          reaction: 'Rivke suspira. “Nisht dos...” murmura.',
          suspicionDelta: 10,
        },
      ],
    },
    q2: {
      id: 'q2',
      kind: 'response',
      speaker: 'Rivke',
      yiddish: 'Vos makhstu?',
      portuguese: 'Como você está?',
      prompt: 'Como você responde?',
      next: 'q3',
      options: [
        {
          text: 'Ikh bin gut.',
          correct: true,
          reaction: 'Rivke sorri de leve. “Gut.”',
          suspicionDelta: -5,
          learn: [
            { yiddish: 'ikh bin gut', portuguese: 'eu estou bem' },
            { yiddish: 'ikh', portuguese: 'eu' },
          ],
        },
        {
          text: 'Ikh bin a broyt.',
          correct: false,
          reaction: 'Rivke pisca. “Du bist a broyt?!” Ela quase ri — e quase desconfia mais.',
          suspicionDelta: 15,
        },
        {
          text: 'Ikh heys Rivke.',
          correct: false,
          reaction: 'Ela ergue uma sobrancelha. “Ikh heys Rivke. Du... nisht.”',
          suspicionDelta: 10,
        },
        {
          text: 'Ikh voyn in shtetl.',
          correct: false,
          partial: true,
          reaction: 'Resposta estranha para a pergunta — mas pelo menos as palavras soam locais.',
          suspicionDelta: 0,
        },
      ],
    },
    q3: {
      id: 'q3',
      kind: 'recognition',
      speaker: 'Rivke',
      yiddish: 'Vi heystu?',
      prompt: 'O que ela está perguntando?',
      next: 'q4',
      options: [
        {
          text: 'Como você está?',
          correct: false,
          reaction: 'Rivke balança a cabeça, lenta e firme.',
          suspicionDelta: 10,
        },
        {
          text: 'Onde você mora?',
          correct: false,
          reaction: '“Nisht vu... vi heystu.”',
          suspicionDelta: 10,
        },
        {
          text: 'Qual é o seu nome?',
          correct: true,
          reaction: 'Ela aponta para você, esperando a resposta.',
          suspicionDelta: -5,
          learn: [{ yiddish: 'vi heystu?', portuguese: 'qual é o seu nome?' }],
        },
        {
          text: 'Você é de fora?',
          correct: false,
          reaction: 'O olhar dela fica mais afiado.',
          suspicionDelta: 10,
        },
      ],
    },
    q4: {
      id: 'q4',
      kind: 'response',
      speaker: 'Rivke',
      yiddish: 'Vi heystu?',
      portuguese: 'Qual é o seu nome?',
      prompt: 'Como você se apresenta?',
      next: 'lodging',
      options: [
        {
          text: 'Ikh heys Yankev.',
          correct: false,
          reaction: 'Ela aponta para a padaria. “Yankev iz dortn. Du bist nisht Yankev.”',
          suspicionDelta: 10,
        },
        {
          text: 'Ikh bin gut.',
          correct: false,
          reaction: 'Resposta para outra pergunta. Rivke permanece quieta.',
          suspicionDelta: 10,
        },
        {
          text: 'Ikh heys... ikh veys nisht.',
          correct: true,
          reaction:
            'A honestidade desarma Rivke. “Du veys nisht... interessant.” Ela decide te dar uma chance.',
          suspicionDelta: -10,
          reputationDelta: 10,
          learn: [
            { yiddish: 'ikh heys', portuguese: 'eu me chamo' },
            { yiddish: 'ikh veys nisht', portuguese: 'eu não sei' },
          ],
        },
        {
          text: 'Vos makhstu?',
          correct: false,
          reaction: 'Você devolve a pergunta. Rivke não se diverte.',
          suspicionDelta: 5,
        },
      ],
    },
    lodging: {
      id: 'lodging',
      kind: 'narration',
      speaker: 'Rivke',
      yiddish: 'Du kenst shlofn in der kretchme.',
      portuguese:
        'Você pode dormir na hospedaria. Por enquanto. Mas cuidado com as palavras, kind.',
      next: 'end',
    },
    end: {
      id: 'end',
      kind: 'narration',
      speaker: 'Narrador',
      portuguese:
        'Rivke se afasta. Alguém te ofereceu um lugar.\nEncontre a hospedaria na praça.',
    },
  },
};

export const yankevBrief: DialogueTree = {
  id: 'yankev-brief',
  encounterTitle: 'Yankev quer falar com você!',
  startId: 'hello',
  turns: {
    hello: {
      id: 'hello',
      kind: 'response',
      speaker: 'Yankev',
      yiddish: 'A gutn morgn! Du vilst broyt?',
      portuguese: 'Bom dia! Você quer pão?',
      prompt: 'Ele fala rápido. O que você diz?',
      options: [
        {
          text: 'Yo, a broyt, bitte.',
          correct: true,
          reaction: 'Yankev entrega um pão quente. “Gut! Gut!”',
          suspicionDelta: -5,
          reputationDelta: 5,
          learn: [
            { yiddish: 'broyt', portuguese: 'pão' },
            { yiddish: 'a gutn morgn', portuguese: 'bom dia' },
          ],
        },
        {
          text: 'Ikh bin a melkh.',
          correct: false,
          reaction: '“Melkh?! Ha!” Ele ri alto demais. As pessoas olham.',
          suspicionDelta: 10,
        },
        {
          text: 'Vos kost es?',
          correct: true,
          reaction: '“Ah! Du fregst dem prayz. Zeyer gut.”',
          suspicionDelta: -5,
          learn: [{ yiddish: 'vos kost es?', portuguese: 'quanto custa?' }],
        },
        {
          text: '...',
          correct: false,
          partial: true,
          reaction: 'Yankev encolhe os ombros e volta ao forno.',
          suspicionDelta: 0,
        },
      ],
    },
  },
};

export const tsipeBrief: DialogueTree = {
  id: 'tsipe-brief',
  encounterTitle: 'Tsipe quer falar com você!',
  startId: 'hello',
  turns: {
    hello: {
      id: 'hello',
      kind: 'response',
      speaker: 'Tsipe',
      yiddish: 'Sholem aleykhem... du bist nay?',
      portuguese: 'Olá... você é novo?',
      prompt: 'Como você responde?',
      options: [
        {
          text: 'Yo... ikh bin nay.',
          correct: true,
          reaction: 'Tsipe sorri. “Ikh ken dir helfn, az du vilst.”',
          suspicionDelta: -5,
          reputationDelta: 8,
          learn: [
            { yiddish: 'sholem aleykhem', portuguese: 'olá / paz sobre você' },
            { yiddish: 'nay', portuguese: 'novo' },
          ],
        },
        {
          text: 'Neyn. Ikh bin fun do.',
          correct: false,
          reaction: 'Ela inclina a cabeça. Algo nela não acredita — mas não denuncia.',
          suspicionDelta: 5,
        },
        {
          text: 'Vos makhstu?',
          correct: false,
          partial: true,
          reaction: 'Ela ri baixinho. “Ikh bin gut... ober dos iz nisht di frage.”',
          suspicionDelta: 0,
        },
        {
          text: 'Ikh red nisht.',
          correct: false,
          reaction: 'Tsipe fica séria. “Du redst. Ober andersh.”',
          suspicionDelta: 10,
          learn: [{ yiddish: 'ikh red nisht', portuguese: 'eu não falo' }],
        },
      ],
    },
  },
};
