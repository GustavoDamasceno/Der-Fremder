import type { DialogueTree } from './chapter1';

/** Cap. 5 — Der Emes: a verdade e a escolha final. */
export const shloymeChapter5: DialogueTree = {
  id: 'shloyme-ch5',
  encounterTitle: 'Reb Shloyme quer falar com você!',
  startId: 'intro',
  turns: {
    intro: {
      id: 'intro',
      kind: 'narration',
      speaker: 'Narrador',
      portuguese:
        'Amanhecer. Shloyme espera no poço. A fotografia está em suas mãos.',
      next: 'q1',
    },
    q1: {
      id: 'q1',
      kind: 'narration',
      speaker: 'Reb Shloyme',
      yiddish: 'Du bist gekumen fun der tsukunft.',
      portuguese:
        'Pessoas caem neste shtetl de outras épocas.\nVocê não pertence a este ano — e mesmo assim está aqui.',
      next: 'q2',
    },
    q2: {
      id: 'q2',
      kind: 'recognition',
      speaker: 'Reb Shloyme',
      yiddish: 'Der emess iz azoy.',
      prompt: 'O que ele está revelando?',
      next: 'q3',
      options: [
        {
          text: 'A verdade: você veio de outro tempo.',
          correct: true,
          reaction: 'Ele acena. O peso da frase assenta.',
          suspicionDelta: -10,
          learn: [{ yiddish: 'der emess iz azoy', portuguese: 'a verdade é assim' }],
          setFlags: { chapter5Truth: true },
        },
        {
          text: 'Que você deve comprar pão.',
          correct: false,
          reaction: '“Nisht broyt. Emess.”',
          suspicionDelta: 5,
          setFlags: { chapter5Truth: true },
        },
        {
          text: 'Que Rivke mentiu.',
          correct: false,
          reaction: '“Rivke hot gevart. Vi mir ale.”',
          suspicionDelta: 5,
          setFlags: { chapter5Truth: true },
        },
        {
          text: 'Que o trem te leva para casa.',
          correct: false,
          reaction: '“Der tsug iz a tir... ober nit di eyntsike.”',
          suspicionDelta: 0,
          setFlags: { chapter5Truth: true },
        },
      ],
    },
    q3: {
      id: 'q3',
      kind: 'choice',
      speaker: 'Reb Shloyme',
      yiddish: 'Blaybstu... oder geystu?',
      portuguese: 'Você fica... ou vai embora?',
      prompt: 'A escolha final:',
      next: 'end',
      options: [
        {
          text: 'Ikh blayb. (Eu fico.)',
          correct: true,
          reaction:
            'Shloyme fecha os olhos. “Dan kum. Di andere vartn.”',
          suspicionDelta: -15,
          reputationDelta: 15,
          learn: [{ yiddish: 'ikh blayb', portuguese: 'eu fico' }],
          setFlags: { choseStay: true },
        },
        {
          text: 'Ikh gey. (Eu vou.)',
          correct: true,
          reaction:
            'Ele não julga. “Der veg tsurik iz ofn. Zay gezunt.”',
          suspicionDelta: 0,
          reputationDelta: 5,
          learn: [{ yiddish: 'ikh gey', portuguese: 'eu vou' }],
          setFlags: { choseLeave: true },
        },
        {
          text: 'Ikh veys nisht.',
          correct: false,
          partial: true,
          reaction: '“Di tsayt vart nisht. Ober mir vartn. A bisl.”',
          suspicionDelta: 0,
        },
        {
          text: 'Vos makhstu?',
          correct: false,
          reaction: 'Mesmo agora? Ele quase ri. “Kleyne frage. Groyse tsayt.”',
          suspicionDelta: 5,
        },
      ],
    },
    end: {
      id: 'end',
      kind: 'narration',
      speaker: 'Narrador',
      portuguese:
        'A escolha está feita.\nVolte à hospedaria — o final te espera.',
    },
  },
};

export const rivkeChapter5: DialogueTree = {
  id: 'rivke-ch5',
  encounterTitle: 'Rivke quer falar com você!',
  startId: 'hello',
  turns: {
    hello: {
      id: 'hello',
      kind: 'response',
      speaker: 'Rivke',
      yiddish: 'Mir hobn gevist.',
      portuguese: 'Nós sabíamos.',
      prompt: 'Como você reage?',
      options: [
        {
          text: 'Fun onheyb?',
          correct: true,
          reaction: '“Fun onheyb. Mir hobn gevart tsu zen vos du tust.”',
          suspicionDelta: -10,
          reputationDelta: 10,
          learn: [{ yiddish: 'fun onheyb', portuguese: 'desde o começo' }],
        },
        {
          text: 'Farvos?!',
          correct: true,
          reaction: '“Vayl a fremder ken vern undzer.”',
          suspicionDelta: -5,
          reputationDelta: 5,
          learn: [{ yiddish: 'farvos', portuguese: 'por quê' }],
        },
        {
          text: 'Ikh bin broyt.',
          correct: false,
          reaction: 'Ela finalmente ri. “Nokh alts?”',
          suspicionDelta: 0,
        },
        {
          text: '...',
          correct: false,
          partial: true,
          reaction: 'O silêncio diz o suficiente.',
          suspicionDelta: 0,
        },
      ],
    },
  },
};

export const tsipeChapter5: DialogueTree = {
  id: 'tsipe-ch5',
  encounterTitle: 'Tsipe quer falar com você!',
  startId: 'hello',
  turns: {
    hello: {
      id: 'hello',
      kind: 'response',
      speaker: 'Tsipe',
      yiddish: 'Vos vestu ton?',
      portuguese: 'O que você vai fazer?',
      prompt: 'Como responde?',
      options: [
        {
          text: 'Ikh blayb bay aykh.',
          correct: true,
          reaction: 'Ela sorri com os olhos molhados. “Gut.”',
          suspicionDelta: -5,
          reputationDelta: 10,
          learn: [{ yiddish: 'bay aykh', portuguese: 'com vocês' }],
        },
        {
          text: 'Ikh muz geyn.',
          correct: true,
          reaction: 'Ela acena. “Ikh farshtey. Zay gezunt.”',
          suspicionDelta: 0,
          reputationDelta: 5,
          learn: [{ yiddish: 'ikh muz geyn', portuguese: 'eu preciso ir' }],
        },
        {
          text: 'Vos makhstu?',
          correct: false,
          partial: true,
          reaction: 'Ela ri baixinho, nervoso. “Ikh bin gut... un tsebrokhn.”',
          suspicionDelta: 0,
        },
        {
          text: 'Ikh veys nisht.',
          correct: false,
          reaction: '“Dan red mit Shloyme.”',
          suspicionDelta: 0,
        },
      ],
    },
  },
};

export const yankevChapter5: DialogueTree = {
  id: 'yankev-ch5',
  encounterTitle: 'Yankev quer falar com você!',
  startId: 'hello',
  turns: {
    hello: {
      id: 'hello',
      kind: 'response',
      speaker: 'Yankev',
      yiddish: 'Broyt far dem veg — oder far der heym.',
      portuguese: 'Pão para a estrada — ou para o lar.',
      prompt: 'O que você aceita?',
      options: [
        {
          text: 'Far der heym. A dank.',
          correct: true,
          reaction: 'Ele embrulha o pão com carinho. “Undzer heym.”',
          suspicionDelta: -5,
          reputationDelta: 8,
          learn: [{ yiddish: 'heym', portuguese: 'lar / casa' }],
        },
        {
          text: 'Far dem veg.',
          correct: true,
          reaction: '“Zay gezunt, kind.”',
          suspicionDelta: 0,
          reputationDelta: 5,
          learn: [{ yiddish: 'veg', portuguese: 'caminho' }],
        },
        {
          text: 'Vos kost es?',
          correct: false,
          reaction: '“Haynt — umzist. Vi tomed.”',
          suspicionDelta: 0,
        },
        {
          text: '...',
          correct: false,
          partial: true,
          reaction: 'Ele deixa o pão na sua mão mesmo assim.',
          suspicionDelta: 0,
        },
      ],
    },
  },
};

/** Final secreto — pergunta depois de tudo. */
export const secretFinale: DialogueTree = {
  id: 'secret-finale',
  encounterTitle: 'O shtetl inteiro escuta...',
  startId: 'q1',
  turns: {
    q1: {
      id: 'q1',
      kind: 'choice',
      speaker: 'Rivke',
      yiddish: 'Farvos bistu geblibn?',
      portuguese: 'Why did you stay? / Por que você ficou?',
      prompt: 'A verdadeira última pergunta:',
      next: 'end',
      options: [
        {
          text: 'Vayl ir zent mayn mishpokhe.',
          correct: true,
          reaction: 'Lágrimas. Sorrisos. “Dan bistu fun do.”',
          suspicionDelta: -20,
          reputationDelta: 20,
          learn: [{ yiddish: 'vayl', portuguese: 'porque' }],
        },
        {
          text: 'Vayl ikh hob gelernt redn.',
          correct: true,
          reaction: 'Shloyme acena. “Di shprakh hot dikh gehaltn.”',
          suspicionDelta: -10,
          reputationDelta: 10,
        },
        {
          text: 'Ikh veys nisht.',
          correct: false,
          partial: true,
          reaction: '“Dos iz oykh an entfer.”',
          suspicionDelta: 0,
        },
        {
          text: 'Vayl dos broyt iz gut.',
          correct: false,
          reaction: 'Yankev explode em gargalhadas. Mesmo assim — eles entendem.',
          suspicionDelta: -5,
          reputationDelta: 5,
        },
      ],
    },
    end: {
      id: 'end',
      kind: 'narration',
      speaker: 'Narrador',
      portuguese: 'O shtetl sabia desde o começo.\nE mesmo assim... te esperou.',
    },
  },
};
