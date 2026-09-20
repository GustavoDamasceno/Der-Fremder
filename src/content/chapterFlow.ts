import type { DialogueTree } from '../data/dialogue/chapter1';
import {
  rivkeChapter1,
  tsipeBrief,
  yankevBrief,
} from '../data/dialogue/chapter1';
import {
  rivkeChapter2,
  tsipeChapter2,
  yankevChapter2,
} from '../data/dialogue/chapter2';
import {
  rivkeChapter3,
  shloymeChapter3,
  tsipeChapter3,
  yankevChapter3,
} from '../data/dialogue/chapter3';
import {
  photoExamine,
  rivkeChapter4,
  shloymeChapter4,
  tsipeChapter4,
  yankevChapter4,
} from '../data/dialogue/chapter4';
import {
  rivkeChapter5,
  shloymeChapter5,
  tsipeChapter5,
  yankevChapter5,
} from '../data/dialogue/chapter5';
import {
  avromChat,
  berishChat,
  berlChat,
  dinaChat,
  dovidChat,
  feldsherChat,
  freydeChat,
  hazanChat,
  khayeChat,
  khayimChat,
  leibChat,
  melamedChat,
  mendlChat,
  meyerChat,
  motlChat,
  ravChat,
  rokhelChat,
  shmuelChat,
  shnayderChat,
  soraChat,
  soykerChat,
  velvlChat,
  yoslChat,
} from '../data/dialogue/villagers';
import { GameState } from '../state/GameState';

export type NpcId =
  | 'rivke'
  | 'yankev'
  | 'tsipe'
  | 'shloyme'
  | 'photo'
  | 'inn'
  | 'synagogue'
  | 'mendl'
  | 'khaye'
  | 'berl'
  | 'sora'
  | 'leib'
  | 'dina'
  | 'hazan'
  | 'yosl'
  | 'avrom'
  | 'rav'
  | 'meyer'
  | 'shmuel'
  | 'velvl'
  | 'berish'
  | 'dovid'
  | 'khayim'
  | 'soyker'
  | 'rokhel'
  | 'feldsher'
  | 'melamed'
  | 'shnayder'
  | 'freyde'
  | 'motl';

/** Moradores secundários — disponíveis em todos os capítulos. */
const SIDE_DIALOGUES: Partial<Record<NpcId, DialogueTree>> = {
  mendl: mendlChat,
  khaye: khayeChat,
  berl: berlChat,
  sora: soraChat,
  leib: leibChat,
  dina: dinaChat,
  hazan: hazanChat,
  yosl: yoslChat,
  avrom: avromChat,
  rav: ravChat,
  meyer: meyerChat,
  shmuel: shmuelChat,
  velvl: velvlChat,
  berish: berishChat,
  dovid: dovidChat,
  khayim: khayimChat,
  soyker: soykerChat,
  rokhel: rokhelChat,
  feldsher: feldsherChat,
  melamed: melamedChat,
  shnayder: shnayderChat,
  freyde: freydeChat,
  motl: motlChat,
};

const DIALOGUES: Record<number, Partial<Record<NpcId, DialogueTree>>> = {
  1: {
    rivke: rivkeChapter1,
    yankev: yankevBrief,
    tsipe: tsipeBrief,
  },
  2: {
    rivke: rivkeChapter2,
    yankev: yankevChapter2,
    tsipe: tsipeChapter2,
  },
  3: {
    rivke: rivkeChapter3,
    yankev: yankevChapter3,
    tsipe: tsipeChapter3,
    shloyme: shloymeChapter3,
  },
  4: {
    rivke: rivkeChapter4,
    yankev: yankevChapter4,
    tsipe: tsipeChapter4,
    shloyme: shloymeChapter4,
    photo: photoExamine,
  },
  5: {
    rivke: rivkeChapter5,
    yankev: yankevChapter5,
    tsipe: tsipeChapter5,
    shloyme: shloymeChapter5,
  },
};

export function getDialogueFor(npcId: NpcId): DialogueTree | null {
  if (SIDE_DIALOGUES[npcId]) return SIDE_DIALOGUES[npcId]!;

  const map = DIALOGUES[GameState.chapter];
  if (!map) return null;

  if (GameState.chapter === 4) {
    if (
      (npcId === 'rivke' || npcId === 'shloyme') &&
      !GameState.flags.chapter4Photo
    ) {
      return null;
    }
  }

  return map[npcId] ?? null;
}

export function chapterObjectiveHint(): string {
  const f = GameState.flags;
  switch (GameState.chapter) {
    case 1:
      if (f.lodgingGranted && !f.chapter1Complete) return 'Objetivo: entrar na hospedaria';
      return 'Objetivo: falar com Rivke';
    case 2:
      if (!f.chapter2Bread) return 'Objetivo: falar com Yankev (padaria)';
      if (!f.chapter2Family) return 'Objetivo: falar com Tsipe sobre família';
      return 'Objetivo: voltar à hospedaria';
    case 3:
      if (!f.chapter3Friend) return 'Objetivo: ajudar Tsipe';
      if (!f.chapter3Shloyme) return 'Objetivo: falar com Reb Shloyme';
      return 'Objetivo: voltar à hospedaria';
    case 4:
      if (!f.chapter4Photo) return 'Objetivo: examinar o objeto perto do poço';
      if (!f.chapter4Letter) return 'Objetivo: Rivke → depois Reb Shloyme';
      return 'Objetivo: voltar à hospedaria';
    case 5:
      if (!f.chapter5Truth || (!f.choseStay && !f.choseLeave)) {
        return 'Objetivo: falar com Reb Shloyme (a verdade)';
      }
      return 'Objetivo: voltar à hospedaria — o final';
    default:
      return '[ Tab ] Glossário   [ E ] Interagir   [ Click ] Olhar';
  }
}

export function chapterBanner(chapter: number): { title: string; body: string } {
  const banners: Record<number, { title: string; body: string }> = {
    1: {
      title: 'CAPÍTULO 1 — DER FREMDER',
      body: 'A praça do shtetl se abre à sua frente.\nVocê não reconhece ninguém — e ninguém parece reconhecê-lo.\n\nAqui, a língua é tudo. Cada resposta em iídiche\npode baixar a desconfiança… ou denunciá-lo como fremder.\n\nFale com Rivke. Peça abrigo. Não erre as palavras.',
    },
    2: {
      title: 'CAPÍTULO 2 — A GAST',
      body: 'Você acordou na hospedaria.\nFale com Yankev na padaria.\nDepois, ouça Tsipe sobre a família.',
    },
    3: {
      title: 'CAPÍTULO 3 — UNDZER SHTETL',
      body: 'Ajude Tsipe.\nDepois fale com Reb Shloyme no poço.\nO shtetl começa a se abrir.',
    },
    4: {
      title: 'CAPÍTULO 4 — DI GEHEIMNIS',
      body: 'Há algo perto do poço...\nUma fotografia.\nMostre a Rivke, depois a Shloyme.',
    },
    5: {
      title: 'CAPÍTULO 5 — DER EMES',
      body: 'A verdade espera com Reb Shloyme.\nEscute. Escolha.\nFicar ou partir.',
    },
  };
  return banners[chapter] ?? banners[1];
}

export function chapterCompleteCopy(chapter: number): {
  he: string;
  yi: string;
  body: string;
} {
  const titles: Record<number, { he: string; yi: string; body: string }> = {
    1: {
      he: 'CAPÍTULO 1',
      yi: 'DER FREMDER',
      body: 'Você conseguiu um teto.\nO shtetl ainda observa.\nAmanhã, a integração começa.',
    },
    2: {
      he: 'CAPÍTULO 2',
      yi: 'A GAST',
      body: 'Você comeu o pão do shtetl.\nOuviu sobre família.\nJá não é só um estranho na porta.',
    },
    3: {
      he: 'CAPÍTULO 3',
      yi: 'UNDZER SHTETL',
      body: 'Amizades se formaram.\nReb Shloyme falou em segredo.\nO shtetl começa a ser seu.',
    },
    4: {
      he: 'CAPÍTULO 4',
      yi: 'DI GEHEIMNIS',
      body: 'A fotografia. A carta.\nUma dobra no tempo.\nVocê não chegou aqui por acaso.',
    },
    5: {
      he: 'CAPÍTULO 5',
      yi: 'DER EMES',
      body: 'A verdade foi dita.\nA escolha foi feita.\nAgora, o final.',
    },
  };
  return titles[chapter] ?? titles[1];
}
