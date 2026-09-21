import { GameState } from '../state/GameState';
import {
  chapterObjectiveHint,
  getDialogueFor,
  type NpcId,
} from '../content/chapterFlow';
import {
  ShtetlWorld,
  makePerson,
  applyWalkCycle,
  type PersonRig,
} from '../world/ShtetlWorld';
import { FixedCameraPlayer } from '../world/FixedCameraPlayer';
import { UiController } from '../ui/UiController';
import { Footsteps } from '../audio/Footsteps';
import { SoundManager } from '../audio/SoundManager';
import { GamepadInput, GP } from '../input/GamepadInput';
import { TouchControls } from '../input/TouchControls';
import * as THREE from 'three';

export class GameApp {
  private renderer: THREE.WebGLRenderer;
  private world: ShtetlWorld;
  private player: FixedCameraPlayer;
  private ui: UiController;
  private playerRig: PersonRig;
  private walkPhase = { value: 0 };
  private footsteps = new Footsteps();
  private gamepad = new GamepadInput();
  private touch = new TouchControls();
  private last = performance.now();
  private eHeld = false;
  private interactBlocked = false;
  private playing = false;

  constructor(canvas: HTMLCanvasElement, uiRoot: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;

    this.world = new ShtetlWorld();
    this.player = new FixedCameraPlayer(canvas);
    this.player.setGamepad(this.gamepad);
    this.player.setTouch(this.touch);

    // Personagem 3D do jogador
    this.playerRig = makePerson('player');
    this.world.scene.add(this.playerRig.root);

    this.ui = new UiController(uiRoot, {
      onStartGame: (opts) => this.startNewGame(opts),
      onBannerClosed: () => this.afterBanner(),
      onChapterContinue: () => this.advanceChapter(),
      onDialogueFinished: () => this.afterDialogue(),
      onRequestTitle: () => this.toTitle(),
      onSecretDialogue: () => this.ui.startSecretDialogue(),
    });
    this.ui.setTouch(this.touch);

    window.addEventListener('resize', () => this.onResize());
    requestAnimationFrame((t) => this.frame(t));
  }

  private onResize(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.player.resize();
  }

  private startNewGame(opts?: { mobile?: boolean }): void {
    this.touch.setEnabled(!!opts?.mobile);
    this.footsteps.unlock();
    SoundManager.get().unlock();
    SoundManager.get().setTrack('shtetl');
    GameState.reset();
    this.world.refreshChapterVisibility();
    this.player.setPosition(this.world.spawnPlayerDefault());
    this.player.facing = Math.PI;
    this.playing = true;
    this.ui.showBanner(1);
  }

  private afterBanner(): void {
    this.ui.enterPlaying();
    this.world.refreshChapterVisibility();
  }

  private afterDialogue(): void {
    this.world.refreshChapterVisibility();
    this.ui.enterPlaying();
    this.ui.refreshHud();
    // Evita reabrir o diálogo no mesmo A/E ainda pressionado
    this.eHeld = true;
    this.interactBlocked = true;
    if (GameState.chapterReadyForInn()) {
      this.ui.setHint('Missão ok — volte à hospedaria.');
    }
  }

  private toTitle(): void {
    this.playing = false;
    this.touch.setEnabled(false);
    this.touch.setGameplayVisible(false);
    GameState.reset();
    this.ui.showTitle();
  }

  private advanceChapter(): void {
    const chapter = GameState.chapter;
    if (chapter === 5) {
      GameState.flags.chapter5Complete = true;
      this.ui.showEnding();
      return;
    }

    if (chapter === 1) GameState.flags.chapter1Complete = true;
    if (chapter === 2) GameState.flags.chapter2Complete = true;
    if (chapter === 3) GameState.flags.chapter3Complete = true;
    if (chapter === 4) GameState.flags.chapter4Complete = true;

    const next = (chapter + 1) as 2 | 3 | 4 | 5;
    GameState.chapter = next;
    this.player.setPosition(this.world.spawnPlayerNearInn());
    this.world.refreshChapterVisibility();
    this.ui.showBanner(next);
  }

  private tryInteract(): void {
    if (this.ui.currentMode !== 'playing') return;
    const target = this.world.nearestInteractable(this.player.position);
    if (!target) return;

    if (target.id === 'inn') {
      if (!GameState.flags.lodgingGranted) {
        this.ui.setHint('A hospedaria... talvez Rivke possa ajudar.');
        return;
      }
      if (GameState.chapterReadyForInn()) {
        this.ui.showChapterComplete(GameState.chapter);
      }
      return;
    }

    if (target.id === 'synagogue') {
      if (this.world.isInSynagogueScene()) {
        this.world.setSynagogueMode(false);
        this.player.setPosition(this.world.spawnOutsideSynagogue());
        this.player.facing = 0;
        this.player.setIndoor(false);
        this.player.snapCamera();
        SoundManager.get().setTrack('shtetl');
      } else {
        this.world.setSynagogueMode(true);
        this.player.setPosition(this.world.spawnInsideSynagogue());
        this.player.facing = 0;
        this.player.setIndoor(true);
        this.player.snapCamera();
        SoundManager.get().setTrack('shul');
      }
      return;
    }

    const tree = getDialogueFor(target.id as NpcId);
    if (!tree) {
      if (GameState.chapter === 4 && !GameState.flags.chapter4Photo) {
        this.ui.setHint('Examine a fotografia perto do poço primeiro.');
      }
      return;
    }

    this.ui.startDialogue(tree, target.id);
  }

  private updateHints(): void {
    if (this.ui.currentMode !== 'playing') return;

    const target = this.world.nearestInteractable(this.player.position);
    if (target) {
      if (target.id === 'inn') {
        if (GameState.chapterReadyForInn()) {
          this.ui.setHint('[ E ] Entrar na hospedaria');
        } else if (GameState.flags.lodgingGranted) {
          this.ui.setHint('A hospedaria — seu teto por enquanto.');
        } else {
          this.ui.setHint('A hospedaria... talvez Rivke possa ajudar.');
        }
      } else if (target.id === 'synagogue') {
        if (this.world.isInSynagogueScene()) {
          this.ui.setHint('[ E ] Sair da sinagoga');
        } else {
          this.ui.setHint('[ E ] Entrar na sinagoga');
        }
      } else if (target.id === 'photo') {
        this.ui.setHint('[ E ] Examinar o objeto');
      } else {
        this.ui.setHint(`[ E ] Falar com ${target.name}`);
      }
      return;
    }
    this.ui.setHint(chapterObjectiveHint());
  }

  private frame(now: number): void {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;

    this.gamepad.update();
    this.ui.pollGamepad(this.gamepad);
    this.ui.pollTouch();
    this.ui.setGamepadStatus(this.gamepad.isConnected, this.gamepad.displayName);

    const canMove =
      this.playing && this.ui.currentMode === 'playing';

    this.player.update(dt, this.world, canMove);

    this.world.updateVillagers(dt, !canMove, {
      x: this.player.position.x,
      z: this.player.position.z,
    });

    const moving = canMove && this.player.moving;
    this.playerRig.root.position.x = this.player.position.x;
    this.playerRig.root.position.z = this.player.position.z;
    this.playerRig.root.rotation.y = this.player.facing;

    applyWalkCycle(this.playerRig, moving, dt, this.walkPhase);
    this.footsteps.update(this.walkPhase.value, moving);

    const eDown =
      this.player.justPressed('KeyE') ||
      this.gamepad.isDown(GP.A) ||
      this.touch.isInteractDown();
    if (!eDown) this.interactBlocked = false;
    if (canMove && eDown && !this.eHeld && !this.interactBlocked) {
      this.tryInteract();
    }
    this.eHeld = eDown;

    if (canMove) this.updateHints();

    this.renderer.render(this.world.scene, this.player.camera);
    requestAnimationFrame((t) => this.frame(t));
  }
}
