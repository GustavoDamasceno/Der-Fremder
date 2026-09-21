import type { DialogueTree } from '../data/dialogue/chapter1';
import { DialogueEngine } from '../systems/DialogueEngine';
import { GameState, type EndingId } from '../state/GameState';
import { secretFinale } from '../data/dialogue/chapter5';
import {
  chapterBanner,
  chapterCompleteCopy,
} from '../content/chapterFlow';
import { GP, type GamepadInput } from '../input/GamepadInput';
import type { TouchControls } from '../input/TouchControls';
import { SoundManager } from '../audio/SoundManager';

const ENDINGS: Record<
  EndingId,
  { yi: string; pt: string; color: string; body: string }
> = {
  fremder: {
    yi: 'Du bist a fremder.',
    pt: 'Você é um estranho.',
    color: '#a83c3c',
    body: 'O shtetl fechou as portas.\nAs palavras não bastaram.',
  },
  gast: {
    yi: 'Er iz a gast.',
    pt: 'Ele é um hóspede.',
    color: '#c9a227',
    body: 'Eles sabem que você não é daqui.\nMesmo assim, deixam você partir — ou ficar à margem.',
  },
  einer: {
    yi: 'Er iz fun do.',
    pt: 'Ele é daqui.',
    color: '#a8c97a',
    body: 'Você aprendeu a língua.\nFez amizades.\nO shtetl te reconhece.',
  },
  secret: {
    yi: 'Mir hobn gevist.',
    pt: 'Nós sabíamos.',
    color: '#c9a227',
    body: 'Desde o começo.\nRivke, Yankev, Tsipe, Shloyme.\nEles esperavam ver o que você faria.',
  },
};

export type UiMode =
  | 'title'
  | 'banner'
  | 'playing'
  | 'dialogue'
  | 'glossary'
  | 'chapterComplete'
  | 'gameOver'
  | 'ending'
  | 'secretEnd';

type Handlers = {
  onStartGame: (opts?: { mobile?: boolean }) => void;
  onBannerClosed: () => void;
  onChapterContinue: () => void;
  onDialogueFinished: () => void;
  onRequestTitle: () => void;
  onSecretDialogue: () => void;
};

export class UiController {
  private root: HTMLElement;
  private mode: UiMode = 'title';
  private engine: DialogueEngine | null = null;
  private npcId = '';
  private fromSecret = false;
  private phase: 'turn' | 'reaction' | 'closing' = 'turn';
  private pendingDone = false;
  private handlers: Handlers;
  private selectedOption = 0;
  private optionCount = 0;
  private padNavUntil = 0;
  /** Trava A/Enter no UI até soltar (evita double-fire). */
  private uiConfirmHeld = false;

  private screenEl!: HTMLElement;
  private hudEl!: HTMLElement;
  private hintEl!: HTMLElement;
  private dialogueEl!: HTMLElement;
  private reactionEl!: HTMLElement;
  private glossaryEl!: HTMLElement;
  private lockHintEl!: HTMLElement;
  private crosshairEl!: HTMLElement;
  private touch: TouchControls | null = null;

  constructor(root: HTMLElement, handlers: Handlers) {
    this.root = root;
    this.handlers = handlers;
    this.build();
    this.bindKeys();
    this.showTitle();
  }

  setTouch(touch: TouchControls): void {
    this.touch = touch;
    touch.mount(this.root);
  }

  get currentMode(): UiMode {
    return this.mode;
  }

  private build(): void {
    this.root.innerHTML = `
      <button type="button" class="sound-toggle" id="sound-toggle" title="Som (M)">Som: ligado</button>
      <div class="crosshair hidden" id="crosshair"></div>
      <div class="hud hidden" id="hud">
        <div class="hud-bar-wrap">
          <div class="hud-bar"><i id="sus-fill"></i></div>
          <span id="sus-text">Desconfiança 15%</span>
        </div>
        <span class="hud-controls" id="lock-hint">WASD / stick · E / A interagir · Tab / Back glossário · M som</span>
        <div class="hud-right">
          <span id="know-text">Saber 0%</span>
          <span class="pad-status hidden" id="pad-status"></span>
        </div>
      </div>
      <div class="hint hidden" id="hint"></div>
      <div class="dialogue hidden" id="dialogue">
        <div class="status" id="dlg-status"></div>
        <div class="speaker" id="dlg-speaker"></div>
        <div class="body" id="dlg-body"></div>
        <div class="prompt-line" id="dlg-prompt"></div>
        <div class="options" id="dlg-options"></div>
      </div>
      <div class="reaction hidden" id="reaction"></div>
      <div class="glossary hidden" id="glossary">
        <h2>Glossário de Iídiche</h2>
        <ul id="glossary-list"></ul>
        <div class="close-tip">[ Tab ] / [ Esc ] Fechar</div>
      </div>
      <div class="screen" id="screen"></div>
    `;

    this.screenEl = this.$('screen');
    this.hudEl = this.$('hud');
    this.hintEl = this.$('hint');
    this.dialogueEl = this.$('dialogue');
    this.reactionEl = this.$('reaction');
    this.glossaryEl = this.$('glossary');
    this.lockHintEl = this.$('lock-hint');
    this.crosshairEl = this.$('crosshair');

    const soundBtn = this.$('sound-toggle');
    soundBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      SoundManager.get().toggle();
    });
    SoundManager.get().onChange((on) => {
      soundBtn.textContent = on ? 'Som: ligado' : 'Som: mudo';
      soundBtn.classList.toggle('muted', !on);
      soundBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  private $(id: string): HTMLElement {
    return this.root.querySelector(`#${id}`) as HTMLElement;
  }

  private bindKeys(): void {
    window.addEventListener('keydown', (e) => {
      // Ignora repeat do teclado — evitava avançar/reabrir diálogo sozinho
      if (e.repeat) return;

      if (this.mode === 'dialogue' && this.phase === 'turn' && this.engine?.isChoiceTurn()) {
        if (e.code === 'ArrowUp' || e.code === 'ArrowLeft') {
          e.preventDefault();
          this.moveOption(-1);
          return;
        }
        if (e.code === 'ArrowDown' || e.code === 'ArrowRight') {
          e.preventDefault();
          this.moveOption(1);
          return;
        }
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          this.confirmOption();
          return;
        }
        const map: Record<string, number> = {
          Digit1: 0,
          Digit2: 1,
          Digit3: 2,
          Digit4: 3,
          KeyA: 0,
          KeyB: 1,
          KeyC: 2,
          KeyD: 3,
        };
        if (e.code in map) {
          this.pickOption(map[e.code]!);
          return;
        }
      }

      if (e.code === 'Enter') this.onEnter();
      if (e.code === 'Tab') {
        e.preventDefault();
        this.toggleGlossary();
      }
      if (e.code === 'Escape' && this.mode === 'glossary') {
        this.closeGlossary();
      }
      if (e.code === 'KeyM') {
        e.preventDefault();
        SoundManager.get().toggle();
      }
    });
  }

  /** Poll do toque — chamar a cada frame. */
  pollTouch(): void {
    if (!this.touch?.isEnabled()) return;

    if (this.touch.consumeGlossary()) {
      if (this.mode === 'glossary') this.closeGlossary();
      else if (this.mode === 'playing') this.toggleGlossary();
    }

    if (this.touch.consumeConfirm()) {
      if (this.mode === 'dialogue' && this.phase === 'turn' && this.engine?.isChoiceTurn()) {
        this.confirmOption();
      } else {
        this.onEnter();
      }
    }
  }

  /** Poll do controle — chamar a cada frame depois de gamepad.update(). */
  pollGamepad(pad: GamepadInput): void {
    const confirmDown =
      pad.isDown(GP.A) || pad.isDown(GP.START);
    const confirmPressed =
      !this.uiConfirmHeld && (pad.justPressed(GP.A) || pad.justPressed(GP.START));
    this.uiConfirmHeld = confirmDown;

    if (this.mode === 'dialogue' && this.phase === 'turn' && this.engine?.isChoiceTurn()) {
      const now = performance.now();
      const canStickNav = now >= this.padNavUntil;
      const move = pad.getMove();
      const up =
        pad.justPressed(GP.UP) || (canStickNav && move.z < -0.55);
      const down =
        pad.justPressed(GP.DOWN) || (canStickNav && move.z > 0.55);

      if (up) {
        this.moveOption(-1);
        this.padNavUntil = now + 220;
      } else if (down) {
        this.moveOption(1);
        this.padNavUntil = now + 220;
      }

      if (confirmPressed) this.confirmOption();
      else if (pad.justPressed(GP.B)) this.pickOption(1);
      else if (pad.justPressed(GP.X)) this.pickOption(2);
      else if (pad.justPressed(GP.Y)) this.pickOption(3);
      return;
    }

    if (confirmPressed) this.onEnter();

    if (pad.justPressed(GP.BACK)) {
      if (this.mode === 'playing' || this.mode === 'glossary') {
        this.toggleGlossary();
      }
    }

    if (pad.justPressed(GP.B) && this.mode === 'glossary') {
      this.closeGlossary();
    }
  }

  private moveOption(delta: number): void {
    if (this.optionCount <= 0) return;
    this.selectedOption =
      (this.selectedOption + delta + this.optionCount) % this.optionCount;
    this.refreshOptionHighlight();
  }

  private confirmOption(): void {
    this.pickOption(this.selectedOption);
  }

  private refreshOptionHighlight(): void {
    const optionsEl = this.root.querySelector('#dlg-options');
    if (!optionsEl) return;
    const buttons = optionsEl.querySelectorAll('button');
    buttons.forEach((btn, i) => {
      btn.classList.toggle('selected', i === this.selectedOption);
    });
  }

  private onEnter(): void {
    if (this.mode === 'title') {
      this.handlers.onStartGame();
      return;
    }
    if (this.mode === 'banner') {
      this.handlers.onBannerClosed();
      return;
    }
    if (this.mode === 'chapterComplete') {
      this.handlers.onChapterContinue();
      return;
    }
    if (this.mode === 'gameOver' || this.mode === 'secretEnd') {
      this.handlers.onRequestTitle();
      return;
    }
    if (this.mode === 'ending') {
      const ending = GameState.ending ?? 'gast';
      if (ending === 'secret') {
        this.handlers.onSecretDialogue();
        return;
      }
      this.handlers.onRequestTitle();
      return;
    }
    if (this.mode === 'dialogue') {
      if (this.phase === 'reaction') this.afterReaction();
      else if (this.phase === 'closing') this.finishDialogue();
      else if (this.engine && !this.engine.isChoiceTurn()) this.advanceNarration();
    }
  }

  showTitle(): void {
    this.mode = 'title';
    this.hidePlayUi();
    this.touch?.setEnabled(false);
    this.touch?.setGameplayVisible(false);
    SoundManager.get().pause();
    this.screenEl.classList.remove('hidden');
    this.screenEl.innerHTML = `
      <h1>DER FREMDER</h1>
      <h2>A Yiddish Language Adventure</h2>
      <p class="tagline">Você acordou num shtetl sem memória. Aprenda iídiche para ser aceito.</p>
      <div class="title-actions">
        <button type="button" class="title-btn" id="btn-start">Começar</button>
        <button type="button" class="title-btn title-btn-mobile" id="btn-mobile">Jogar no celular</button>
      </div>
      <p class="mobile-tip">No celular: use a tela deitada (paisagem). Joystick à esquerda, botões à direita.</p>
      <div class="prompt">[ Enter / A ] Começar · [ M ] Som</div>
    `;
    this.$('btn-start').addEventListener('click', (e) => {
      e.stopPropagation();
      this.handlers.onStartGame();
    });
    this.$('btn-mobile').addEventListener('click', async (e) => {
      e.stopPropagation();
      await this.touch?.requestLandscape();
      this.handlers.onStartGame({ mobile: true });
    });
  }

  showBanner(chapter: number): void {
    this.mode = 'banner';
    this.hidePlayUi();
    this.touch?.setGameplayVisible(!!this.touch?.isEnabled());
    const b = chapterBanner(chapter);
    this.screenEl.classList.remove('hidden');
    this.screenEl.innerHTML = `
      <h2>${b.title}</h2>
      <p>${b.body}</p>
      <div class="prompt">[ Enter / OK ] Continuar</div>
    `;
  }

  enterPlaying(): void {
    this.mode = 'playing';
    this.screenEl.classList.add('hidden');
    this.hudEl.classList.remove('hidden');
    this.lockHintEl.classList.remove('hidden');
    this.crosshairEl.classList.add('hidden');
    this.touch?.setGameplayVisible(true);
    if (this.touch?.isEnabled()) {
      this.lockHintEl.textContent =
        'Joystick andar · E interagir · OK confirmar · ☰ glossário';
    }
    SoundManager.get().resume();
    this.refreshHud();
  }

  setPointerLocked(_locked: boolean): void {
    // Câmera fixa — sem pointer lock
  }

  setHint(text: string | null): void {
    if (!text || this.mode !== 'playing') {
      this.hintEl.classList.add('hidden');
      return;
    }
    this.hintEl.textContent = text;
    this.hintEl.classList.remove('hidden');
  }

  refreshHud(): void {
    const fill = this.$('sus-fill');
    const sus = this.$('sus-text');
    const know = this.$('know-text');
    fill.style.width = `${GameState.suspicion}%`;
    fill.style.background =
      GameState.suspicion >= 75
        ? '#a83c3c'
        : GameState.suspicion >= 50
          ? '#c47a3a'
          : '#c45c3a';
    sus.textContent = `Desconfiança ${GameState.suspicion}%`;
    know.textContent = `Saber ${GameState.knowledge}%`;
  }

  setGamepadStatus(connected: boolean, name = ''): void {
    const el = this.root.querySelector('#pad-status') as HTMLElement | null;
    if (!el) return;
    if (!connected) {
      el.classList.add('hidden');
      el.textContent = '';
      return;
    }
    el.classList.remove('hidden');
    el.textContent = name ? `Controle: ${name}` : 'Controle OK';
  }

  startDialogue(tree: DialogueTree, npcId: string, fromSecret = false): void {
    this.mode = 'dialogue';
    this.fromSecret = fromSecret;
    this.npcId = npcId;
    this.engine = new DialogueEngine(tree);
    this.phase = 'turn';
    this.pendingDone = false;
    this.hintEl.classList.add('hidden');
    this.lockHintEl.classList.add('hidden');
    this.glossaryEl.classList.add('hidden');
    this.dialogueEl.classList.remove('hidden');
    this.reactionEl.classList.add('hidden');
    this.touch?.setGameplayVisible(!!this.touch?.isEnabled());
    this.renderTurn();
  }

  private renderTurn(): void {
    if (!this.engine) return;
    this.phase = 'turn';
    const turn = this.engine.current();
    this.$('dlg-status').textContent = `Desconfiança ${GameState.suspicion}%`;
    this.$('dlg-speaker').textContent = turn.speaker;

    let body = '';
    if (turn.yiddish) body += turn.yiddish;
    if (turn.portuguese) body += `${body ? '\n' : ''}* ${turn.portuguese}`;
    this.$('dlg-body').textContent = body;

    const optionsEl = this.$('dlg-options');
    optionsEl.innerHTML = '';
    const prompt = this.$('dlg-prompt');

    if (this.engine.isChoiceTurn() && turn.options) {
      prompt.textContent =
        turn.prompt ?? '↑↓ / D-pad escolher · Enter / A confirmar';
      const labels = ['A', 'B', 'C', 'D'];
      this.optionCount = turn.options.length;
      this.selectedOption = 0;
      turn.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'clickable';
        btn.textContent = `${labels[i]}) ${opt.text}`;
        btn.addEventListener('click', () => this.pickOption(i));
        btn.addEventListener('mouseenter', () => {
          this.selectedOption = i;
          this.refreshOptionHighlight();
        });
        optionsEl.appendChild(btn);
      });
      this.refreshOptionHighlight();
    } else {
      this.optionCount = 0;
      const isLast = !turn.next;
      prompt.textContent = isLast ? '[ Enter / A ] Encerrar' : '[ Enter / A ] Continuar';
      if (isLast) this.phase = 'closing';
    }
  }

  private pickOption(index: number): void {
    if (!this.engine || this.phase !== 'turn' || !this.engine.isChoiceTurn()) return;
    const option = this.engine.current().options?.[index];
    if (!option) return;

    const result = this.engine.applyOption(option);
    this.pendingDone = result.done;
    this.phase = 'reaction';
    this.$('dlg-options').innerHTML = '';
    this.$('dlg-prompt').textContent = '';

    let msg = result.reaction;
    if (result.suspicionDelta !== 0) {
      const d = result.suspicionDelta;
      if (d > 0) {
        msg += `\n\nDesconfiança subiu +${d}%`;
      } else {
        msg += `\n\nDesconfiança baixou ${Math.abs(d)}%`;
      }
    }
    if (result.learned.length) {
      msg += `\n\nAprendeu: ${result.learned.join(' · ')}`;
    }
    msg += '\n\n[ Enter ]';

    this.reactionEl.textContent = msg;
    this.reactionEl.classList.remove('hidden');
    this.$('dlg-status').textContent = `Desconfiança ${GameState.suspicion}%`;
    this.refreshHud();
  }

  private afterReaction(): void {
    this.reactionEl.classList.add('hidden');
    if (GameState.isGameOver()) {
      this.showGameOver();
      return;
    }
    if (this.pendingDone) {
      this.finishDialogue();
      return;
    }
    const next = this.engine?.consumeQueuedTurn();
    if (!next) {
      this.finishDialogue();
      return;
    }
    this.renderTurn();
  }

  private advanceNarration(): void {
    if (!this.engine) return;
    const turn = this.engine.current();
    if (!turn.next) {
      this.finishDialogue();
      return;
    }
    this.engine.advanceNarration();
    this.renderTurn();
  }

  private finishDialogue(): void {
    this.engine?.markNpcDone(this.npcId);
    this.dialogueEl.classList.add('hidden');
    this.reactionEl.classList.add('hidden');
    this.uiConfirmHeld = true;
    this.optionCount = 0;
    if (this.fromSecret) {
      this.showSecretEnd();
      return;
    }
    this.handlers.onDialogueFinished();
  }

  toggleGlossary(): void {
    if (this.mode === 'glossary') {
      this.closeGlossary();
      return;
    }
    if (this.mode !== 'playing') return;
    this.mode = 'glossary';
    const list = this.$('glossary-list');
    list.innerHTML = GameState.vocab
      .map((v) => `<li>${v.yiddish} — ${v.portuguese}</li>`)
      .join('');
    this.glossaryEl.classList.remove('hidden');
    this.hintEl.classList.add('hidden');
  }

  private closeGlossary(): void {
    this.glossaryEl.classList.add('hidden');
    this.mode = 'playing';
  }

  showChapterComplete(chapter: number): void {
    this.mode = 'chapterComplete';
    this.hidePlayUi();
    this.touch?.setGameplayVisible(!!this.touch?.isEnabled());
    const t = chapterCompleteCopy(chapter);
    const nextLabels: Record<number, string> = {
      1: '[ Enter ] Continuar — Capítulo 2',
      2: '[ Enter ] Continuar — Capítulo 3',
      3: '[ Enter ] Continuar — Capítulo 4',
      4: '[ Enter ] Continuar — Capítulo 5',
      5: '[ Enter ] Ver o final',
    };
    this.screenEl.classList.remove('hidden');
    this.screenEl.innerHTML = `
      <h2>${t.he}</h2>
      <h1>${t.yi}</h1>
      <p>${t.body}</p>
      <p style="margin-top:1.5rem;color:#e8d9b8">Desconfiança ${GameState.suspicion}% · Saber ${GameState.knowledge}%
Palavras: ${GameState.vocab.length}</p>
      <div class="prompt">${nextLabels[chapter] ?? '[ Enter ] Continuar'}</div>
    `;
  }

  showGameOver(): void {
    this.mode = 'gameOver';
    this.hidePlayUi();
    this.touch?.setGameplayVisible(!!this.touch?.isEnabled());
    this.screenEl.classList.remove('hidden');
    this.screenEl.innerHTML = `
      <h1 style="color:#a83c3c">GAME OVER</h1>
      <h2>Du bist a fremder.</h2>
      <p>Você é um estranho.</p>
      <div class="prompt">[ Enter / OK ] Tentar de novo</div>
    `;
  }

  showEnding(): void {
    const ending = GameState.resolveEnding();
    this.mode = 'ending';
    this.hidePlayUi();
    const e = ENDINGS[ending];
    this.screenEl.classList.remove('hidden');
    this.screenEl.innerHTML = `
      <h2>DER FREMDER</h2>
      <h1 style="color:${e.color}">${e.yi}</h1>
      <p style="color:#e8d9b8">${e.pt}</p>
      <p style="margin-top:1.2rem">${e.body}</p>
      <p style="margin-top:1.5rem;color:#e8d9b8">Desconfiança ${GameState.suspicion}% · Reputação ${GameState.reputation}%
Saber ${GameState.knowledge}% · Palavras ${GameState.vocab.length}</p>
      <div class="prompt">${ending === 'secret' ? '[ Enter ] A última pergunta...' : '[ Enter ] Voltar ao título'}</div>
    `;
  }

  showSecretEnd(): void {
    this.mode = 'secretEnd';
    this.hidePlayUi();
    this.screenEl.classList.remove('hidden');
    this.screenEl.innerHTML = `
      <h1 style="color:#a8c97a">Er iz fun do.</h1>
      <p>Ele é daqui.

E o shtetl inteiro sorri.</p>
      <div class="prompt">[ Enter ] Voltar ao título</div>
    `;
  }

  startSecretDialogue(): void {
    this.startDialogue(secretFinale, 'rivke', true);
    this.screenEl.classList.add('hidden');
  }

  private hidePlayUi(): void {
    this.hudEl.classList.add('hidden');
    this.hintEl.classList.add('hidden');
    this.dialogueEl.classList.add('hidden');
    this.reactionEl.classList.add('hidden');
    this.glossaryEl.classList.add('hidden');
    this.lockHintEl.classList.add('hidden');
    this.crosshairEl.classList.add('hidden');
  }
}
