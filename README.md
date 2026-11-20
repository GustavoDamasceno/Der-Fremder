# DER FREMDER

Aventura 3D no navegador (Vite + TypeScript + Three.js) ambientada num **shtetl** judeu. Você é um *fremder* (estranho) e precisa aprender **iídiche** conversando com os moradores — cada resposta certa baixa a desconfiança; cada erro a sobe.

Além da campanha principal, o jogo inclui **escola com minigames**, **cavalo montável**, **sinagoga entrável**, visual **cartoon/toon**, e uma **biblioteca multiplayer** (voz por proximidade + *Chão que Cai* cooperativo).

---

## Jogar

```bash
npm install
npm run dev
```

Abra o endereço do Vite (geralmente `http://localhost:5173`).

| Script | Uso |
|--------|-----|
| `npm run dev` | Desenvolvimento |
| `npm run build` | Build de produção (`tsc && vite build`) |
| `npm run preview` | Preview do build |

**Biblioteca / microfone:** use `localhost` ou HTTPS e aceite a permissão de mic no navegador. Para multiplayer, abra duas abas (ou dois PCs) com o **mesmo código de sala**.

---

## Controles

| Teclado | Controle Xbox | Efeito |
|---------|---------------|--------|
| WASD / setas | Stick esquerdo / D-pad | Andar |
| Shift | LB / RB | Correr (a pé ou a cavalo) |
| E | A | Falar / interagir / montar·desmontar / entrar·sair |
| Tab | Back (View) | Glossário |
| M | — | Ligar / mutar som |
| Enter | A / Menu | Avançar diálogos e telas |
| A–D ou 1–4 | A / B / X / Y | Escolher resposta / piso / porta |
| ↑↓ / ←→ | D-pad / stick | Destacar opção |
| Esc | B | Fechar glossário / sair de telas |

A câmera é **fixixa** (ângulo 3/4) e segue o personagem. Em interiores fica mais próxima, com limites por cena (sinagoga, escola, biblioteca).

### Celular (paisagem)

Na tela inicial, toque em **Jogar no celular**. Aparece:

- **Joystick** (esquerda) — andar  
- **E** — interagir / falar  
- **OK** — confirmar / avançar telas e diálogos  
- **☰** — glossário  

Gire o aparelho na horizontal. Em alguns navegadores o jogo tenta entrar em tela cheia e travar a orientação.

Conecte o controle por Bluetooth ou USB (Gamepad API; Xbox também via WebHID quando disponível).

---

## Mecânicas principais

- **Desconfiança** — começa em 75%. Respostas corretas baixam; erros sobem. Em **100%** o jogo falha.
- **Reputação** e **Saber** — sobem com boas escolhas e palavras novas aprendidas (HUD).
- **Glossário** — palavras aprendidas em conversas, minigames e no coop (Tab). Começa com *gut*, *a gutn tog*, *vos makhstu?*.
- **Diálogos de história** — avançam os capítulos (Rivke, Yankev, Tsipe, Reb Shloyme).
- **Diálogos laterais** — moradores secundários ensinam vocabulário sem travar a trama (as opções **não** vêm traduzidas — você precisa reconhecer o iídiche).
- **Música** — `bgm.mp3` no shtetl e `shul.mp3` dentro da sinagoga; mute no rodapé ou com **M**. Na **biblioteca** a BGM **pausa** (ambiente multiplayer / voz).

---

## O shtetl

### Espaços ao ar livre

- **Praça** — menorá central, ruas e casas.
- **Hospedaria** — Rivke; ponto de retorno entre capítulos (interação na porta; não é interior walkable).
- **Padaria** — Yankev.
- **Poço** — Reb Shloyme (a partir do cap. 3); fotografia no cap. 4.
- **Mercado (norte)** — barracas e moradores do *mark*.
- **Celeiro e pasto** — celeiro visual, cerca e cavalos decorativos; **um cavalo montável** perto da porta.

### Locais entráveis

| Local | Como entrar / sair | O que tem |
|-------|--------------------|-----------|
| **Sinagoga (*shul*)** | **E** na porta / na saída | Aron HaKodesh, bimá, bancos, sefarim, miniã (10); música `shul` |
| **Escola (*Kheyder*)** | **E** na porta / na saída (oeste do shtetl) | Sala de aula, lousa, carteiras; **Reb Leyzer** e minigames |
| **Biblioteca** | **E** na porta → nome + código da sala; **E** na saída | Salão grande com estantes; **multiplayer** (sem NPCs locais) |

### Cavalo

1. Aproxime-se do cavalo montável e pressione **E**.  
2. Ande com WASD; **Shift** galopa.  
3. **E** de novo para desmontar.  
4. Montado, não dá para entrar em prédios (desça antes).

Passos do cavalo usam o sistema de footsteps com volume ligado ao movimento.

---

## Escola (Kheyder) e prática

A escola fica a **oeste**, afastada da rua. Interior amplo com alunos decorativos e o professor **Reb Leyzer**.

### NPCs ligados à escola

| Personagem | Onde | Função |
|------------|------|--------|
| **Reb Leyzer** | *Dentro* da escola | Abre o menu de prática (minigames arcade) |
| **Itsik** | Fora, perto da escola | Diálogo / quiz de **números** (só conversa, sem minigame) |
| **Golde** | Fora, perto da escola | Diálogo / quiz de **verbos** (só conversa, sem minigame) |

### Minigames (solo, via Leyzer)

Três jogos no estilo arcade, com escolha de dificuldade:

| Tópico | Jogo | O que treina |
|--------|------|--------------|
| Pronomes | **Chão que Cai!** | *ikh, du, er, zi, mir, ir, zey, es* |
| Verbos | **Portas da Resposta!** | *zayn, hobn, geyn, kumen, redn, esn, trinken, shlofn, lernen, helfen* |
| Números | **Corrida a Cavalo!** | *eyns… tsen* (1–10) |

**Dificuldades:**

| Nível | Rodadas | Opções | Tempo por pergunta |
|-------|---------|--------|--------------------|
| Fácil | 5 | 2 | ~5,2 s |
| Médio | 6 | 3 | ~3,6 s |
| Difícil | 8 | 4 | ~2,4 s |

- Alterna perguntas **iídiche → português** e **português → iídiche**.  
- Controles: ← →, **1–4**, **Enter**.  
- No *Chão que Cai*, os pisos errados **caem** e o herói cai se errou.  
- Acertos entram no **glossário**.

---

## Biblioteca multiplayer

Casa grande no **sudeste** do mapa (fora do pasto). Ao entrar:

1. Informe **nome** e **código da sala** (letras, números; salvos no navegador).  
2. Entra no salão 3D; a música do shtetl **para**.  
3. Até **10** jogadores na mesma sala (P2P via **Trystero** / WebRTC).

### Presença e identidade

- Cada pessoa ganha um **casaco de cor única** (paleta compartilhada; o jogo evita colisão de cores).  
- **Name tags** flutuantes com nome, botão de mic e ondas quando alguém fala.  
- Avatares remotos sincronizam posição, direção e animação de caminhada.

### Voz

- Microfone opcional (ícone no nametag ou fluxo da UI).  
- **Voz por proximidade** no salão: volume cheio de perto; some à distância.  
- Quem está **dentro do minigame coop** só ouve os outros jogadores da partida (isolamento); quem ficou só andando na biblioteca não entra nesse canal.

### HUD da biblioteca

- Código da sala e contagem de jogadores (`X/10`).  
- Botão **Chão que Cai** para abrir o lobby do coop.

---

## Chão que Cai · Coop (biblioteca)

Modo **eliminação** jogado na biblioteca (não é o mesmo fluxo da escola, embora o visual dos pisos seja parecido).

### Como funciona

1. Entre no lobby (host marcado com ★).  
2. O anfitrião aperta **Começar**.  
3. Em cada rodada, escolha um **chão** (setas, clique, **1–4**, **Enter**). Dá para **trocar** até o tempo acabar.  
4. Quando o **tempo zera**, os pisos errados **caem**.  
5. Quem estava no certo **fica**; quem errou ou não escolheu é **eliminado**.  
6. O objetivo no multi é **sobrar só um** vencedor.

Marcadores coloridos nos pisos mostram onde cada um está parado. Eliminados ficam cinza no placar e passam a assistir.

### Solo = treino

Dá para jogar **sozinho**. Nesse caso:

- Continua até você **cair** ou acabar o pool de perguntas.  
- **Não há vencedor** — é só para treinar o ritmo e o vocabulário.  
- A tela final fala em “treino”, não em “último de pé”.

Com **2 ou mais** jogadores, vale a regra de eliminação até sobrar um (ou ninguém, se todos caírem na mesma rodada).

### Ondas de dificuldade

Pool grande de perguntas mistas (pronomes + verbos + números), reaproveitando o vocabulário.

| Onda (a cada 10 perguntas) | Tempo aproximado | Opções |
|----------------------------|------------------|--------|
| 1–10 | ~10 s | 3 |
| 11–20 | ~7,5 s | 3+ |
| 21–30 | ~5,5 s | até 4 |
| 31–40 | ~4 s → mín. ~3 s | até 4 |

Depois do resolve (~1 s de animação dos chãos caindo), a próxima rodada começa automaticamente. Vocabulário das perguntas da partida entra no glossário ao terminar.

---

## Capítulos

1. **Der Fremder** — falar com Rivke → conseguir abrigo na hospedaria  
2. **A Gast** — Yankev (pão) + Tsipe (família) → hospedaria  
3. **Undzer Shtetl** — ajudar Tsipe + Reb Shloyme no poço → hospedaria  
4. **Di Geheimnis** — foto no poço → Rivke → Shloyme → hospedaria  
5. **Der Emes** — a verdade com Shloyme → escolha final  

**Finais:** *Fremder*, *Gast*, *Einer fun Undzer*, e o final secreto (dependem de desconfiança, reputação, saber e da escolha de ficar ou partir).

---

## Personagens

### História (principais)

| Personagem | Onde | Papel |
|------------|------|--------|
| **Rivke** | Hospedaria | Dona da hospedaria; porta de entrada e retorno dos capítulos |
| **Yankev** | Padaria | Padeiro; pão, trabalho e vida do shtetl |
| **Tsipe** | Casa leste | Jovem; família, amizade e pedidos de ajuda |
| **Reb Shloyme** | Poço (cap. 3+) | Ancião; segredos, verdade e o desfecho |

### Escola

| Personagem | Onde | Papel |
|------------|------|--------|
| **Reb Leyzer** | Interior da escola | Melamed; abre os minigames de prática |
| **Itsik** | Perto da escola (fora) | Quiz de números em diálogo |
| **Golde** | Perto da escola (fora) | Quiz de verbos em diálogo |

### Sinagoga (miniã — 10)

| Personagem | Papel / vocabulário |
|------------|---------------------|
| **Hazan Hersh** | Cantor na bimá — *shul*, *tallis* |
| **Reb Yankl** | Rabino com o sefer — *sefer toyre*, *heylik* |
| **Yosl** | Baal habayis no banco — *davenen* |
| **Avrom** | No banco — *toyre*, *aron* |
| **Meyer** | No banco — *minyan* |
| **Khayim** | No banco — *bime* |
| **Shmuel** | Em pé junto à bimá — *omeyn* |
| **Velvl** | Em pé junto à bimá — *siddur* |
| **Berish** | Em pé perto da entrada — *brokhe* |
| **Dovid** | Em pé no fundo — *shabes* |

### Rua e praça (ambulantes)

| Personagem | Vocabulário |
|------------|-------------|
| **Mendl** | *vaser*, *a dank*, *a gutn tog* |
| **Khaye** | cumprimentos (*shalom aleykhem*, *a gutn tog*) |
| **Berl** | *yo* / *neyn*, *vi heystu?* |
| **Sora** | *mame* / *tate*, *esn* / *trinken* |
| **Leib** | *gut* / *shlekht*, *hoyz* |
| **Dina** | *gelt*, *zayt azoy gut* |

### Norte / mercado

| Personagem | Papel / vocabulário |
|------------|---------------------|
| **Itsik der Soykher** | Comerciante — *mark*, *koyfn* (não confundir com o Itsik da escola) |
| **Rokhel** | Barraca de frutas — *frukht* |
| **Dr. Moyshe** | Feldsher — *shpitol* |
| **Reb Aron** | Melamed no mercado — *kheyder* |
| **Hershl der Shnayder** | Alfaiate — *shnayder* |
| **Freyde** | Cumprimento — *a gutn morgn* |
| **Motl** | Ajuda / comida — *helf*, *kishke* |

---

## Visual

- Estilo **cartoon / toon**: `MeshToonMaterial` com gradient map, paleta saturada (céu vivo, grama, telhados).  
- Personagens procedurais (rig + walk cycle).  
- Grama dinâmica, sombras suaves, tone mapping ACES.  
- UI arcade com fonte **Press Start 2P**.

---

## Stack e pastas úteis

| Peça | Tecnologia / arquivo |
|------|----------------------|
| Build | **Vite 5** + **TypeScript** |
| Mundo 3D | **Three.js** — `src/world/ShtetlWorld.ts`, `FixedCameraPlayer.ts` |
| Estilo toon | `src/world/cartoonLook.ts` |
| Estado | `src/state/GameState.ts` |
| Diálogos / capítulos | `src/data/dialogue/`, `src/content/chapterFlow.ts` |
| Prática solo | `src/data/practice.ts`, `src/ui/PracticeMinigame.ts` |
| Biblioteca P2P | **Trystero** — `src/net/LibraryRoom.ts`, `LibraryPresence.ts` |
| Coop | `src/net/coopTypes.ts`, `src/ui/CoopFallGame.ts` |
| Áudio | `public/audio/` (`bgm.mp3`, `shul.mp3`) + `SoundManager` |
| Input | teclado, `GamepadInput`, `TouchControls`, `XboxHidBridge` |

---

## Resumo do que é “novo” em relação à campanha base

1. **Escola entrável** com Reb Leyzer e três minigames arcade (níveis fácil / médio / difícil).  
2. **Itsik** e **Golde** fora da escola (diálogos de números e verbos).  
3. **Celeiro**, pasto e **cavalo montável** (galope com Shift).  
4. **Biblioteca multiplayer**: código de sala, casacos únicos, nametags, mic, voz espacial, animação de fala.  
5. **Chão que Cai coop**: eliminação quando o tempo acaba; solo como treino sem vencedor; tempo mais curto a cada 10 perguntas; voz isolada na partida.  
6. Visual **toon/cartoon** em todo o shtetl.  
7. Controles de **celular em paisagem** e refinamentos de interiores (bounds da sinagoga / escola / biblioteca).
