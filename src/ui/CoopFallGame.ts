import type { LibraryRoom } from '../net/LibraryRoom';
import type { CoopMatchSnapshot, CoopPlayerInfo, CoopRoundPayload } from '../net/coopTypes';
import { COOP_WAVE_SIZE } from '../net/coopTypes';
import { GameState } from '../state/GameState';

/**
 * Chão que Cai cooperativo — eliminação.
 * Fica no chão até o tempo acabar; errados caem; sobra um.
 */
export class CoopFallGame {
  private root: HTMLElement;
  private room: LibraryRoom;
  private onClose: () => void;
  private match: CoopMatchSnapshot | null = null;
  private selected = 0;
  private timerRaf = 0;
  private lastRoundSeq = -1;
  /** Estava vivo no início desta rodada (para animar queda só se caiu agora). */
  private aliveAtRoundStart = true;

  constructor(host: HTMLElement, room: LibraryRoom, onClose: () => void) {
    this.root = host;
    this.room = room;
    this.onClose = onClose;
    this.root.classList.remove('hidden');
    void this.boot();
  }

  destroy(): void {
    cancelAnimationFrame(this.timerRaf);
    this.root.classList.add('hidden');
    this.root.innerHTML = '';
  }

  handleKey(code: string): boolean {
    if (code === 'Escape') {
      void this.exit();
      return true;
    }
    const match = this.match;
    if (!match) return true;

    if (match.phase === 'results') {
      if (code === 'Enter' || code === 'Space') {
        void this.exit();
        return true;
      }
      return true;
    }

    if (match.phase !== 'playing') return true;
    if (!match.alive[this.room.selfId]) return true;

    const round = match.rounds[match.roundIndex];
    if (!round) return true;

    if (code === 'ArrowLeft' || code === 'KeyA') {
      this.selected = (this.selected - 1 + round.choices.length) % round.choices.length;
      void this.standOn(this.selected);
      return true;
    }
    if (code === 'ArrowRight' || code === 'KeyD') {
      this.selected = (this.selected + 1) % round.choices.length;
      void this.standOn(this.selected);
      return true;
    }
    if (code === 'Enter' || code === 'Space') {
      void this.standOn(this.selected);
      return true;
    }
    const digit = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(code);
    if (digit >= 0 && digit < round.choices.length) {
      void this.standOn(digit);
      return true;
    }
    return true;
  }

  private async boot(): Promise<void> {
    try {
      this.match = await this.room.createOrJoinLobby();
    } catch (e) {
      this.root.innerHTML = `
        <div class="practice-panel practice-arcade">
          <div class="practice-head"><h2>Chão que Cai</h2>
          <p>${escapeHtml(e instanceof Error ? e.message : 'Falha ao entrar')}</p></div>
          <div class="practice-foot">
            <button type="button" class="practice-exit" id="coop-close">Fechar</button>
          </div>
        </div>`;
      this.root.querySelector('#coop-close')!.addEventListener('click', () => this.finishClose());
      return;
    }
    this.render();
  }

  applyMatch(match: CoopMatchSnapshot | null): void {
    this.match = match;
    if (!match) {
      this.finishClose();
      return;
    }
    if (
      (match.phase === 'playing' || match.phase === 'resolving') &&
      match.roundSeq !== this.lastRoundSeq
    ) {
      this.lastRoundSeq = match.roundSeq;
      this.aliveAtRoundStart = !!match.alive[this.room.selfId];
      const n = match.rounds[match.roundIndex]?.choices.length ?? 3;
      const mine = match.answers[this.room.selfId] ?? -1;
      this.selected = mine >= 0 ? mine : Math.floor(n / 2);
    }
    this.render();
  }

  private render(): void {
    cancelAnimationFrame(this.timerRaf);
    const match = this.match;
    if (!match) return;

    if (match.phase === 'lobby') this.renderLobby(match);
    else if (match.phase === 'playing' || match.phase === 'resolving') this.renderPlay(match);
    else this.renderResults(match);
  }

  private renderLobby(match: CoopMatchSnapshot): void {
    const isHost = match.hostId === this.room.selfId;
    this.root.innerHTML = `
      <div class="practice-panel practice-arcade coop-panel">
        <div class="practice-head">
          <h2>Chão que Cai · Coop</h2>
          <p>Fique no chão certo · errados caem · sobra um</p>
          <p class="coop-voice-note">Mic só entre quem está no jogo · solo = treino (sem vencedor)</p>
        </div>
        <div class="coop-faces" id="coop-faces"></div>
        <div class="practice-foot">
          ${
            isHost
              ? `<button type="button" class="practice-exit practice-done" id="coop-start">Começar</button>`
              : `<span class="practice-tip">Aguardando o anfitrião…</span>`
          }
          <button type="button" class="practice-exit" id="coop-leave">Sair do jogo</button>
        </div>
      </div>
    `;
    this.fillFaces(match);
    this.root.querySelector('#coop-leave')!.addEventListener('click', () => void this.exit());
    this.root.querySelector('#coop-start')?.addEventListener('click', () => {
      void this.room.startCoopMatch().catch((e) => {
        alert(e instanceof Error ? e.message : 'Não foi possível começar');
      });
    });
  }

  private renderPlay(match: CoopMatchSnapshot): void {
    const round = match.rounds[match.roundIndex];
    if (!round) return;
    const alive = !!match.alive[this.room.selfId];
    const resolving = match.phase === 'resolving';
    const wave = Math.floor(match.roundIndex / COOP_WAVE_SIZE) + 1;
    const survivors = match.players.filter((p) => match.alive[p.id]).length;

    this.root.innerHTML = `
      <div class="practice-panel practice-arcade mode-fall coop-panel">
        <div class="practice-head">
          <h2>Chão que Cai · Coop</h2>
          <p>Rodada ${match.roundIndex + 1} · Onda ${wave} · ${survivors} vivos</p>
        </div>
        <div class="coop-faces compact" id="coop-faces"></div>
        <div class="practice-prompt">
          <div class="practice-big">${escapeHtml(round.prompt)}</div>
          <div class="practice-sub">${escapeHtml(round.sub)}</div>
        </div>
        <div class="arcade-timer"><i id="coop-timer"></i></div>
        <div class="arcade-stage" id="coop-stage">
          <div class="fall-sky"></div>
          <div class="fall-heroes" id="coop-heroes"></div>
          <div class="fall-platforms" id="coop-opts"></div>
        </div>
        <div class="practice-foot">
          <button type="button" class="practice-exit" id="coop-leave">Sair</button>
          <span class="practice-tip">${
            resolving
              ? 'Os chãos errados caem…'
              : !alive
                ? 'Você caiu! Assistindo…'
                : '← → · Enter · 1–4 · fique no certo!'
          }</span>
        </div>
      </div>
    `;
    this.fillFaces(match);
    const opts = this.root.querySelector('#coop-opts')!;
    round.choices.forEach((c, i) => {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'fall-tile practice-opt';
      if (!resolving && match.answers[this.room.selfId] === i) tile.classList.add('selected');
      tile.innerHTML = `
        <span class="opt-key">${i + 1}</span>
        <span class="opt-text">${escapeHtml(c)}</span>
      `;
      tile.disabled = resolving || !alive;
      if (alive && !resolving) {
        tile.addEventListener('click', () => void this.standOn(i));
      }
      opts.appendChild(tile);
    });
    this.paintHeroes(match, round);
    this.refreshHighlight();
    if (resolving) this.revealFallOutcome(match, round);
    this.root.querySelector('#coop-leave')!.addEventListener('click', () => void this.exit());
    if (!resolving) this.tickTimer();
  }

  /** Cabeças coloridas de todos os vivos acima do chão escolhido. */
  private paintHeroes(match: CoopMatchSnapshot, round: CoopRoundPayload): void {
    const layer = this.root.querySelector('#coop-heroes');
    if (!layer) return;
    layer.innerHTML = '';

    const resolving = match.phase === 'resolving';
    for (const p of match.players) {
      const isSelf = p.id === this.room.selfId;
      if (resolving) {
        if (isSelf && !this.aliveAtRoundStart) continue;
        if (!isSelf && !match.alive[p.id] && (match.answers[p.id] ?? -1) < 0) continue;
      } else if (!match.alive[p.id]) {
        continue;
      }

      const floor = this.floorOfHero(match, p.id, round);
      if (floor < 0) continue;

      const color = `#${(p.coat >>> 0).toString(16).padStart(6, '0')}`;
      const unit = document.createElement('div');
      unit.className = 'fall-hero-unit';
      unit.dataset.pid = p.id;
      if (isSelf) unit.classList.add('self');
      unit.title = p.name;
      unit.innerHTML = `
        <span class="fall-hero-cap" style="background:${color}">🧒</span>
        <span class="fall-hero-name">${escapeHtml(p.name)}</span>
      `;
      layer.appendChild(unit);
    }
    this.layoutHeroes(match, round);
  }

  private floorOfHero(
    match: CoopMatchSnapshot,
    pid: string,
    round: CoopRoundPayload,
  ): number {
    // Local: posição otimista (não espera o sync da rede).
    let floor =
      pid === this.room.selfId && match.phase === 'playing'
        ? this.selected
        : (match.answers[pid] ?? -1);
    if (floor < 0 || floor >= round.choices.length) return -1;
    return floor;
  }

  private layoutHeroes(match: CoopMatchSnapshot, round: CoopRoundPayload): void {
    const stage = this.root.querySelector('#coop-stage') as HTMLElement | null;
    const opts = this.root.querySelectorAll('.practice-opt');
    const layer = this.root.querySelector('#coop-heroes');
    if (!stage || !layer) return;

    const stacks: Record<number, number> = {};
    for (const el of layer.querySelectorAll('.fall-hero-unit')) {
      const unit = el as HTMLElement;
      const pid = unit.dataset.pid!;
      const floor = this.floorOfHero(match, pid, round);
      if (floor < 0) continue;
      const tile = opts[floor] as HTMLElement | undefined;
      if (!tile) continue;
      const stack = stacks[floor] ?? 0;
      stacks[floor] = stack + 1;
      const sr = stage.getBoundingClientRect();
      const tr = tile.getBoundingClientRect();
      unit.style.left = `${tr.left - sr.left + tr.width / 2 + stack * 14}px`;
    }
  }

  /** Quando o tempo acaba: chãos errados caem; cabeças no errado caem junto. */
  private revealFallOutcome(match: CoopMatchSnapshot, round: CoopRoundPayload): void {
    const opts = this.root.querySelectorAll('.practice-opt');
    opts.forEach((el, i) => {
      const text = round.choices[i]!;
      if (text === round.answer) el.classList.add('correct');
      else el.classList.add('wrong', 'falling');
    });

    this.paintHeroes(match, round);
    const units = this.root.querySelectorAll('.fall-hero-unit');
    units.forEach((el) => {
      const pid = (el as HTMLElement).dataset.pid!;
      const floor = match.answers[pid] ?? -1;
      const ok = floor >= 0 && round.choices[floor] === round.answer;
      el.classList.add(ok && match.alive[pid] ? 'safe' : 'fall');
    });
  }

  private renderResults(match: CoopMatchSnapshot): void {
    const winner = match.players.find((p) => p.id === match.winnerId) ?? null;
    const myAlive = !!match.alive[this.room.selfId];
    const solo = match.players.length < 2;
    const myScore = match.scores[this.room.selfId] ?? 0;

    let title = 'Ninguém sobrou…';
    let subtitle = 'Todos caíram na mesma rodada';
    let foot = 'Você foi eliminado';
    if (solo) {
      title = myAlive ? 'Treino concluído!' : 'Treino encerrado';
      subtitle = myAlive
        ? `${myScore} rodadas seguidas`
        : `Caiu na rodada ${match.roundIndex + 1} · ${myScore} acertos`;
      foot = myAlive ? 'Bom aquecimento!' : 'Tenta de novo quando quiser';
    } else if (winner) {
      title = 'Último de pé!';
      subtitle = `Vencedor: ${escapeHtml(winner.name)}`;
      foot =
        winner.id === this.room.selfId
          ? 'Você venceu!'
          : myAlive
            ? 'Você sobreviveu até o fim'
            : 'Você foi eliminado';
    }

    this.root.innerHTML = `
      <div class="practice-panel practice-arcade practice-result coop-panel">
        <div class="practice-head">
          <h2>${title}</h2>
          <p>Chão que Cai · ${solo ? 'Treino' : 'Coop'}</p>
        </div>
        <div class="coop-winner">
          ${winner ? faceHtml(winner, true) : solo ? faceHtml(match.players[0]!, true) : ''}
          <div class="coop-winner-title">${subtitle}</div>
          <div class="coop-winner-score">${
            winner ? `${match.scores[winner.id] ?? 0} rodadas` : ''
          }</div>
        </div>
        <div class="coop-faces" id="coop-faces"></div>
        <div class="practice-sub" style="text-align:center;margin-top:0.6rem">${foot}</div>
        <div class="practice-foot">
          <button type="button" class="practice-exit practice-done" id="coop-done">Pronto</button>
        </div>
      </div>
    `;
    this.fillFaces(match);
    for (const r of match.rounds.slice(0, match.roundIndex + 1)) {
      GameState.addVocab({ yiddish: r.yi, portuguese: r.pt });
    }
    this.root.querySelector('#coop-done')!.addEventListener('click', () => void this.exit());
  }

  private fillFaces(match: CoopMatchSnapshot): void {
    const el = this.root.querySelector('#coop-faces');
    if (!el) return;
    el.innerHTML = '';
    for (const p of match.players) {
      const card = document.createElement('div');
      card.className = 'coop-face';
      if (p.id === this.room.selfId) card.classList.add('self');
      if (match.phase !== 'lobby' && !match.alive[p.id]) card.classList.add('out');
      else if (
        match.phase === 'playing' &&
        (match.answers[p.id] ?? -1) >= 0 &&
        match.alive[p.id]
      ) {
        card.classList.add('standing');
      }
      card.innerHTML = `
        ${faceHtml(p, false)}
        <div class="coop-face-meta">
          <span class="coop-face-name">${escapeHtml(p.name)}${p.id === match.hostId ? ' ★' : ''}</span>
          <span class="coop-face-score">${
            match.phase === 'lobby'
              ? 'pronto'
              : match.alive[p.id]
                ? `${match.scores[p.id] ?? 0}`
                : 'fora'
          }</span>
        </div>
      `;
      el.appendChild(card);
    }
  }

  private refreshHighlight(): void {
    const match = this.match;
    if (!match || match.phase !== 'playing') return;
    const round = match.rounds[match.roundIndex];
    if (!round) return;

    const opts = this.root.querySelectorAll('.practice-opt');
    opts.forEach((el, i) => {
      const mine = match.alive[this.room.selfId] && i === this.selected;
      el.classList.toggle('selected', mine);
    });
    // Garante cabeça local mesmo antes do sync; reposiciona todas.
    const layer = this.root.querySelector('#coop-heroes');
    if (layer && !layer.querySelector(`[data-pid="${this.room.selfId}"]`)) {
      this.paintHeroes(match, round);
    } else {
      this.layoutHeroes(match, round);
    }
  }

  private tickTimer = (): void => {
    if (!this.match || this.match.phase !== 'playing') return;
    const left = this.match.deadline - Date.now();
    const pct = Math.max(0, Math.min(1, left / this.match.roundMs));
    const bar = this.root.querySelector('#coop-timer') as HTMLElement | null;
    if (bar) {
      bar.style.width = `${pct * 100}%`;
      bar.classList.toggle('urgent', pct < 0.28);
    }
    const round = this.match.rounds[this.match.roundIndex];
    if (round) this.layoutHeroes(this.match, round);
    this.timerRaf = requestAnimationFrame(this.tickTimer);
  };

  private async standOn(index: number): Promise<void> {
    if (!this.match || this.match.phase !== 'playing') return;
    if (!this.match.alive[this.room.selfId]) return;
    this.selected = index;
    const round = this.match.rounds[this.match.roundIndex];
    if (round) {
      const opts = this.root.querySelectorAll('.practice-opt');
      opts.forEach((el, i) => el.classList.toggle('selected', i === index));
      if (!this.root.querySelector(`#coop-heroes [data-pid="${this.room.selfId}"]`)) {
        this.paintHeroes(this.match, round);
      } else {
        this.layoutHeroes(this.match, round);
      }
    }
    await this.room.submitCoopAnswer(index);
  }

  private async exit(): Promise<void> {
    await this.room.leaveCoop();
    this.finishClose();
  }

  private finishClose(): void {
    this.destroy();
    this.onClose();
  }
}

function faceHtml(p: CoopPlayerInfo, big: boolean): string {
  const color = `#${(p.coat >>> 0).toString(16).padStart(6, '0')}`;
  const initial = (p.name.trim()[0] ?? '?').toUpperCase();
  return `<div class="coop-avatar${big ? ' big' : ''}" style="background:${color}">${escapeHtml(initial)}</div>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
