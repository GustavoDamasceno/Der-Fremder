import type { DialogueOption, DialogueTree, DialogueTurn } from '../data/dialogue/chapter1';
import { GameState } from '../state/GameState';

export interface TurnResult {
  reaction: string;
  suspicionDelta: number;
  learned: string[];
  done: boolean;
  nextTurn: DialogueTurn | null;
  lodgingGranted: boolean;
}

export class DialogueEngine {
  private tree: DialogueTree;
  private currentId: string;
  private afterChoiceQueue: string | null = null;

  constructor(tree: DialogueTree) {
    this.tree = tree;
    this.currentId = tree.startId;
  }

  get title(): string {
    return this.tree.encounterTitle;
  }

  current(): DialogueTurn {
    return this.tree.turns[this.currentId];
  }

  isChoiceTurn(): boolean {
    const t = this.current();
    return t.kind === 'recognition' || t.kind === 'response' || t.kind === 'choice';
  }

  advanceNarration(): DialogueTurn | null {
    const t = this.current();
    if (t.kind !== 'narration') return t;

    if (!t.next) {
      return null;
    }
    this.currentId = t.next;
    if (this.currentId === 'lodging') {
      GameState.flags.lodgingGranted = true;
    }
    return this.current();
  }

  applyOption(option: DialogueOption): TurnResult {
    GameState.adjustSuspicion(option.suspicionDelta);
    if (option.reputationDelta) {
      GameState.adjustReputation(option.reputationDelta);
    }

    const learned: string[] = [];
    if (option.learn) {
      for (const entry of option.learn) {
        if (GameState.addVocab(entry)) {
          learned.push(`${entry.yiddish} = ${entry.portuguese}`);
        }
      }
    }

    if (option.setFlags) {
      GameState.applyFlags(option.setFlags);
    }

    const nextId = this.current().next ?? null;
    if (nextId === 'lodging') {
      GameState.flags.lodgingGranted = true;
    }

    if (!nextId) {
      return {
        reaction: option.reaction,
        suspicionDelta: option.suspicionDelta,
        learned,
        done: true,
        nextTurn: null,
        lodgingGranted: GameState.flags.lodgingGranted,
      };
    }

    this.afterChoiceQueue = nextId;
    return {
      reaction: option.reaction,
      suspicionDelta: option.suspicionDelta,
      learned,
      done: false,
      nextTurn: this.tree.turns[nextId],
      lodgingGranted: GameState.flags.lodgingGranted,
    };
  }

  consumeQueuedTurn(): DialogueTurn | null {
    if (!this.afterChoiceQueue) return null;
    this.currentId = this.afterChoiceQueue;
    this.afterChoiceQueue = null;
    return this.current();
  }

  markNpcDone(npcId: string): void {
    if (npcId === 'rivke') {
      GameState.flags.metRivke = true;
      GameState.flags.rivkeConversationDone = true;
    }
    if (npcId === 'yankev') GameState.flags.metYankev = true;
    if (npcId === 'tsipe') GameState.flags.metTsipe = true;
    if (npcId === 'shloyme') GameState.flags.metShloyme = true;
  }
}
