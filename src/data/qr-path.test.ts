import { describe, expect, it } from 'vitest';
import { encode } from 'uqr';
import { qrPath } from './qr-path';

/** Fills a grid from a path made of `M x y h w v1 h-w z` rectangles. */
function paint(path: string, size: number) {
  const grid = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  for (const [, x, y, w] of path.matchAll(/M(\d+) (\d+)h(\d+)v1h-\d+z/g)) {
    for (let i = 0; i < Number(w); i++) grid[Number(y)][Number(x) + i] = true;
  }
  return grid;
}

describe('qrPath', () => {
  it('draws each run of dark modules as one rectangle', () => {
    expect(qrPath([[true, true, true, false, true]])).toBe('M0 0h3v1h-3zM4 0h1v1h-1z');
  });

  it('draws exactly the modules of a real code, and nothing else', () => {
    const { data, size } = encode('https://isaactzl.github.io/DigitalPortfolio/work/hdb-cats/', {
      ecc: 'M',
      border: 2,
    });
    expect(paint(qrPath(data), size)).toEqual(data);
  });
});
