import type { DialogueTree } from './chapter1';

/**
 * Moradores do shtetl — conversas opcionais.
 * Não alteram flags da história; só ensinam iídiche básico e mexem no desconfiômetro.
 */

export const mendlChat: DialogueTree = {
  id: 'mendl-side',
  encounterTitle: 'Mendl quer falar com você!',
  startId: 'q1',
  turns: {
    q1: {
      id: 'q1',
      kind: 'recognition',
      speaker: 'Mendl',
      yiddish: 'Vos iz dos? … Vaser!',
      portuguese: 'Ele aponta o poço e espera você entender a palavra.',
      prompt: 'O que significa vaser?',
      next: 'q2',
      options: [
        {
          text: 'Água',
          correct: true,
          reaction: 'Mendl acena. “Yo. Du trinkst vaser.”',
          suspicionDelta: -2,
          learn: [{ yiddish: 'vaser', portuguese: 'água' }],
        },
        {
          text: 'Pão',
          correct: false,
          reaction: '“Broyt iz broyt. Vaser iz… vaser!” Ele franze a testa.',
          suspicionDelta: 10,
        },
        {
          text: 'Casa',
          correct: false,
          reaction: 'Mendl balança a cabeça. “Neyn… dos iz nisht a hoyz.”',
          suspicionDelta: 10,
        },
        {
          text: 'Dinheiro',
          correct: false,
          reaction: '“Gelt? Ha! Du redst vi a fremder.”',
          suspicionDelta: 12,
        },
      ],
    },
    q2: {
      id: 'q2',
      kind: 'response',
      speaker: 'Mendl',
      yiddish: 'Zog: a dank.',
      portuguese: 'Ele espera, como se quisesse ouvir a resposta certa.',
      prompt: 'Como se diz obrigado?',
      options: [
        {
          text: 'A dank.',
          correct: true,
          reaction: '“Gut! A dank.” Mendl sorri e segue.',
          suspicionDelta: -2,
          learn: [{ yiddish: 'a dank', portuguese: 'obrigado' }],
        },
        {
          text: 'A gutn tog.',
          correct: false,
          partial: true,
          reaction: '“Dos iz ‘bom dia’… ober a dank iz besser.”',
          suspicionDelta: 4,
          learn: [{ yiddish: 'a gutn tog', portuguese: 'um bom dia' }],
        },
        {
          text: 'Sholem.',
          correct: false,
          reaction: 'Ele torce o nariz. “Sholem iz sholem. A dank iz a dank.”',
          suspicionDelta: 10,
        },
        {
          text: 'Thank you.',
          correct: false,
          reaction: 'Mendl recua. “Vos? Du redst goyish?!”',
          suspicionDelta: 14,
        },
      ],
    },
  },
};

export const khayeChat: DialogueTree = {
  id: 'khaye-side',
  encounterTitle: 'Khaye quer falar com você!',
  startId: 'q1',
  turns: {
    q1: {
      id: 'q1',
      kind: 'response',
      speaker: 'Khaye',
      yiddish: 'Sholem aleykhem!',
      portuguese: 'Ela te cumprimenta com um aceno.',
      prompt: 'Como você responde ao cumprimento?',
      next: 'q2',
      options: [
        {
          text: 'Aleykhem sholem!',
          correct: true,
          reaction: 'Khaye aperta as mãos. “Gut, gut.”',
          suspicionDelta: -2,
          learn: [
            { yiddish: 'sholem aleykhem', portuguese: 'olá / paz sobre você' },
            { yiddish: 'aleykhem sholem', portuguese: 'e sobre você, paz' },
          ],
        },
        {
          text: 'Vos makhstu?',
          correct: false,
          partial: true,
          reaction: '“Ershte sholem… dan fregn.” Ela corrige com paciência.',
          suspicionDelta: 5,
        },
        {
          text: 'Hello!',
          correct: false,
          reaction: 'Os olhos dela estreitaram. “Du bist… nisht fun do?”',
          suspicionDelta: 14,
        },
        {
          text: 'Neyn.',
          correct: false,
          reaction: 'Ela pisca. Recusar um sholem? Estranho.',
          suspicionDelta: 10,
        },
      ],
    },
    q2: {
      id: 'q2',
      kind: 'recognition',
      speaker: 'Khaye',
      yiddish: 'A gutn tog.',
      portuguese: 'Ela acena de novo.',
      prompt: 'O que significa a gutn tog?',
      options: [
        {
          text: 'Um bom dia',
          correct: true,
          reaction: '“Yo! A gutn tog.” Khaye segue com o cesto.',
          suspicionDelta: -2,
          learn: [{ yiddish: 'a gutn tog', portuguese: 'um bom dia' }],
        },
        {
          text: 'Boa noite',
          correct: false,
          reaction: '“Dos iz gutn ovnt. Tog iz tog.”',
          suspicionDelta: 10,
          learn: [{ yiddish: 'gutn ovnt', portuguese: 'boa noite / boa tarde' }],
        },
        {
          text: 'Obrigado',
          correct: false,
          reaction: 'Ela balança a cabeça. “A dank iz andersh.”',
          suspicionDelta: 10,
        },
        {
          text: 'Como você está?',
          correct: false,
          reaction: '“Dos iz vos makhstu… nisht a gutn tog.”',
          suspicionDelta: 12,
        },
      ],
    },
  },
};

export const berlChat: DialogueTree = {
  id: 'berl-side',
  encounterTitle: 'Berl quer falar com você!',
  startId: 'q1',
  turns: {
    q1: {
      id: 'q1',
      kind: 'recognition',
      speaker: 'Berl',
      yiddish: 'Yo? Neyn?',
      portuguese: 'O rapaz aponta para um pão na mão e balança a cabeça, esperando.',
      prompt: 'O que significam yo e neyn?',
      next: 'q2',
      options: [
        {
          text: 'Sim e não',
          correct: true,
          reaction: '“Yo!” Berl ri. “Du kenst di vortn.”',
          suspicionDelta: -2,
          learn: [
            { yiddish: 'yo', portuguese: 'sim' },
            { yiddish: 'neyn', portuguese: 'não' },
          ],
        },
        {
          text: 'Olá e tchau',
          correct: false,
          reaction: 'Ele torce a boca. “Neyn… dos iz nisht sholem.”',
          suspicionDelta: 10,
        },
        {
          text: 'Bom e ruim',
          correct: false,
          reaction: '“Gut un shlekht? Neyn. Yo un neyn.”',
          suspicionDelta: 10,
        },
        {
          text: 'Pão e água',
          correct: false,
          reaction: 'Berl ri alto. “Broyt un vaser?! Ha!” Vizinhos olham.',
          suspicionDelta: 12,
        },
      ],
    },
    q2: {
      id: 'q2',
      kind: 'response',
      speaker: 'Berl',
      yiddish: 'Vi heystu?',
      portuguese: 'Ele inclina a cabeça, curioso, e espera sua resposta.',
      prompt: 'O que ele perguntou?',
      options: [
        {
          text: 'Qual é o seu nome?',
          correct: true,
          reaction: '“Gut! Ikh heys Berl.” Ele te cumprimenta de novo.',
          suspicionDelta: -2,
          learn: [{ yiddish: 'vi heystu?', portuguese: 'como você se chama?' }],
        },
        {
          text: 'Onde você mora?',
          correct: false,
          reaction: '“Dos iz vu voynstu… nisht vi heystu.”',
          suspicionDelta: 10,
        },
        {
          text: 'Quantos anos você tem?',
          correct: false,
          reaction: 'Berl pisca. “Ikh bin yung… ober dos iz nisht di frage.”',
          suspicionDelta: 10,
        },
        {
          text: 'Você quer pão?',
          correct: false,
          reaction: 'Ele levanta o pão. “Ikh hob shoyn broyt. Vi heystu?”',
          suspicionDelta: 12,
        },
      ],
    },
  },
};

export const soraChat: DialogueTree = {
  id: 'sora-side',
  encounterTitle: 'Sora quer falar com você!',
  startId: 'q1',
  turns: {
    q1: {
      id: 'q1',
      kind: 'recognition',
      speaker: 'Sora',
      yiddish: 'Mame… tate…',
      portuguese: 'Ela aponta para uma casa e faz dois gestos com a mão.',
      prompt: 'O que significam mame e tate?',
      next: 'q2',
      options: [
        {
          text: 'Mãe e pai',
          correct: true,
          reaction: 'Sora sorri. “Yo. Mayn mame un mayn tate.”',
          suspicionDelta: -2,
          learn: [
            { yiddish: 'mame', portuguese: 'mãe' },
            { yiddish: 'tate', portuguese: 'pai' },
          ],
        },
        {
          text: 'Irmã e irmão',
          correct: false,
          reaction: '“Shvester un bruder… nisht dos.”',
          suspicionDelta: 10,
        },
        {
          text: 'Pão e leite',
          correct: false,
          reaction: 'Ela ri baixinho, mas olha desconfiada.',
          suspicionDelta: 12,
        },
        {
          text: 'Dia e noite',
          correct: false,
          reaction: '“Tog un nakht? Neyn…”',
          suspicionDelta: 10,
        },
      ],
    },
    q2: {
      id: 'q2',
      kind: 'recognition',
      speaker: 'Sora',
      yiddish: 'Ikh vil esn. Ikh vil trinken.',
      portuguese: 'Ela faz de conta que come e bebe.',
      prompt: 'O que significam esn e trinken?',
      options: [
        {
          text: 'Comer e beber',
          correct: true,
          reaction: '“Zeyer gut!” Sora acena e corre para casa.',
          suspicionDelta: -2,
          learn: [
            { yiddish: 'esn', portuguese: 'comer' },
            { yiddish: 'trinken', portuguese: 'beber' },
          ],
        },
        {
          text: 'Andar e correr',
          correct: false,
          reaction: 'Ela balança a cabeça. “Geyn… nisht esn.”',
          suspicionDelta: 10,
        },
        {
          text: 'Falar e ouvir',
          correct: false,
          reaction: '“Redn un hern? Neyn.” Um adulto passa e observa você.',
          suspicionDelta: 12,
        },
        {
          text: 'Dormir e acordar',
          correct: false,
          reaction: 'Sora franze o nariz. “Shlofn iz andersh.”',
          suspicionDelta: 10,
        },
      ],
    },
  },
};

export const leibChat: DialogueTree = {
  id: 'leib-side',
  encounterTitle: 'Leib quer falar com você!',
  startId: 'q1',
  turns: {
    q1: {
      id: 'q1',
      kind: 'recognition',
      speaker: 'Leib',
      yiddish: 'Gut? Oder shlekht?',
      portuguese: 'Ele aponta o céu e espera sua resposta.',
      prompt: 'O que significam gut e shlekht?',
      next: 'q2',
      options: [
        {
          text: 'Bom e ruim',
          correct: true,
          reaction: '“Yo! Haynt iz a guter tog.” Leib segue andando.',
          suspicionDelta: -2,
          learn: [
            { yiddish: 'gut', portuguese: 'bom' },
            { yiddish: 'shlekht', portuguese: 'ruim / mau' },
          ],
        },
        {
          text: 'Grande e pequeno',
          correct: false,
          reaction: '“Groys un kleyn? Neyn…” Ele te olha de lado.',
          suspicionDelta: 10,
        },
        {
          text: 'Quente e frio',
          correct: false,
          reaction: 'Leib balança a cabeça. “Dos iz heys un kalt.”',
          suspicionDelta: 10,
        },
        {
          text: 'Sim e não',
          correct: false,
          reaction: '“Yo un neyn? Nisht dos.” Vizinhos escutam.',
          suspicionDelta: 12,
        },
      ],
    },
    q2: {
      id: 'q2',
      kind: 'recognition',
      speaker: 'Leib',
      yiddish: 'Dort iz a hoyz.',
      portuguese: 'Ele aponta uma casa e deixa a frase no ar.',
      prompt: 'O que significa hoyz?',
      options: [
        {
          text: 'Casa',
          correct: true,
          reaction: '“Gut! A hoyz.” Leib acena e continua o caminho.',
          suspicionDelta: -2,
          learn: [{ yiddish: 'hoyz', portuguese: 'casa' }],
        },
        {
          text: 'Árvore',
          correct: false,
          reaction: '“Boym iz boym. Hoyz iz hoyz.”',
          suspicionDelta: 10,
        },
        {
          text: 'Rua',
          correct: false,
          reaction: '“Gas… ober ikh hob gezogt hoyz.”',
          suspicionDelta: 10,
        },
        {
          text: 'Poço',
          correct: false,
          reaction: 'Ele ri seco. “Du bist a fremder, take.”',
          suspicionDelta: 14,
        },
      ],
    },
  },
};

export const dinaChat: DialogueTree = {
  id: 'dina-side',
  encounterTitle: 'Dina quer falar com você!',
  startId: 'q1',
  turns: {
    q1: {
      id: 'q1',
      kind: 'recognition',
      speaker: 'Dina',
      yiddish: 'Ikh hob gelt.',
      portuguese: 'Ela mostra uma moeda e bate de leve no peito.',
      prompt: 'O que significa gelt?',
      next: 'q2',
      options: [
        {
          text: 'Dinheiro',
          correct: true,
          reaction: '“Yo! Gelt.” Dina guarda a moeda e sorri.',
          suspicionDelta: -2,
          learn: [{ yiddish: 'gelt', portuguese: 'dinheiro' }],
        },
        {
          text: 'Pão',
          correct: false,
          reaction: '“Broyt? Neyn… gelt.” Ela franze a testa.',
          suspicionDelta: 10,
        },
        {
          text: 'Leite',
          correct: false,
          reaction: '“Melkh iz andersh.”',
          suspicionDelta: 10,
        },
        {
          text: 'Amor',
          correct: false,
          reaction: 'Ela ri, depois fica séria. “Libe? Neyn. Gelt.”',
          suspicionDelta: 12,
        },
      ],
    },
    q2: {
      id: 'q2',
      kind: 'response',
      speaker: 'Dina',
      yiddish: 'Zayt azoy gut…',
      portuguese: 'Ela pede com educação, as mãos abertas.',
      prompt: 'O que significa zayt azoy gut?',
      options: [
        {
          text: 'Por favor',
          correct: true,
          reaction: '“Zeyer gut!” Dina acena e segue pela praça.',
          suspicionDelta: -2,
          learn: [{ yiddish: 'zayt azoy gut', portuguese: 'por favor' }],
        },
        {
          text: 'Obrigado',
          correct: false,
          reaction: '“Dos iz a dank… nisht zayt azoy gut.”',
          suspicionDelta: 8,
        },
        {
          text: 'Com licença',
          correct: false,
          partial: true,
          reaction: 'Quase — mas ela corrige: “Zayt azoy gut = bitte.”',
          suspicionDelta: 4,
        },
        {
          text: 'Tchau',
          correct: false,
          reaction: 'Dina recua. “Du redst falsch…”',
          suspicionDelta: 12,
        },
      ],
    },
  },
};

export const hazanChat: DialogueTree = {
  id: 'hazan-side',
  encounterTitle: 'Hazan Hersh quer falar com você!',
  startId: 'q1',
  turns: {
    q1: {
      id: 'q1',
      kind: 'recognition',
      speaker: 'Hazan Hersh',
      yiddish: 'Dos iz di shul.',
      portuguese: 'Ele abre os braços, mostrando o salão da sinagoga.',
      prompt: 'O que significa shul?',
      next: 'q2',
      options: [
        {
          text: 'Sinagoga',
          correct: true,
          reaction: '“Yo. Undzer shul.” Ele aponta o aron.',
          suspicionDelta: 0,
          learn: [{ yiddish: 'shul', portuguese: 'sinagoga' }],
        },
        {
          text: 'Escola',
          correct: false,
          reaction: '“Di shul iz di shul… nisht di shule.”',
          suspicionDelta: 8,
        },
        {
          text: 'Mercado',
          correct: false,
          reaction: 'Ele franze a testa. “Du bist a fremder?”',
          suspicionDelta: 12,
        },
        {
          text: 'Poço',
          correct: false,
          reaction: '“Neyn…” Ele balança a cabeça.',
          suspicionDelta: 10,
        },
      ],
    },
    q2: {
      id: 'q2',
      kind: 'recognition',
      speaker: 'Hazan Hersh',
      yiddish: 'Dos iz a tallis.',
      portuguese: 'Ele toca as faixas brancas do talit nos ombros.',
      prompt: 'O que é um tallis (talit)?',
      options: [
        {
          text: 'Xale de oração',
          correct: true,
          reaction: '“Gut.” Ele volta ao amud.',
          suspicionDelta: 0,
          learn: [{ yiddish: 'tallis', portuguese: 'talit / xale de oração' }],
        },
        {
          text: 'Chapéu',
          correct: false,
          reaction: '“Dos iz a hit… nisht a tallis.”',
          suspicionDelta: 10,
        },
        {
          text: 'Cinto',
          correct: false,
          reaction: 'Ele suspira. “Neyn.”',
          suspicionDelta: 10,
        },
        {
          text: 'Livro',
          correct: false,
          reaction: '“A sefer iz andersh.”',
          suspicionDelta: 12,
        },
      ],
    },
  },
};

export const yoslChat: DialogueTree = {
  id: 'yosl-side',
  encounterTitle: 'Yosl quer falar com você!',
  startId: 'q1',
  turns: {
    q1: {
      id: 'q1',
      kind: 'recognition',
      speaker: 'Yosl',
      yiddish: 'Mir davenen.',
      portuguese: 'Ele murmura e aponta o aron kodesh.',
      prompt: 'O que significa davenen?',
      options: [
        {
          text: 'Rezar / orar',
          correct: true,
          reaction: 'Yosl acena em silêncio e volta ao banco.',
          suspicionDelta: 0,
          learn: [{ yiddish: 'davenen', portuguese: 'rezar / orar' }],
        },
        {
          text: 'Comer',
          correct: false,
          reaction: '“Esn? Neyn. Davenen.”',
          suspicionDelta: 10,
        },
        {
          text: 'Dormir',
          correct: false,
          reaction: 'Ele olha de lado. Estranho.',
          suspicionDelta: 12,
        },
        {
          text: 'Cantar só por diversão',
          correct: false,
          reaction: '“Dos iz ernst.”',
          suspicionDelta: 8,
        },
      ],
    },
  },
};

export const avromChat: DialogueTree = {
  id: 'avrom-side',
  encounterTitle: 'Avrom quer falar com você!',
  startId: 'q1',
  turns: {
    q1: {
      id: 'q1',
      kind: 'recognition',
      speaker: 'Avrom',
      yiddish: 'Der aron… di toyre.',
      portuguese: 'Ele aponta o armário sagrado com respeito.',
      prompt: 'O que é a toyre (Torá)?',
      options: [
        {
          text: 'A Torá / o pergaminho sagrado',
          correct: true,
          reaction: '“Yo.” Avrom baixa a cabeça.',
          suspicionDelta: 0,
          learn: [
            { yiddish: 'toyre', portuguese: 'Torá' },
            { yiddish: 'aron', portuguese: 'aron kodesh / armário sagrado' },
          ],
        },
        {
          text: 'Uma mesa',
          correct: false,
          reaction: '“Neyn… dos iz heylik.”',
          suspicionDelta: 12,
        },
        {
          text: 'Um banco',
          correct: false,
          reaction: 'Ele franze o rosto.',
          suspicionDelta: 10,
        },
        {
          text: 'Um chapéu',
          correct: false,
          reaction: 'Avrom não responde. A desconfiança sobe.',
          suspicionDelta: 14,
        },
      ],
    },
  },
};

export const meyerChat: DialogueTree = {
  id: 'meyer-side',
  encounterTitle: 'Meyer quer falar com você!',
  startId: 'q1',
  turns: {
    q1: {
      id: 'q1',
      kind: 'recognition',
      speaker: 'Meyer',
      yiddish: 'Mir hobn a minyan.',
      portuguese: 'Ele conta os homens nos bancos com o dedo.',
      prompt: 'O que é um minyan?',
      options: [
        {
          text: 'O quórum de dez para rezar',
          correct: true,
          reaction: '“Yo. Tsen yidn.” Ele acena satisfeito.',
          suspicionDelta: 0,
          learn: [{ yiddish: 'minyan', portuguese: 'miniã / quórum de dez' }],
        },
        {
          text: 'Uma festa',
          correct: false,
          reaction: '“A simkhe? Neyn… a minyan.”',
          suspicionDelta: 10,
        },
        {
          text: 'Um banco',
          correct: false,
          reaction: 'Ele balança a cabeça.',
          suspicionDelta: 10,
        },
        {
          text: 'Um chapéu',
          correct: false,
          reaction: '“Neyn.”',
          suspicionDelta: 12,
        },
      ],
    },
  },
};

export const shmuelChat: DialogueTree = {
  id: 'shmuel-side',
  encounterTitle: 'Shmuel quer falar com você!',
  startId: 'q1',
  turns: {
    q1: {
      id: 'q1',
      kind: 'recognition',
      speaker: 'Shmuel',
      yiddish: 'Zog omeyn.',
      portuguese: 'Ele espera o fim da brokhe e olha para você.',
      prompt: 'O que significa omeyn?',
      options: [
        {
          text: 'Amém / assim seja',
          correct: true,
          reaction: '“Omeyn.” Shmuel volta ao siddur.',
          suspicionDelta: 0,
          learn: [{ yiddish: 'omeyn', portuguese: 'amém' }],
        },
        {
          text: 'Olá',
          correct: false,
          reaction: '“Sholem? Neyn… omeyn.”',
          suspicionDelta: 10,
        },
        {
          text: 'Obrigado',
          correct: false,
          reaction: 'Ele franze a testa.',
          suspicionDelta: 10,
        },
        {
          text: 'Adeus',
          correct: false,
          reaction: '“Neyn.”',
          suspicionDelta: 12,
        },
      ],
    },
  },
};

export const velvlChat: DialogueTree = {
  id: 'velvl-side',
  encounterTitle: 'Velvl quer falar com você!',
  startId: 'q1',
  turns: {
    q1: {
      id: 'q1',
      kind: 'recognition',
      speaker: 'Velvl',
      yiddish: 'In mayn siddur.',
      portuguese: 'Ele mostra o livro de orações aberto no colo.',
      prompt: 'O que é um siddur?',
      options: [
        {
          text: 'O livro de orações',
          correct: true,
          reaction: '“Yo.” Ele vira a página com cuidado.',
          suspicionDelta: 0,
          learn: [{ yiddish: 'siddur', portuguese: 'sidur / livro de orações' }],
        },
        {
          text: 'Um jornal',
          correct: false,
          reaction: '“A tsaytung? Neyn.”',
          suspicionDelta: 10,
        },
        {
          text: 'Um mapa',
          correct: false,
          reaction: 'Velvl fecha o livro depressa.',
          suspicionDelta: 12,
        },
        {
          text: 'Uma carta',
          correct: false,
          reaction: '“Neyn… a siddur.”',
          suspicionDelta: 10,
        },
      ],
    },
  },
};

export const berishChat: DialogueTree = {
  id: 'berish-side',
  encounterTitle: 'Berish quer falar com você!',
  startId: 'q1',
  turns: {
    q1: {
      id: 'q1',
      kind: 'recognition',
      speaker: 'Berish',
      yiddish: 'A brokhe.',
      portuguese: 'Ele murmura e ergue um pouco a mão.',
      prompt: 'O que é uma brokhe?',
      options: [
        {
          text: 'Uma bênção',
          correct: true,
          reaction: '“Yo.” Berish baixa a voz de novo.',
          suspicionDelta: 0,
          learn: [{ yiddish: 'brokhe', portuguese: 'bênção' }],
        },
        {
          text: 'Um pão',
          correct: false,
          reaction: '“Broyt? Neyn… a brokhe.”',
          suspicionDelta: 10,
        },
        {
          text: 'Uma dança',
          correct: false,
          reaction: 'Ele olha de lado.',
          suspicionDelta: 12,
        },
        {
          text: 'Uma brincadeira',
          correct: false,
          reaction: '“Dos iz ernst.”',
          suspicionDelta: 10,
        },
      ],
    },
  },
};

export const dovidChat: DialogueTree = {
  id: 'dovid-side',
  encounterTitle: 'Dovid quer falar com você!',
  startId: 'q1',
  turns: {
    q1: {
      id: 'q1',
      kind: 'recognition',
      speaker: 'Dovid',
      yiddish: 'Haynt iz shabes.',
      portuguese: 'Ele aponta o talit e fala baixo.',
      prompt: 'O que é shabes?',
      options: [
        {
          text: 'O shabat / sábado sagrado',
          correct: true,
          reaction: '“Yo. A heylike teg.”',
          suspicionDelta: 0,
          learn: [{ yiddish: 'shabes', portuguese: 'shabat / sábado' }],
        },
        {
          text: 'Uma feira',
          correct: false,
          reaction: '“Der mark? Neyn… shabes.”',
          suspicionDelta: 10,
        },
        {
          text: 'Um jogo',
          correct: false,
          reaction: 'Dovid balança a cabeça.',
          suspicionDelta: 12,
        },
        {
          text: 'Uma viagem',
          correct: false,
          reaction: '“Neyn.”',
          suspicionDelta: 10,
        },
      ],
    },
  },
};

export const khayimChat: DialogueTree = {
  id: 'khayim-side',
  encounterTitle: 'Khayim quer falar com você!',
  startId: 'q1',
  turns: {
    q1: {
      id: 'q1',
      kind: 'recognition',
      speaker: 'Khayim',
      yiddish: 'Di bime.',
      portuguese: 'Ele aponta a plataforma no meio da shul.',
      prompt: 'O que é a bime (bimá)?',
      options: [
        {
          text: 'A plataforma / púlpito da sinagoga',
          correct: true,
          reaction: '“Yo. Der hazan shteyt dortn.”',
          suspicionDelta: 0,
          learn: [{ yiddish: 'bime', portuguese: 'bimá / plataforma' }],
        },
        {
          text: 'A porta',
          correct: false,
          reaction: '“Di tir? Neyn… di bime.”',
          suspicionDelta: 10,
        },
        {
          text: 'O teto',
          correct: false,
          reaction: 'Ele aponta de novo, com paciência.',
          suspicionDelta: 10,
        },
        {
          text: 'Um banco',
          correct: false,
          reaction: '“Neyn.”',
          suspicionDelta: 12,
        },
      ],
    },
  },
};

export const ravChat: DialogueTree = {
  id: 'rav-side',
  encounterTitle: 'Reb Yankl quer falar com você!',
  startId: 'q1',
  turns: {
    q1: {
      id: 'q1',
      kind: 'recognition',
      speaker: 'Reb Yankl',
      yiddish: 'Dos iz a sefer toyre.',
      portuguese: 'Ele segura o rolo com as duas mãos e o ergue um pouco.',
      prompt: 'O que é um sefer toyre?',
      next: 'q2',
      options: [
        {
          text: 'O rolo / livro da Torá',
          correct: true,
          reaction: '“Yo.” Ele aperta o manto azul contra o peito.',
          suspicionDelta: 0,
          learn: [{ yiddish: 'sefer toyre', portuguese: 'rolo da Torá / Sefer Torah' }],
        },
        {
          text: 'Um chapéu de festa',
          correct: false,
          reaction: 'Ele aperta o rolo e franze a testa.',
          suspicionDelta: 14,
        },
        {
          text: 'Um banco da bimá',
          correct: false,
          reaction: '“Neyn…” Ele balança a cabeça.',
          suspicionDelta: 10,
        },
        {
          text: 'Uma menorá',
          correct: false,
          reaction: '“Dos iz di toyre… nisht di menoyre.”',
          suspicionDelta: 12,
        },
      ],
    },
    q2: {
      id: 'q2',
      kind: 'recognition',
      speaker: 'Reb Yankl',
      yiddish: 'Di toyre iz heylik.',
      portuguese: 'Ele baixa o olhar para o pergaminho e fica em silêncio um instante.',
      prompt: 'O que significa heylik?',
      options: [
        {
          text: 'Sagrado / santo',
          correct: true,
          reaction: 'Ele acena e segura o sefer com mais cuidado.',
          suspicionDelta: 0,
          learn: [{ yiddish: 'heylik', portuguese: 'sagrado / santo' }],
        },
        {
          text: 'Pesado',
          correct: false,
          reaction: '“Shver? Neyn… heylik.”',
          suspicionDelta: 10,
        },
        {
          text: 'Novo',
          correct: false,
          reaction: 'Ele suspira. “Neyn.”',
          suspicionDelta: 10,
        },
        {
          text: 'Barato',
          correct: false,
          reaction: 'O olhar dele endurece. A desconfiança sobe.',
          suspicionDelta: 14,
        },
      ],
    },
  },
};

export const soykerChat: DialogueTree = {
  id: 'soyker-side',
  encounterTitle: 'Itsik der Soykher quer falar com você!',
  startId: 'q1',
  turns: {
    q1: {
      id: 'q1',
      kind: 'recognition',
      speaker: 'Itsik der Soykher',
      yiddish: 'Kum tsum mark!',
      portuguese: 'Ele abre os braços mostrando as barracas.',
      prompt: 'O que é o mark?',
      next: 'q2',
      options: [
        {
          text: 'Mercado',
          correct: true,
          reaction: '“Yo! Der mark.” Ele aponta as frutas.',
          suspicionDelta: 0,
          learn: [{ yiddish: 'mark', portuguese: 'mercado' }],
        },
        {
          text: 'Sinagoga',
          correct: false,
          reaction: '“Di shul iz andersh… dos iz der mark.”',
          suspicionDelta: 10,
        },
        {
          text: 'Celeiro',
          correct: false,
          reaction: 'Ele ri. “Neyn, nisht a shtal.”',
          suspicionDelta: 10,
        },
        {
          text: 'Poço',
          correct: false,
          reaction: '“Der brunem? Neyn.”',
          suspicionDelta: 12,
        },
      ],
    },
    q2: {
      id: 'q2',
      kind: 'recognition',
      speaker: 'Itsik der Soykher',
      yiddish: 'Vilstu koyfn?',
      portuguese: 'Ele ergue um caixote e espera sua resposta.',
      prompt: 'O que significa koyfn?',
      options: [
        {
          text: 'Comprar',
          correct: true,
          reaction: '“Gut. Mir koyfn un farkoyfn.”',
          suspicionDelta: 0,
          learn: [{ yiddish: 'koyfn', portuguese: 'comprar' }],
        },
        {
          text: 'Rezar',
          correct: false,
          reaction: '“Davenen? Neyn… koyfn!”',
          suspicionDelta: 10,
        },
        {
          text: 'Dormir',
          correct: false,
          reaction: 'Ele balança a cabeça.',
          suspicionDelta: 10,
        },
        {
          text: 'Cantar',
          correct: false,
          reaction: '“Nisht zingen… koyfn.”',
          suspicionDelta: 12,
        },
      ],
    },
  },
};

export const rokhelChat: DialogueTree = {
  id: 'rokhel-side',
  encounterTitle: 'Rokhel quer falar com você!',
  startId: 'q1',
  turns: {
    q1: {
      id: 'q1',
      kind: 'recognition',
      speaker: 'Rokhel',
      yiddish: 'Dos iz frukht.',
      portuguese: 'Ela mostra a cesta cheia de frutas.',
      prompt: 'O que é frukht?',
      options: [
        {
          text: 'Fruta',
          correct: true,
          reaction: '“Yo.” Ela sorri e segue para outra barraca.',
          suspicionDelta: 0,
          learn: [{ yiddish: 'frukht', portuguese: 'fruta' }],
        },
        {
          text: 'Pão',
          correct: false,
          reaction: '“Broyt iz broyt. Frukht iz frukht.”',
          suspicionDelta: 10,
        },
        {
          text: 'Água',
          correct: false,
          reaction: 'Ela franze a testa.',
          suspicionDelta: 10,
        },
        {
          text: 'Chapéu',
          correct: false,
          reaction: '“A hit? Ha!”',
          suspicionDelta: 12,
        },
      ],
    },
  },
};

export const feldsherChat: DialogueTree = {
  id: 'feldsher-side',
  encounterTitle: 'Dr. Moyshe quer falar com você!',
  startId: 'q1',
  turns: {
    q1: {
      id: 'q1',
      kind: 'recognition',
      speaker: 'Dr. Moyshe',
      yiddish: 'Dos iz der shpitol.',
      portuguese: 'Ele aponta a clínica branca com a cruz vermelha.',
      prompt: 'O que é um shpitol?',
      options: [
        {
          text: 'Hospital / clínica',
          correct: true,
          reaction: '“Yo. Mentshn kumen ven zey zaynen krank.”',
          suspicionDelta: 0,
          learn: [{ yiddish: 'shpitol', portuguese: 'hospital / clínica' }],
        },
        {
          text: 'Mercado',
          correct: false,
          reaction: '“Der mark iz dortn… dos iz der shpitol.”',
          suspicionDelta: 10,
        },
        {
          text: 'Escola',
          correct: false,
          reaction: '“Di shule iz andersh.”',
          suspicionDelta: 10,
        },
        {
          text: 'Padaria',
          correct: false,
          reaction: 'Ele suspira. “Neyn.”',
          suspicionDelta: 12,
        },
      ],
    },
  },
};

export const melamedChat: DialogueTree = {
  id: 'melamed-side',
  encounterTitle: 'Reb Aron quer falar com você!',
  startId: 'q1',
  turns: {
    q1: {
      id: 'q1',
      kind: 'recognition',
      speaker: 'Reb Aron',
      yiddish: 'Dos iz a kheyder.',
      portuguese: 'Ele toca a placa da escola e olha para você.',
      prompt: 'O que é um kheyder (cheder)?',
      options: [
        {
          text: 'Escola / aula de crianças',
          correct: true,
          reaction: '“Yo. Kinder lernen.” Ele acena.',
          suspicionDelta: 0,
          learn: [{ yiddish: 'kheyder', portuguese: 'cheder / escola tradicional' }],
        },
        {
          text: 'Mercado',
          correct: false,
          reaction: '“Neyn… dos iz nisht der mark.”',
          suspicionDelta: 10,
        },
        {
          text: 'Celeiro',
          correct: false,
          reaction: 'Ele franze o rosto.',
          suspicionDelta: 12,
        },
        {
          text: 'Poço',
          correct: false,
          reaction: '“Der brunem iz andersh.”',
          suspicionDelta: 10,
        },
      ],
    },
  },
};

export const shnayderChat: DialogueTree = {
  id: 'shnayder-side',
  encounterTitle: 'Hershl der Shnayder quer falar com você!',
  startId: 'q1',
  turns: {
    q1: {
      id: 'q1',
      kind: 'recognition',
      speaker: 'Hershl der Shnayder',
      yiddish: 'Ikh bin a shnayder.',
      portuguese: 'Ele mostra a agulha e o tecido na oficina.',
      prompt: 'O que é um shnayder?',
      options: [
        {
          text: 'Alfaiate / costureiro',
          correct: true,
          reaction: '“Yo. Ikh shnayd un ney.”',
          suspicionDelta: 0,
          learn: [{ yiddish: 'shnayder', portuguese: 'alfaiate' }],
        },
        {
          text: 'Padeiro',
          correct: false,
          reaction: '“Der beker iz andersh.”',
          suspicionDelta: 10,
        },
        {
          text: 'Médico',
          correct: false,
          reaction: 'Ele balança a cabeça. “Neyn.”',
          suspicionDelta: 10,
        },
        {
          text: 'Rabino',
          correct: false,
          reaction: '“Der rav? Neyn… ikh bin a shnayder.”',
          suspicionDelta: 12,
        },
      ],
    },
  },
};

export const freydeChat: DialogueTree = {
  id: 'freyde-side',
  encounterTitle: 'Freyde quer falar com você!',
  startId: 'q1',
  turns: {
    q1: {
      id: 'q1',
      kind: 'recognition',
      speaker: 'Freyde',
      yiddish: 'A gutn morgn!',
      portuguese: 'Ela te cumprimenta com um sorriso e a cesta no braço.',
      prompt: 'O que significa gutn morgn?',
      options: [
        {
          text: 'Bom dia',
          correct: true,
          reaction: '“Yo! A gutn morgn.”',
          suspicionDelta: 0,
          learn: [{ yiddish: 'a gutn morgn', portuguese: 'bom dia' }],
        },
        {
          text: 'Boa noite',
          correct: false,
          reaction: '“A gute nakht iz bay nakht…”',
          suspicionDelta: 10,
        },
        {
          text: 'Obrigada',
          correct: false,
          reaction: '“Dos iz a dank.”',
          suspicionDelta: 10,
        },
        {
          text: 'Adeus',
          correct: false,
          reaction: 'Ela ri baixinho.',
          suspicionDelta: 12,
        },
      ],
    },
  },
};

export const motlChat: DialogueTree = {
  id: 'motl-side',
  encounterTitle: 'Motl quer falar com você!',
  startId: 'q1',
  turns: {
    q1: {
      id: 'q1',
      kind: 'recognition',
      speaker: 'Motl',
      yiddish: 'Ikh helf in mark!',
      portuguese: 'Ele ergue a caixa e aponta as barracas.',
      prompt: 'O que significa helf?',
      next: 'q2',
      options: [
        {
          text: 'Ajudo / ajudar',
          correct: true,
          reaction: '“Yo — ikh helf dem soykher.”',
          suspicionDelta: 0,
          learn: [{ yiddish: 'helf', portuguese: 'ajudar' }],
        },
        {
          text: 'Durmo',
          correct: false,
          reaction: '“Shlofn? Neyn!”',
          suspicionDelta: 10,
        },
        {
          text: 'Vendo',
          correct: false,
          reaction: '“Farkoyfn? Manchmal… ober ikh helf.”',
          suspicionDelta: 8,
        },
        {
          text: 'Rezo',
          correct: false,
          reaction: 'Ele balança a cabeça.',
          suspicionDelta: 12,
        },
      ],
    },
    q2: {
      id: 'q2',
      kind: 'recognition',
      speaker: 'Motl',
      yiddish: 'Nem di kishke… oy, di kishke!',
      portuguese: 'Ele ri e aponta uma caixa. (Brincadeira de mercado.)',
      prompt: 'kishke aqui é…',
      options: [
        {
          text: 'Um alimento / tripa recheada',
          correct: true,
          reaction: '“Yo! Gut tsu esn.”',
          suspicionDelta: 0,
          learn: [{ yiddish: 'kishke', portuguese: 'kishke (tripa recheada)' }],
        },
        {
          text: 'Um chapéu',
          correct: false,
          reaction: '“A hit? Ha!”',
          suspicionDelta: 10,
        },
        {
          text: 'Uma casa',
          correct: false,
          reaction: 'Ele ri mais alto.',
          suspicionDelta: 10,
        },
        {
          text: 'Um livro',
          correct: false,
          reaction: '“Neyn…”',
          suspicionDelta: 12,
        },
      ],
    },
  },
};
