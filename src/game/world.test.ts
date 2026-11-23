import { describe, expect, it } from 'vitest';
import { FLOOR, parseFloor, type Floor, type Tile } from './map';
import { adjacentTarget, isBlocked, step, tryMove, type Dir } from './movement';
import { BOT_ROUTES, botPosition, touches } from './bots';

const floor = parseFloor(FLOOR);
const key = (t: Tile) => `${t.x},${t.y}`;
const DIRS: Dir[] = ['up', 'down', 'left', 'right'];

/** Every tile the player can stand on, walking from spawn. */
function reachable(f: Floor, doorOpen: boolean) {
  const seen = new Set([key(f.spawn)]);
  const queue = [f.spawn];
  while (queue.length) {
    const here = queue.shift() as Tile;
    for (const dir of DIRS) {
      const next = step(here, dir);
      if (!isBlocked(f, next, doorOpen) && !seen.has(key(next))) {
        seen.add(key(next));
        queue.push(next);
      }
    }
  }
  return seen;
}

const neighbours = (t: Tile) => DIRS.map((d) => key(step(t, d)));

describe('the floor', () => {
  it('has a spawn, five terminals, a door and a mainframe', () => {
    expect(floor.terminals.map((t) => t.id)).toEqual([1, 2, 3, 4, 5]);
    expect(floor.terminals.map((t) => t.topic)).toEqual([
      'linux',
      'network',
      'web',
      'python',
      'data',
    ]);
    expect(floor.door).toBeDefined();
    expect(floor.mainframe).toBeDefined();
    expect(floor.width).toBe(16);
    expect(floor.height).toBe(11);
  });

  it('lets the player reach every terminal with the door shut', () => {
    const open = reachable(floor, false);
    for (const terminal of floor.terminals) {
      expect(
        neighbours(terminal.at).some((n) => open.has(n)),
        `terminal ${terminal.id}`,
      ).toBe(true);
    }
  });

  it('keeps the mainframe sealed until the door opens', () => {
    expect(neighbours(floor.mainframe).some((n) => reachable(floor, false).has(n))).toBe(false);
    expect(neighbours(floor.mainframe).some((n) => reachable(floor, true).has(n))).toBe(true);
  });
});

describe('movement', () => {
  it('moves one tile on open floor', () => {
    expect(tryMove(floor, floor.spawn, 'right', false)).toEqual({
      x: floor.spawn.x + 1,
      y: floor.spawn.y,
    });
  });

  it('stays put when walking into a wall', () => {
    expect(tryMove(floor, floor.spawn, 'up', false)).toEqual(floor.spawn);
  });

  it('treats terminals as solid', () => {
    const terminal = floor.terminals[0].at;
    expect(isBlocked(floor, terminal, false)).toBe(true);
  });

  it('finds the terminal the player is facing', () => {
    const terminal = floor.terminals[0];
    const besideLeft = { x: terminal.at.x - 1, y: terminal.at.y };
    expect(adjacentTarget(floor, besideLeft, 'right')).toEqual({
      kind: 'terminal',
      id: terminal.id,
    });
    expect(adjacentTarget(floor, besideLeft, 'left')).toBeNull();
  });
});

describe('firewall bots', () => {
  it('has three routes that only cross open floor and avoid the spawn', () => {
    expect(BOT_ROUTES).toHaveLength(3);
    for (const route of BOT_ROUTES) {
      for (const tile of route) {
        expect(isBlocked(floor, tile, false), key(tile)).toBe(false);
        expect(touches(tile, floor.spawn)).toBe(false);
      }
    }
  });

  it('walks a route one tile every half second and loops back to the start', () => {
    const route = BOT_ROUTES[0];
    expect(botPosition(route, 0)).toEqual(route[0]);
    expect(botPosition(route, 0.5)).toEqual(route[1]);
    expect(botPosition(route, route.length * 0.5)).toEqual(route[0]);
  });

  it('touches only on the same tile', () => {
    expect(touches({ x: 2, y: 3 }, { x: 2, y: 3 })).toBe(true);
    expect(touches({ x: 2, y: 3 }, { x: 3, y: 3 })).toBe(false);
  });
});
