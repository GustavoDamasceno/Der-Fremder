import './style.css';
import { GameApp } from './app/GameApp';

async function boot(): Promise<void> {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  const uiRoot = document.getElementById('ui-root') as HTMLElement;
  if (!canvas || !uiRoot) {
    throw new Error('Canvas ou UI root não encontrados');
  }

  new GameApp(canvas, uiRoot);
}

boot();
