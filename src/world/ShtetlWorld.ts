import * as THREE from 'three';
import type { NpcId } from '../content/chapterFlow';
import { GameState } from '../state/GameState';

export interface Collider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/** Colisão circular — melhor para móveis e NPCs. */
export interface CircleSolid {
  x: number;
  z: number;
  r: number;
}

export interface WorldNpc {
  id: NpcId;
  name: string;
  mesh: THREE.Object3D;
  position: THREE.Vector3;
  /** Raio de colisão no chão. */
  radius: number;
  /** Rig para animação de caminhada (moradores que patrulham). */
  rig?: PersonRig;
  patrol?: {
    points: { x: number; z: number }[];
    index: number;
    wait: number;
    speed: number;
    phase: { value: number };
    /** 1 = avançar pontos, -1 = voltar. */
    dir: 1 | -1;
    /** Tempo restante andando livre (após bater em parede/pessoa). */
    freeLeft: number;
    /** Direção livre (ângulo Y, mesmo que mesh.rotation.y). */
    heading: number;
  };
}

export interface Interactable {
  id: NpcId;
  name: string;
  position: THREE.Vector3;
  radius: number;
}

type GrazingCow = {
  mesh: THREE.Group;
  legs: THREE.Object3D[];
  points: { x: number; z: number }[];
  index: number;
  wait: number;
  speed: number;
  phase: number;
  radius: number;
};

const COLORS = {
  grass: 0x4a7c3f,
  grassDark: 0x3f6e36,
  path: 0xc4b08a,
  pathDark: 0xa8926c,
  wall: 0xe8dcc8,
  wallShade: 0xd4c4a8,
  roof: 0x8b3a2a,
  roofDark: 0x6e2e22,
  wood: 0x6b4a2e,
  woodLight: 0x8a6340,
  stone: 0x7a7a72,
  stoneDark: 0x5a5a58,
  leaf: 0x2f5d28,
  leafLight: 0x3f7a38,
  gold: 0xc9a227,
  skin: 0xe8c4a0,
  cream: 0xf0e6d0,
};

function mat(color: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color });
}

function box(
  w: number,
  h: number,
  d: number,
  color: number,
  x: number,
  y: number,
  z: number,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cyl(
  rTop: number,
  rBot: number,
  h: number,
  color: number,
  x: number,
  y: number,
  z: number,
  segments = 10,
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(rTop, rBot, h, segments),
    mat(color),
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

type PersonStyle =
  | 'rivke'
  | 'yankev'
  | 'tsipe'
  | 'shloyme'
  | 'player'
  | 'mendl'
  | 'khaye'
  | 'berl'
  | 'sora'
  | 'leib'
  | 'dina'
  | 'hazan'
  | 'baal'
  | 'rav'
  | 'soyker'
  | 'rokhel'
  | 'feldsher'
  | 'melamed'
  | 'shnayder'
  | 'freyde'
  | 'motl';

export type PersonRig = {
  root: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
};

type FaceOpts = {
  skin: number;
  eyeWhite?: number;
  iris: number;
  brow: number;
  lip: number;
  /** Expressão: boca um pouco aberta / sorriso. */
  smile?: number;
  /** Sobrancelhas mais baixas (mais velho / sério). */
  browDrop?: number;
};

/** Rosto low-poly legível da câmera 3/4. */
function makeFace(opts: FaceOpts): THREE.Group {
  const face = new THREE.Group();
  const white = opts.eyeWhite ?? 0xf5f0e8;
  const smile = opts.smile ?? 0.02;
  const browY = 1.78 - (opts.browDrop ?? 0);

  for (const side of [-1, 1] as const) {
    // Globo ocular
    face.add(box(0.07, 0.055, 0.04, white, side * 0.08, 1.74, 0.18));
    // Íris + pupila
    face.add(box(0.045, 0.04, 0.03, opts.iris, side * 0.08, 1.74, 0.2));
    face.add(box(0.02, 0.02, 0.02, 0x1a1210, side * 0.08, 1.74, 0.215));
    // Sobrancelha
    face.add(box(0.09, 0.025, 0.03, opts.brow, side * 0.085, browY, 0.19));
  }

  // Nariz
  face.add(box(0.05, 0.08, 0.07, opts.skin, 0, 1.68, 0.21));
  face.add(box(0.07, 0.03, 0.04, opts.skin, 0, 1.64, 0.23));

  // Boca
  face.add(box(0.1, 0.025, 0.03, opts.lip, 0, 1.58 + smile * 0.3, 0.2));
  if (smile > 0.03) {
    face.add(box(0.12, 0.015, 0.02, opts.lip, 0, 1.565, 0.195));
  }

  // Bochechas leves
  face.add(box(0.05, 0.04, 0.03, 0xe0a888, -0.14, 1.64, 0.16));
  face.add(box(0.05, 0.04, 0.03, 0xe0a888, 0.14, 1.64, 0.16));

  // Orelhas
  face.add(box(0.04, 0.07, 0.05, opts.skin, -0.22, 1.7, 0.02));
  face.add(box(0.04, 0.07, 0.05, opts.skin, 0.22, 1.7, 0.02));

  return face;
}

/** Payot — cachos laterais tradicionais. */
function makePayot(hair: number, length = 0.35): THREE.Group {
  const g = new THREE.Group();
  for (const side of [-1, 1] as const) {
    const curl = new THREE.Group();
    curl.position.set(side * 0.2, 1.68, 0.06);
    for (let i = 0; i < 4; i++) {
      const bead = new THREE.Mesh(
        new THREE.SphereGeometry(0.045 - i * 0.004, 8, 8),
        mat(hair),
      );
      bead.position.set(side * 0.02 * i, -i * (length / 4), 0.02 * Math.sin(i));
      curl.add(bead);
    }
    g.add(curl);
  }
  return g;
}

function makeBeard(
  color: number,
  length: 'short' | 'full' | 'long',
): THREE.Group {
  const g = new THREE.Group();
  if (length === 'short') {
    // Bigode + queixo
    g.add(box(0.16, 0.04, 0.06, color, 0, 1.6, 0.2));
    const chin = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), mat(color));
    chin.position.set(0, 1.52, 0.16);
    chin.scale.set(1.1, 0.9, 0.75);
    g.add(chin);
  } else if (length === 'full') {
    const beard = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), mat(color));
    beard.position.set(0, 1.48, 0.14);
    beard.scale.set(1.05, 1.25, 0.85);
    g.add(beard);
    g.add(box(0.18, 0.05, 0.06, color, 0, 1.62, 0.2));
    // Laterais
    g.add(box(0.06, 0.22, 0.08, color, -0.16, 1.55, 0.1));
    g.add(box(0.06, 0.22, 0.08, color, 0.16, 1.55, 0.1));
  } else {
    // Barba longa de reb
    const beard = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), mat(color));
    beard.position.set(0, 1.42, 0.12);
    beard.scale.set(1.1, 1.7, 0.9);
    g.add(beard);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), mat(color));
    tip.position.set(0, 1.18, 0.14);
    tip.scale.set(0.9, 1.2, 0.7);
    g.add(tip);
    g.add(box(0.2, 0.05, 0.06, color, 0, 1.64, 0.2));
    g.add(box(0.07, 0.35, 0.1, color, -0.17, 1.48, 0.08));
    g.add(box(0.07, 0.35, 0.1, color, 0.17, 1.48, 0.08));
  }
  return g;
}

/** Lenço / tichel feminino. */
function makeTichel(color: number, accent: number): THREE.Group {
  const g = new THREE.Group();
  const wrap = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 12, 10),
    mat(color),
  );
  wrap.position.set(0, 1.82, -0.02);
  wrap.scale.set(1.05, 0.7, 1.05);
  g.add(wrap);
  // Queda atrás
  g.add(box(0.4, 0.35, 0.12, color, 0, 1.7, -0.2));
  // Nó / faixa na frente
  g.add(box(0.32, 0.06, 0.08, accent, 0, 1.78, 0.18));
  return g;
}

/** Sefer Torah — rolos + manto, para o rabino segurar. */
function makeSeferTorah(): THREE.Group {
  const g = new THREE.Group();
  // Manto (meil)
  g.add(box(0.52, 0.82, 0.32, 0x1a2a6a, 0, 0, 0));
  g.add(box(0.56, 0.07, 0.36, COLORS.gold, 0, 0.32, 0));
  g.add(box(0.56, 0.05, 0.36, COLORS.gold, 0, -0.28, 0));
  const star = makeStarOfDavid(0.16, COLORS.gold);
  star.position.set(0, 0.02, 0.18);
  g.add(star);
  // Atzei chaim (eixos de madeira)
  g.add(cyl(0.055, 0.055, 1.12, 0xc4a882, -0.16, 0, 0, 8));
  g.add(cyl(0.055, 0.055, 1.12, 0xc4a882, 0.16, 0, 0, 8));
  // Pomo / coroa nos eixos
  for (const sx of [-0.16, 0.16] as const) {
    g.add(cyl(0.085, 0.085, 0.1, COLORS.gold, sx, 0.6, 0, 8));
    g.add(cyl(0.085, 0.085, 0.1, COLORS.gold, sx, -0.6, 0, 8));
  }
  g.add(box(0.48, 0.05, 0.1, COLORS.gold, 0, 0.7, 0));
  return g;
}

function makePerson(style: PersonStyle): PersonRig {
  const g = new THREE.Group();

  type Pal = {
    coat: number;
    accent: number;
    hair: number;
    skin: number;
    iris: number;
    lip: number;
    pants: number;
  };
  const palette: Record<PersonStyle, Pal> = {
    // Rivke — dona da hospedaria, tichel claro, vestido vinho
    rivke: {
      coat: 0x6b3a55,
      accent: 0xc4a882,
      hair: 0xb8b0a8,
      skin: 0xe2b890,
      iris: 0x4a6a4a,
      lip: 0xa85a5a,
      pants: 0x3a2a32,
    },
    // Yankev — padeiro, casaco marrom, avental, kipá + boné
    yankev: {
      coat: 0x6e4228,
      accent: 0xd8c9a8,
      hair: 0x2a1c14,
      skin: 0xd4a878,
      iris: 0x3a4a6a,
      lip: 0x8a5048,
      pants: 0x2a2420,
    },
    // Tsipe — jovem, vestido azul, lenço floral
    tsipe: {
      coat: 0x3a6a8a,
      accent: 0xc45c7a,
      hair: 0x3a2418,
      skin: 0xe8c4a0,
      iris: 0x4a5a8a,
      lip: 0xb85a68,
      pants: 0x2a2a32,
    },
    // Reb Shloyme — kapote preta, chapéu, barba longa
    shloyme: {
      coat: 0x1c1c1c,
      accent: 0xe8e4dc,
      hair: 0xdcd8d0,
      skin: 0xd8b090,
      iris: 0x3a3a4a,
      lip: 0x8a6a60,
      pants: 0x141414,
    },
    // Jogador — viajante / fremder com cara de jovem judeu
    player: {
      coat: 0x8a3c3c,
      accent: 0x2f4a6e,
      hair: 0x1e1814,
      skin: 0xe0b890,
      iris: 0x3a5a4a,
      lip: 0x9a5a55,
      pants: 0x2a2a32,
    },
    // Moradores secundários
    mendl: {
      coat: 0x4a5a48,
      accent: 0xc4b08a,
      hair: 0xb0a898,
      skin: 0xd4a878,
      iris: 0x4a5a3a,
      lip: 0x8a6058,
      pants: 0x2a2a28,
    },
    khaye: {
      coat: 0x6a4a3a,
      accent: 0xd8c4a0,
      hair: 0x8a8078,
      skin: 0xe0b890,
      iris: 0x5a4a3a,
      lip: 0xa85a58,
      pants: 0x3a2a32,
    },
    berl: {
      coat: 0x3a5a6a,
      accent: 0xc9a227,
      hair: 0x2a1c14,
      skin: 0xe8c4a0,
      iris: 0x3a5a6a,
      lip: 0x9a5a55,
      pants: 0x2a2a32,
    },
    sora: {
      coat: 0x7a4a6a,
      accent: 0xe8c070,
      hair: 0x4a2a18,
      skin: 0xe8c8a8,
      iris: 0x5a6a4a,
      lip: 0xb85a68,
      pants: 0x2a2a32,
    },
    leib: {
      coat: 0x5a4a3a,
      accent: 0x8a7050,
      hair: 0x3a2a1c,
      skin: 0xd8b090,
      iris: 0x4a4a3a,
      lip: 0x8a6058,
      pants: 0x2a2420,
    },
    dina: {
      coat: 0x5a6a5a,
      accent: 0xd4a080,
      hair: 0x5a3a28,
      skin: 0xe4c0a0,
      iris: 0x4a5a4a,
      lip: 0xa85a60,
      pants: 0x3a2a32,
    },
    // Hazan — preto + talit
    hazan: {
      coat: 0x1a1a1a,
      accent: 0xf0ebe0,
      hair: 0x2a2a2a,
      skin: 0xd8b090,
      iris: 0x3a3a4a,
      lip: 0x8a6058,
      pants: 0x141414,
    },
    // Membro da sinagoga com talit
    baal: {
      coat: 0x3a3a48,
      accent: 0xf0ebe0,
      hair: 0x4a3a28,
      skin: 0xe0b890,
      iris: 0x4a5a4a,
      lip: 0x8a5a55,
      pants: 0x2a2a32,
    },
    // Rabino — kapote preta, barba, sefer
    rav: {
      coat: 0x121212,
      accent: 0xe8e4dc,
      hair: 0xd8d4cc,
      skin: 0xd4a878,
      iris: 0x3a3a4a,
      lip: 0x8a6a60,
      pants: 0x0e0e0e,
    },
    // Mercador do mark
    soyker: {
      coat: 0x5a4030,
      accent: 0xc9a227,
      hair: 0x3a2a1c,
      skin: 0xd8b090,
      iris: 0x4a5a3a,
      lip: 0x8a6058,
      pants: 0x2a2420,
    },
    // Fregadeira no mercado
    rokhel: {
      coat: 0x6a4a5a,
      accent: 0xd8c090,
      hair: 0x4a3a28,
      skin: 0xe4c0a0,
      iris: 0x5a4a3a,
      lip: 0xa85a60,
      pants: 0x3a2a32,
    },
    // Feldsher — clínico do shpitol
    feldsher: {
      coat: 0xe8e0d0,
      accent: 0xa83c3c,
      hair: 0xb0a898,
      skin: 0xd4a878,
      iris: 0x3a4a5a,
      lip: 0x8a6058,
      pants: 0x3a3a40,
    },
    // Melamed — mestre do cheder
    melamed: {
      coat: 0x3a4a48,
      accent: 0xc4b08a,
      hair: 0xc8c0b0,
      skin: 0xd8b090,
      iris: 0x4a4a3a,
      lip: 0x8a6a60,
      pants: 0x2a2a28,
    },
    // Alfaiate da oficina
    shnayder: {
      coat: 0x4a5a6a,
      accent: 0xc9a227,
      hair: 0x2a2a28,
      skin: 0xd4a878,
      iris: 0x3a4a5a,
      lip: 0x8a6058,
      pants: 0x2a3038,
    },
    // Vizinha do norte
    freyde: {
      coat: 0x5a3a48,
      accent: 0xd8b878,
      hair: 0x3a2a20,
      skin: 0xe0b898,
      iris: 0x4a3a2a,
      lip: 0xa85a58,
      pants: 0x3a2a30,
    },
    // Rapaz ajudante no mark
    motl: {
      coat: 0x3a5a48,
      accent: 0xc4a060,
      hair: 0x4a3a28,
      skin: 0xe0b898,
      iris: 0x4a5a3a,
      lip: 0x8a6058,
      pants: 0x2a3a32,
    },
  };
  const p = palette[style];
  const isWoman =
    style === 'rivke' ||
    style === 'tsipe' ||
    style === 'khaye' ||
    style === 'sora' ||
    style === 'dina' ||
    style === 'rokhel' ||
    style === 'freyde';

  // —— Pernas ——
  const legL = new THREE.Group();
  legL.position.set(-0.13, 0.55, 0);
  legL.add(cyl(0.085, 0.095, 0.55, p.pants, 0, -0.28, 0, 6));
  legL.add(box(0.2, 0.1, 0.3, 0x1a1410, 0, -0.55, 0.05));
  g.add(legL);

  const legR = new THREE.Group();
  legR.position.set(0.13, 0.55, 0);
  legR.add(cyl(0.085, 0.095, 0.55, p.pants, 0, -0.28, 0, 6));
  legR.add(box(0.2, 0.1, 0.3, 0x1a1410, 0, -0.55, 0.05));
  g.add(legR);

  // —— Corpo / vestimenta ——
  if (isWoman) {
    const skirt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.5, 0.85, 12),
      mat(style === 'rivke' ? p.coat : p.coat),
    );
    skirt.position.y = 0.78;
    skirt.castShadow = true;
    g.add(skirt);
    // Blusa
    g.add(cyl(0.26, 0.3, 0.5, p.coat, 0, 1.35, 0, 10));
    // Avental
    const apronColor = style === 'rivke' ? p.accent : 0xe8dcc8;
    g.add(box(0.42, 0.55, 0.08, apronColor, 0, 1.05, 0.28));
    g.add(box(0.5, 0.06, 0.06, p.accent, 0, 1.32, 0.26));
    // Gola / lenço no peito
    g.add(box(0.28, 0.08, 0.2, COLORS.cream, 0, 1.52, 0.18));
  } else if (style === 'shloyme' || style === 'hazan' || style === 'rav') {
    // Kapote / casaco longo
    const coat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.42, 1.35, 12),
      mat(p.coat),
    );
    coat.position.y = 0.95;
    coat.castShadow = true;
    g.add(coat);
    if (style === 'shloyme' || style === 'rav') {
      g.add(box(0.5, 0.08, 0.08, p.accent, 0, 1.45, 0.3));
      g.add(box(0.08, 0.55, 0.06, p.accent, -0.2, 1.15, 0.32));
      g.add(box(0.08, 0.55, 0.06, p.accent, 0.2, 1.15, 0.32));
      for (const by of [1.35, 1.15, 0.95]) {
        g.add(box(0.04, 0.04, 0.04, 0xc9a227, 0, by, 0.36));
      }
    }
  } else {
    // Casaco de homem (Yankev / jogador)
    const torso = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.3, 0.55, 4, 10),
      mat(p.coat),
    );
    torso.position.y = 1.08;
    torso.castShadow = true;
    g.add(torso);
    // Colete / peito
    g.add(box(0.35, 0.5, 0.12, p.accent, 0, 1.15, 0.22));
    if (style === 'yankev') {
      // Avental de padeiro
      g.add(box(0.48, 0.65, 0.06, 0xe8e0d0, 0, 0.95, 0.32));
      g.add(box(0.5, 0.06, 0.06, 0xc4b08a, 0, 1.28, 0.3));
    }
    if (style === 'player') {
      // Cinto de viajante
      g.add(box(0.62, 0.07, 0.08, 0x3a2a18, 0, 0.85, 0.05));
      g.add(box(0.08, 0.08, 0.06, 0xc9a227, 0, 0.85, 0.32));
    }
    if (style === 'mendl') {
      // Cachecol / faixa de idoso
      g.add(box(0.4, 0.12, 0.2, p.accent, 0, 1.5, 0.2));
    }
    if (style === 'berl') {
      g.add(box(0.55, 0.06, 0.08, 0x3a2a18, 0, 0.88, 0.05));
    }
    if (style === 'baal') {
      g.add(box(0.55, 0.06, 0.08, 0x2a2a2a, 0, 0.88, 0.05));
    }
    if (style === 'soyker') {
      // Avental de mercador + bolsa
      g.add(box(0.48, 0.55, 0.06, 0xd8c9a8, 0, 1.0, 0.3));
      g.add(box(0.28, 0.22, 0.16, 0x4a3020, 0.28, 0.95, 0.28));
      g.add(box(0.08, 0.08, 0.06, 0xc9a227, 0.28, 0.95, 0.38));
    }
    if (style === 'feldsher') {
      g.add(box(0.55, 0.08, 0.08, p.accent, 0, 1.35, 0.28));
      g.add(box(0.2, 0.2, 0.06, p.accent, 0, 1.15, 0.32));
    }
    if (style === 'melamed') {
      g.add(box(0.4, 0.12, 0.18, p.accent, 0, 1.48, 0.22));
    }
  }

  // Talit gadol (hazan, membros e rabino)
  if (style === 'hazan' || style === 'baal' || style === 'rav') {
    const tallit = 0xf2ede4;
    const stripe =
      style === 'hazan' ? 0x1a2a6a : style === 'rav' ? 0x1a3a5a : 0x2a2a2a;
    g.add(box(0.72, 0.1, 0.55, tallit, 0, 1.5, 0.02));
    g.add(box(0.72, 0.04, 0.55, stripe, 0, 1.44, 0.02));
    g.add(box(0.72, 0.03, 0.55, stripe, 0, 1.55, 0.02));
    // Quedas laterais
    g.add(box(0.1, 0.75, 0.4, tallit, -0.4, 1.12, 0.02));
    g.add(box(0.1, 0.75, 0.4, tallit, 0.4, 1.12, 0.02));
    g.add(box(0.1, 0.04, 0.4, stripe, -0.4, 0.85, 0.02));
    g.add(box(0.1, 0.04, 0.4, stripe, 0.4, 0.85, 0.02));
    // Tzitzit simples
    for (const sx of [-0.42, 0.42] as const) {
      g.add(box(0.02, 0.2, 0.02, tallit, sx, 0.7, 0.18));
      g.add(box(0.02, 0.2, 0.02, tallit, sx, 0.7, -0.12));
    }
  }

  // —— Braços ——
  const sleeve = isWoman ? p.coat : style === 'shloyme' ? p.coat : p.coat;
  const armL = new THREE.Group();
  armL.position.set(-0.4, 1.48, 0);
  armL.add(cyl(0.075, 0.085, 0.55, sleeve, 0, -0.28, 0, 6));
  armL.add(box(0.1, 0.1, 0.1, p.skin, 0, -0.58, 0)); // mão
  armL.rotation.z = 0.18;
  g.add(armL);

  const armR = new THREE.Group();
  armR.position.set(0.4, 1.48, 0);
  armR.add(cyl(0.075, 0.085, 0.55, sleeve, 0, -0.28, 0, 6));
  armR.add(box(0.1, 0.1, 0.1, p.skin, 0, -0.58, 0));
  armR.rotation.z = -0.18;
  g.add(armR);

  // Rabino segura o Sefer Torah à frente
  if (style === 'rav') {
    armL.rotation.x = -1.2;
    armL.rotation.z = 0.42;
    armR.rotation.x = -1.2;
    armR.rotation.z = -0.42;
    const sefer = makeSeferTorah();
    sefer.position.set(0, 1.12, 0.48);
    g.add(sefer);
  }

  // —— Cabeça + rosto ——
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.23, 14, 14),
    mat(p.skin),
  );
  head.position.y = 1.72;
  head.castShadow = true;
  g.add(head);

  const faceOpts: FaceOpts = {
    skin: p.skin,
    iris: p.iris,
    brow: p.hair,
    lip: p.lip,
    smile:
      style === 'player' || style === 'berl' || style === 'sora' || style === 'dina' || style === 'soyker' || style === 'motl'
        ? 0.06
        : style === 'yankev' || style === 'tsipe' || style === 'leib' || style === 'rokhel' || style === 'freyde'
          ? 0.05
          : style === 'rivke' || style === 'khaye'
            ? 0.03
            : 0.01,
    browDrop:
      style === 'shloyme' || style === 'mendl' || style === 'rav' || style === 'melamed' || style === 'shnayder'
        ? 0.03
        : style === 'rivke' || style === 'khaye'
          ? 0.015
          : 0,
  };
  g.add(makeFace(faceOpts));

  // —— Cabelo / coberturas ——
  if (style === 'rivke' || style === 'khaye' || style === 'dina' || style === 'rokhel' || style === 'freyde') {
    g.add(
      makeTichel(
        style === 'dina'
          ? p.coat
          : style === 'khaye' || style === 'rokhel' || style === 'freyde'
            ? p.accent
            : COLORS.cream,
        style === 'dina' ? p.accent : p.coat,
      ),
    );
    g.add(box(0.08, 0.12, 0.06, p.hair, -0.2, 1.68, 0.08));
    g.add(box(0.08, 0.12, 0.06, p.hair, 0.2, 1.68, 0.08));
    if (style === 'rokhel') {
      // Cesta no braço
      g.add(box(0.35, 0.22, 0.28, 0x8a6a40, 0.42, 1.05, 0.15));
      g.add(box(0.28, 0.12, 0.22, 0xc45c3a, 0.42, 1.2, 0.15));
    }
    if (style === 'freyde') {
      g.add(box(0.3, 0.18, 0.24, 0x8a6a40, -0.4, 1.08, 0.12));
      g.add(cyl(0.08, 0.09, 0.2, 0xf0e6d0, -0.4, 1.22, 0.12, 8));
    }
  } else if (style === 'tsipe' || style === 'sora') {
    g.add(makeTichel(p.accent, 0xe8d9b8));
    for (let i = 0; i < 3; i++) {
      const bead = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 8),
        mat(p.hair),
      );
      bead.position.set(0, 1.55 - i * 0.1, -0.28);
      g.add(bead);
    }
  } else if (style === 'yankev') {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), mat(p.hair));
    hair.position.set(0, 1.8, -0.02);
    hair.scale.set(1, 0.5, 1);
    g.add(hair);
    g.add(makePayot(p.hair, 0.28));
    g.add(makeBeard(0x3a2a1c, 'short'));
    g.add(cyl(0.14, 0.16, 0.06, 0x2a2a4a, 0, 1.92, 0, 10));
    g.add(cyl(0.26, 0.22, 0.14, 0x5a4030, 0, 1.98, 0, 12));
    g.add(box(0.28, 0.04, 0.18, 0x5a4030, 0, 1.92, 0.18));
  } else if (
    style === 'mendl' ||
    style === 'leib' ||
    style === 'baal' ||
    style === 'soyker' ||
    style === 'feldsher' ||
    style === 'melamed' ||
    style === 'shnayder' ||
    style === 'motl'
  ) {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), mat(p.hair));
    hair.position.set(0, 1.8, -0.02);
    hair.scale.set(1, 0.5, 1);
    g.add(hair);
    g.add(makePayot(p.hair, style === 'leib' || style === 'motl' ? 0.26 : 0.3));
    if (style === 'baal' || style === 'soyker' || style === 'motl') g.add(makeBeard(0x3a2a1c, 'short'));
    else if (style === 'feldsher' || style === 'shnayder') g.add(makeBeard(p.hair, 'short'));
    else g.add(makeBeard(p.hair, style === 'leib' ? 'short' : 'full'));
    if (style === 'baal' || style === 'feldsher') {
      g.add(cyl(0.15, 0.17, 0.07, style === 'feldsher' ? 0xe8e0d0 : 0x1a1a28, 0, 1.94, 0, 10));
    } else if (style === 'soyker') {
      g.add(cyl(0.24, 0.22, 0.16, 0x5a4030, 0, 1.98, 0, 12));
      g.add(box(0.26, 0.04, 0.14, 0x5a4030, 0, 1.92, 0.16));
    } else if (style === 'shnayder') {
      g.add(cyl(0.22, 0.2, 0.14, 0x4a5a6a, 0, 1.97, 0, 12));
      g.add(box(0.22, 0.08, 0.12, 0xc9a227, 0.38, 1.15, 0.2)); // tesoura/caixa
    } else if (style === 'motl') {
      g.add(cyl(0.22, 0.2, 0.12, 0x3a5a48, 0, 1.96, 0, 12));
      g.add(box(0.28, 0.2, 0.22, 0x8a6a40, 0.4, 1.0, 0.1));
    } else {
      const hat = style === 'leib' ? 0x4a3a2a : style === 'melamed' ? 0x2a3a38 : 0x3a4a38;
      g.add(cyl(0.26, 0.24, 0.18, hat, 0, 1.98, 0, 12));
      g.add(box(0.28, 0.04, 0.16, hat, 0, 1.92, 0.18));
    }
  } else if (style === 'hazan') {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), mat(p.hair));
    hair.position.set(0, 1.8, -0.04);
    hair.scale.set(1, 0.45, 0.95);
    g.add(hair);
    g.add(makePayot(p.hair, 0.35));
    g.add(makeBeard(0x3a3a3a, 'full'));
    g.add(cyl(0.16, 0.18, 0.08, 0x121212, 0, 1.94, 0, 10));
  } else if (style === 'shloyme' || style === 'rav') {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), mat(p.hair));
    hair.position.set(0, 1.8, -0.04);
    hair.scale.set(1, 0.45, 0.95);
    g.add(hair);
    g.add(makePayot(p.hair, style === 'rav' ? 0.38 : 0.4));
    g.add(makeBeard(p.hair, 'long'));
    g.add(cyl(0.28, 0.26, 0.28, 0x121212, 0, 2.05, 0, 14));
    g.add(cyl(0.4, 0.4, 0.05, 0x121212, 0, 1.9, 0, 16));
  } else if (style === 'berl') {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), mat(p.hair));
    hair.position.set(0, 1.82, -0.02);
    hair.scale.set(1, 0.55, 1);
    g.add(hair);
    g.add(makePayot(p.hair, 0.2));
    g.add(cyl(0.15, 0.17, 0.07, p.accent, 0, 1.94, 0, 10));
  } else {
    // Jogador — jovem viajante, sem payot
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 10), mat(p.hair));
    hair.position.set(0, 1.84, -0.02);
    hair.scale.set(1.05, 0.65, 1.05);
    g.add(hair);
    g.add(cyl(0.22, 0.2, 0.14, p.accent, 0, 1.98, 0, 12));
    g.add(box(0.24, 0.03, 0.14, p.accent, 0, 1.93, 0.18));
  }

  if (style === 'player') g.scale.setScalar(0.82);
  if (style === 'sora' || style === 'berl') g.scale.setScalar(0.88);

  return { root: g, legL, legR, armL, armR };
}

/** Ciclo de caminhada nas pernas e braços. */
export function applyWalkCycle(
  rig: PersonRig,
  moving: boolean,
  dt: number,
  phaseRef: { value: number },
): void {
  if (moving) {
    phaseRef.value += dt * 10;
    const swing = Math.sin(phaseRef.value) * 0.85;
    const armSwing = Math.sin(phaseRef.value) * 0.65;
    rig.legL.rotation.x = swing;
    rig.legR.rotation.x = -swing;
    // Braços em contrafase das pernas + abertura leve
    rig.armL.rotation.x = -armSwing;
    rig.armR.rotation.x = armSwing;
    rig.armL.rotation.z = 0.18 + Math.sin(phaseRef.value) * 0.06;
    rig.armR.rotation.z = -0.18 - Math.sin(phaseRef.value) * 0.06;
    // Leve bobbing
    rig.root.position.y = Math.abs(Math.sin(phaseRef.value * 2)) * 0.05;
  } else {
    // Volta à pose em pé
    rig.legL.rotation.x *= 0.75;
    rig.legR.rotation.x *= 0.75;
    rig.armL.rotation.x *= 0.75;
    rig.armR.rotation.x *= 0.75;
    rig.armL.rotation.z += (0.18 - (rig.armL.rotation.z || 0)) * 0.2;
    rig.armR.rotation.z += (-0.18 - (rig.armR.rotation.z || 0)) * 0.2;
    rig.root.position.y *= 0.75;
    if (Math.abs(rig.legL.rotation.x) < 0.02) {
      rig.legL.rotation.x = 0;
      rig.legR.rotation.x = 0;
      rig.armL.rotation.x = 0;
      rig.armR.rotation.x = 0;
      rig.armL.rotation.z = 0.18;
      rig.armR.rotation.z = -0.18;
      rig.root.position.y = 0;
    }
  }
}

function makeBench(x: number, z: number, rotY = 0): THREE.Group {
  const g = new THREE.Group();
  // Assento com ripas
  g.add(box(2.0, 0.1, 0.58, COLORS.woodLight, 0, 0.5, 0));
  g.add(box(2.0, 0.04, 0.12, COLORS.wood, 0, 0.56, 0.18));
  g.add(box(2.0, 0.04, 0.12, COLORS.wood, 0, 0.56, -0.05));
  // Encosto com ripas
  g.add(box(2.0, 0.12, 0.08, COLORS.wood, 0, 0.7, -0.28));
  g.add(box(2.0, 0.12, 0.08, COLORS.wood, 0, 0.95, -0.28));
  g.add(box(0.1, 0.7, 0.1, COLORS.wood, -0.9, 0.85, -0.28));
  g.add(box(0.1, 0.7, 0.1, COLORS.wood, 0.9, 0.85, -0.28));
  // Pernas
  for (const [px, pz] of [
    [-0.85, 0.2],
    [0.85, 0.2],
    [-0.85, -0.2],
    [0.85, -0.2],
  ] as [number, number][]) {
    g.add(box(0.1, 0.5, 0.1, COLORS.wood, px, 0.25, pz));
  }
  g.add(box(1.7, 0.06, 0.06, COLORS.wood, 0, 0.18, 0));
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  return g;
}

/** Estante alta cheia de sefarim (livros) — estrutura oca, livros à vista. */
function makeBookcase(x: number, z: number, width = 4.2): THREE.Group {
  const g = new THREE.Group();
  const depth = 0.42;
  const height = 2.55;
  const shelves = 4;
  const side = 0.08;
  const bookColors = [
    0x8b3a2a, 0x2a4a7a, 0x3a6a3a, 0x6a3a1a, 0x5a2a5a, 0x1a1a22, 0x7a5030, 0x1a4a5a,
    0xa05030, 0x3a3a6a,
  ];
  const spineColors = [0xf5ecd8, 0xe8d9b8, 0xc9a227, 0xd4c4a0, 0xf0e0c0];

  // Fundo fino (não preenche o volume)
  g.add(box(width - side * 2, height - 0.12, 0.05, 0x4a3424, 0, height / 2, depth / 2 - 0.03));
  // Laterais, topo e base
  g.add(box(side, height, depth, COLORS.wood, -width / 2 + side / 2, height / 2, 0));
  g.add(box(side, height, depth, COLORS.wood, width / 2 - side / 2, height / 2, 0));
  g.add(box(width, 0.1, depth, COLORS.woodLight, 0, height - 0.05, 0));
  g.add(box(width, 0.1, depth, COLORS.wood, 0, 0.05, 0));
  // Divisor vertical no meio
  g.add(box(0.06, height - 0.2, depth - 0.04, COLORS.wood, 0, height / 2, 0));

  const colW = (width - side * 2 - 0.06) / 2;
  const shelfStep = (height - 0.28) / shelves;

  for (let col = 0; col < 2; col++) {
    const colCenter = col === 0 ? -colW / 2 - 0.03 : colW / 2 + 0.03;
    for (let s = 0; s < shelves; s++) {
      const shelfY = 0.14 + s * shelfStep;
      g.add(box(colW, 0.05, depth - 0.06, COLORS.woodLight, colCenter, shelfY, 0));

      let bx = colCenter - colW / 2 + 0.06;
      let i = 0;
      while (bx < colCenter + colW / 2 - 0.08) {
        const thick = 0.08 + (i % 4) * 0.018;
        const bh = Math.min(0.22 + ((i * 3 + s + col) % 5) * 0.055, shelfStep - 0.12);
        const c = bookColors[(i + s * 3 + col * 4) % bookColors.length]!;
        const spine = spineColors[i % spineColors.length]!;
        const by = shelfY + 0.03 + bh / 2;
        // Lombada voltada para a sala (−Z)
        g.add(box(thick, bh, depth - 0.14, c, bx, by, -0.02));
        g.add(box(thick * 0.9, bh * 0.85, 0.025, spine, bx, by, -depth / 2 + 0.04));
        if (i % 4 === 0) {
          g.add(box(thick * 0.85, 0.03, 0.025, COLORS.gold, bx, by + bh * 0.12, -depth / 2 + 0.05));
        }
        bx += thick + 0.01;
        i++;
      }
    }
  }

  g.position.set(x, 0, z);
  return g;
}

function makeWell(x: number, z: number): THREE.Group {
  const g = new THREE.Group();
  g.add(cyl(0.95, 1.05, 0.95, COLORS.stone, 0, 0.48, 0, 12));
  g.add(cyl(0.7, 0.7, 0.2, COLORS.stoneDark, 0, 0.95, 0, 12));
  // Postes e travessa
  g.add(box(0.12, 1.3, 0.12, COLORS.wood, -0.7, 1.4, 0));
  g.add(box(0.12, 1.3, 0.12, COLORS.wood, 0.7, 1.4, 0));
  g.add(box(1.6, 0.12, 0.12, COLORS.wood, 0, 2.05, 0));
  // Balde
  g.add(cyl(0.18, 0.2, 0.28, COLORS.woodLight, 0, 1.5, 0, 8));
  g.position.set(x, 0, z);
  return g;
}

/** Menorá grande da praça central (7 braços). */
function makePlazaMenorah(x: number, z: number): THREE.Group {
  const g = new THREE.Group();
  // Pedestal de pedra
  g.add(cyl(1.35, 1.45, 0.28, COLORS.stoneDark, 0, 0.14, 0, 18));
  g.add(cyl(1.15, 1.2, 0.35, COLORS.stone, 0, 0.42, 0, 18));
  g.add(box(1.6, 0.18, 0.7, COLORS.stoneDark, 0, 0.68, 0));
  // Base dourada
  g.add(box(1.5, 0.22, 0.55, COLORS.gold, 0, 0.88, 0));
  g.add(box(1.3, 0.1, 0.45, 0xe8c860, 0, 1.02, 0));
  // Haste central
  g.add(cyl(0.12, 0.16, 1.7, COLORS.gold, 0, 1.9, 0, 10));
  g.add(cyl(0.22, 0.2, 0.18, COLORS.gold, 0, 2.75, 0, 10));
  // Travessa principal
  g.add(box(3.2, 0.12, 0.12, COLORS.gold, 0, 2.85, 0));
  // Braços curvados (aproximação em degraus)
  const arms = [-1.4, -0.95, -0.5, 0, 0.5, 0.95, 1.4];
  for (const ax of arms) {
    const h = 0.55 + Math.abs(ax) * 0.08;
    g.add(cyl(0.07, 0.07, h, COLORS.gold, ax, 2.85 + h / 2, 0, 8));
    g.add(cyl(0.1, 0.09, 0.12, COLORS.gold, ax, 2.85 + h + 0.05, 0, 8));
    // Chama
    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 8, 8),
      mat(0xffc14a),
    );
    flame.position.set(ax, 2.85 + h + 0.22, 0);
    flame.scale.set(0.85, 1.35, 0.85);
    g.add(flame);
    const tip = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 6, 6),
      mat(0xfff0a0),
    );
    tip.position.set(ax, 2.85 + h + 0.34, 0);
    g.add(tip);
  }
  // Detalhe estrela no pedestal
  const star = makeStarOfDavid(0.35, COLORS.gold);
  star.position.set(0, 0.55, 0.62);
  g.add(star);
  g.position.set(x, 0, z);
  return g;
}

function makeCart(x: number, z: number, rotY = 0): THREE.Group {
  const g = new THREE.Group();
  g.add(box(1.8, 0.7, 1.1, COLORS.wood, 0, 0.7, 0));
  g.add(box(1.9, 0.12, 1.2, COLORS.woodLight, 0, 1.1, 0));
  g.add(box(1.5, 0.5, 0.9, 0xc9a227, 0, 1.45, 0));
  const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.15, 12);
  const w1 = new THREE.Mesh(wheelGeo, mat(0x2a1c14));
  w1.rotation.z = Math.PI / 2;
  w1.position.set(-0.7, 0.4, 0.65);
  g.add(w1);
  const w2 = w1.clone();
  w2.position.set(-0.7, 0.4, -0.65);
  g.add(w2);
  const w3 = w1.clone();
  w3.position.set(0.7, 0.4, 0.65);
  g.add(w3);
  const w4 = w1.clone();
  w4.position.set(0.7, 0.4, -0.65);
  g.add(w4);
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  return g;
}

/** Estrela de Davi (dois triângulos). */
function makeStarOfDavid(size = 0.9, color = COLORS.gold): THREE.Group {
  const g = new THREE.Group();
  const h = (size * Math.sqrt(3)) / 2;

  const makeTri = (flip: boolean) => {
    const shape = new THREE.Shape();
    if (!flip) {
      shape.moveTo(0, h * 0.65);
      shape.lineTo(-size / 2, -h * 0.35);
      shape.lineTo(size / 2, -h * 0.35);
    } else {
      shape.moveTo(0, -h * 0.65);
      shape.lineTo(-size / 2, h * 0.35);
      shape.lineTo(size / 2, h * 0.35);
    }
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.06,
      bevelEnabled: false,
    });
    const mesh = new THREE.Mesh(geo, mat(color));
    mesh.castShadow = true;
    return mesh;
  };

  g.add(makeTri(false));
  g.add(makeTri(true));
  return g;
}

/** Mezuzá na ombreira da porta. */
function makeMezuzah(x: number, y: number, z: number): THREE.Mesh {
  const m = box(0.08, 0.35, 0.08, COLORS.woodLight, x, y, z);
  m.rotation.z = -0.35;
  return m;
}

/** Placa com letra hebraica (ש). */
function makeHebrewPlaque(
  x: number,
  y: number,
  z: number,
  letter: string,
): THREE.Group {
  const g = new THREE.Group();
  g.add(box(0.7, 0.55, 0.08, COLORS.wood, 0, 0, 0));
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#6b4a2e';
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = '#c9a227';
  ctx.font = 'bold 72px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, 64, 70);
  const tex = new THREE.CanvasTexture(canvas);
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 0.45),
    new THREE.MeshLambertMaterial({ map: tex }),
  );
  plane.position.z = 0.05;
  g.add(plane);
  g.position.set(x, y, z);
  return g;
}

export class ShtetlWorld {
  readonly scene = new THREE.Scene();
  readonly colliders: Collider[] = [];
  readonly circles: CircleSolid[] = [];
  readonly npcs: WorldNpc[] = [];
  readonly interactables: Interactable[] = [];
  private photoMesh: THREE.Object3D | null = null;
  private shloyme: WorldNpc | null = null;

  private readonly outdoor = new THREE.Group();
  private readonly shulInterior = new THREE.Group();
  private inShul = false;
  private readonly outdoorColliders: Collider[] = [];
  private readonly outdoorCircles: CircleSolid[] = [];
  private readonly shulColliders: Collider[] = [];
  private readonly shulCircles: CircleSolid[] = [];
  private outdoorInteractables: Interactable[] = [];
  private readonly shulInteractables: Interactable[] = [];
  private buildingShul = false;
  private outdoorHemi!: THREE.HemisphereLight;
  private outdoorSun!: THREE.DirectionalLight;
  private shulLight!: THREE.PointLight;
  private shulFill!: THREE.HemisphereLight;
  private readonly cows: GrazingCow[] = [];

  private static readonly SHUL_NPCS = new Set<NpcId>([
    'hazan',
    'rav',
    'yosl',
    'avrom',
    'meyer',
    'shmuel',
    'velvl',
    'berish',
    'dovid',
    'khayim',
  ]);

  constructor() {
    // Céu âmbar de final de tarde — tom de shtetl
    this.scene.background = new THREE.Color(0xc9b896);
    this.scene.fog = new THREE.Fog(0xc9b896, 50, 120);

    this.outdoorHemi = new THREE.HemisphereLight(0xfff0d6, 0x5a4a32, 0.95);
    this.scene.add(this.outdoorHemi);
    this.outdoorSun = new THREE.DirectionalLight(0xffe0a8, 1.05);
    this.outdoorSun.position.set(28, 40, 16);
    this.outdoorSun.castShadow = true;
    this.outdoorSun.shadow.mapSize.set(2048, 2048);
    this.outdoorSun.shadow.camera.near = 1;
    this.outdoorSun.shadow.camera.far = 140;
    this.outdoorSun.shadow.camera.left = -70;
    this.outdoorSun.shadow.camera.right = 70;
    this.outdoorSun.shadow.camera.top = 70;
    this.outdoorSun.shadow.camera.bottom = -70;
    this.scene.add(this.outdoorSun);

    this.scene.add(this.outdoor);
    this.scene.add(this.shulInterior);
    this.shulInterior.visible = false;

    this.shulLight = new THREE.PointLight(0xffe0b0, 2.2, 32, 1.5);
    this.shulLight.position.set(0, 4.2, 0);
    this.shulLight.visible = false;
    this.scene.add(this.shulLight);
    this.shulFill = new THREE.HemisphereLight(0xfff0d8, 0x4a3a28, 0.85);
    this.shulFill.visible = false;
    this.scene.add(this.shulFill);

    this.buildGround();
    this.buildBuildings();
    this.buildJewishDetails();
    this.buildProps();
    this.buildNpcs();

    // Empacota o shtetl num grupo (cenário separado da sinagoga)
    this.packOutdoor();
    this.outdoorInteractables = [...this.interactables];
    this.outdoorColliders.push(...this.colliders);
    this.outdoorCircles.push(...this.circles);

    this.buildSynagogueInterior();
    this.setSynagogueMode(false);
  }

  /** Move tudo que não é luz / grupos de cena para o grupo outdoor. */
  private packOutdoor(): void {
    for (const child of [...this.scene.children]) {
      if (child === this.outdoor || child === this.shulInterior) continue;
      if ((child as THREE.Light).isLight) continue;
      this.outdoor.add(child);
    }
  }

  private addCollider(x: number, z: number, w: number, d: number): void {
    const c = {
      minX: x - w / 2,
      maxX: x + w / 2,
      minZ: z - d / 2,
      maxZ: z + d / 2,
    };
    if (this.buildingShul) this.shulColliders.push(c);
    else this.colliders.push(c);
  }

  private addCircle(x: number, z: number, r: number): void {
    const c = { x, z, r };
    if (this.buildingShul) this.shulCircles.push(c);
    else this.circles.push(c);
  }

  /** Caixa alinhada ao mundo, expandida se o objeto estiver rotacionado. */
  private addOrientedBox(
    x: number,
    z: number,
    w: number,
    d: number,
    rotY = 0,
  ): void {
    const c = Math.abs(Math.cos(rotY));
    const s = Math.abs(Math.sin(rotY));
    const aw = w * c + d * s;
    const ad = w * s + d * c;
    this.addCollider(x, z, aw + 0.15, ad + 0.15);
  }

  private buildGround(): void {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(140, 140),
      mat(COLORS.grass),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const pathMat = mat(COLORS.path);
    const addPath = (w: number, d: number, x: number, z: number) => {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), pathMat);
      p.rotation.x = -Math.PI / 2;
      p.position.set(x, 0.02, z);
      p.receiveShadow = true;
      this.scene.add(p);
    };

    // Rua norte–sul principal (não chega ao lago no sul)
    addPath(8, 64, 0, 2);
    // Prolongamento norte (fundo do mapa)
    addPath(7, 22, 0, 36);
    // Rua leste–oeste central
    addPath(80, 8, 0, 0);
    // Rua transversal no fundo norte
    addPath(56, 6.5, 0, 34);
    // Travessas laterais no norte
    addPath(6, 20, -18, 30);
    addPath(6, 20, 18, 30);

    // Manchas de gramado nos quintais
    for (const [x, z] of [
      [-14, -12],
      [14, -13],
      [-16, 12],
      [16, 12],
      [-14, -22],
      [-14, 22],
      [14, 22],
      [0, 18],
      [-28, 0],
      [28, 0],
      [-10, 40],
      [10, 40],
      [-26, 36],
      [26, 36],
    ] as [number, number][]) {
      const patch = new THREE.Mesh(
        new THREE.CircleGeometry(3.2, 12),
        mat(COLORS.grassDark),
      );
      patch.rotation.x = -Math.PI / 2;
      patch.position.set(x, 0.015, z);
      this.scene.add(patch);
    }

    // Praça de pedra no cruzamento
    const plaza = new THREE.Mesh(
      new THREE.CircleGeometry(4.2, 24),
      mat(COLORS.pathDark),
    );
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(0, 0.025, 0);
    plaza.receiveShadow = true;
    this.scene.add(plaza);

    // Praça do mercado no cruzamento norte
    const northPlaza = new THREE.Mesh(
      new THREE.CircleGeometry(6.5, 22),
      mat(COLORS.pathDark),
    );
    northPlaza.rotation.x = -Math.PI / 2;
    northPlaza.position.set(0, 0.026, 34);
    northPlaza.receiveShadow = true;
    this.scene.add(northPlaza);
  }

  private building(
    x: number,
    z: number,
    w: number,
    d: number,
    h: number,
    label?: string,
  ): void {
    this.scene.add(box(w, h, d, COLORS.wall, x, h / 2, z));
    this.scene.add(box(w + 0.05, 0.2, d + 0.05, COLORS.wood, x, 0.9, z));
    // Telhado de madeira / telha escura
    this.scene.add(box(w + 0.5, 0.35, d + 0.5, COLORS.roof, x, h + 0.15, z));
    this.scene.add(box(w * 0.35, 0.5, d + 0.2, COLORS.roofDark, x, h + 0.45, z));
    // Janelas com moldura
    for (const sx of [-1, 1]) {
      const wx = x + sx * w * 0.28;
      const wz = z + d / 2 + 0.02;
      this.scene.add(box(0.62, 0.62, 0.06, COLORS.wood, wx, h * 0.55, wz));
      this.scene.add(box(0.48, 0.48, 0.05, 0x7eb6d9, wx, h * 0.55, wz + 0.02));
    }
    // Porta + mezuzá
    const doorZ = z + d / 2 + 0.06;
    this.scene.add(box(1.05, 1.85, 0.1, COLORS.wood, x, 0.92, doorZ));
    this.scene.add(makeMezuzah(x + 0.58, 1.55, doorZ + 0.04));
    this.addCollider(x, z, w + 0.7, d + 0.7);

    if (label === 'inn') {
      this.scene.add(box(0.35, 0.35, 0.08, COLORS.gold, x, 2.25, doorZ + 0.05));
      const star = makeStarOfDavid(0.45, COLORS.gold);
      star.position.set(x, 2.7, doorZ + 0.08);
      this.scene.add(star);
      this.interactables.push({
        id: 'inn',
        name: 'Hospedaria',
        position: new THREE.Vector3(x, 0, z + d / 2 + 1.2),
        radius: 2.2,
      });
    }
  }

  /**
   * Fachada da sinagoga no shtetl (sólida) — interior é outro cenário.
   */
  private buildSynagogue(): void {
    const cx = -20;
    const cz = -16;
    const w = 12;
    const d = 12;
    const h = 4.8;

    this.building(cx, cz, w, d, h);

    // Cúpula
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(2.3, 16, 16),
      mat(0x2f5f9a),
    );
    dome.position.set(cx, h + 0.9, cz);
    dome.castShadow = true;
    this.scene.add(dome);
    this.scene.add(cyl(0.18, 0.22, 0.4, COLORS.gold, cx, h + 3.1, cz, 8));

    const doorZ = cz + d / 2 + 0.06;
    const bigStar = makeStarOfDavid(1.4, COLORS.gold);
    bigStar.position.set(cx, 3.6, doorZ + 0.15);
    this.scene.add(bigStar);

    this.interactables.push({
      id: 'synagogue',
      name: 'Sinagoga',
      position: new THREE.Vector3(cx, 0, doorZ + 1.3),
      radius: 2.6,
    });
  }

  /** Salão interno — cenário próprio (shtetl fica oculto). */
  private buildSynagogueInterior(): void {
    this.buildingShul = true;
    const add = (o: THREE.Object3D) => this.shulInterior.add(o);

    const w = 14;
    const d = 14;
    const h = 6.5;
    const t = 0.5;

    // Piso + teto (sala fechada) — topo do piso em y=0 para os pés não enterrarem
    const floor = box(w, 0.12, d, 0xa88858, 0, -0.06, 0);
    add(floor);
    const ceiling = box(w, 0.2, d, 0x5a4a38, 0, h, 0);
    add(ceiling);

    // Quatro paredes opacas
    const wallS = box(w, h, t, 0xe8dcc8, 0, h / 2, -d / 2 + t / 2);
    const wallN = box(w, h, t, 0xe8dcc8, 0, h / 2, d / 2 - t / 2);
    const wallW = box(t, h, d, 0xe0d4bc, -w / 2 + t / 2, h / 2, 0);
    const wallE = box(t, h, d, 0xe0d4bc, w / 2 - t / 2, h / 2, 0);
    add(wallS);
    add(wallN);
    add(wallW);
    add(wallE);
    this.addCollider(0, -d / 2 + t / 2, w + 0.4, t + 0.5);
    this.addCollider(0, d / 2 - t / 2, w + 0.4, t + 0.5);
    this.addCollider(-w / 2 + t / 2, 0, t + 0.5, d + 0.4);
    this.addCollider(w / 2 - t / 2, 0, t + 0.5, d + 0.4);

    // Faixa de madeira
    add(box(w - 0.2, 0.15, 0.08, COLORS.wood, 0, 1.0, d / 2 - t - 0.05));
    add(box(w - 0.2, 0.15, 0.08, COLORS.wood, 0, 1.0, -d / 2 + t + 0.05));

    // Estante de sefarim na parede norte (oposta à porta)
    const bookcaseZ = d / 2 - t - 0.35;
    add(makeBookcase(0, bookcaseZ, 4.4));
    this.addOrientedBox(0, bookcaseZ, 4.6, 0.55, 0);

    // Janelas internas (vitral) — só decoração, parede continua fechada
    for (const wz of [-3, 3] as const) {
      add(box(0.08, 1.4, 1.0, 0x4a6a9a, -w / 2 + t + 0.06, 2.4, wz));
      add(box(0.08, 1.4, 1.0, 0x4a6a9a, w / 2 - t - 0.06, 2.4, wz));
    }

    // Aron Kodesh (leste)
    const aronX = w / 2 - t - 0.7;
    add(box(0.85, 3.4, 2.8, COLORS.wood, aronX, 1.8, 0));
    add(box(0.55, 2.8, 2.2, 0x5a3a22, aronX - 0.2, 1.7, 0));
    add(box(0.14, 2.4, 1.9, 0x6a1a2a, aronX - 0.42, 1.6, 0));
    add(box(0.1, 0.18, 1.9, COLORS.gold, aronX - 0.45, 2.75, 0));
    const aronStar = makeStarOfDavid(0.4, COLORS.gold);
    aronStar.position.set(aronX - 0.5, 2.3, 0);
    aronStar.rotation.y = Math.PI / 2;
    add(aronStar);
    add(cyl(0.14, 0.14, 1.2, 0xe8d9b8, aronX - 0.1, 1.55, -0.4, 8));
    add(cyl(0.14, 0.14, 1.2, 0xe8d9b8, aronX - 0.1, 1.55, 0.4, 8));
    add(cyl(0.06, 0.06, 0.22, COLORS.gold, aronX - 0.1, 2.25, -0.4, 6));
    add(cyl(0.06, 0.06, 0.22, COLORS.gold, aronX - 0.1, 2.25, 0.4, 6));
    this.addOrientedBox(aronX, 0, 1.0, 3.0, 0);

    // Ner tamid
    add(cyl(0.07, 0.07, 0.55, COLORS.gold, aronX - 0.85, 3.6, 0, 6));
    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 6, 6),
      mat(0xffc14a),
    );
    flame.position.set(aronX - 0.85, 4.0, 0);
    add(flame);

    // Estrela no teto / centro
    const ceilStar = makeStarOfDavid(0.9, COLORS.gold);
    ceilStar.position.set(0, h - 0.35, 0);
    ceilStar.rotation.x = Math.PI / 2;
    add(ceilStar);

    // Bimá + estante (amud) com siddur — altura do peito de quem está em cima
    const bimahTopY = 0.55;
    add(box(3.2, 0.4, 2.6, COLORS.wood, 0, 0.28, 0));
    add(box(3.0, 0.1, 2.4, COLORS.woodLight, 0, 0.5, 0));
    // Amud / estante voltada ao Aron (+X)
    const amudX = 0.72;
    const amudDeskY = bimahTopY + 1.15;
    add(box(0.14, 0.95, 0.14, COLORS.wood, amudX, bimahTopY + 0.5, 0));
    add(box(0.95, 0.1, 0.55, COLORS.wood, amudX, amudDeskY, 0));
    add(box(0.9, 0.04, 0.08, COLORS.wood, amudX, amudDeskY + 0.12, -0.22));
    // Siddur aberto apoiado na estante
    add(box(0.38, 0.05, 0.3, 0x2a1a12, amudX, amudDeskY + 0.06, 0.02));
    add(box(0.17, 0.02, 0.26, 0xf5f0e6, amudX - 0.1, amudDeskY + 0.1, 0.02));
    add(box(0.17, 0.02, 0.26, 0xf0ebe0, amudX + 0.1, amudDeskY + 0.1, 0.02));
    add(box(0.02, 0.015, 0.22, 0xc9a227, amudX, amudDeskY + 0.11, 0.02));
    this.addOrientedBox(0, 0, 3.0, 2.4, 0);

    // Bancos
    for (const bz of [-4, -2, 2, 4] as const) {
      const bench = makeBench(-3.8, bz, Math.PI / 2);
      add(bench);
      this.addOrientedBox(-3.8, bz, 2.2, 0.9, Math.PI / 2);
    }

    // Porta de saída (parede sul)
    add(box(2.2, 2.1, 0.12, COLORS.wood, 0, 1.05, -d / 2 + t + 0.05));
    add(box(0.1, 0.1, 0.1, COLORS.gold, 0.7, 1.05, -d / 2 + t - 0.05));
    this.shulInteractables.push({
      id: 'synagogue',
      name: 'Saída',
      position: new THREE.Vector3(0, 0, -d / 2 + 1.8),
      radius: 2.5,
    });

    // Hazan sobre a bimá, de frente ao Aron (+X), lendo o siddur no amud
    const hazan = this.addNpc('hazan', 'Hazan Hersh', 'hazan', 0.12, 0, true, undefined, this.shulInterior);
    hazan.mesh.position.y = bimahTopY;
    hazan.position.y = bimahTopY;
    hazan.mesh.rotation.y = Math.PI / 2; // olha para o Aron (leste)
    hazan.radius = 0.85;
    if (hazan.rig) {
      // Braços sobre o siddur (mesmo tipo de pose do rav com o sefer)
      hazan.rig.armL.rotation.x = -1.25;
      hazan.rig.armL.rotation.z = 0.38;
      hazan.rig.armR.rotation.x = -1.25;
      hazan.rig.armR.rotation.z = -0.38;
    }

    const rav = this.addNpc('rav', 'Reb Yankl', 'rav', 4.4, 0.8, true, undefined, this.shulInterior);
    // De costas para o Aron (+X), de frente para os bancos (−X)
    rav.mesh.rotation.y = -Math.PI / 2;
    rav.radius = 0.9;

    // Miniã: alguns nos bancos, outros em pé ( + hazan + rav = 10 )
    const congregants: {
      id: NpcId;
      name: string;
      x: number;
      z: number;
      rotY: number;
      radius?: number;
    }[] = [
      // Nos bancos (oeste), voltados ao Aron
      { id: 'yosl', name: 'Yosl', x: -3.8, z: -4, rotY: Math.PI / 2, radius: 0.55 },
      { id: 'meyer', name: 'Meyer', x: -3.8, z: -2, rotY: Math.PI / 2, radius: 0.55 },
      { id: 'avrom', name: 'Avrom', x: -3.8, z: 2, rotY: Math.PI / 2, radius: 0.55 },
      { id: 'khayim', name: 'Khayim', x: -3.8, z: 4, rotY: Math.PI / 2, radius: 0.55 },
      // Em pé — laterais da bimá
      { id: 'shmuel', name: 'Shmuel', x: 1.6, z: -2.4, rotY: Math.PI / 2 },
      { id: 'velvl', name: 'Velvl', x: 1.6, z: 2.4, rotY: Math.PI / 2 },
      // Em pé — perto da entrada / fundo
      { id: 'berish', name: 'Berish', x: -1.2, z: -5.2, rotY: Math.PI * 0.15 },
      { id: 'dovid', name: 'Dovid', x: -2.4, z: 4.2, rotY: Math.PI * 0.85 },
    ];
    for (const c of congregants) {
      const npc = this.addNpc(c.id, c.name, 'baal', c.x, c.z, true, undefined, this.shulInterior);
      npc.mesh.rotation.y = c.rotY;
      npc.radius = c.radius ?? 0.65;
    }

    this.buildingShul = false;
  }

  private refreshModeSets(): void {
    this.colliders.length = 0;
    this.circles.length = 0;
    this.interactables.length = 0;
    if (this.inShul) {
      this.colliders.push(...this.shulColliders);
      this.circles.push(...this.shulCircles);
      this.interactables.push(...this.shulInteractables);
    } else {
      this.colliders.push(...this.outdoorColliders);
      this.circles.push(...this.outdoorCircles);
      this.interactables.push(...this.outdoorInteractables);
    }
  }

  isInSynagogueScene(): boolean {
    return this.inShul;
  }

  setSynagogueMode(inside: boolean): void {
    this.inShul = inside;
    this.outdoor.visible = !inside;
    this.shulInterior.visible = inside;
    this.outdoorHemi.visible = !inside;
    this.outdoorSun.visible = !inside;
    this.shulLight.visible = inside;
    this.shulFill.visible = inside;

    if (inside) {
      this.scene.background = new THREE.Color(0x3d3428);
      this.scene.fog = new THREE.Fog(0x3d3428, 12, 28);
    } else {
      this.scene.background = new THREE.Color(0xc9b896);
      this.scene.fog = new THREE.Fog(0xc9b896, 50, 120);
    }

    for (const npc of this.npcs) {
      const isShulNpc = ShtetlWorld.SHUL_NPCS.has(npc.id);
      if (npc.id === 'shloyme') {
        // tratado em refreshChapterVisibility
        continue;
      }
      npc.mesh.visible = inside ? isShulNpc : !isShulNpc;
    }

    this.refreshModeSets();
    this.refreshChapterVisibility();
  }

  private tree(x: number, z: number): void {
    this.scene.add(cyl(0.18, 0.25, 1.3, COLORS.wood, x, 0.65, z, 6));
    const leaves = new THREE.Mesh(
      new THREE.SphereGeometry(1.15, 10, 10),
      mat(COLORS.leaf),
    );
    leaves.position.set(x, 2.1, z);
    leaves.castShadow = true;
    this.scene.add(leaves);
    const leaves2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.75, 8, 8),
      mat(COLORS.leafLight),
    );
    leaves2.position.set(x + 0.4, 2.3, z - 0.2);
    this.scene.add(leaves2);
    this.addCollider(x, z, 1.4, 1.4);
  }

  /** Padaria do Yankev — toldo, vitrine de pães, placa. */
  private buildBakery(
    x: number,
    z: number,
    w: number,
    d: number,
    h: number,
  ): void {
    this.building(x, z, w, d, h);
    const doorZ = z + d / 2;

    // Toldo listrado
    this.scene.add(box(w * 0.85, 0.08, 1.4, 0xc45c3a, x, 2.35, doorZ + 0.85));
    this.scene.add(box(w * 0.85, 0.06, 1.4, 0xe8d9b8, x, 2.28, doorZ + 0.85));
    // Suportes do toldo
    this.scene.add(box(0.08, 0.9, 0.08, COLORS.wood, x - w * 0.35, 1.85, doorZ + 1.4));
    this.scene.add(box(0.08, 0.9, 0.08, COLORS.wood, x + w * 0.35, 1.85, doorZ + 1.4));

    // Placa "BROYT"
    this.scene.add(box(2.2, 0.55, 0.12, COLORS.wood, x, 3.05, doorZ + 0.15));
    this.scene.add(box(1.9, 0.35, 0.08, 0xf0e6d0, x, 3.05, doorZ + 0.22));
    // Letras simples (blocos)
    for (const [lx, lw] of [
      [-0.7, 0.18],
      [-0.35, 0.18],
      [0, 0.22],
      [0.4, 0.18],
      [0.75, 0.18],
    ] as [number, number][]) {
      this.scene.add(box(lw, 0.22, 0.06, 0x6e4228, x + lx, 3.05, doorZ + 0.28));
    }

    // Vitrine / balcão na frente (pães)
    this.scene.add(box(2.8, 0.9, 0.7, COLORS.wood, x + 1.6, 0.5, doorZ + 1.1));
    this.scene.add(box(2.6, 0.08, 0.55, COLORS.woodLight, x + 1.6, 0.98, doorZ + 1.1));
    // Pães
    for (const px of [-0.7, -0.2, 0.3, 0.8] as const) {
      this.scene.add(
        cyl(0.16, 0.14, 0.55, 0xd4a060, x + 1.6 + px, 1.15, doorZ + 1.05, 8),
      );
    }
    this.scene.add(box(0.35, 0.2, 0.35, 0xc9a227, x + 2.4, 1.12, doorZ + 1.15)); // challah-ish
    this.addOrientedBox(x + 1.6, doorZ + 1.1, 2.9, 0.85, 0);

    // Sacos de farinha na lateral
    this.scene.add(box(0.55, 0.7, 0.45, 0xe8e0d0, x - 3.6, 0.4, doorZ + 0.9));
    this.scene.add(box(0.5, 0.55, 0.4, 0xe0d8c8, x - 3.6, 0.95, doorZ + 0.9));
    this.addCircle(x - 3.6, doorZ + 0.9, 0.55);

    // Janela quente (forno) — brilho âmbar
    this.scene.add(box(0.9, 0.7, 0.08, COLORS.wood, x - 1.8, 1.7, doorZ + 0.08));
    this.scene.add(box(0.7, 0.5, 0.06, 0xffb060, x - 1.8, 1.7, doorZ + 0.12));

    // Chaminé
    this.scene.add(box(0.7, 1.1, 0.7, 0x6a5a4a, x + 2.2, h + 0.9, z - 1.2));
    this.scene.add(box(0.85, 0.15, 0.85, 0x5a4a3a, x + 2.2, h + 1.5, z - 1.2));
  }

  /** Mercado do shtetl — barracas abertas com mercadorias. */
  private buildMarket(x: number, z: number): void {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 10),
      mat(COLORS.pathDark),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(x, 0.03, z);
    floor.receiveShadow = true;
    this.scene.add(floor);

    const stalls: { sx: number; sz: number; awning: number; kind: 'fruit' | 'books' | 'goods' }[] = [
      { sx: x - 4.2, sz: z + 1.2, awning: 0xc45c3a, kind: 'fruit' },
      { sx: x, sz: z + 1.5, awning: 0x3a6a8a, kind: 'books' },
      { sx: x + 4.2, sz: z + 1.2, awning: 0x6a5a3a, kind: 'goods' },
    ];

    for (const stall of stalls) {
      const { sx, sz, awning, kind } = stall;
      // Estrutura da tenda
      this.scene.add(box(3.2, 0.12, 2.4, COLORS.wood, sx, 1.15, sz));
      this.scene.add(box(3.4, 0.08, 2.6, awning, sx, 2.35, sz + 0.2));
      this.scene.add(box(0.1, 1.2, 0.1, COLORS.wood, sx - 1.4, 1.7, sz + 1.1));
      this.scene.add(box(0.1, 1.2, 0.1, COLORS.wood, sx + 1.4, 1.7, sz + 1.1));
      this.scene.add(box(0.1, 1.2, 0.1, COLORS.wood, sx - 1.4, 1.7, sz - 0.9));
      this.scene.add(box(0.1, 1.2, 0.1, COLORS.wood, sx + 1.4, 1.7, sz - 0.9));
      // Caixotes de base
      this.scene.add(box(0.85, 0.4, 0.65, 0x8a6a48, sx - 0.95, 1.42, sz + 0.15));
      this.scene.add(box(0.85, 0.4, 0.65, 0x7a5a38, sx + 0.95, 1.42, sz + 0.15));
      this.scene.add(box(0.7, 0.35, 0.55, 0x6a4a30, sx, 1.4, sz - 0.55));

      if (kind === 'fruit') this.fillFruitStall(sx, sz);
      else if (kind === 'books') this.fillBookStall(sx, sz);
      else this.fillGoodsStall(sx, sz);

      this.addOrientedBox(sx, sz, 3.3, 2.5, 0);
    }

    this.scene.add(box(2.4, 0.5, 0.1, COLORS.wood, x, 3.0, z + 3.2));
    this.scene.add(box(2.1, 0.32, 0.06, 0xf0e6d0, x, 3.0, z + 3.28));
  }

  /** Frutas e legumes na barraca. */
  private fillFruitStall(sx: number, sz: number): void {
    const y = 1.55;
    // Maçãs
    for (const [ox, oz] of [
      [-1.1, 0.1],
      [-0.95, 0.25],
      [-0.8, 0.05],
      [-1.0, -0.05],
      [-0.85, 0.15],
    ] as const) {
      this.scene.add(cyl(0.09, 0.1, 0.1, 0xb83c2a, sx + ox, y + 0.08, sz + oz, 8));
      this.scene.add(box(0.02, 0.06, 0.02, 0x3a5a28, sx + ox, y + 0.16, sz + oz));
    }
    // Laranjas / cidras
    for (const [ox, oz] of [
      [-0.35, 0.2],
      [-0.2, 0.05],
      [-0.05, 0.18],
      [-0.25, -0.1],
      [-0.1, 0.0],
    ] as const) {
      this.scene.add(cyl(0.1, 0.11, 0.1, 0xe08030, sx + ox, y + 0.08, sz + oz, 8));
    }
    // Uvas (cacho)
    for (let i = 0; i < 8; i++) {
      const gx = sx + 0.35 + (i % 3) * 0.07;
      const gz = sz + 0.05 + Math.floor(i / 3) * 0.08;
      this.scene.add(cyl(0.045, 0.05, 0.05, 0x5a2a6a, gx, y + 0.06 + (i % 2) * 0.04, gz, 6));
    }
    // Pêras
    for (const [ox, oz] of [
      [0.85, 0.15],
      [1.0, 0.0],
      [1.15, 0.2],
      [0.95, 0.25],
    ] as const) {
      this.scene.add(cyl(0.08, 0.1, 0.14, 0xc4c060, sx + ox, y + 0.1, sz + oz, 8));
      this.scene.add(box(0.02, 0.05, 0.02, 0x3a5a28, sx + ox, y + 0.2, sz + oz));
    }
    // Cebolas / beterrabas no caixote de trás
    for (const [ox, oz, c] of [
      [-0.2, -0.55, 0x8a5a3a],
      [0.0, -0.5, 0x7a3a4a],
      [0.2, -0.58, 0x9a6a40],
      [-0.1, -0.65, 0x6a2a3a],
    ] as const) {
      this.scene.add(cyl(0.09, 0.1, 0.09, c, sx + ox, y + 0.02, sz + oz, 8));
    }
    // Melancia
    this.scene.add(cyl(0.22, 0.24, 0.28, 0x2a6a3a, sx + 0.55, y + 0.12, sz - 0.55, 10));
    this.scene.add(box(0.35, 0.02, 0.08, 0x3a8a4a, sx + 0.55, y + 0.2, sz - 0.55));
  }

  /** Livros / seforim na barraca. */
  private fillBookStall(sx: number, sz: number): void {
    const y = 1.52;
    const bookColors = [0x6e2e22, 0x2a3a5a, 0x3a5a3a, 0x5a3a2a, 0x4a2a4a, 0x2a2a28];
    // Pilhas de livros deitados
    let stackY = y;
    for (let i = 0; i < 5; i++) {
      const c = bookColors[i % bookColors.length]!;
      this.scene.add(box(0.38, 0.06, 0.28, c, sx - 1.0, stackY, sz + 0.1));
      this.scene.add(box(0.04, 0.05, 0.26, 0xe8d9b8, sx - 1.0 - 0.17, stackY, sz + 0.1));
      stackY += 0.07;
    }
    stackY = y;
    for (let i = 0; i < 4; i++) {
      const c = bookColors[(i + 2) % bookColors.length]!;
      this.scene.add(box(0.32, 0.055, 0.24, c, sx - 0.45, stackY, sz + 0.2));
      this.scene.add(box(0.03, 0.045, 0.22, 0xf0e6d0, sx - 0.45 - 0.14, stackY, sz + 0.2));
      stackY += 0.06;
    }
    // Livros em pé (como em prateleira)
    for (let i = 0; i < 6; i++) {
      const c = bookColors[i % bookColors.length]!;
      const bx = sx + 0.55 + i * 0.12;
      const h = 0.28 + (i % 3) * 0.04;
      this.scene.add(box(0.1, h, 0.22, c, bx, y + h / 2 - 0.02, sz + 0.05));
      this.scene.add(box(0.02, h * 0.9, 0.2, 0xe8d9b8, bx - 0.04, y + h / 2 - 0.02, sz + 0.05));
    }
    // Sefer maior no centro (capa dourada)
    this.scene.add(box(0.42, 0.12, 0.32, 0x3a2a18, sx + 0.1, y + 0.08, sz - 0.45));
    this.scene.add(box(0.36, 0.04, 0.26, 0xc9a227, sx + 0.1, y + 0.16, sz - 0.45));
    this.scene.add(box(0.08, 0.02, 0.08, COLORS.gold, sx + 0.1, y + 0.19, sz - 0.45));
    // Pergaminhos enrolados
    this.scene.add(cyl(0.06, 0.06, 0.32, 0xe8d9b8, sx - 0.7, y + 0.08, sz - 0.5, 8));
    this.scene.add(cyl(0.055, 0.055, 0.28, 0xd8c8a0, sx - 0.5, y + 0.08, sz - 0.55, 8));
    // Tinteiro
    this.scene.add(cyl(0.07, 0.08, 0.1, 0x2a2a32, sx + 0.9, y + 0.08, sz - 0.5, 8));
    this.scene.add(box(0.02, 0.18, 0.02, 0x5a4030, sx + 1.05, y + 0.12, sz - 0.5));
  }

  /** Tecidos, velas, pães e miudezas. */
  private fillGoodsStall(sx: number, sz: number): void {
    const y = 1.52;
    // Rolos de tecido
    this.scene.add(cyl(0.12, 0.12, 0.55, 0x6a3a55, sx - 1.05, y + 0.1, sz + 0.1, 10));
    this.scene.add(cyl(0.11, 0.11, 0.5, 0x3a5a6a, sx - 0.75, y + 0.1, sz + 0.2, 10));
    this.scene.add(cyl(0.1, 0.1, 0.48, 0xc45c3a, sx - 0.9, y + 0.22, sz + 0.05, 10));
    // Velas
    for (let i = 0; i < 5; i++) {
      const cx = sx - 0.15 + i * 0.12;
      this.scene.add(cyl(0.035, 0.04, 0.22, 0xf0e6d0, cx, y + 0.14, sz + 0.15, 6));
      this.scene.add(box(0.015, 0.05, 0.015, 0x3a2a18, cx, y + 0.28, sz + 0.15));
    }
    // Pães
    this.scene.add(cyl(0.14, 0.16, 0.12, 0xd4a060, sx + 0.7, y + 0.08, sz + 0.1, 8));
    this.scene.add(cyl(0.12, 0.14, 0.1, 0xc49050, sx + 0.95, y + 0.08, sz + 0.2, 8));
    this.scene.add(cyl(0.13, 0.15, 0.11, 0xe0b070, sx + 1.15, y + 0.08, sz + 0.05, 8));
    // Chalá trançada (aproximação)
    this.scene.add(box(0.45, 0.12, 0.18, 0xe8c888, sx + 0.9, y + 0.1, sz - 0.5));
    this.scene.add(box(0.4, 0.06, 0.1, 0xd4a860, sx + 0.9, y + 0.18, sz - 0.5));
    // Ovos em cesta
    this.scene.add(box(0.35, 0.12, 0.28, 0x8a6a40, sx - 0.1, y + 0.04, sz - 0.5));
    this.scene.add(cyl(0.05, 0.055, 0.07, 0xf5ecd8, sx - 0.18, y + 0.14, sz - 0.52, 6));
    this.scene.add(cyl(0.05, 0.055, 0.07, 0xf0e6d0, sx - 0.05, y + 0.14, sz - 0.45, 6));
    this.scene.add(cyl(0.05, 0.055, 0.07, 0xf5ecd8, sx + 0.08, y + 0.14, sz - 0.52, 6));
    // Garrafa / jarro
    this.scene.add(cyl(0.08, 0.1, 0.22, 0x3a6a5a, sx + 0.35, y + 0.14, sz + 0.2, 8));
    this.scene.add(cyl(0.04, 0.05, 0.08, 0x3a6a5a, sx + 0.35, y + 0.28, sz + 0.2, 6));
  }

  /** Shpitol — pequena clínica do shtetl. */
  private buildClinic(x: number, z: number): void {
    const w = 9;
    const d = 6.5;
    const h = 3.4;
    this.scene.add(box(w, h, d, 0xe8e4dc, x, h / 2, z));
    this.scene.add(box(w + 0.5, 0.35, d + 0.5, 0x6e2e22, x, h + 0.15, z));
    this.scene.add(box(w * 0.3, 0.45, d + 0.2, 0x5a2418, x, h + 0.45, z));
    this.addCollider(x, z, w + 0.7, d + 0.7);

    const doorZ = z + d / 2 + 0.06;
    this.scene.add(box(1.1, 1.9, 0.1, COLORS.wood, x, 0.95, doorZ));
    this.scene.add(makeMezuzah(x + 0.62, 1.55, doorZ + 0.04));
    this.scene.add(box(0.7, 0.18, 0.08, 0xa83c3c, x, 2.55, doorZ + 0.05));
    this.scene.add(box(0.18, 0.7, 0.08, 0xa83c3c, x, 2.55, doorZ + 0.05));
    for (const sx of [-2.4, 2.4] as const) {
      this.scene.add(box(1.1, 1.0, 0.08, COLORS.wood, x + sx, 1.8, doorZ));
      this.scene.add(box(0.9, 0.8, 0.05, 0xa8d0e8, x + sx, 1.8, doorZ + 0.04));
    }
    this.scene.add(box(2.0, 0.45, 0.1, COLORS.wood, x, 3.55, doorZ + 0.1));
    this.scene.add(box(1.7, 0.28, 0.06, 0xf0e6d0, x, 3.55, doorZ + 0.16));
  }

  /** Cheder — escola do shtetl. */
  private buildCheder(x: number, z: number): void {
    const w = 8;
    const d = 6;
    const h = 3.1;
    this.building(x, z, w, d, h);
    const doorZ = z + d / 2;
    this.scene.add(box(2.3, 0.5, 0.1, 0x2a4a3a, x, 3.15, doorZ + 0.12));
    this.scene.add(box(2.0, 0.32, 0.06, 0xe8d9b8, x, 3.15, doorZ + 0.18));
    this.scene.add(box(2.0, 0.12, 0.55, COLORS.woodLight, x + 2.2, 0.55, doorZ + 1.3));
    this.scene.add(box(0.12, 0.5, 0.12, COLORS.wood, x + 1.4, 0.28, doorZ + 1.5));
    this.scene.add(box(0.12, 0.5, 0.12, COLORS.wood, x + 3.0, 0.28, doorZ + 1.5));
    this.addOrientedBox(x + 2.2, doorZ + 1.3, 2.1, 0.7, 0);
    this.scene.add(box(0.35, 0.12, 0.28, 0x6b3a55, x + 2.0, 0.72, doorZ + 1.25));
    this.scene.add(box(0.32, 0.1, 0.26, 0x3a6a8a, x + 2.0, 0.84, doorZ + 1.25));
  }

  /** Oficina / alfaiate do shtetl. */
  private buildWorkshop(x: number, z: number): void {
    const w = 7;
    const d = 5.5;
    const h = 2.9;
    this.scene.add(box(w, h, d, 0xd4c4a8, x, h / 2, z));
    this.scene.add(box(w + 0.45, 0.3, d + 0.45, 0x5a4030, x, h + 0.12, z));
    this.addCollider(x, z, w + 0.7, d + 0.7);
    const doorZ = z + d / 2 + 0.05;
    this.scene.add(box(1.0, 1.75, 0.1, COLORS.wood, x, 0.88, doorZ));
    this.scene.add(makeMezuzah(x + 0.55, 1.45, doorZ + 0.04));
    this.scene.add(box(1.6, 0.08, 0.9, 0x6a3a55, x + 2.2, 0.85, doorZ + 1.0));
    this.scene.add(cyl(0.22, 0.22, 1.1, 0x3a5a6a, x + 2.2, 1.05, doorZ + 1.0, 8));
    this.addOrientedBox(x + 2.2, doorZ + 1.0, 1.7, 1.0, 0);
    this.scene.add(box(1.6, 0.4, 0.08, COLORS.wood, x, 2.85, doorZ + 0.08));
  }

  /** Celeiro menor + pastos amplos com cavalos. */
  private buildBarn(x: number, z: number): void {
    const w = 6;
    const d = 5;
    const h = 3.2;

    // Celeiro compacto
    this.scene.add(box(w, h, d, 0x6b4a2e, x, h / 2, z));
    this.addCollider(x, z, w + 0.7, d + 0.7);

    const roofL = box(w / 2 + 0.3, 0.28, d + 0.5, 0x5a3a22, x - w / 4, h + 0.45, z);
    roofL.rotation.z = 0.38;
    this.scene.add(roofL);
    const roofR = box(w / 2 + 0.3, 0.28, d + 0.5, 0x5a3a22, x + w / 4, h + 0.45, z);
    roofR.rotation.z = -0.38;
    this.scene.add(roofR);
    this.scene.add(box(0.3, 0.9, d + 0.2, 0x4a2e18, x, h + 0.85, z));

    const doorZ = z + d / 2 + 0.05;
    this.scene.add(box(2.2, 2.2, 0.12, 0x5a3a1e, x, 1.15, doorZ));
    this.scene.add(box(0.1, 2.2, 0.06, COLORS.woodLight, x, 1.15, doorZ + 0.06));
    this.scene.add(box(1.8, 0.1, 0.06, COLORS.woodLight, x, 1.5, doorZ + 0.08));
    this.scene.add(box(1.8, 0.1, 0.06, COLORS.woodLight, x, 0.85, doorZ + 0.08));
    this.scene.add(box(0.8, 0.6, 0.08, 0xc9a227, x + 1.8, 2.5, doorZ));

    // Um único pasto grande ao sul do celeiro
    const pw = 22;
    const pd = 16;
    const pcx = x + 2;
    const pcz = z - d / 2 - pd / 2 - 1.2;
    this.addPaddock(pcx, pcz, pw, pd);

    const horses: [number, number, number, number][] = [
      [pcx - 7, pcz - 4, 0.4, 0x5a4030],
      [pcx - 3, pcz - 1, -1.0, 0x2a2218],
      [pcx + 1, pcz - 5, 1.8, 0x8a6a48],
      [pcx + 5, pcz - 2, 0.2, 0x4a3020],
      [pcx + 8, pcz + 1, -0.9, 0x6a5040],
      [pcx - 5, pcz + 3, 1.3, 0x3a2818],
      [pcx + 2, pcz + 4, -2.0, 0x7a5a38],
      [pcx - 1, pcz + 1, 2.4, 0x4a3828],
      [pcx + 6, pcz - 4.5, -1.5, 0x9a7a58],
      [pcx - 8, pcz + 0.5, 0.8, 0x3a2a1a],
      [pcx + 4, pcz + 2.5, -0.3, 0x6a4830],
    ];
    for (const [hx, hz, rot, col] of horses) {
      this.addHorse(hx, hz, rot, col);
    }

    // Bebedouros e feno dentro do cerco
    this.scene.add(box(1.4, 0.5, 0.7, COLORS.wood, pcx - 6, 0.28, pcz + 5));
    this.scene.add(box(1.2, 0.12, 0.5, 0x4a7a9a, pcx - 6, 0.52, pcz + 5));
    this.addCircle(pcx - 6, pcz + 5, 0.85);
    this.scene.add(box(1.4, 0.5, 0.7, COLORS.wood, pcx + 7, 0.28, pcz - 5));
    this.scene.add(box(1.2, 0.12, 0.5, 0x4a7a9a, pcx + 7, 0.52, pcz - 5));
    this.addCircle(pcx + 7, pcz - 5, 0.85);
    this.scene.add(box(1.5, 0.45, 1.1, 0xc9a227, pcx + 1, 0.25, pcz + 1));
    this.addCircle(pcx + 1, pcz + 1, 0.9);
    this.scene.add(box(1.3, 0.4, 1.0, 0xc9a227, pcx - 4, 0.22, pcz - 3));
    this.addCircle(pcx - 4, pcz - 3, 0.85);
  }

  private addPaddock(cx: number, cz: number, pw: number, pd: number): void {
    const postsX = Math.max(8, Math.floor(pw / 1.6));
    const postsZ = Math.max(6, Math.floor(pd / 1.6));
    for (let i = 0; i <= postsX; i++) {
      const fx = cx - pw / 2 + (i * pw) / postsX;
      this.scene.add(box(0.09, 0.95, 0.09, COLORS.wood, fx, 0.48, cz - pd / 2));
      this.scene.add(box(0.09, 0.95, 0.09, COLORS.wood, fx, 0.48, cz + pd / 2));
    }
    for (let i = 0; i <= postsZ; i++) {
      const fz = cz - pd / 2 + (i * pd) / postsZ;
      this.scene.add(box(0.09, 0.95, 0.09, COLORS.wood, cx - pw / 2, 0.48, fz));
      this.scene.add(box(0.09, 0.95, 0.09, COLORS.wood, cx + pw / 2, 0.48, fz));
    }
    this.scene.add(box(pw, 0.07, 0.07, COLORS.wood, cx, 0.65, cz - pd / 2));
    this.scene.add(box(pw, 0.07, 0.07, COLORS.wood, cx, 0.65, cz + pd / 2));
    this.scene.add(box(0.07, 0.07, pd, COLORS.wood, cx - pw / 2, 0.65, cz));
    this.scene.add(box(0.07, 0.07, pd, COLORS.wood, cx + pw / 2, 0.65, cz));

    const patch = new THREE.Mesh(
      new THREE.PlaneGeometry(pw - 0.4, pd - 0.4),
      mat(COLORS.grassDark),
    );
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(cx, 0.018, cz);
    this.scene.add(patch);

    // Várias manchas de pasto mais claro
    const spots: [number, number, number][] = [
      [-pw * 0.32, -pd * 0.28, 2.4],
      [pw * 0.28, -pd * 0.22, 2.1],
      [-pw * 0.18, pd * 0.2, 2.6],
      [pw * 0.22, pd * 0.28, 2.0],
      [0, -pd * 0.05, 2.8],
      [-pw * 0.05, pd * 0.05, 1.9],
      [pw * 0.35, pd * 0.05, 1.7],
      [-pw * 0.35, -pd * 0.05, 2.2],
      [pw * 0.08, -pd * 0.35, 1.8],
    ];
    for (const [ox, oz, r] of spots) {
      const spot = new THREE.Mesh(
        new THREE.CircleGeometry(r, 12),
        mat(COLORS.grass),
      );
      spot.rotation.x = -Math.PI / 2;
      spot.position.set(cx + ox, 0.022, cz + oz);
      this.scene.add(spot);
    }
  }

  private addHorse(x: number, z: number, rotY: number, color: number): void {
    const g = new THREE.Group();
    // Corpo
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.35, 0.9, 4, 8),
      mat(color),
    );
    body.rotation.z = Math.PI / 2;
    body.position.set(0, 0.95, 0);
    body.castShadow = true;
    g.add(body);
    // Pescoço
    const neck = box(0.28, 0.55, 0.28, color, 0.55, 1.25, 0);
    neck.rotation.z = -0.5;
    g.add(neck);
    // Cabeça
    g.add(box(0.45, 0.28, 0.25, color, 0.95, 1.45, 0));
    g.add(box(0.12, 0.1, 0.08, 0x1a1410, 1.15, 1.5, 0.08)); // olho
    g.add(box(0.12, 0.1, 0.08, 0x1a1410, 1.15, 1.5, -0.08));
    // Crina
    g.add(box(0.12, 0.4, 0.08, 0x1a1410, 0.5, 1.45, 0));
    // Orelhas
    g.add(box(0.08, 0.18, 0.06, color, 0.85, 1.65, 0.1));
    g.add(box(0.08, 0.18, 0.06, color, 0.85, 1.65, -0.1));
    // Pernas
    for (const [lx, lz] of [
      [-0.35, 0.2],
      [-0.35, -0.2],
      [0.35, 0.2],
      [0.35, -0.2],
    ] as [number, number][]) {
      g.add(cyl(0.07, 0.08, 0.75, color, lx, 0.4, lz, 6));
      g.add(box(0.12, 0.08, 0.18, 0x1a1410, lx, 0.05, lz));
    }
    // Cauda
    g.add(box(0.08, 0.5, 0.08, 0x1a1410, -0.7, 1.0, 0));
    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    this.scene.add(g);
    this.addCircle(x, z, 0.85);
  }

  private makeCow(color: number): {
    root: THREE.Group;
    legs: THREE.Object3D[];
  } {
    const g = new THREE.Group();
    // Corpo mais baixo e largo que cavalo
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.38, 0.85, 4, 8),
      mat(color),
    );
    body.rotation.z = Math.PI / 2;
    body.position.set(0, 0.85, 0);
    body.castShadow = true;
    g.add(body);
    // Manchas claras
    g.add(box(0.35, 0.28, 0.22, 0xf0ebe0, 0.15, 0.95, 0.28));
    g.add(box(0.25, 0.22, 0.18, 0xf0ebe0, -0.25, 0.88, -0.25));
    // Pescoço + cabeça
    g.add(box(0.28, 0.4, 0.28, color, 0.55, 1.05, 0));
    g.add(box(0.42, 0.28, 0.28, color, 0.85, 1.15, 0));
    g.add(box(0.1, 0.08, 0.06, 0x1a1410, 1.05, 1.2, 0.1));
    g.add(box(0.1, 0.08, 0.06, 0x1a1410, 1.05, 1.2, -0.1));
    // Orelhas
    g.add(box(0.08, 0.14, 0.06, color, 0.75, 1.35, 0.14));
    g.add(box(0.08, 0.14, 0.06, color, 0.75, 1.35, -0.14));
    // Chifres curtos
    g.add(cyl(0.03, 0.025, 0.18, 0xe8d9b8, 0.72, 1.42, 0.12, 5));
    g.add(cyl(0.03, 0.025, 0.18, 0xe8d9b8, 0.72, 1.42, -0.12, 5));
    // Úbere simples
    g.add(box(0.22, 0.14, 0.18, 0xe8d0c0, -0.15, 0.55, 0));
    // Cauda
    g.add(box(0.06, 0.45, 0.06, 0x3a2a1a, -0.65, 0.95, 0));
    g.add(box(0.1, 0.12, 0.1, 0x2a1a10, -0.65, 0.7, 0));

    const legs: THREE.Object3D[] = [];
    for (const [lx, lz] of [
      [0.35, 0.22],
      [0.35, -0.22],
      [-0.35, 0.22],
      [-0.35, -0.22],
    ] as [number, number][]) {
      const leg = new THREE.Group();
      leg.position.set(lx, 0.55, lz);
      leg.add(cyl(0.08, 0.09, 0.55, color, 0, -0.28, 0, 6));
      leg.add(box(0.14, 0.08, 0.16, 0x1a1410, 0, -0.55, 0.02));
      g.add(leg);
      legs.push(leg);
    }
    return { root: g, legs };
  }

  /** Lago irregular no fundo sul + vacas pastando no gramado em volta. */
  private buildLakeAndCows(): void {
    const cx = -6;
    const cz = -41;

    const addBlob = (
      ox: number,
      oz: number,
      rx: number,
      rz: number,
      y: number,
      color: number,
      segs = 28,
    ) => {
      const m = new THREE.Mesh(new THREE.CircleGeometry(1, segs), mat(color));
      m.scale.set(rx, rz, 1);
      m.rotation.x = -Math.PI / 2;
      m.position.set(cx + ox, y, cz + oz);
      m.receiveShadow = true;
      this.scene.add(m);
    };

    // Margem de terra (várias elipses sobrepostas = formato irregular)
    addBlob(0, 0, 5.8, 4.2, 0.02, 0x8a7850, 32);
    addBlob(2.2, -0.8, 3.4, 3.0, 0.021, 0x8a7850, 28);
    addBlob(-2.4, 1.0, 3.2, 2.8, 0.021, 0x8a7850, 28);
    addBlob(0.8, 1.8, 2.6, 2.2, 0.021, 0x8a7850, 24);
    addBlob(-1.2, -1.6, 2.8, 2.4, 0.021, 0x8a7850, 24);

    // Água
    addBlob(0, 0, 5.0, 3.5, 0.04, 0x3a6a82, 32);
    addBlob(1.8, -0.6, 2.8, 2.4, 0.041, 0x3a6a82, 28);
    addBlob(-2.0, 0.8, 2.6, 2.2, 0.041, 0x3a6a82, 28);
    addBlob(0.6, 1.4, 2.0, 1.7, 0.041, 0x3a6a82, 24);
    addBlob(-0.9, -1.2, 2.2, 1.8, 0.041, 0x3a6a82, 24);

    // Centro mais fundo + brilho
    addBlob(0.2, 0.1, 2.4, 1.8, 0.05, 0x2a4a62, 24);
    addBlob(-0.8, -0.4, 1.4, 1.0, 0.055, 0x6a9aaa, 16);

    // Juncos na margem
    const reeds: [number, number][] = [
      [-5.2, 0.5],
      [-4.0, 2.8],
      [-1.5, 3.6],
      [1.8, 3.2],
      [4.5, 1.5],
      [5.2, -0.8],
      [3.5, -2.8],
      [0.5, -3.5],
      [-2.8, -3.0],
      [-5.0, -1.5],
    ];
    for (const [ox, oz] of reeds) {
      this.scene.add(
        cyl(0.04, 0.03, 0.65, 0x3a6a38, cx + ox, 0.38, cz + oz, 5),
      );
      this.scene.add(
        cyl(0.03, 0.02, 0.5, 0x4a7a40, cx + ox + 0.1, 0.3, cz + oz + 0.06, 5),
      );
    }

    // Colisão da água (elipses aproximadas)
    this.addCircle(cx, cz, 4.2);
    this.addCircle(cx + 1.8, cz - 0.6, 2.4);
    this.addCircle(cx - 2.0, cz + 0.8, 2.3);

    // Rota no gramado em volta do lago (fora da água)
    const ringR = 7.5;
    const cowColors = [0x6a5040, 0x4a3828, 0x8a6a48, 0x3a2a1c, 0x7a5a38];
    for (let i = 0; i < 5; i++) {
      const margin = (i % 3) * 0.55;
      const points: { x: number; z: number }[] = [];
      const steps = 12;
      const start = (i / 5) * Math.PI * 2;
      for (let s = 0; s < steps; s++) {
        const a = start + (s / steps) * Math.PI * 2;
        const r = ringR + margin;
        points.push({
          x: cx + Math.cos(a) * r,
          z: cz + Math.sin(a) * r * 0.85,
        });
      }
      const { root, legs } = this.makeCow(cowColors[i]!);
      root.position.set(points[0]!.x, 0, points[0]!.z);
      // Modelo da vaca olha para +X → compensar na rotação
      root.rotation.y = Math.atan2(
        points[1]!.x - points[0]!.x,
        points[1]!.z - points[0]!.z,
      ) - Math.PI / 2;
      this.scene.add(root);
      this.cows.push({
        mesh: root,
        legs,
        points,
        index: 1,
        wait: i * 0.35,
        speed: 1.05 + (i % 3) * 0.2,
        phase: Math.random() * Math.PI * 2,
        radius: 0.75,
      });
    }
  }

  private buildBuildings(): void {
    // Hospedaria (sul)
    this.building(0, -24, 10, 7.5, 3.6, 'inn');

    // Sinagoga — fachada no shtetl; interior é cenário separado
    this.buildSynagogue();

    // Padaria (Yankev) e casa leste (Tsipe)
    this.buildBakery(-20, 8, 8, 6.5, 3.2);
    this.building(20, 8, 8, 6.5, 3.2);

    // Casa norte + casas extras (espaçadas)
    this.building(0, 28, 8, 5.5, 3);
    this.building(-28, -28, 7, 6, 2.9);
    this.building(22, -30, 7, 6, 2.9); // longe do lago sul
    // (sem casas em ±30,22 — ficavam grudadas nos prédios perto de Yankev/Tsipe)

    // Fundo norte — serviços do shtetl (espaçados, não só casa)
    this.buildMarket(0, 36);
    this.buildClinic(-22, 38);
    this.buildCheder(22, 38);
    this.buildWorkshop(-34, 28);
    this.building(34, 28, 6.5, 5.5, 2.8); // casa isolada leste
    this.building(-10, 42, 6, 5, 2.7); // casa afastada
    this.building(10, 42, 6, 5, 2.7);

    // Celeiro com cavalos — afastado a leste
    this.buildBarn(34, -6);

    // Lago + vacas no fundo sul (longe das ruas)
    this.buildLakeAndCows();

    for (const [x, z] of [
      // Borda
      [-34, -34],
      [34, -34],
      [-38, 0],
      [38, 0],
      [-40, 40],
      [40, 40],
      [20, -40],
      [-38, 16],
      [38, 16],
      [-38, -14],
      [38, -14],
      // Gramados (fora das casas novas e do lago)
      [-14, 20],
      [14, 20],
      [-26, -6],
      [22, 4],
      [-26, -22],
      [18, -22],
      [-14, -12],
      [14, -14],
      [-26, 14],
      [26, 14],
      [-8, 46],
      [8, 46],
      [-22, 26],
      [22, 26],
      [10, -32],
      [-24, -32],
      [-38, 36],
      [38, 36],
      [-16, 46],
      [16, 46],
    ] as [number, number][]) {
      this.tree(x, z);
    }

    const bound = 48;
    this.addCollider(0, -bound - 1, 110, 2);
    this.addCollider(0, bound + 1, 110, 2);
    this.addCollider(-bound - 1, 0, 2, 110);
    this.addCollider(bound + 1, 0, 2, 110);
  }

  /** Símbolos e detalhes judaicos — sempre no gramado, fora das paredes. */
  private buildJewishDetails(): void {
    const plaqueSh = makeHebrewPlaque(-20, 3.1, -16 + 6 - 0.2, 'ש');
    this.scene.add(plaqueSh);
    const plaqueCh = makeHebrewPlaque(20, 2.7, 8 + 3.3, 'ח');
    this.scene.add(plaqueCh);

    const starHouse = makeStarOfDavid(0.45, COLORS.gold);
    starHouse.position.set(20, 3.5, 8 + 3.3);
    this.scene.add(starHouse);

    const starInnSide = makeStarOfDavid(0.4, 0xe8d9b8);
    starInnSide.position.set(0, 3.2, -24 + 3.85);
    this.scene.add(starInnSide);

    // Cerca no gramado oeste da sinagoga
    for (let i = 0; i < 6; i++) {
      const fx = -28 + i * 0.55;
      this.scene.add(box(0.08, 0.7, 0.08, COLORS.wood, fx, 0.35, -16));
    }
    this.scene.add(box(3.2, 0.08, 0.06, COLORS.wood, -26.6, 0.55, -16));
  }

  private buildProps(): void {
    // Menorá grande no círculo central da praça
    const plazaMenorah = makePlazaMenorah(0, 0);
    this.scene.add(plazaMenorah);
    this.addCircle(0, 0, 1.6);

    // Poço no gramado (sudeste da praça)
    const well = makeWell(11, -14);
    this.scene.add(well);
    this.addCircle(11, -14, 1.35);

    // Banco só na frente da casa da Tsipe (padaria sem cadeira/banco na rua)
    const bench2 = makeBench(20, 13.5, Math.PI);
    this.scene.add(bench2);
    this.addOrientedBox(20, 13.5, 2.2, 0.9, Math.PI);

    // Carroça no quintal oeste da padaria
    const cart = makeCart(-27, 8, 0.2);
    this.scene.add(cart);
    this.addOrientedBox(-27, 8, 2.2, 1.5, 0.2);
    this.addCircle(-27, 8, 1.4);

    // Floreiras ao lado das portas
    this.scene.add(box(0.8, 0.35, 0.4, COLORS.wood, 23, 0.2, 12.2));
    this.scene.add(box(0.7, 0.25, 0.3, 0xc45c6a, 23, 0.45, 12.2));
    this.scene.add(box(0.15, 0.35, 0.15, COLORS.leaf, 22.85, 0.7, 12.2));
    this.scene.add(box(0.15, 0.4, 0.15, 0xe8d45a, 23.15, 0.72, 12.2));
    this.addCircle(23, 12.2, 0.65);

    this.scene.add(box(0.8, 0.35, 0.4, COLORS.wood, -23, 0.2, 12.2));
    this.scene.add(box(0.7, 0.25, 0.3, 0x7a9e4a, -23, 0.45, 12.2));
    this.addCircle(-23, 12.2, 0.65);

    // Barril perto da hospedaria
    this.scene.add(cyl(0.35, 0.4, 0.7, COLORS.wood, 5.5, 0.35, -18, 10));
    this.addCircle(5.5, -18, 0.55);

    // Foto perto do poço
    const photo = box(0.55, 0.7, 0.08, COLORS.cream, 12.5, 0.55, -13);
    const frame = box(0.65, 0.8, 0.05, COLORS.wood, 12.5, 0.55, -13.05);
    photo.visible = false;
    frame.visible = false;
    this.scene.add(frame);
    this.scene.add(photo);
    this.photoMesh = photo;
    (photo as THREE.Mesh & { frame?: THREE.Object3D }).frame = frame;
  }

  private addNpc(
    id: NpcId,
    name: string,
    style: PersonStyle,
    x: number,
    z: number,
    visible = true,
    patrolPoints?: { x: number; z: number }[],
    parent?: THREE.Object3D,
  ): WorldNpc {
    const rig = makePerson(style);
    const mesh = rig.root;
    mesh.position.set(x, 0, z);
    mesh.visible = visible;
    (parent ?? this.scene).add(mesh);
    const npc: WorldNpc = {
      id,
      name,
      mesh,
      position: mesh.position,
      radius: 0.72,
      rig,
    };
    if (patrolPoints && patrolPoints.length > 1) {
      npc.patrol = {
        points: patrolPoints,
        index: 0,
        wait: 0.5 + Math.random() * 1.5,
        speed: 1.6 + Math.random() * 0.6,
        phase: { value: Math.random() * Math.PI * 2 },
        dir: 1,
        freeLeft: 0,
        heading: 0,
      };
    }
    if (visible) this.npcs.push(npc);
    return npc;
  }

  private buildNpcs(): void {
    // Rivke: em frente à hospedaria
    const rivke = this.addNpc('rivke', 'Rivke', 'rivke', -4.5, -18.5);
    rivke.mesh.rotation.y = Math.PI;
    // Yankev: em frente à padaria
    const yankev = this.addNpc('yankev', 'Yankev', 'yankev', -18.5, 14.2);
    yankev.mesh.rotation.y = Math.PI / 2;
    // Tsipe: em frente à casa leste
    const tsipe = this.addNpc('tsipe', 'Tsipe', 'tsipe', 20, 13);
    tsipe.mesh.rotation.y = -Math.PI / 2;
    // Shloyme: junto ao poço
    this.shloyme = this.addNpc('shloyme', 'Reb Shloyme', 'shloyme', 9, -14, false);
    this.shloyme.mesh.rotation.y = -Math.PI * 0.65;

    // Moradores que andam pelas ruas (não alteram a história)
    this.addNpc('mendl', 'Mendl', 'mendl', 0, 18, true, [
      { x: 0, z: 18 },
      { x: 0, z: 8 },
      { x: 10, z: 0 },
      { x: 0, z: -8 },
      { x: -10, z: 0 },
      { x: 0, z: 8 },
    ]);
    this.addNpc('khaye', 'Khaye', 'khaye', 16, 0, true, [
      { x: 16, z: 0 },
      { x: 8, z: 0 },
      { x: 0, z: 0 },
      { x: -8, z: 0 },
      { x: -16, z: 0 },
      { x: -8, z: 0 },
      { x: 0, z: 0 },
      { x: 8, z: 0 },
    ]);
    this.addNpc('berl', 'Berl', 'berl', -6, 6, true, [
      { x: -6, z: 6 },
      { x: 6, z: 6 },
      { x: 6, z: -6 },
      { x: -6, z: -6 },
    ]);
    this.addNpc('sora', 'Sora', 'sora', 4, -16, true, [
      { x: 4, z: -16 },
      { x: 0, z: -12 },
      { x: -4, z: -16 },
      { x: 0, z: -20 },
    ]);
    this.addNpc('leib', 'Leib', 'leib', 0, -6, true, [
      { x: 0, z: -6 },
      { x: 0, z: 12 },
      { x: 0, z: 24 },
      { x: 0, z: 12 },
      { x: 0, z: -12 },
      { x: 0, z: -22 },
    ]);
    this.addNpc('dina', 'Dina', 'dina', -14, -4, true, [
      { x: -14, z: -4 },
      { x: -8, z: 0 },
      { x: 0, z: 4 },
      { x: 8, z: 0 },
      { x: 14, z: -4 },
      { x: 8, z: -8 },
      { x: 0, z: -4 },
      { x: -8, z: -8 },
    ]);

    // Norte — rotas na praça aberta (entre a casa z=28 e as barracas z≈37)
    this.addNpc('soyker', 'Itsik der Soykher', 'soyker', -5, 33, true, [
      { x: -7, z: 33 },
      { x: -3, z: 34 },
      { x: 3, z: 34 },
      { x: 7, z: 33 },
      { x: 3, z: 32.5 },
      { x: -3, z: 32.5 },
    ]);
    this.addNpc('rokhel', 'Rokhel', 'rokhel', 10, 33, true, [
      { x: 8, z: 33 },
      { x: 12, z: 32.5 },
      { x: 14, z: 34 },
      { x: 10, z: 34.5 },
      { x: 6, z: 33.5 },
    ]);
    this.addNpc('feldsher', 'Dr. Moyshe', 'feldsher', -22, 33, true, [
      { x: -22, z: 33 },
      { x: -18, z: 32.5 },
      { x: -26, z: 32.5 },
      { x: -24, z: 34 },
    ]);
    this.addNpc('melamed', 'Reb Aron', 'melamed', 22, 33, true, [
      { x: 22, z: 33 },
      { x: 18, z: 32.5 },
      { x: 26, z: 32.5 },
      { x: 24, z: 34 },
    ]);
    this.addNpc('shnayder', 'Hershl der Shnayder', 'shnayder', -32, 23, true, [
      { x: -32, z: 23 },
      { x: -28, z: 23 },
      { x: -28, z: 26 },
      { x: -32, z: 25 },
    ]);
    this.addNpc('freyde', 'Freyde', 'freyde', 32, 23, true, [
      { x: 32, z: 23 },
      { x: 28, z: 23 },
      { x: 28, z: 26 },
      { x: 32, z: 25 },
    ]);
    this.addNpc('motl', 'Motl', 'motl', -9, 33, true, [
      { x: -9, z: 33 },
      { x: -5, z: 34 },
      { x: 0, z: 34.5 },
      { x: 4, z: 33 },
      { x: -2, z: 32.5 },
    ]);
  }

  private static readonly NPC_SOLID_R = 0.72;

  /** Atualiza patrulha e animação dos moradores ambulantes. */
  updateVillagers(
    dt: number,
    paused = false,
    playerPos?: { x: number; z: number },
  ): void {
    if (this.inShul) return;
    const playerR = 0.55;

    for (const npc of this.npcs) {
      const patrol = npc.patrol;
      const rig = npc.rig;
      if (!patrol || !rig || !npc.mesh.visible) continue;

      if (paused) {
        applyWalkCycle(rig, false, dt, patrol.phase);
        continue;
      }

      this.unstickNpc(npc);

      if (patrol.wait > 0) {
        patrol.wait -= dt;
        applyWalkCycle(rig, false, dt, patrol.phase);
        continue;
      }

      const stepLen = patrol.speed * dt;

      // Modo livre: virou após bater e anda sem alvo fixo
      if (patrol.freeLeft > 0) {
        patrol.freeLeft -= dt;
        const mx = Math.sin(patrol.heading) * stepLen;
        const mz = Math.cos(patrol.heading) * stepLen;
        if (this.tryNpcStepFull(npc, mx, mz, playerPos, playerR)) {
          npc.mesh.rotation.y = patrol.heading;
          applyWalkCycle(rig, true, dt, patrol.phase);
        } else {
          const clear = this.pickClearNpcHeading(npc, patrol.heading, playerPos, playerR);
          if (clear != null) {
            patrol.heading = clear;
            npc.mesh.rotation.y = clear;
            this.tryNpcStepFull(
              npc,
              Math.sin(clear) * stepLen,
              Math.cos(clear) * stepLen,
              playerPos,
              playerR,
            );
            applyWalkCycle(rig, true, dt, patrol.phase);
          } else {
            patrol.freeLeft = 0;
            patrol.wait = 0.5 + Math.random() * 0.6;
            applyWalkCycle(rig, false, dt, patrol.phase);
          }
        }
        if (patrol.freeLeft <= 0) this.retargetNpcPatrol(npc);
        continue;
      }

      const target = patrol.points[patrol.index]!;
      const dx = target.x - npc.position.x;
      const dz = target.z - npc.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 0.45) {
        const n = patrol.points.length;
        patrol.index = (patrol.index + patrol.dir + n) % n;
        patrol.wait = 1.2 + Math.random() * 2.2;
        applyWalkCycle(rig, false, dt, patrol.phase);
        continue;
      }

      const facing = Math.atan2(dx, dz);
      const mx = (dx / dist) * stepLen;
      const mz = (dz / dist) * stepLen;

      if (this.tryNpcStepFull(npc, mx, mz, playerPos, playerR)) {
        npc.mesh.rotation.y = facing;
        applyWalkCycle(rig, true, dt, patrol.phase);
      } else {
        // Qualquer bloqueio (parede ou pessoa): vira e anda livre — sem deslizar na parede
        this.beginNpcFreeWalk(npc, facing, playerPos, playerR);
        applyWalkCycle(rig, patrol.freeLeft > 0, dt, patrol.phase);
      }
    }

    this.updateCows(dt, paused, playerPos);
  }

  /** Empurra NPC para fora se nasceu / ficou dentro de sólido. */
  private unstickNpc(npc: WorldNpc): void {
    const r = ShtetlWorld.NPC_SOLID_R;
    if (!this.collidesSolid(npc.position.x, npc.position.z, r)) return;
    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1],
    ];
    for (let dist = 0.4; dist <= 3.2; dist += 0.4) {
      for (const [sx, sz] of dirs) {
        const nx = npc.position.x + sx * dist;
        const nz = npc.position.z + sz * dist;
        if (!this.collidesSolid(nx, nz, r)) {
          npc.position.x = nx;
          npc.position.z = nz;
          return;
        }
      }
    }
  }

  private npcBlockedAt(
    x: number,
    z: number,
    npc: WorldNpc,
    playerPos: { x: number; z: number } | undefined,
    playerR: number,
  ): boolean {
    return (
      this.collidesSolid(x, z, ShtetlWorld.NPC_SOLID_R) ||
      this.hitsActor(x, z, npc.radius, playerPos, playerR, npc) ||
      this.hitsOtherNpc(x, z, npc)
    );
  }

  /** Passo completo (sem deslizar no eixo) — evita andar colado na parede. */
  private tryNpcStepFull(
    npc: WorldNpc,
    mx: number,
    mz: number,
    playerPos: { x: number; z: number } | undefined,
    playerR: number,
  ): boolean {
    const nx = npc.position.x + mx;
    const nz = npc.position.z + mz;
    if (this.npcBlockedAt(nx, nz, npc, playerPos, playerR)) return false;
    npc.position.x = nx;
    npc.position.z = nz;
    return true;
  }

  /** Inicia caminhada livre após colisão — vira e escolhe direção aberta. */
  private beginNpcFreeWalk(
    npc: WorldNpc,
    blockedFacing: number,
    playerPos: { x: number; z: number } | undefined,
    playerR: number,
  ): void {
    const patrol = npc.patrol;
    if (!patrol) return;
    const heading = this.pickClearNpcHeading(npc, blockedFacing, playerPos, playerR);
    if (heading == null) {
      patrol.dir = patrol.dir === 1 ? -1 : 1;
      this.retargetNpcPatrol(npc);
      patrol.wait = 0.4 + Math.random() * 0.5;
      return;
    }
    patrol.heading = heading;
    patrol.freeLeft = 2.2 + Math.random() * 2.5;
    patrol.dir = patrol.dir === 1 ? -1 : 1;
    npc.mesh.rotation.y = heading;
    const step = patrol.speed * (1 / 30);
    this.tryNpcStepFull(
      npc,
      Math.sin(heading) * step,
      Math.cos(heading) * step,
      playerPos,
      playerR,
    );
  }

  /** Escolhe ângulo livre, preferindo virar (~180°) em relação à direção bloqueada. */
  private pickClearNpcHeading(
    npc: WorldNpc,
    blockedFacing: number,
    playerPos: { x: number; z: number } | undefined,
    playerR: number,
  ): number | null {
    const probe = 1.15;
    const offsets = [
      Math.PI,
      Math.PI * 0.85,
      -Math.PI * 0.85,
      Math.PI * 0.65,
      -Math.PI * 0.65,
      Math.PI * 0.5,
      -Math.PI * 0.5,
      Math.PI * 0.35,
      -Math.PI * 0.35,
      Math.PI * 1.15,
      -Math.PI * 1.15,
      Math.PI * 0.25,
      -Math.PI * 0.25,
    ];
    for (let i = offsets.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const a = offsets[i]!;
      offsets[i] = offsets[j]!;
      offsets[j] = a;
    }
    offsets.unshift(Math.PI);

    for (const off of offsets) {
      const angle = blockedFacing + off;
      const nx = npc.position.x + Math.sin(angle) * probe;
      const nz = npc.position.z + Math.cos(angle) * probe;
      if (!this.npcBlockedAt(nx, nz, npc, playerPos, playerR)) return angle;
    }
    return null;
  }

  /** Após desvio livre, aponta para o ponto de patrulha mais próximo no sentido atual. */
  private retargetNpcPatrol(npc: WorldNpc): void {
    const patrol = npc.patrol;
    if (!patrol || patrol.points.length === 0) return;
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < patrol.points.length; i++) {
      const p = patrol.points[i]!;
      const d = Math.hypot(p.x - npc.position.x, p.z - npc.position.z);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    const n = patrol.points.length;
    patrol.index = (best + patrol.dir + n) % n;
  }

  private updateCows(
    dt: number,
    paused: boolean,
    playerPos?: { x: number; z: number },
  ): void {
    for (const cow of this.cows) {
      if (paused) {
        this.animateCowLegs(cow, false, dt);
        continue;
      }
      if (cow.wait > 0) {
        cow.wait -= dt;
        this.animateCowLegs(cow, false, dt);
        continue;
      }

      const target = cow.points[cow.index]!;
      const dx = target.x - cow.mesh.position.x;
      const dz = target.z - cow.mesh.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 0.5) {
        cow.index = (cow.index + 1) % cow.points.length;
        cow.wait = 0.8 + Math.random() * 2.5;
        this.animateCowLegs(cow, false, dt);
        continue;
      }

      const step = (cow.speed * dt) / dist;
      let nx = cow.mesh.position.x + dx * step;
      let nz = cow.mesh.position.z + dz * step;

      if (playerPos) {
        const pdx = nx - playerPos.x;
        const pdz = nz - playerPos.z;
        if (pdx * pdx + pdz * pdz < (cow.radius + 0.55) ** 2) {
          cow.wait = 0.5 + Math.random() * 0.7;
          this.animateCowLegs(cow, false, dt);
          continue;
        }
      }

      if (this.collidesSolid(nx, nz, 0.5)) {
        cow.index = (cow.index + 1) % cow.points.length;
        cow.wait = 0.4;
        this.animateCowLegs(cow, false, dt);
        continue;
      }

      cow.mesh.position.x = nx;
      cow.mesh.position.z = nz;
      // Cabeça da vaca está em +X local
      cow.mesh.rotation.y = Math.atan2(dx, dz) - Math.PI / 2;
      this.animateCowLegs(cow, true, dt);
    }
  }

  private animateCowLegs(cow: GrazingCow, moving: boolean, dt: number): void {
    if (moving) {
      cow.phase += dt * 7;
      const swing = Math.sin(cow.phase) * 0.55;
      cow.legs[0]!.rotation.x = swing;
      cow.legs[1]!.rotation.x = -swing;
      cow.legs[2]!.rotation.x = -swing;
      cow.legs[3]!.rotation.x = swing;
      cow.mesh.position.y = Math.abs(Math.sin(cow.phase * 2)) * 0.03;
    } else {
      for (const leg of cow.legs) leg.rotation.x *= 0.75;
      cow.mesh.position.y *= 0.8;
    }
  }

  private hitsActor(
    x: number,
    z: number,
    radius: number,
    actor: { x: number; z: number } | undefined,
    actorR: number,
    _self: WorldNpc,
  ): boolean {
    if (!actor) return false;
    const dx = x - actor.x;
    const dz = z - actor.z;
    const min = radius + actorR;
    return dx * dx + dz * dz < min * min;
  }

  private hitsOtherNpc(x: number, z: number, self: WorldNpc): boolean {
    for (const other of this.npcs) {
      if (other === self || !other.mesh.visible) continue;
      const dx = x - other.position.x;
      const dz = z - other.position.z;
      const min = self.radius + other.radius;
      if (dx * dx + dz * dz < min * min) return true;
    }
    return false;
  }

  /** Colisão só com prédios / props (sem NPCs) — para patrulha. */
  private collidesSolid(x: number, z: number, radius: number): boolean {
    for (const c of this.colliders) {
      const nearestX = Math.max(c.minX, Math.min(x, c.maxX));
      const nearestZ = Math.max(c.minZ, Math.min(z, c.maxZ));
      const dx = x - nearestX;
      const dz = z - nearestZ;
      if (dx * dx + dz * dz < radius * radius) return true;
    }
    for (const c of this.circles) {
      const dx = x - c.x;
      const dz = z - c.z;
      const minDist = radius + c.r;
      if (dx * dx + dz * dz < minDist * minDist) return true;
    }
    return false;
  }

  refreshChapterVisibility(): void {
    if (this.shloyme) {
      const show = GameState.chapter >= 3;
      this.shloyme.mesh.visible = show;
      if (show && !this.npcs.includes(this.shloyme)) {
        this.npcs.push(this.shloyme);
      }
      if (!show) {
        const i = this.npcs.indexOf(this.shloyme);
        if (i >= 0) this.npcs.splice(i, 1);
      }
    }

    if (this.photoMesh) {
      const show =
        GameState.chapter === 4 && !GameState.flags.chapter4Photo;
      this.photoMesh.visible = show;
      const frame = (this.photoMesh as THREE.Mesh & { frame?: THREE.Object3D }).frame;
      if (frame) frame.visible = show;
      // Colisão só quando a foto está no mundo
      // (tratada em collides via posição)
    }
  }

  spawnPlayerNearInn(): THREE.Vector3 {
    return new THREE.Vector3(0, 0, -18);
  }

  spawnPlayerDefault(): THREE.Vector3 {
    return new THREE.Vector3(0, 0, 10);
  }

  /** Está no cenário interno da sinagoga? */
  isInsideSynagogue(_pos?: THREE.Vector3): boolean {
    return this.inShul;
  }

  spawnInsideSynagogue(): THREE.Vector3 {
    // Longe da bimá (centro) — perto da porta de saída/entrada
    return new THREE.Vector3(-2.5, 0, -4.2);
  }

  spawnOutsideSynagogue(): THREE.Vector3 {
    // Logo na frente da porta (sinagoga em -20,-16; porta em z ≈ -10)
    return new THREE.Vector3(-20, 0, -8.2);
  }

  private npcInCurrentScene(npc: WorldNpc): boolean {
    const isShul = ShtetlWorld.SHUL_NPCS.has(npc.id);
    return this.inShul ? isShul : !isShul;
  }

  collides(x: number, z: number, radius = 0.5): boolean {
    for (const c of this.colliders) {
      const nearestX = Math.max(c.minX, Math.min(x, c.maxX));
      const nearestZ = Math.max(c.minZ, Math.min(z, c.maxZ));
      const dx = x - nearestX;
      const dz = z - nearestZ;
      if (dx * dx + dz * dz < radius * radius) return true;
    }

    for (const c of this.circles) {
      const dx = x - c.x;
      const dz = z - c.z;
      const minDist = radius + c.r;
      if (dx * dx + dz * dz < minDist * minDist) return true;
    }

    for (const npc of this.npcs) {
      if (!npc.mesh.visible || !this.npcInCurrentScene(npc)) continue;
      const dx = x - npc.position.x;
      const dz = z - npc.position.z;
      const minDist = radius + npc.radius;
      if (dx * dx + dz * dz < minDist * minDist) return true;
    }

    if (!this.inShul) {
      for (const cow of this.cows) {
        const dx = x - cow.mesh.position.x;
        const dz = z - cow.mesh.position.z;
        const minDist = radius + cow.radius;
        if (dx * dx + dz * dz < minDist * minDist) return true;
      }
    }

    if (
      this.photoMesh?.visible &&
      GameState.chapter === 4 &&
      !GameState.flags.chapter4Photo
    ) {
      const dx = x - this.photoMesh.position.x;
      const dz = z - this.photoMesh.position.z;
      if (dx * dx + dz * dz < (radius + 0.45) * (radius + 0.45)) return true;
    }

    return false;
  }

  nearestInteractable(
    pos: THREE.Vector3,
    maxDist = 2.8,
  ): Interactable | WorldNpc | null {
    let best: Interactable | WorldNpc | null = null;
    let bestD = maxDist;

    for (const npc of this.npcs) {
      if (!npc.mesh.visible || !this.npcInCurrentScene(npc)) continue;
      const d = pos.distanceTo(npc.position);
      if (d < bestD) {
        bestD = d;
        best = npc;
      }
    }

    if (
      this.photoMesh?.visible &&
      !this.inShul &&
      GameState.chapter === 4 &&
      !GameState.flags.chapter4Photo
    ) {
      const photoPos = this.photoMesh.position;
      const d = pos.distanceTo(photoPos);
      if (d < bestD) {
        bestD = d;
        best = {
          id: 'photo',
          name: 'Fotografia',
          position: photoPos.clone(),
          radius: 2,
        };
      }
    }

    for (const it of this.interactables) {
      const d = pos.distanceTo(it.position);
      if (d < Math.min(bestD, it.radius)) {
        bestD = d;
        best = it;
      }
    }

    return best;
  }
}

export { makePerson };
