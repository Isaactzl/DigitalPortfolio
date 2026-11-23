import type { Dir } from './movement';

/** Our own small palette: a dark training facility with neon green and the site's stamp red. */
export const PAL = {
  void: '#0d0e16',
  floor: '#171926',
  floorDot: '#22253a',
  wall: '#2b2f48',
  wallTop: '#3d4366',
  wallDark: '#1d2033',
  outline: '#0b0b12',
  hood: '#3a5bd9',
  hoodDark: '#253b94',
  skin: '#f2c79a',
  visor: '#5ef08a',
  metal: '#8c93a3',
  metalDark: '#4a5060',
  screen: '#4fd8e8',
  green: '#5ef08a',
  greenDark: '#1f7a45',
  red: '#e0533a',
  redDark: '#8f2717',
  amber: '#f4c542',
  white: '#e8e6dc',
} as const;

/** Everything is drawn in whole pixels at the 256×176 internal size; the canvas scales it up. */
type Ctx = CanvasRenderingContext2D;
const px = (ctx: Ctx, color: string, x: number, y: number, w = 1, h = 1) => {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
};

export function drawFloor(ctx: Ctx, x: number, y: number) {
  px(ctx, PAL.floor, x, y, 16, 16);
  px(ctx, PAL.floorDot, x, y);
  px(ctx, PAL.floorDot, x + 8, y + 8);
}

export function drawWall(ctx: Ctx, x: number, y: number) {
  px(ctx, PAL.wall, x, y, 16, 16);
  px(ctx, PAL.wallTop, x, y, 16, 3);
  px(ctx, PAL.wallDark, x, y + 15, 16, 1);
  // Panel seams, offset per row so walls read as a built structure.
  px(ctx, PAL.wallDark, x + ((y / 16) % 2 ? 4 : 11), y + 4, 1, 10);
}

export function drawHacker(ctx: Ctx, x: number, y: number, facing: Dir, frame: number) {
  px(ctx, PAL.outline, x + 3, y + 1, 10, 12);
  px(ctx, PAL.hood, x + 4, y + 2, 8, 10);
  px(ctx, PAL.hoodDark, x + 4, y + 9, 8, 3);
  if (facing !== 'up') {
    const faceX = facing === 'left' ? x + 4 : facing === 'right' ? x + 6 : x + 5;
    px(ctx, PAL.skin, faceX, y + 4, 6, 4);
    px(ctx, PAL.visor, faceX, y + 5, 6, 1);
  } else {
    px(ctx, PAL.hoodDark, x + 6, y + 3, 4, 5);
  }
  // Two-frame walk: the legs swap heights.
  const [left, right] = frame % 2 ? [3, 2] : [2, 3];
  px(ctx, PAL.outline, x + 5, y + 12, 2, left);
  px(ctx, PAL.outline, x + 9, y + 12, 2, right);
}

export type TerminalLook = 'idle' | 'cracked' | 'locked';

export function drawTerminal(ctx: Ctx, x: number, y: number, look: TerminalLook, t: number) {
  px(ctx, PAL.metalDark, x + 1, y + 10, 14, 5);
  px(ctx, PAL.metal, x + 1, y + 10, 14, 1);
  px(ctx, PAL.outline, x + 2, y + 1, 12, 9);
  const screen = look === 'cracked' ? PAL.greenDark : look === 'locked' ? PAL.redDark : '#16404a';
  px(ctx, screen, x + 3, y + 2, 10, 7);
  if (look === 'idle') {
    px(ctx, PAL.screen, x + 4, y + 3, 6, 1);
    px(ctx, PAL.screen, x + 4, y + 5, 4, 1);
    if (Math.floor(t * 2) % 2 === 0) px(ctx, PAL.screen, x + 9, y + 5, 2, 1);
  } else if (look === 'cracked') {
    px(ctx, PAL.green, x + 5, y + 5, 1, 1);
    px(ctx, PAL.green, x + 6, y + 6, 1, 1);
    px(ctx, PAL.green, x + 7, y + 5, 1, 1);
    px(ctx, PAL.green, x + 8, y + 4, 1, 1);
    px(ctx, PAL.green, x + 9, y + 3, 1, 1);
  } else {
    for (let i = 0; i < 5; i++) {
      px(ctx, PAL.red, x + 5 + i, y + 3 + i, 1, 1);
      px(ctx, PAL.red, x + 9 - i, y + 3 + i, 1, 1);
    }
  }
}

export function drawBot(ctx: Ctx, x: number, y: number, frame: number) {
  px(ctx, PAL.outline, x + 2, y + 3, 12, 11);
  px(ctx, PAL.red, x + 3, y + 4, 10, 9);
  px(ctx, PAL.redDark, x + 3, y + 11, 10, 2);
  px(ctx, PAL.metal, x + 7, y + 1, 2, 3);
  px(ctx, PAL.amber, x + 7, y, 2, 1);
  // The eye scans side to side.
  px(ctx, PAL.white, x + (frame % 2 ? 5 : 8), y + 6, 3, 3);
  px(ctx, PAL.outline, x + (frame % 2 ? 6 : 9), y + 7, 1, 1);
}

export function drawDoor(ctx: Ctx, x: number, y: number, open: boolean) {
  if (open) {
    drawFloor(ctx, x, y);
    px(ctx, PAL.green, x, y, 16, 1);
    px(ctx, PAL.green, x, y + 15, 16, 1);
    return;
  }
  px(ctx, PAL.redDark, x, y, 16, 16);
  for (let i = 0; i < 16; i += 4) px(ctx, PAL.amber, x + i, y, 2, 16);
}

export function drawMainframe(ctx: Ctx, x: number, y: number, t: number) {
  px(ctx, PAL.outline, x, y, 16, 16);
  px(ctx, PAL.metalDark, x + 1, y + 1, 14, 14);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const on = (Math.floor(t * 3) + row + col) % 3 !== 0;
      px(ctx, on ? PAL.green : PAL.greenDark, x + 3 + col * 3, y + 3 + row * 4, 2, 2);
    }
  }
}
