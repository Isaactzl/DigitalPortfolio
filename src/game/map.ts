import type { Topic } from './types';

export interface Tile {
  x: number;
  y: number;
}

export interface Terminal {
  id: number;
  topic: Topic;
  at: Tile;
}

export interface Floor {
  width: number;
  height: number;
  walls: Set<string>;
  spawn: Tile;
  terminals: Terminal[];
  door: Tile;
  mainframe: Tile;
}

/**
 * The training-range floor. # wall, . floor, S spawn, 1–5 terminals, D vault door,
 * M mainframe. The vault in the bottom right is only reachable through the door.
 */
export const FLOOR = [
  '################',
  '#S...#.....1...#',
  '#.##.#.###.##..#',
  '#.#2...#.......#',
  '#.####.#.###.3.#',
  '#......#...#...#',
  '##.##.###.##.###',
  '#4.......5.....#',
  '#.###.####.#####',
  '#.........D..M.#',
  '################',
];

const TERMINAL_TOPICS: Topic[] = ['linux', 'network', 'web', 'python', 'data'];

export const tileKey = (t: Tile) => `${t.x},${t.y}`;

export function parseFloor(rows: string[]): Floor {
  const walls = new Set<string>();
  const terminals: Terminal[] = [];
  let spawn: Tile | undefined;
  let door: Tile | undefined;
  let mainframe: Tile | undefined;

  rows.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      const at = { x, y };
      if (cell === '#') walls.add(tileKey(at));
      else if (cell === 'S') spawn = at;
      else if (cell === 'D') door = at;
      else if (cell === 'M') mainframe = at;
      else if (/[1-5]/.test(cell)) {
        const id = Number(cell);
        terminals.push({ id, topic: TERMINAL_TOPICS[id - 1], at });
      }
    });
  });

  if (!spawn || !door || !mainframe) throw new Error('Floor needs S, D and M');
  terminals.sort((a, b) => a.id - b.id);
  return { width: rows[0].length, height: rows.length, walls, spawn, terminals, door, mainframe };
}
