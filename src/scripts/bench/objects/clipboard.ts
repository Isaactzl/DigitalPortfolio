import * as THREE from 'three';
import {
  canvasTexture,
  drawQrPattern,
  material,
  palette,
  part,
  roundedBox,
  topTextured,
} from '../materials';
import type { BenchObject } from './types';

export interface Clipboard extends BenchObject {
  stamp: THREE.Group;
}

export function buildClipboard(): Clipboard {
  const group = new THREE.Group();
  part(group, roundedBox(1.9, 0.1, 2.5, 0.05), '#b07f50', [0, 0.05, 0]);

  const form = canvasTexture(512, 640, (g, w, h) => {
    g.fillStyle = '#fbf7ee';
    g.fillRect(0, 0, w, h);
    g.fillStyle = palette.ink;
    g.font = '800 34px sans-serif';
    g.fillText('EVENT FORM', 36, 70);
    g.font = '500 16px monospace';
    g.fillStyle = palette.inkDim;
    g.fillText('STORE A · SAT 14 DEC', 36, 100);
    g.strokeStyle = '#cfc5b0';
    g.lineWidth = 2;
    ['Name', 'Party size', 'Date', 'Contact'].forEach((label, i) => {
      const y = 160 + i * 70;
      g.fillStyle = palette.inkDim;
      g.font = '500 15px monospace';
      g.fillText(label.toUpperCase(), 36, y);
      g.beginPath();
      g.moveTo(36, y + 26);
      g.lineTo(w - 36, y + 26);
      g.stroke();
    });
    drawQrPattern(g, w - 196, h - 200, 160, 7);
    g.fillStyle = palette.stamp;
    g.fillRect(36, h - 70, 130, 30);
    g.fillStyle = '#fff';
    g.font = '500 14px monospace';
    g.fillText('SEND LINK', 52, h - 50);
  });
  part(
    group,
    new THREE.BoxGeometry(1.7, 0.02, 2.15),
    topTextured(form, '#f2ecdf'),
    [0, 0.11, 0.08],
  );
  part(group, roundedBox(0.72, 0.16, 0.3, 0.05), '#a8adb1', [0, 0.16, -1.08], {
    metalness: 0.7,
    roughness: 0.35,
  });

  const stamp = new THREE.Group();
  stamp.position.set(1.55, 0, 0.55);
  part(stamp, roundedBox(0.56, 0.16, 0.38, 0.04), '#34332f', [0, 0.08, 0]);
  part(stamp, new THREE.BoxGeometry(0.5, 0.02, 0.32), material(palette.stampDark), [0, 0.005, 0]);
  part(stamp, new THREE.CylinderGeometry(0.09, 0.14, 0.44, 16), palette.stamp, [0, 0.38, 0]);
  part(stamp, new THREE.SphereGeometry(0.18, 20, 14), palette.stamp, [0, 0.66, 0]);
  group.add(stamp);

  return { group, stamp };
}
