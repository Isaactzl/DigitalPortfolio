/**
 * An SVG path for a QR code's dark modules. Each horizontal run becomes one rectangle
 * rather than a square per module, which keeps six codes on the home page small enough
 * not to slow its first paint.
 */
export function qrPath(rows: boolean[][]) {
  let path = '';
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (!row[x]) {
        x++;
        continue;
      }
      const start = x;
      while (x < row.length && row[x]) x++;
      const width = x - start;
      path += `M${start} ${y}h${width}v1h-${width}z`;
    }
  });
  return path;
}
