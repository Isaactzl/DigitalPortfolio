import { tileKey, type Floor, type Tile } from './map';

export type Dir = 'up' | 'down' | 'left' | 'right';

const OFFSETS: Record<Dir, Tile> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export const step = (from: Tile, dir: Dir): Tile => ({
  x: from.x + OFFSETS[dir].x,
  y: from.y + OFFSETS[dir].y,
});

const same = (a: Tile, b: Tile) => a.x === b.x && a.y === b.y;

/** Walls, terminals, the mainframe and a shut door all stop the player. */
export function isBlocked(floor: Floor, t: Tile, doorOpen: boolean): boolean {
  if (t.x < 0 || t.y < 0 || t.x >= floor.width || t.y >= floor.height) return true;
  if (floor.walls.has(tileKey(t))) return true;
  if (same(t, floor.mainframe)) return true;
  if (!doorOpen && same(t, floor.door)) return true;
  return floor.terminals.some((terminal) => same(terminal.at, t));
}

export function tryMove(floor: Floor, from: Tile, dir: Dir, doorOpen: boolean): Tile {
  const next = step(from, dir);
  return isBlocked(floor, next, doorOpen) ? from : next;
}

export type Target = { kind: 'terminal'; id: number } | { kind: 'mainframe' };

/** What the player would hack by pressing action, given where they stand and face. */
export function adjacentTarget(floor: Floor, at: Tile, facing: Dir): Target | null {
  const front = step(at, facing);
  const terminal = floor.terminals.find((t) => same(t.at, front));
  if (terminal) return { kind: 'terminal', id: terminal.id };
  if (same(front, floor.mainframe)) return { kind: 'mainframe' };
  return null;
}
