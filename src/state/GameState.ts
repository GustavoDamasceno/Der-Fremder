export type ChapterId = 1 | 2 | 3 | 4 | 5;

export type EndingId = 'fremder' | 'gast' | 'einer' | 'secret';

export interface VocabEntry {
  yiddish: string;
  portuguese: string;
}

export interface GameFlags {
  metRivke: boolean;
  metYankev: boolean;
  metTsipe: boolean;
  metShloyme: boolean;
  rivkeConversationDone: boolean;
  lodgingGranted: boolean;
  chapter1Complete: boolean;
  chapter2Bread: boolean;
  chapter2Family: boolean;
  chapter2Complete: boolean;
  chapter3Friend: boolean;
  chapter3Shloyme: boolean;
  chapter3Complete: boolean;
  chapter4Photo: boolean;
  chapter4Letter: boolean;
  chapter4Complete: boolean;
  chapter5Truth: boolean;
  choseStay: boolean;
  choseLeave: boolean;
  chapter5Complete: boolean;
}

const DEFAULT_FLAGS: GameFlags = {
  metRivke: false,
  metYankev: false,
  metTsipe: false,
  metShloyme: false,
  rivkeConversationDone: false,
  lodgingGranted: false,
  chapter1Complete: false,
  chapter2Bread: false,
  chapter2Family: false,
  chapter2Complete: false,
  chapter3Friend: false,
  chapter3Shloyme: false,
  chapter3Complete: false,
  chapter4Photo: false,
  chapter4Letter: false,
  chapter4Complete: false,
  chapter5Truth: false,
  choseStay: false,
  choseLeave: false,
  chapter5Complete: false,
};

class GameStateStore {
  suspicion = 75;
  reputation = 10;
  knowledge = 0;
  chapter: ChapterId = 1;
  vocab: VocabEntry[] = [
    { yiddish: 'gut', portuguese: 'bom' },
    { yiddish: 'a gutn tog', portuguese: 'um bom dia' },
    { yiddish: 'vos makhstu?', portuguese: 'como você está?' },
  ];
  flags: GameFlags = { ...DEFAULT_FLAGS };
  playerName = 'Fremder';
  ending: EndingId | null = null;

  reset(): void {
    this.suspicion = 75;
    this.reputation = 10;
    this.knowledge = 0;
    this.chapter = 1;
    this.vocab = [
      { yiddish: 'gut', portuguese: 'bom' },
      { yiddish: 'a gutn tog', portuguese: 'um bom dia' },
      { yiddish: 'vos makhstu?', portuguese: 'como você está?' },
    ];
    this.flags = { ...DEFAULT_FLAGS };
    this.ending = null;
  }

  adjustSuspicion(delta: number): void {
    this.suspicion = Math.max(0, Math.min(100, this.suspicion + delta));
  }

  adjustReputation(delta: number): void {
    this.reputation = Math.max(0, Math.min(100, this.reputation + delta));
  }

  addVocab(entry: VocabEntry): boolean {
    const exists = this.vocab.some(
      (v) => v.yiddish.toLowerCase() === entry.yiddish.toLowerCase(),
    );
    if (exists) return false;
    this.vocab.push(entry);
    this.knowledge = Math.min(100, this.knowledge + 8);
    return true;
  }

  applyFlags(partial: Partial<GameFlags>): void {
    Object.assign(this.flags, partial);
  }

  isGameOver(): boolean {
    return this.suspicion >= 100;
  }

  /** Calcula o final do Cap. 5. */
  resolveEnding(): EndingId {
    if (this.flags.choseLeave) {
      this.ending = 'gast';
      return this.ending;
    }

    const secretReady =
      this.suspicion <= 20 &&
      this.reputation >= 50 &&
      this.knowledge >= 56 &&
      this.flags.metRivke &&
      this.flags.metYankev &&
      this.flags.metTsipe &&
      this.flags.metShloyme;

    if (secretReady && this.flags.choseStay) {
      this.ending = 'secret';
      return this.ending;
    }

    if (this.flags.choseStay && this.reputation >= 30 && this.suspicion <= 40) {
      this.ending = 'einer';
      return this.ending;
    }

    this.ending = 'gast';
    return this.ending;
  }

  suspicionLabel(): string {
    const s = this.suspicion;
    if (s >= 100) return 'FREMDEM!';
    if (s >= 75) return 'Ele definitivamente não é daqui.';
    if (s >= 50) return 'De onde esse rapaz veio?';
    if (s >= 25) return 'Hmm... estranho...';
    return 'Ele parece ser um dos nossos.';
  }

  chapterReadyForInn(): boolean {
    const f = this.flags;
    switch (this.chapter) {
      case 1:
        return f.lodgingGranted && !f.chapter1Complete;
      case 2:
        return f.chapter2Bread && f.chapter2Family && !f.chapter2Complete;
      case 3:
        return f.chapter3Friend && f.chapter3Shloyme && !f.chapter3Complete;
      case 4:
        return f.chapter4Photo && f.chapter4Letter && !f.chapter4Complete;
      case 5:
        return f.chapter5Truth && (f.choseStay || f.choseLeave) && !f.chapter5Complete;
      default:
        return false;
    }
  }
}

export const GameState = new GameStateStore();
