import type { DialogueTree } from './chapter1';

export const rivkeChapter2: DialogueTree = {
  id: 'rivke-ch2',
  encounterTitle: 'Rivke quer falar com você!',
  startId: 'hello',
  turns: {
    hello: {
      id: 'hello',
      kind: 'response',
      speaker: 'Rivke',
      yiddish: 'Nu? Du lernst?',
      portuguese: 'E então? Você está aprendendo?',
      prompt: 'Como você responde?',
      options: [
        {
          text: 'Yo, ikh lern.',
          correct: true,
          reaction: 'Rivke balança a cabeça. “Gut. Red mit Yankev. Red mit Tsipe.”',
          suspicionDelta: -5,
          learn: [{ yiddish: 'ikh lern', portuguese: 'eu aprendo' }],
        },
        {
          text: 'Neyn.',
          correct: false,
          reaction: 'Ela suspira. “Dan verstu blaybn a fremder.”',
          suspicionDelta: 10,
        },
        {
          text: 'Ikh bin a broyt.',
          correct: false,
          reaction: 'Rivke fecha os olhos. “Nisht vider...”',
          suspicionDelta: 10,
        },
        {
          text: 'Vos makhstu?',
          correct: false,
          partial: true,
          reaction: 'Ela quase sorri. “Ikh bin gut. Ober di frage iz: du lernst?”',
          suspicionDelta: 0,
        },
      ],
    },
  },
};

export const yankevChapter2: DialogueTree = {
  id: 'yankev-ch2',
  encounterTitle: 'Yankev quer falar com você!',
  startId: 'intro',
  turns: {
    intro: {
      id: 'intro',
      kind: 'narration',
      speaker: 'Narrador',
      portuguese:
        'Na padaria, o cheiro de broyt quente preenche o ar. Yankev fala depressa demais.',
      next: 'q1',
    },
    q1: {
      id: 'q1',
      kind: 'recognition',
      speaker: 'Yankev',
      yiddish: 'Du vilst broyt oder melkh?',
      prompt: 'O que ele está perguntando?',
      next: 'q2',
      options: [
        {
          text: 'Você quer pão ou leite?',
          correct: true,
          reaction: 'Yankev aponta para a prateleira. “Yo! Yo!”',
          suspicionDelta: -5,
          learn: [
            { yiddish: 'oder', portuguese: 'ou' },
            { yiddish: 'melkh', portuguese: 'leite' },
          ],
        },
        {
          text: 'Onde mora a sua família?',
          correct: false,
          reaction: 'Ele franze a testa. Isso não era a pergunta.',
          suspicionDelta: 10,
        },
        {
          text: 'Quanto custa o açúcar?',
          correct: false,
          reaction: '“Tsuker? Neyn... broyt oder melkh!”',
          suspicionDelta: 10,
        },
        {
          text: 'Como você se chama?',
          correct: false,
          reaction: 'Yankev bate no peito. “Ikh heys Yankev! Ober dos nisht di frage.”',
          suspicionDelta: 10,
        },
      ],
    },
    q2: {
      id: 'q2',
      kind: 'response',
      speaker: 'Yankev',
      yiddish: 'Vos kost es?',
      portuguese: 'Quanto custa?',
      prompt: 'Ele espera que você compreenda. Como reage?',
      next: 'end',
      options: [
        {
          text: 'Ikh hob nisht keyn gelt.',
          correct: true,
          reaction:
            'Yankev ri. “Iz gut. Far a gast — a broyt umzist.” Ele te dá o pão.',
          suspicionDelta: -5,
          reputationDelta: 8,
          learn: [
            { yiddish: 'gelt', portuguese: 'dinheiro' },
            { yiddish: 'umzist', portuguese: 'de graça' },
          ],
          setFlags: { chapter2Bread: true },
        },
        {
          text: 'Ikh bin a mishpokhe.',
          correct: false,
          reaction: '“Mishpokhe?! Du bist nisht mayn bruder.”',
          suspicionDelta: 10,
        },
        {
          text: 'Tsuker, bitte.',
          correct: false,
          partial: true,
          reaction: 'Ele te dá açúcar... mas não era isso. Pelo menos as palavras soam locais.',
          suspicionDelta: 0,
          learn: [{ yiddish: 'tsuker', portuguese: 'açúcar' }],
          setFlags: { chapter2Bread: true },
        },
        {
          text: 'Ikh heys broyt.',
          correct: false,
          reaction: 'Yankev quase derruba a forma. “Du heyst broyt?! Ha!”',
          suspicionDelta: 15,
        },
      ],
    },
    end: {
      id: 'end',
      kind: 'narration',
      speaker: 'Narrador',
      portuguese:
        'Você segura o pão. A padaria foi o primeiro passo.\nFale com Tsipe sobre a família dela.',
    },
  },
};

export const tsipeChapter2: DialogueTree = {
  id: 'tsipe-ch2',
  encounterTitle: 'Tsipe quer falar com você!',
  startId: 'hello',
  turns: {
    hello: {
      id: 'hello',
      kind: 'response',
      speaker: 'Tsipe',
      yiddish: 'Dos iz mayn mishpokhe.',
      portuguese: 'Esta é a minha família.',
      prompt: 'Como você responde com respeito?',
      next: 'end',
      options: [
        {
          text: 'A sheyne mishpokhe.',
          correct: true,
          reaction:
            'Tsipe sorri. “Du lernst shnel... ober epes iz andersh mit dir.”',
          suspicionDelta: -10,
          reputationDelta: 10,
          learn: [
            { yiddish: 'mishpokhe', portuguese: 'família' },
            { yiddish: 'sheyne', portuguese: 'bonita / bela' },
            { yiddish: 'mame', portuguese: 'mãe' },
            { yiddish: 'tate', portuguese: 'pai' },
          ],
          setFlags: { chapter2Family: true },
        },
        {
          text: 'Ikh bin a broyt.',
          correct: false,
          reaction: 'Ela pisca, confusa. O silêncio fica pesado.',
          suspicionDelta: 10,
        },
        {
          text: 'Vos makhstu?',
          correct: false,
          partial: true,
          reaction: 'Ela ri baixinho. “Ikh bin gut... ober red vegn mishpokhe.”',
          suspicionDelta: 0,
          setFlags: { chapter2Family: true },
        },
        {
          text: 'Du bist a fremder.',
          correct: false,
          reaction: 'Tsipe fica séria. “Neyn. Du bist der fremder.”',
          suspicionDelta: 15,
        },
      ],
    },
    end: {
      id: 'end',
      kind: 'narration',
      speaker: 'Narrador',
      portuguese:
        'Tsipe te aceita um pouco mais. O Capítulo 2 avança.\nVolte à hospedaria quando estiver pronto.',
    },
  },
};
