import type { Floor, Tile } from './map';
import type { Run } from './run';
import { isLocked } from './run';
import {
  drawBot,
  drawDoor,
  drawFloor,
  drawHacker,
  drawMainframe,
  drawTerminal,
  drawWall,
  PAL,
} from './sprites';

export const TILE = 16;

export interface View {
  /** The player's drawn position in tiles; fractional while gliding between tiles. */
  player: { x: number; y: number };
  walkFrame: number;
  time: number;
}

export function createRenderer(canvas: HTMLCanvasElement, floor: Floor) {
  canvas.width = floor.width * TILE;
  canvas.height = floor.height * TILE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not available');
  ctx.imageSmoothingEnabled = false;

  // Walls and floor never change, so they're drawn once and copied each frame.
  const backdrop = document.createElement('canvas');
  backdrop.width = canvas.width;
  backdrop.height = canvas.height;
  const back = backdrop.getContext('2d')!;
  back.fillStyle = PAL.void;
  back.fillRect(0, 0, backdrop.width, backdrop.height);
  for (let y = 0; y < floor.height; y++) {
    for (let x = 0; x < floor.width; x++) {
      if (floor.walls.has(`${x},${y}`)) drawWall(back, x * TILE, y * TILE);
      else drawFloor(back, x * TILE, y * TILE);
    }
  }

  const at = (t: Tile) => [t.x * TILE, t.y * TILE] as const;

  return {
    draw(run: Run, view: View) {
      ctx.drawImage(backdrop, 0, 0);
      drawDoor(ctx, ...at(floor.door), run.doorOpen);
      drawMainframe(ctx, ...at(floor.mainframe), view.time);
      for (const terminal of floor.terminals) {
        const state = run.terminals[terminal.id];
        const look =
          state === 'cracked' ? 'cracked' : isLocked(run, terminal.id) ? 'locked' : 'idle';
        drawTerminal(ctx, ...at(terminal.at), look, view.time);
      }
      const botFrame = Math.floor(view.time * 2);
      for (const bot of run.bots) drawBot(ctx, ...at(bot), botFrame);
      drawHacker(
        ctx,
        Math.round(view.player.x * TILE),
        Math.round(view.player.y * TILE),
        run.facing,
        view.walkFrame,
      );
    },
  };
}
