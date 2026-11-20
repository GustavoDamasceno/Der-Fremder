import {
  PRACTICE_TITLES,
  buildMemoryPairs,
  buildQuiz,
  type PracticePair,
  type PracticeTopic,
  type QuizQuestion,
} from '../data/practice';
import { GameState } from '../state/GameState';

type CloseInfo = { score: number; total: number; learned: number };

/**
 * Popup 2D educacional:
 * - pronomes → memória (combinar iídiche ↔ português)
 * - verbos / números → quiz de múltipla escolha
 */
export class PracticeMinigame {
  private root: HTMLElement;
  private topic: PracticeTopic;
  private onClose: (info: CloseInfo) => void;
  private score = 0;
  private total = 0;
  private learned = 0;
  private selected = 0;
  private choiceCount = 0;
  private locked = false;
  private phase: 'play' | 'result' = 'play';

  // memória
  private cards: { id: number; text: string; pairId: number; side: 'yi' | 'pt' }[] = [];
  private flipped: number[] = [];
  private matched = new Set<number>();

  // quiz
  private questions: QuizQuestion[] = [];
  private qIndex = 0;

  constructor(
    host: HTMLElement,
    topic: PracticeTopic,
    onClose: (info: CloseInfo) => void,
  ) {
    this.root = host;
    this.topic = topic;
    this.onClose = onClose;
    this.root.classList.remove('hidden');
    if (topic === 'pronouns') this.startMemory();
    else this.startQuiz();
  }

  destroy(): void {
    this.root.classList.add('hidden');
    this.root.innerHTML = '';
  }

  /** Teclado / gamepad: setas e Enter. Retorna true se consumiu. */
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
    if (this.locked) return true;
    if (this.topic === 'pronouns') return false;

    if (code === 'ArrowUp' || code === 'KeyW') {
      this.moveChoice(-1);
      return true;
    }
    if (code === 'ArrowDown' || code === 'KeyS') {
      this.moveChoice(1);
      return true;
    }
    if (code === 'Enter' || code === 'Space') {
      this.confirmChoice();
      return true;
    }
    const digit = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(code);
    if (digit >= 0) {
      this.selected = digit;
      this.refreshChoiceHighlight();
      this.confirmChoice();
      return true;
    }
    return false;
  }

  handlePadNav(delta: number): void {
    if (this.phase !== 'play' || this.topic === 'pronouns' || this.locked) return;
    this.moveChoice(delta);
  }

  handlePadConfirm(): void {
    if (this.phase === 'result') {
      this.finish();
      return;
    }
    if (this.topic === 'pronouns' || this.locked) return;
    this.confirmChoice();
  }

  // ——— Memória (pronomes) ———

  private startMemory(): void {
    const pairs = buildMemoryPairs(4);
    this.total = pairs.length;
    this.cards = [];
    let id = 0;
    pairs.forEach((p, pairId) => {
      this.cards.push({ id: id++, text: p.yi, pairId, side: 'yi' });
      this.cards.push({ id: id++, text: p.pt, pairId, side: 'pt' });
    });
    this.cards = shuffle(this.cards);
    this.renderMemory();
  }

  private renderMemory(): void {
    const title = PRACTICE_TITLES.pronouns;
    this.root.innerHTML = `
      <div class="practice-panel">
        <div class="practice-head">
          <h2>${title.yi}</h2>
          <p>Combine o pronome em iídiche com o português.</p>
          <span class="practice-score">Pares ${this.matched.size / 2}/${this.total}</span>
        </div>
        <div class="practice-memory" id="prac-memory"></div>
        <div class="practice-foot">
          <button type="button" class="practice-exit" id="prac-exit">Sair [ Esc ]</button>
        </div>
      </div>
    `;
    const grid = this.root.querySelector('#prac-memory')!;
    this.cards.forEach((card, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'practice-card';
      btn.dataset.idx = String(idx);
      if (this.matched.has(card.id) || this.flipped.includes(idx)) {
        btn.classList.add('flipped');
        btn.textContent = card.text;
        if (this.matched.has(card.id)) btn.classList.add('matched');
      } else {
        btn.textContent = '?';
      }
      btn.addEventListener('click', () => this.flipCard(idx));
      grid.appendChild(btn);
    });
    this.root.querySelector('#prac-exit')!.addEventListener('click', () => this.finish());
  }

  private flipCard(idx: number): void {
    if (this.locked) return;
    const card = this.cards[idx];
    if (!card || this.matched.has(card.id) || this.flipped.includes(idx)) return;
    if (this.flipped.length >= 2) return;

    this.flipped.push(idx);
    this.renderMemory();

    if (this.flipped.length < 2) return;

    const a = this.cards[this.flipped[0]!]!;
    const b = this.cards[this.flipped[1]!]!;
    this.locked = true;

    if (a.pairId === b.pairId && a.side !== b.side) {
      this.matched.add(a.id);
      this.matched.add(b.id);
      this.score++;
      const pair = findPair(a, b);
      if (pair && GameState.addVocab({ yiddish: pair.yi, portuguese: pair.pt })) {
        this.learned++;
      }
      setTimeout(() => {
        this.flipped = [];
        this.locked = false;
        if (this.matched.size === this.cards.length) this.showResult();
        else this.renderMemory();
      }, 420);
    } else {
      setTimeout(() => {
        this.flipped = [];
        this.locked = false;
        this.renderMemory();
      }, 700);
    }
  }

  // ——— Quiz (verbos / números) ———

  private startQuiz(): void {
    this.questions = buildQuiz(this.topic, 6);
    this.total = this.questions.length;
    this.qIndex = 0;
    this.renderQuiz();
  }

  private renderQuiz(): void {
    const q = this.questions[this.qIndex];
    if (!q) {
      this.showResult();
      return;
    }
    const title = PRACTICE_TITLES[this.topic];
    this.choiceCount = q.choices.length;
    this.selected = 0;
    this.root.innerHTML = `
      <div class="practice-panel">
        <div class="practice-head">
          <h2>${title.yi} · ${title.pt}</h2>
          <p>Pergunta ${this.qIndex + 1} de ${this.total} · Acertos ${this.score}</p>
        </div>
        <div class="practice-prompt">
          <div class="practice-big">${escapeHtml(q.prompt)}</div>
          ${q.sub ? `<div class="practice-sub">${escapeHtml(q.sub)}</div>` : ''}
        </div>
        <div class="practice-choices" id="prac-choices"></div>
        <div class="practice-foot">
          <button type="button" class="practice-exit" id="prac-exit">Sair [ Esc ]</button>
          <span class="practice-tip">1–4 / ↑↓ · Enter</span>
        </div>
      </div>
    `;
    const box = this.root.querySelector('#prac-choices')!;
    const labels = ['1', '2', '3', '4'];
    q.choices.forEach((c, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'practice-choice';
      btn.textContent = `${labels[i]}) ${c}`;
      btn.addEventListener('click', () => {
        this.selected = i;
        this.confirmChoice();
      });
      btn.addEventListener('mouseenter', () => {
        this.selected = i;
        this.refreshChoiceHighlight();
      });
      box.appendChild(btn);
    });
    this.refreshChoiceHighlight();
    this.root.querySelector('#prac-exit')!.addEventListener('click', () => this.finish());
  }

  private moveChoice(delta: number): void {
    if (this.choiceCount <= 0) return;
    this.selected =
      (this.selected + delta + this.choiceCount) % this.choiceCount;
    this.refreshChoiceHighlight();
  }

  private refreshChoiceHighlight(): void {
    const buttons = this.root.querySelectorAll('.practice-choice');
    buttons.forEach((btn, i) => {
      btn.classList.toggle('selected', i === this.selected);
    });
  }

  private confirmChoice(): void {
    if (this.locked) return;
    const q = this.questions[this.qIndex];
    if (!q) return;
    const pick = q.choices[this.selected];
    if (pick == null) return;

    this.locked = true;
    const buttons = this.root.querySelectorAll('.practice-choice');
    buttons.forEach((btn, i) => {
      const text = q.choices[i]!;
      if (text === q.answer) btn.classList.add('correct');
      else if (i === this.selected) btn.classList.add('wrong');
    });

    const ok = pick === q.answer;
    if (ok) {
      this.score++;
      if (GameState.addVocab(q.learn)) this.learned++;
      else GameState.adjustReputation(1);
    } else {
      GameState.adjustSuspicion(0); // sem punição forte — é treino
    }

    setTimeout(() => {
      this.locked = false;
      this.qIndex++;
      if (this.qIndex >= this.questions.length) this.showResult();
      else this.renderQuiz();
    }, 750);
  }

  // ——— Resultado ———

  private showResult(): void {
    this.phase = 'result';
    const title = PRACTICE_TITLES[this.topic];
    const pct = this.total ? Math.round((this.score / this.total) * 100) : 0;
    let msg = 'Gut gemakht!';
    if (pct < 50) msg = 'Nisht shlekht — continue treinando.';
    else if (pct < 80) msg = 'Yo! Você está aprendendo.';
    else msg = 'Mamesh gut! Reb Leyzer ficaria orgulhoso.';

    this.root.innerHTML = `
      <div class="practice-panel practice-result">
        <div class="practice-head">
          <h2>${title.pt}</h2>
          <p>${msg}</p>
        </div>
        <div class="practice-prompt">
          <div class="practice-big">${this.score}/${this.total}</div>
          <div class="practice-sub">${pct}% · ${this.learned} palavra(s) nova(s) no glossário</div>
        </div>
        <div class="practice-foot">
          <button type="button" class="practice-exit practice-done" id="prac-done">Pronto [ Enter ]</button>
        </div>
      </div>
    `;
    this.choiceCount = 0;
    this.root.querySelector('#prac-done')!.addEventListener('click', () => this.finish());
  }

  private finish(): void {
    const info = { score: this.score, total: this.total, learned: this.learned };
    this.destroy();
    this.onClose(info);
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function findPair(
  a: { text: string; side: 'yi' | 'pt' },
  b: { text: string; side: 'yi' | 'pt' },
): PracticePair | null {
  const yi = a.side === 'yi' ? a.text : b.text;
  const pt = a.side === 'pt' ? a.text : b.text;
  return { yi, pt };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
