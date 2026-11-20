import {
  LEVEL_CFG,
  LEVEL_LABELS,
  PRACTICE_TITLES,
  buildArcadeRounds,
  type ArcadeRound,
  type PracticeLevel,
  type PracticeTopic,
} from '../data/practice';
import { GameState } from '../state/GameState';

type CloseInfo = { score: number; total: number; learned: number };
type Phase = 'level' | 'play' | 'resolve' | 'result';

/**
 * Minigames arcade para crianças:
 * - pronomes → Chão que Cai (plataformas)
 * - verbos → Portas da Resposta
 * - números → Corrida a Cavalo
 */
export class PracticeMinigame {
  private root: HTMLElement;
  private topic: PracticeTopic;
  private onClose: (info: CloseInfo) => void;
  private level: PracticeLevel = 'medium';
  private phase: Phase = 'level';
  private score = 0;
  private total = 0;
  private learned = 0;
  private selected = 0;
  private choiceCount = 0;
  private rounds: ArcadeRound[] = [];
  private qIndex = 0;
  private locked = false;
  private timerRaf = 0;
  private timerStart = 0;
  private timeLimit = 3600;
  private runnerProg = 0;

  constructor(
    host: HTMLElement,
    topic: PracticeTopic,
    onClose: (info: CloseInfo) => void,
  ) {
    this.root = host;
    this.topic = topic;
    this.onClose = onClose;
    this.root.classList.remove('hidden');
    this.showLevelSelect();
  }

  destroy(): void {
    cancelAnimationFrame(this.timerRaf);
    this.root.classList.add('hidden');
    this.root.innerHTML = '';
  }

  handleKey(code: string): boolean {
    if (code === 'Escape') {
      this.finish();
      return true;
    }
    if (this.phase === 'result') {
      if (code === 'Enter' || code === 'Space') {
        this.finish();
        return true;
      }
      return true;
    }
    if (this.phase === 'level') {
      if (code === 'ArrowLeft' || code === 'KeyA') {
        this.moveLevel(-1);
        return true;
      }
      if (code === 'ArrowRight' || code === 'KeyD') {
        this.moveLevel(1);
        return true;
      }
      if (code === 'Enter' || code === 'Space') {
        this.pickLevel(['easy', 'medium', 'hard'][this.selected] as PracticeLevel);
        return true;
      }
      const digit = ['Digit1', 'Digit2', 'Digit3'].indexOf(code);
      if (digit >= 0) {
        this.pickLevel(['easy', 'medium', 'hard'][digit] as PracticeLevel);
        return true;
      }
      return true;
    }
    if (this.phase !== 'play' || this.locked) return true;

    if (code === 'ArrowLeft' || code === 'KeyA') {
      this.moveChoice(-1);
      return true;
    }
    if (code === 'ArrowRight' || code === 'KeyD') {
      this.moveChoice(1);
      return true;
    }
    if (code === 'Enter' || code === 'Space') {
      this.lockInChoice();
      return true;
    }
    const digit = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(code);
    if (digit >= 0 && digit < this.choiceCount) {
      this.selected = digit;
      this.refreshChoiceHighlight();
      this.lockInChoice();
      return true;
    }
    return false;
  }

  handlePadNav(delta: number): void {
    if (this.phase === 'level') {
      this.moveLevel(delta);
      return;
    }
    if (this.phase === 'play' && !this.locked) this.moveChoice(delta);
  }

  handlePadConfirm(): void {
    if (this.phase === 'result') {
      this.finish();
      return;
    }
    if (this.phase === 'level') {
      this.pickLevel(['easy', 'medium', 'hard'][this.selected] as PracticeLevel);
      return;
    }
    if (this.phase === 'play' && !this.locked) this.lockInChoice();
  }

  // ——— Nível ———

  private showLevelSelect(): void {
    this.phase = 'level';
    this.selected = 1;
    const title = PRACTICE_TITLES[this.topic];
    this.root.innerHTML = `
      <div class="practice-panel practice-arcade">
        <div class="practice-head">
          <h2>${title.game}</h2>
          <p>${title.pt} · Escolha o nível</p>
        </div>
        <div class="practice-levels" id="prac-levels">
          <button type="button" class="practice-level" data-lv="easy">
            <span class="lv-name">Fácil</span>
            <span class="lv-tip">${LEVEL_LABELS.easy.tip}</span>
          </button>
          <button type="button" class="practice-level selected" data-lv="medium">
            <span class="lv-name">Médio</span>
            <span class="lv-tip">${LEVEL_LABELS.medium.tip}</span>
          </button>
          <button type="button" class="practice-level" data-lv="hard">
            <span class="lv-name">Difícil</span>
            <span class="lv-tip">${LEVEL_LABELS.hard.tip}</span>
          </button>
        </div>
        <div class="practice-foot">
          <button type="button" class="practice-exit" id="prac-exit">Sair [ Esc ]</button>
          <span class="practice-tip">← → · Enter</span>
        </div>
      </div>
    `;
    this.root.querySelectorAll('.practice-level').forEach((btn, i) => {
      btn.addEventListener('click', () => {
        this.selected = i;
        this.pickLevel((btn as HTMLElement).dataset.lv as PracticeLevel);
      });
      btn.addEventListener('mouseenter', () => {
        this.selected = i;
        this.refreshLevelHighlight();
      });
    });
    this.root.querySelector('#prac-exit')!.addEventListener('click', () => this.finish());
  }

  private moveLevel(delta: number): void {
    this.selected = (this.selected + delta + 3) % 3;
    this.refreshLevelHighlight();
  }

  private refreshLevelHighlight(): void {
    this.root.querySelectorAll('.practice-level').forEach((btn, i) => {
      btn.classList.toggle('selected', i === this.selected);
    });
  }

  private pickLevel(level: PracticeLevel): void {
    this.level = level;
    const cfg = LEVEL_CFG[level];
    this.timeLimit = cfg.timeMs;
    this.rounds = buildArcadeRounds(this.topic, level);
    this.total = this.rounds.length;
    this.score = 0;
    this.learned = 0;
    this.qIndex = 0;
    this.renderRound();
  }

  // ——— Rodada ———

  private renderRound(): void {
    cancelAnimationFrame(this.timerRaf);
    const q = this.rounds[this.qIndex];
    if (!q) {
      this.showResult();
      return;
    }
    this.phase = 'play';
    this.locked = false;
    this.choiceCount = q.choices.length;
    this.selected = Math.floor(this.choiceCount / 2);
    this.runnerProg = 0;
    this.timerStart = performance.now();

    const title = PRACTICE_TITLES[this.topic];
    const modeClass =
      this.topic === 'pronouns'
        ? 'mode-fall'
        : this.topic === 'verbs'
          ? 'mode-doors'
          : 'mode-race';

    this.root.innerHTML = `
      <div class="practice-panel practice-arcade ${modeClass}">
        <div class="practice-head">
          <h2>${title.game}</h2>
          <p>Rodada ${this.qIndex + 1}/${this.total} · Acertos ${this.score} · ${LEVEL_LABELS[this.level].pt}</p>
        </div>
        <div class="practice-prompt">
          <div class="practice-big">${escapeHtml(q.prompt)}</div>
          <div class="practice-sub">${escapeHtml(q.sub)}</div>
        </div>
        <div class="arcade-timer"><i id="prac-timer"></i></div>
        <div class="arcade-stage" id="prac-stage"></div>
        <div class="practice-foot">
          <button type="button" class="practice-exit" id="prac-exit">Sair [ Esc ]</button>
          <span class="practice-tip">← → escolher · Enter confirmar · 1–4</span>
        </div>
      </div>
    `;

    const stage = this.root.querySelector('#prac-stage')!;
    if (this.topic === 'pronouns') this.buildFallStage(stage, q);
    else if (this.topic === 'verbs') this.buildDoorsStage(stage, q);
    else this.buildRaceStage(stage, q);

    this.refreshChoiceHighlight();
    this.root.querySelector('#prac-exit')!.addEventListener('click', () => this.finish());
    this.tickTimer();
  }

  private buildFallStage(stage: Element, q: ArcadeRound): void {
    stage.innerHTML = `
      <div class="fall-sky"></div>
      <div class="fall-hero" id="prac-hero">🧒</div>
      <div class="fall-platforms" id="prac-opts"></div>
    `;
    const opts = stage.querySelector('#prac-opts')!;
    q.choices.forEach((c, i) => {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'fall-tile practice-opt';
      tile.innerHTML = `<span class="opt-key">${i + 1}</span><span class="opt-text">${escapeHtml(c)}</span>`;
      tile.addEventListener('click', () => {
        this.selected = i;
        this.lockInChoice();
      });
      opts.appendChild(tile);
    });
  }

  private buildDoorsStage(stage: Element, q: ArcadeRound): void {
    stage.innerHTML = `
      <div class="doors-track">
        <div class="doors-runner" id="prac-hero">🏃</div>
        <div class="doors-wall" id="prac-opts"></div>
      </div>
    `;
    const opts = stage.querySelector('#prac-opts')!;
    q.choices.forEach((c, i) => {
      const door = document.createElement('button');
      door.type = 'button';
      door.className = 'door-panel practice-opt';
      door.innerHTML = `<span class="opt-key">${i + 1}</span><span class="opt-text">${escapeHtml(c)}</span>`;
      door.addEventListener('click', () => {
        this.selected = i;
        this.lockInChoice();
      });
      opts.appendChild(door);
    });
  }

  private buildRaceStage(stage: Element, q: ArcadeRound): void {
    stage.innerHTML = `
      <div class="race-track">
        <div class="race-dust"></div>
        <div class="race-horse" id="prac-hero">🐴</div>
        <div class="race-gates" id="prac-opts"></div>
      </div>
    `;
    const opts = stage.querySelector('#prac-opts')!;
    q.choices.forEach((c, i) => {
      const gate = document.createElement('button');
      gate.type = 'button';
      gate.className = 'race-gate practice-opt';
      gate.innerHTML = `<span class="opt-key">${i + 1}</span><span class="opt-text">${escapeHtml(c)}</span>`;
      gate.addEventListener('click', () => {
        this.selected = i;
        this.lockInChoice();
      });
      opts.appendChild(gate);
    });
  }

  private moveChoice(delta: number): void {
    if (this.choiceCount <= 0) return;
    this.selected =
      (this.selected + delta + this.choiceCount) % this.choiceCount;
    this.refreshChoiceHighlight();
  }

  private refreshChoiceHighlight(): void {
    const opts = this.root.querySelectorAll('.practice-opt');
    opts.forEach((el, i) => {
      el.classList.toggle('selected', i === this.selected);
    });
    // Hero encima da opção selecionada (chão que cai)
    if (this.topic === 'pronouns') {
      const hero = this.root.querySelector('#prac-hero') as HTMLElement | null;
      const tile = opts[this.selected] as HTMLElement | undefined;
      if (hero && tile) {
        const stage = this.root.querySelector('#prac-stage') as HTMLElement;
        const sr = stage.getBoundingClientRect();
        const tr = tile.getBoundingClientRect();
        hero.style.left = `${tr.left - sr.left + tr.width / 2}px`;
      }
    }
  }

  private tickTimer = (): void => {
    if (this.phase !== 'play' || this.locked) return;
    const elapsed = performance.now() - this.timerStart;
    const pct = Math.max(0, 1 - elapsed / this.timeLimit);
    const bar = this.root.querySelector('#prac-timer') as HTMLElement | null;
    if (bar) {
      bar.style.width = `${pct * 100}%`;
      bar.classList.toggle('urgent', pct < 0.28);
    }

    // Runner / cavalo avança com o tempo
    if (this.topic !== 'pronouns') {
      this.runnerProg = 1 - pct;
      const hero = this.root.querySelector('#prac-hero') as HTMLElement | null;
      if (hero) {
        hero.style.transform = `translateX(${this.runnerProg * 70}%)`;
      }
    } else {
      this.refreshChoiceHighlight();
    }

    if (elapsed >= this.timeLimit) {
      this.lockInChoice();
      return;
    }
    this.timerRaf = requestAnimationFrame(this.tickTimer);
  };

  private lockInChoice(): void {
    if (this.locked || this.phase !== 'play') return;
    this.locked = true;
    this.phase = 'resolve';
    cancelAnimationFrame(this.timerRaf);

    const q = this.rounds[this.qIndex]!;
    const pick = q.choices[this.selected] ?? '';
    const ok = pick === q.answer;
    const opts = this.root.querySelectorAll('.practice-opt');

    opts.forEach((el, i) => {
      const text = q.choices[i]!;
      if (text === q.answer) el.classList.add('correct');
      else {
        el.classList.add('wrong');
        if (this.topic === 'pronouns') el.classList.add('falling');
      }
      if (i === this.selected && !ok) el.classList.add('picked-wrong');
    });

    if (this.topic !== 'pronouns') {
      const hero = this.root.querySelector('#prac-hero') as HTMLElement | null;
      if (hero) {
        hero.classList.add(ok ? 'pass' : 'bump');
        hero.style.transform = `translateX(88%)`;
      }
    } else {
      const hero = this.root.querySelector('#prac-hero') as HTMLElement | null;
      if (hero) hero.classList.add(ok ? 'safe' : 'fall');
    }

    if (ok) {
      this.score++;
      if (GameState.addVocab(q.learn)) this.learned++;
    }

    setTimeout(() => {
      this.qIndex++;
      this.renderRound();
    }, ok ? 750 : 950);
  }

  private showResult(): void {
    cancelAnimationFrame(this.timerRaf);
    this.phase = 'result';
    const title = PRACTICE_TITLES[this.topic];
    const pct = this.total ? Math.round((this.score / this.total) * 100) : 0;
    let msg = 'Gut gemakht!';
    if (pct < 40) msg = 'Quase! Tenta de novo no fácil.';
    else if (pct < 70) msg = 'Yo! Você está pegando o jeito.';
    else if (pct < 100) msg = 'Mamesh gut! Quase perfeito.';
    else msg = 'Campeão do kheyder! ⭐';

    this.root.innerHTML = `
      <div class="practice-panel practice-arcade practice-result">
        <div class="practice-head">
          <h2>${title.game}</h2>
          <p>${msg}</p>
        </div>
        <div class="practice-prompt">
          <div class="practice-big">${this.score}/${this.total}</div>
          <div class="practice-sub">${LEVEL_LABELS[this.level].pt} · ${pct}% · ${this.learned} palavra(s) nova(s)</div>
        </div>
        <div class="practice-foot">
          <button type="button" class="practice-exit practice-done" id="prac-done">Pronto [ Enter ]</button>
        </div>
      </div>
    `;
    this.root.querySelector('#prac-done')!.addEventListener('click', () => this.finish());
  }

  private finish(): void {
    cancelAnimationFrame(this.timerRaf);
    const info = { score: this.score, total: this.total, learned: this.learned };
    this.destroy();
    this.onClose(info);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
