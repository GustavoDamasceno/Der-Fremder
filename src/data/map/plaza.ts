/** 0=grass 1=path 2=wall 3=building 4=tree 5=well 6=inn door 7=flower */
export const TILE = {
  GRASS: 0,
  PATH: 1,
  WALL: 2,
  BUILDING: 3,
  TREE: 4,
  WELL: 5,
  INN: 6,
  FLOWER: 7,
  ROOF: 8,
} as const;

export const TILE_SIZE = 32;
export const MAP_W = 24;
export const MAP_H = 16;

/**
 * Praça central do shtetl — layout lógico.
 * 3 = prédios sólidos, 6 = porta da hospedaria (interativa).
 */
export const PLAZA_MAP: number[][] = [
  [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  [4, 3, 3, 3, 3, 0, 0, 1, 1, 1, 0, 0, 3, 3, 3, 8, 8, 0, 0, 3, 3, 3, 4, 4],
  [4, 3, 3, 3, 3, 0, 0, 1, 1, 1, 0, 0, 3, 3, 3, 3, 3, 0, 0, 3, 3, 3, 4, 4],
  [4, 3, 3, 3, 3, 0, 7, 1, 1, 1, 7, 0, 3, 6, 3, 3, 3, 0, 0, 3, 3, 3, 0, 4],
  [4, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
  [4, 0, 7, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0, 5, 0, 0, 0, 7, 0, 0, 4],
  [4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4],
  [4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4],
  [4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4],
  [4, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 4],
  [4, 0, 3, 3, 3, 0, 0, 1, 1, 1, 0, 3, 3, 3, 0, 1, 0, 0, 3, 3, 3, 8, 0, 4],
  [4, 0, 3, 3, 3, 0, 0, 1, 1, 1, 0, 3, 3, 3, 0, 1, 0, 0, 3, 3, 3, 3, 0, 4],
  [4, 0, 3, 3, 3, 7, 0, 1, 1, 1, 0, 3, 3, 3, 0, 1, 0, 7, 3, 3, 3, 3, 0, 4],
  [4, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 4],
  [4, 4, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 4, 4, 4],
  [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
];

export const SOLID_TILES: Set<number> = new Set([
  TILE.WALL,
  TILE.BUILDING,
  TILE.TREE,
  TILE.WELL,
  TILE.ROOF,
  TILE.INN,
]);

export interface NpcSpawn {
  id: 'rivke' | 'yankev' | 'tsipe' | 'shloyme';
  name: string;
  tileX: number;
  tileY: number;
  color: number;
  dialogueId: string;
}

export const NPC_SPAWNS: NpcSpawn[] = [
  { id: 'rivke', name: 'Rivke', tileX: 9, tileY: 5, color: 0x6b4c8a, dialogueId: 'rivke-ch1' },
  { id: 'yankev', name: 'Yankev', tileX: 4, tileY: 9, color: 0xb85c38, dialogueId: 'yankev-brief' },
  { id: 'tsipe', name: 'Tsipe', tileX: 18, tileY: 9, color: 0x3d7ea6, dialogueId: 'tsipe-brief' },
  { id: 'shloyme', name: 'Reb Shloyme', tileX: 16, tileY: 5, color: 0x4a4a4a, dialogueId: 'shloyme-ch3' },
];

export const PLAYER_SPAWN = { tileX: 12, tileY: 13 };

/** Ponto da fotografia (Cap. 4) — ao lado do poço. */
export const PHOTO_SPOT = { tileX: 17, tileY: 5 };
