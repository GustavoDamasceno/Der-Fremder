import type { DialogueTree } from './chapter1';

/** Cap. 4 — Di Geheimnis: fotografia, carta, anomalia. */
export const photoExamine: DialogueTree = {
  id: 'photo-ch4',
  encounterTitle: 'Você encontrou algo...',
  startId: 'intro',
  turns: {
    intro: {
      id: 'intro',
      kind: 'narration',
      speaker: 'Narrador',
      portuguese:
        'Perto do poço, uma fotografia antiga está presa sob uma pedra.\nVários moradores. No canto — um jovem idêntico a você.',
      next: 'q1',
    },
    q1: {
      id: 'q1',
      kind: 'recognition',
      speaker: 'Narrador',
      yiddish: 'Di alte fotografye',
      prompt: 'O que você encontrou?',
      next: 'end',
      options: [
        {
          text: 'Uma fotografia antiga.',
          correct: true,
          reaction:
            'O rosto no papel é o seu. A data parece... décadas atrás.\nImpossível.',
          suspicionDelta: -5,
          learn: [
            { yiddish: 'fotografye', portuguese: 'fotografia' },
            { yiddish: 'alt', portuguese: 'velho / antigo' },
          ],
          setFlags: { chapter4Photo: true },
        },
        {
          text: 'Um mapa do trem.',
          correct: false,
          reaction: 'Não. É um rosto. O seu.',
          suspicionDelta: 0,
          setFlags: { chapter4Photo: true },
        },
        {
          text: 'Uma receita de pão.',
          correct: false,
          reaction: 'Você pisca. É uma foto. Com você nela.',
          suspicionDelta: 0,
          setFlags: { chapter4Photo: true },
        },
        {
          text: 'Nada importante.',
          correct: false,
          reaction: 'Mas suas mãos tremem. Você sabe que é importante.',
          suspicionDelta: 5,
          setFlags: { chapter4Photo: true },
        },
      ],
    },
    end: {
      id: 'end',
      kind: 'narration',
      speaker: 'Narrador',
      portuguese:
        'Mostre a fotografia a Rivke.\nEla conhece cada rosto deste lugar.',
    },
  },
};

export const rivkeChapter4: DialogueTree = {
  id: 'rivke-ch4',
  encounterTitle: 'Rivke quer falar com você!',
  startId: 'intro',
  turns: {
    intro: {
      id: 'intro',
      kind: 'narration',
      speaker: 'Narrador',
      portuguese: 'Você estende a fotografia. Rivke empalidece.',
      next: 'q1',
    },
    q1: {
      id: 'q1',
      kind: 'response',
      speaker: 'Rivke',
      yiddish: 'Dos ken nisht zayn...',
      portuguese: 'Isso não pode ser...',
      prompt: 'O que você pergunta?',
      next: 'q2',
      options: [
        {
          text: 'Ver iz dos?',
          correct: true,
          reaction: 'Ela engole em seco. “Dos bist... du. Ober amol.”',
          suspicionDelta: -5,
          learn: [{ yiddish: 'ver iz dos?', portuguese: 'quem é esse?' }],
        },
        {
          text: 'Vos kost es?',
          correct: false,
          reaction: '“Nisht gelt! A sod!”',
          suspicionDelta: 10,
        },
        {
          text: 'Ikh bin gut.',
          correct: false,
          reaction: 'Ela não responde à frase vazia.',
          suspicionDelta: 5,
        },
        {
          text: 'A sheyne mishpokhe.',
          correct: false,
          partial: true,
          reaction: '“Mishpokhe... yo. Ober oykh a sod.”',
          suspicionDelta: 0,
        },
      ],
    },
    q2: {
      id: 'q2',
      kind: 'narration',
      speaker: 'Rivke',
      yiddish: 'Nem di briv.',
      portuguese: 'Ela te entrega uma carta amarelada. “Leyen. Bay Shloyme.”',
      next: 'end',
    },
    end: {
      id: 'end',
      kind: 'narration',
      speaker: 'Narrador',
      portuguese:
        'A carta queima na sua mão.\nLeve-a a Reb Shloyme.',
      // flag set when arriving - actually set via option. Set on q2 via engine when leaving rivke?
    },
  },
};

export const shloymeChapter4: DialogueTree = {
  id: 'shloyme-ch4',
  encounterTitle: 'Reb Shloyme quer falar com você!',
  startId: 'intro',
  turns: {
    intro: {
      id: 'intro',
      kind: 'narration',
      speaker: 'Narrador',
      portuguese: 'Shloyme lê a carta sem surpresa. Como se esperasse há anos.',
      next: 'q1',
    },
    q1: {
      id: 'q1',
      kind: 'recognition',
      speaker: 'Reb Shloyme',
      yiddish: 'Dos shtetl hot a kerung fun der tsayt.',
      prompt: 'O que a carta / ele sugere?',
      next: 'q2',
      options: [
        {
          text: 'O shtetl tem uma dobra no tempo.',
          correct: true,
          reaction: '“Emess. Mentshn kumen fun andere yorn.”',
          suspicionDelta: -10,
          reputationDelta: 8,
          learn: [
            { yiddish: 'tsayt', portuguese: 'tempo' },
            { yiddish: 'kerung', portuguese: 'dobra / virada' },
          ],
        },
        {
          text: 'O pão está envenenado.',
          correct: false,
          reaction: 'Ele quase ri. “Nisht broyt. Tsayt.”',
          suspicionDelta: 10,
        },
        {
          text: 'Você deve fugir de trem.',
          correct: false,
          reaction: '“Der tsug ken nisht aroysfirn dos.”',
          suspicionDelta: 5,
        },
        {
          text: 'Rivke inventou tudo.',
          correct: false,
          reaction: '“Rivke redt emess.”',
          suspicionDelta: 10,
        },
      ],
    },
    q2: {
      id: 'q2',
      kind: 'response',
      speaker: 'Reb Shloyme',
      yiddish: 'Du bist gekumen fun der tsukunft.',
      portuguese: 'Você veio do futuro.',
      prompt: 'Como você responde?',
      next: 'end',
      options: [
        {
          text: 'Dos iz der emess?',
          correct: true,
          reaction:
            'Ele acena. “Morgn — der emess. Shlof. Di tsayt vart.”',
          suspicionDelta: -10,
          reputationDelta: 10,
          learn: [
            { yiddish: 'tsukunft', portuguese: 'futuro' },
            { yiddish: 'der emess', portuguese: 'a verdade' },
          ],
          setFlags: { chapter4Letter: true },
        },
        {
          text: 'Neyn. Dos iz meshuge.',
          correct: false,
          reaction: '“Meshuge... oder emess. Du vest zen.”',
          suspicionDelta: 5,
          learn: [{ yiddish: 'meshuge', portuguese: 'louco' }],
          setFlags: { chapter4Letter: true },
        },
        {
          text: 'Ikh vil broyt.',
          correct: false,
          reaction: 'Ele suspira. “Shpeter. Ietzt — farshtay.”',
          suspicionDelta: 5,
          setFlags: { chapter4Letter: true },
        },
        {
          text: '...',
          correct: false,
          partial: true,
          reaction: 'O silêncio confirma o que você já sentia.',
          suspicionDelta: 0,
          setFlags: { chapter4Letter: true },
        },
      ],
    },
    end: {
      id: 'end',
      kind: 'narration',
      speaker: 'Narrador',
      portuguese:
        'O segredo do shtetl está aberto.\nVolte à hospedaria. Amanhã vem a verdade.',
    },
  },
};

export const tsipeChapter4: DialogueTree = {
  id: 'tsipe-ch4',
  encounterTitle: 'Tsipe quer falar com você!',
  startId: 'hello',
  turns: {
    hello: {
      id: 'hello',
      kind: 'response',
      speaker: 'Tsipe',
      yiddish: 'Ikh hob gezen di fotografye...',
      portuguese: 'Eu vi a fotografia...',
      prompt: 'O que você diz?',
      options: [
        {
          text: 'Ikh farshtey nisht.',
          correct: true,
          reaction: 'Ela segura sua mão. “Ikh oykh nisht. Ober ikh blayb.”',
          suspicionDelta: -5,
          reputationDelta: 8,
          learn: [{ yiddish: 'ikh farshtey nisht', portuguese: 'eu não entendo' }],
        },
        {
          text: 'Dos bist du.',
          correct: false,
          reaction: '“Neyn... dos bist du.”',
          suspicionDelta: 5,
        },
        {
          text: 'A dank.',
          correct: false,
          partial: true,
          reaction: 'Ela acena, sem palavras.',
          suspicionDelta: 0,
        },
        {
          text: 'Du bist a fremder.',
          correct: false,
          reaction: 'Lágrimas. “Neyn...”',
          suspicionDelta: 10,
        },
      ],
    },
  },
};

export const yankevChapter4: DialogueTree = {
  id: 'yankev-ch4',
  encounterTitle: 'Yankev quer falar com você!',
  startId: 'hello',
  turns: {
    hello: {
      id: 'hello',
      kind: 'response',
      speaker: 'Yankev',
      yiddish: 'Di velt iz groyser vi broyt.',
      portuguese: 'O mundo é maior do que o pão.',
      prompt: 'Como responde?',
      options: [
        {
          text: 'Yo. Ober broyt halt undz.',
          correct: true,
          reaction: 'Ele ri alto. “Azoy redt a mentsh!”',
          suspicionDelta: -5,
          reputationDelta: 5,
          learn: [{ yiddish: 'velt', portuguese: 'mundo' }],
        },
        {
          text: 'Ikh vil melkh.',
          correct: false,
          partial: true,
          reaction: 'Ele te serve leite. Mas o olhar é sério.',
          suspicionDelta: 0,
        },
        {
          text: 'Neyn.',
          correct: false,
          reaction: 'Yankev fica quieto — raro nele.',
          suspicionDelta: 5,
        },
        {
          text: 'Vos kost es?',
          correct: false,
          reaction: '“Haynt kost emess.”',
          suspicionDelta: 5,
        },
      ],
    },
  },
};
