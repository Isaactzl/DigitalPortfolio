import type { Tile } from './map';

/** Seconds a bot spends on each tile of its route. */
export const BOT_STEP = 0.5;

/** Walks out and back along a straight corridor, as one repeating loop. */
function patrol(y: number, fromX: number, toX: number): Tile[] {
  const out: Tile[] = [];
  for (let x = fromX; x <= toX; x++) out.push({ x, y });
  const back = out.slice(1, -1).reverse();
  return [...out, ...back];
}

export const BOT_ROUTES: Tile[][] = [patrol(5, 1, 6), patrol(3, 8, 14), patrol(7, 10, 14)];

export function botPosition(route: Tile[], t: number): Tile {
  return route[Math.floor(t / BOT_STEP) % route.length];
}

export const touches = (a: Tile, b: Tile) => a.x === b.x && a.y === b.y;
