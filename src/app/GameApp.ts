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
import { LibraryRoom } from '../net/LibraryRoom';
import { LibraryPresence } from '../net/LibraryPresence';
import * as THREE from 'three';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export class GameApp {
  private renderer: THREE.WebGLRenderer;
  private labelRenderer: CSS2DRenderer;
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
  private libraryRoom = new LibraryRoom();
  private libraryPresence: LibraryPresence;
  private librarySyncAcc = 0;
  private defaultPlayerCoat = 0x8a3c3c;

  constructor(canvas: HTMLCanvasElement, uiRoot: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.inset = '0';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    this.labelRenderer.domElement.style.zIndex = '5';
    canvas.parentElement?.appendChild(this.labelRenderer.domElement);

    this.world = new ShtetlWorld();
    this.player = new FixedCameraPlayer(canvas);
    this.player.setGamepad(this.gamepad);
    this.player.setTouch(this.touch);

    // Personagem 3D do jogador
    this.playerRig = makePerson('player');
    this.world.scene.add(this.playerRig.root);
    this.libraryPresence = new LibraryPresence(this.world.getLibraryInterior());
    this.libraryPresence.setMicClickHandler(() => {
      void this.toggleLibraryMic();
    });

    this.ui = new UiController(uiRoot, {
      onStartGame: (opts) => this.startNewGame(opts),
      onBannerClosed: () => this.afterBanner(),
      onChapterContinue: () => this.advanceChapter(),
      onDialogueFinished: () => this.afterDialogue(),
      onRequestTitle: () => this.toTitle(),
      onSecretDialogue: () => this.ui.startSecretDialogue(),
      onLibraryJoin: (name, code) => this.completeLibraryJoin(name, code),
      onLibraryJoinCancel: () => this.cancelLibraryJoin(),
      onLibraryCoop: () => this.startLibraryCoop(),
    });
    this.ui.setTouch(this.touch);

    window.addEventListener('resize', () => this.onResize());
    requestAnimationFrame((t) => this.frame(t));
  }

  private onResize(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
    this.player.resize();
  }

  private rebuildPlayerRig(coat?: number): void {
    const prev = this.playerRig.root;
    const pos = prev.position.clone();
    const rotY = prev.rotation.y;
    this.world.scene.remove(prev);
    this.libraryPresence.detachLocalName();
    this.playerRig = makePerson('player', coat != null ? { coat } : undefined);
    this.playerRig.root.position.copy(pos);
    this.playerRig.root.rotation.y = rotY;
    this.world.scene.add(this.playerRig.root);
  }

  private startNewGame(opts?: { mobile?: boolean }): void {
    this.touch.setEnabled(!!opts?.mobile);
    this.footsteps.unlock();
    SoundManager.get().unlock();
    SoundManager.get().setTrack('shtetl');
    GameState.reset();
    if (this.world.isMounted()) this.dismount();
    this.world.refreshChapterVisibility();
    this.player.setPosition(this.world.spawnPlayerDefault());
    this.player.facing = Math.PI;
    this.player.setIndoor(false);
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
    void this.exitLibrarySession(false);
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

    // Montado: E sempre desce (não entra em prédios a cavalo)
    if (this.world.isMounted()) {
      this.dismount();
      return;
    }

    const target = this.world.nearestInteractable(this.player.position);
    if (!target) return;

    if (target.id === 'horse') {
      if (this.world.mountHorse()) {
        this.player.setMounted(true);
        this.player.setPosition(
          new THREE.Vector3(target.position.x, 0, target.position.z),
        );
        this.player.snapCamera();
        this.ui.setHint('[ E ] Descer do cavalo · Shift galopar');
      }
      return;
    }

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
        this.player.setIndoor(true, 'synagogue');
        this.player.snapCamera();
        SoundManager.get().setTrack('shul');
      }
      return;
    }

    if (target.id === 'school') {
      if (this.world.isInSchoolScene()) {
        this.world.setSchoolMode(false);
        this.player.setPosition(this.world.spawnOutsideSchool());
        this.player.facing = Math.PI;
        this.player.setIndoor(false);
        this.player.snapCamera();
        SoundManager.get().setTrack('shtetl');
        this.interactBlocked = true;
        this.eHeld = true;
      } else {
        this.world.setSchoolMode(true);
        this.player.setPosition(this.world.spawnInsideSchool());
        this.player.facing = 0;
        this.player.setIndoor(true, 'school');
        this.player.snapCamera();
        this.interactBlocked = true;
        this.eHeld = true;
      }
      return;
    }

    if (target.id === 'library') {
      if (this.world.isInLibraryScene()) {
        void this.exitLibrarySession(true);
      } else {
        this.ui.showLibraryJoin({
          name: LibraryRoom.loadSavedName(),
          code: LibraryRoom.loadSavedCode(),
        });
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

  private async completeLibraryJoin(name: string, code: string): Promise<void> {
    try {
      const joined = await this.libraryRoom.join(name, code, {
        onPresence: (userId, state) => {
          this.libraryPresence.upsert(userId, state);
        },
        onPeerCount: (count) => {
          if (this.libraryRoom.isConnected) {
            this.ui.updateLibraryHud(this.libraryRoom.roomCode, count);
          }
        },
        onPeerStream: () => {
          /* áudio tratado no LibraryRoom */
        },
        onError: (message) => {
          this.ui.setHint(message);
        },
        onCoopMatch: (match) => {
          this.ui.applyCoopMatch(match);
        },
      });

      this.ui.hideLibraryJoin();
      this.rebuildPlayerRig(joined.coat);
      this.world.setLibraryMode(true);
      this.player.setPosition(this.world.spawnInsideLibrary());
      this.player.facing = 0;
      this.player.setIndoor(true, 'library');
      this.player.snapCamera();
      this.libraryPresence.attachLocalName(this.playerRig.root, joined.name, false);
      this.ui.enterPlaying();
      this.ui.showLibraryHud(joined.code, this.libraryRoom.playerCount);
      SoundManager.get().pause();
      this.interactBlocked = true;
      this.eHeld = true;
      this.libraryRoom.publish({
        x: this.player.position.x,
        z: this.player.position.z,
        facing: this.player.facing,
        moving: false,
      });
    } catch (e) {
      this.ui.setLibraryJoinError(
        e instanceof Error ? e.message : 'Não foi possível entrar na sala.',
      );
    }
  }

  private cancelLibraryJoin(): void {
    this.ui.hideLibraryJoin();
    this.ui.enterPlaying();
    this.interactBlocked = true;
    this.eHeld = true;
  }

  private async toggleLibraryMic(): Promise<void> {
    if (!this.libraryRoom.isConnected) return;
    const on = await this.libraryRoom.setMicEnabled(!this.libraryRoom.micOn);
    this.libraryPresence.setLocalMicOn(on);
    this.ui.updateLibraryHud(
      this.libraryRoom.roomCode,
      this.libraryRoom.playerCount,
    );
  }

  private startLibraryCoop(): void {
    if (!this.libraryRoom.isConnected || !this.world.isInLibraryScene()) return;
    if (this.ui.isInCoop()) return;
    this.ui.startCoopFall(this.libraryRoom);
  }

  private async exitLibrarySession(returnOutside: boolean): Promise<void> {
    if (this.ui.isInCoop()) {
      this.ui.applyCoopMatch(null);
    }
    this.libraryPresence.clear();
    await this.libraryRoom.leave();
    this.ui.hideLibraryHud();
    this.rebuildPlayerRig(this.defaultPlayerCoat);

    if (this.world.isInLibraryScene()) {
      this.world.setLibraryMode(false);
    }
    if (returnOutside) {
      this.player.setPosition(this.world.spawnOutsideLibrary());
      this.player.facing = Math.PI;
      this.player.setIndoor(false);
      this.player.snapCamera();
      SoundManager.get().setTrack('shtetl');
      SoundManager.get().resume();
      this.ui.enterPlaying();
      this.interactBlocked = true;
      this.eHeld = true;
    }
  }

  private dismount(): void {
    const pos = this.world.dismountHorse();
    this.player.setMounted(false);
    if (pos) this.player.setPosition(pos);
    this.playerRig.root.position.y = 0;
    this.player.snapCamera();
    this.ui.setHint(chapterObjectiveHint());
  }

  private updateHints(): void {
    if (this.ui.currentMode !== 'playing') return;

    if (this.world.isMounted()) {
      this.ui.setHint('[ E ] Descer do cavalo · WASD andar · Shift galopar');
      return;
    }

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
      } else if (target.id === 'school') {
        if (this.world.isInSchoolScene()) {
          this.ui.setHint('[ E ] Sair da escola');
        } else {
          this.ui.setHint('[ E ] Entrar na escola');
        }
      } else if (target.id === 'library') {
        if (this.world.isInLibraryScene()) {
          this.ui.setHint('[ E ] Sair da biblioteca');
        } else {
          this.ui.setHint('[ E ] Entrar na biblioteca');
        }
      } else if (target.id === 'horse') {
        this.ui.setHint('[ E ] Montar no cavalo');
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
    this.world.updateGrass(dt, {
      x: this.player.position.x,
      z: this.player.position.z,
      vx: this.player.velocity.x,
      vz: this.player.velocity.z,
      moving: this.player.moving,
      sprinting: this.player.sprinting,
    });

    this.world.updateVillagers(dt, !canMove, {
      x: this.player.position.x,
      z: this.player.position.z,
    });

    const mounted = this.world.isMounted();
    this.world.updateRide(dt, {
      x: this.player.position.x,
      z: this.player.position.z,
      facing: this.player.facing,
      moving: canMove && this.player.moving,
    });

    const moving = canMove && this.player.moving && !mounted;
    this.playerRig.root.position.x = this.player.position.x;
    this.playerRig.root.position.z = this.player.position.z;
    this.playerRig.root.rotation.y = this.player.facing;

    if (mounted) {
      // Pose sentada na sela
      this.playerRig.root.position.y = 1.15;
      this.playerRig.legL.rotation.x = -0.95;
      this.playerRig.legR.rotation.x = -0.95;
      this.playerRig.armL.rotation.x = -0.4;
      this.playerRig.armR.rotation.x = -0.4;
      this.playerRig.armL.rotation.z = 0.25;
      this.playerRig.armR.rotation.z = -0.25;
      this.footsteps.update(this.walkPhase.value, false);
      this.footsteps.updateHorse(
        this.world.getRidePhase(),
        canMove && this.player.moving,
      );
    } else {
      applyWalkCycle(this.playerRig, moving, dt, this.walkPhase);
      this.footsteps.update(this.walkPhase.value, moving);
      this.footsteps.updateHorse(0, false);
    }

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

    if (this.libraryRoom.isConnected && this.world.isInLibraryScene()) {
      this.librarySyncAcc += dt;
      if (this.librarySyncAcc >= 0.08) {
        this.librarySyncAcc = 0;
        this.libraryRoom.publish({
          x: this.player.position.x,
          z: this.player.position.z,
          facing: this.player.facing,
          moving,
        });
      }
      this.libraryPresence.update(dt);
      const { localLevel, peerLevels } = this.libraryRoom.updateSpatialAudio(
        this.player.position.x,
        this.player.position.z,
        this.libraryPresence.getRemotePositions(),
      );
      this.libraryPresence.setSpeakingLevels(localLevel, peerLevels);
    }

    this.renderer.render(this.world.scene, this.player.camera);
    this.labelRenderer.render(this.world.scene, this.player.camera);
    requestAnimationFrame((t) => this.frame(t));
  }
}
