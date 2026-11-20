/** Paleta de casacos para a sala — até 10 jogadores com cores distintas. */
export const LIBRARY_COAT_COLORS: number[] = [
  0x8a3c3c, // vinho (padrão do jogador)
  0x2f4a6e, // azul
  0x3a6a48, // verde
  0x6a3a6a, // roxo
  0xb86a28, // laranja
  0x3a5a6a, // teal
  0x8a5a2a, // marrom
  0x5a3a2a, // café
  0x4a4a5a, // cinza-azulado
  0x6a4a3a, // terracotta
  0x2a5a5a, // petróleo
  0x7a4a5a, // rosa-escuro
];

export function pickFreeCoat(taken: Iterable<number>): number {
  const used = new Set(
    [...taken].map((c) => (c >>> 0) & 0xffffff),
  );
  for (const color of LIBRARY_COAT_COLORS) {
    if (!used.has(color)) return color;
  }
  // Fallback: variação leve se todas ocupadas
  const base = LIBRARY_COAT_COLORS[Math.floor(Math.random() * LIBRARY_COAT_COLORS.length)]!;
  return (base + Math.floor(Math.random() * 0x202020)) & 0xffffff;
}

export function normalizeRoomCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, 16);
}
