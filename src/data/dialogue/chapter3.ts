import type { DialogueTree } from './chapter1';

/** Cap. 3 — Undzer Shtetl: amizades, sentimentos, Reb Shloyme. */
export const tsipeChapter3: DialogueTree = {
  id: 'tsipe-ch3',
  encounterTitle: 'Tsipe quer falar com você!',
  startId: 'intro',
  turns: {
    intro: {
      id: 'intro',
      kind: 'narration',
      speaker: 'Narrador',
      portuguese: 'Tsipe parece preocupada — e ao mesmo tempo curiosa.',
      next: 'q1',
    },
    q1: {
      id: 'q1',
      kind: 'recognition',
      speaker: 'Tsipe',
      yiddish: 'Ikh bin freylekh, ober oykh tsebrokhn.',
      prompt: 'O que ela está sentindo?',
      next: 'q2',
      options: [
        {
          text: 'Alegre, mas também magoada.',
          correct: true,
          reaction: 'Ela acena. “Du farshtest... a bisl.”',
          suspicionDelta: -5,
          learn: [
            { yiddish: 'freylekh', portuguese: 'alegre / feliz' },
            { yiddish: 'tsebrokhn', portuguese: 'quebrado / magoado' },
          ],
        },
        {
          text: 'Com fome de pão.',
          correct: false,
          reaction: 'Ela balança a cabeça. Não era sobre comida.',
          suspicionDelta: 10,
        },
        {
          text: 'Quer viajar de trem.',
          correct: false,
          reaction: '“Nisht dos...”',
          suspicionDelta: 10,
        },
        {
          text: 'Está com raiva de Rivke.',
          correct: false,
          reaction: 'Tsipe franze a testa. “Neyn.”',
          suspicionDelta: 5,
        },
      ],
    },
    q2: {
      id: 'q2',
      kind: 'response',
      speaker: 'Tsipe',
      yiddish: 'Kenstu mir helfn?',
      portuguese: 'Você pode me ajudar?',
      prompt: 'Como você responde?',
      next: 'end',
      options: [
        {
          text: 'Yo, ikh ken dir helfn.',
          correct: true,
          reaction:
            'Tsipe aperta sua mão. “Gut. Red mit Reb Shloyme. Er veys epes.”',
          suspicionDelta: -10,
          reputationDelta: 12,
          learn: [
            { yiddish: 'helfn', portuguese: 'ajudar' },
            { yiddish: 'kenstu', portuguese: 'você pode' },
          ],
          setFlags: { chapter3Friend: true },
        },
        {
          text: 'Neyn. Ikh hob keyn tsayt.',
          correct: false,
          reaction: 'Ela recua. A amizade esfria um pouco.',
          suspicionDelta: 10,
        },
        {
          text: 'Vos kost es?',
          correct: false,
          reaction: '“Dos iz nisht a biznes...”',
          suspicionDelta: 5,
        },
        {
          text: 'Ikh bin freylekh.',
          correct: false,
          partial: true,
          reaction: 'Ela sorri sem graça. “Gut... ober helfn?”',
          suspicionDelta: 0,
        },
      ],
    },
    end: {
      id: 'end',
      kind: 'narration',
      speaker: 'Narrador',
      portuguese:
        'Tsipe confia em você. Procure Reb Shloyme —\no velho estudioso perto do poço.',
    },
  },
};

export const shloymeChapter3: DialogueTree = {
  id: 'shloyme-ch3',
  encounterTitle: 'Reb Shloyme quer falar com você!',
  startId: 'intro',
  turns: {
    intro: {
      id: 'intro',
      kind: 'narration',
      speaker: 'Narrador',
      portuguese:
        'Um homem de barba branca ergue os olhos do livro. Ele já sabia que você viria.',
      next: 'q1',
    },
    q1: {
      id: 'q1',
      kind: 'response',
      speaker: 'Reb Shloyme',
      yiddish: 'Du redst vi a fremder.',
      portuguese: 'Você fala como um estrangeiro.',
      prompt: 'O que você diz?',
      next: 'q2',
      options: [
        {
          text: 'Ikh lern. Bitte, lern mikh.',
          correct: true,
          reaction: 'Ele fecha o livro. “Azoy. Emess. Du vilst lern — gut.”',
          suspicionDelta: -10,
          reputationDelta: 10,
          learn: [
            { yiddish: 'emess', portuguese: 'verdade' },
            { yiddish: 'azoy', portuguese: 'assim / é assim' },
          ],
        },
        {
          text: 'Neyn. Ikh bin fun do.',
          correct: false,
          reaction: '“Du bist nisht. Dos veys ikh.”',
          suspicionDelta: 15,
        },
        {
          text: 'Vos makhstu?',
          correct: false,
          partial: true,
          reaction: 'Ele ignora a evasiva. “Du redst andersh.”',
          suspicionDelta: 5,
        },
        {
          text: 'Ikh bin a broyt.',
          correct: false,
          reaction: 'Shloyme não ri. O silêncio dói.',
          suspicionDelta: 15,
        },
      ],
    },
    q2: {
      id: 'q2',
      kind: 'recognition',
      speaker: 'Reb Shloyme',
      yiddish: 'In amolike tsaytn iz dos shtetl geven andersh.',
      prompt: 'Do que ele fala?',
      next: 'end',
      options: [
        {
          text: 'De tempos antigos, quando o shtetl era diferente.',
          correct: true,
          reaction:
            '“Yo. Un epes blaybt... a sod. Kum shpeter.” Ele aponta para a hospedaria.',
          suspicionDelta: -5,
          learn: [
            { yiddish: 'amolike tsaytn', portuguese: 'tempos antigos' },
            { yiddish: 'sod', portuguese: 'segredo' },
          ],
          setFlags: { chapter3Shloyme: true },
        },
        {
          text: 'Do preço do pão.',
          correct: false,
          reaction: 'Ele fecha o livro com força.',
          suspicionDelta: 10,
        },
        {
          text: 'Da sua família em Varsóvia.',
          correct: false,
          reaction: '“Nisht Varshe. Undzer shtetl.”',
          suspicionDelta: 10,
        },
        {
          text: 'De um trem que parte amanhã.',
          correct: false,
          reaction: 'Ele balança a cabeça lentamente.',
          suspicionDelta: 5,
        },
      ],
    },
    end: {
      id: 'end',
      kind: 'narration',
      speaker: 'Narrador',
      portuguese:
        'Reb Shloyme sabe mais do que diz.\nDescanso na hospedaria — o Capítulo 3 se fecha.',
    },
  },
};

export const yankevChapter3: DialogueTree = {
  id: 'yankev-ch3',
  encounterTitle: 'Yankev quer falar com você!',
  startId: 'hello',
  turns: {
    hello: {
      id: 'hello',
      kind: 'response',
      speaker: 'Yankev',
      yiddish: 'Du bist shoyn mer vi a gast.',
      portuguese: 'Você já é mais do que um hóspede.',
      prompt: 'Como responde?',
      options: [
        {
          text: 'A dank. Dos bashtayt mir.',
          correct: true,
          reaction: 'Yankev te empurra um pão extra. “Far fraynd!”',
          suspicionDelta: -5,
          reputationDelta: 5,
          learn: [
            { yiddish: 'a dank', portuguese: 'obrigado' },
            { yiddish: 'fraynd', portuguese: 'amigo' },
          ],
        },
        {
          text: 'Ikh vil broyt.',
          correct: false,
          partial: true,
          reaction: 'Ele ri. “Yo, broyt... ober oykh frayndshaft.”',
          suspicionDelta: 0,
        },
        {
          text: 'Du bist a fremder.',
          correct: false,
          reaction: 'O sorriso dele some.',
          suspicionDelta: 10,
        },
        {
          text: '...',
          correct: false,
          reaction: 'Yankev encolhe os ombros.',
          suspicionDelta: 0,
        },
      ],
    },
  },
};

export const rivkeChapter3: DialogueTree = {
  id: 'rivke-ch3',
  encounterTitle: 'Rivke quer falar com você!',
  startId: 'hello',
  turns: {
    hello: {
      id: 'hello',
      kind: 'response',
      speaker: 'Rivke',
      yiddish: 'Di oygn funem shtetl zeen alts.',
      portuguese: 'Os olhos do shtetl veem tudo.',
      prompt: 'Como você reage?',
      options: [
        {
          text: 'Ikh farshtey.',
          correct: true,
          reaction: 'Ela acena. “Dan hit zikh.”',
          suspicionDelta: -5,
          learn: [{ yiddish: 'ikh farshtey', portuguese: 'eu entendo' }],
        },
        {
          text: 'Ikh hob keyn moyre.',
          correct: false,
          reaction: '“Moyre iz klugkayt.”',
          suspicionDelta: 5,
          learn: [{ yiddish: 'moyre', portuguese: 'medo' }],
        },
        {
          text: 'Vos makhstu?',
          correct: false,
          partial: true,
          reaction: 'Ela ignora. O aviso permanece.',
          suspicionDelta: 0,
        },
        {
          text: 'Ikh bin fun do.',
          correct: false,
          reaction: 'O olhar dela corta. “Nokh nisht.”',
          suspicionDelta: 10,
        },
      ],
    },
  },
};
