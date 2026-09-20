# DER FREMDER

Aventura 3D no navegador (Vite + TypeScript + Three.js) ambientada num **shtetl** judeu. Você é um *fremder* (estranho) e precisa aprender **iídiche** conversando com os moradores — cada resposta certa baixa a desconfiança; cada erro a sobe.

## Jogar

```bash
npm install
npm run dev
```

Abra o endereço do Vite (geralmente `http://localhost:5173`).

| Script | Uso |
|--------|-----|
| `npm run dev` | Desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |

## Controles

| Teclado | Controle Xbox | Efeito |
|---------|---------------|--------|
| WASD / setas | Stick esquerdo / D-pad | Andar |
| E | A | Falar / interagir |
| Tab | Back (View) | Glossário |
| M | — | Ligar / mutar som |
| Enter | A / Menu | Avançar diálogos e telas |
| A–D ou 1–4 | A / B / X / Y | Escolher resposta |
| ↑↓ / ←→ | D-pad / stick | Destacar resposta |
| Esc | B | Fechar glossário |

Conecte o controle por Bluetooth ou USB (Gamepad API). A câmera é **fixixa** (ângulo 3/4) e segue o personagem.

## Mecânicas

- **Desconfiança** — começa em 75%. Respostas corretas baixam; erros sobem. Em 100% o jogo falha.
- **Glossário** — palavras aprendidas nas conversas (Tab).
- **Diálogos de história** — avançam os capítulos (Rivke, Yankev, Tsipe, Reb Shloyme).
- **Diálogos laterais** — moradores secundários ensinam vocabulário sem travar a trama (as opções de resposta não são traduzidas — você precisa reconhecer o iídiche).
- **Música** — `bgm.mp3` no shtetl e `shul.mp3` dentro da sinagoga; mute no rodapé ou com **M**.

## O shtetl

- **Praça** — menorá central, ruas e casas.
- **Hospedaria** — Rivke; ponto de retorno entre capítulos.
- **Padaria** — Yankev.
- **Poço** — Reb Shloyme (a partir do cap. 3); fotografia no cap. 4.
- **Mercado (norte)** — barracas e moradores do mark.
- **Sinagoga** — entrável; interior com Aron HaKodesh, bimá, bancos, estante de sefarim e miniã completo.

## Capítulos

1. **Der Fremder** — falar com Rivke → conseguir abrigo na hospedaria  
2. **A Gast** — Yankev (pão) + Tsipe (família) → hospedaria  
3. **Undzer Shtetl** — ajudar Tsipe + Reb Shloyme no poço → hospedaria  
4. **Di Geheimnis** — foto no poço → Rivke → Shloyme → hospedaria  
5. **Der Emes** — a verdade com Shloyme → escolha final  

**Finais:** *Fremder*, *Gast*, *Einer fun Undzer*, e o final secreto.

---

## Personagens

### História (principais)

| Personagem | Onde | Papel |
|------------|------|--------|
| **Rivke** | Hospedaria | Dona da hospedaria; porta de entrada e retorno dos capítulos |
| **Yankev** | Padaria | Padeiro; pão, trabalho e vida do shtetl |
| **Tsipe** | Casa leste | Jovem; família, amizade e pedidos de ajuda |
| **Reb Shloyme** | Poço (cap. 3+) | Ancião; segredos, verdade e o desfecho |

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
| **Itsik der Soykher** | Comerciante — *mark*, *koyfn* |
| **Rokhel** | Barraca de frutas — *frukht* |
| **Dr. Moyshe** | Feldsher — *shpitol* |
| **Reb Aron** | Melamed — *kheyder* |
| **Hershl der Shnayder** | Alfaiate — *shnayder* |
| **Freyde** | Cumprimento — *a gutn morgn* |
| **Motl** | Ajuda / comida — *helf*, *kishke* |

---

## Stack

- **Vite** + **TypeScript**
- **Three.js** — mundo 3D, NPCs e cenas (shtetl / shul)
- Áudio local em `public/audio/` (`bgm.mp3`, `shul.mp3`)
