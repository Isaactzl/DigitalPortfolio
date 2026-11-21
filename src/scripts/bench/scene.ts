import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { palette } from './materials';

const VIEW_DIRECTION = new THREE.Vector3(15.5, 14, 18).normalize();
export const WIDE_DISTANCE = 27.5;
export const HOME_TARGET = new THREE.Vector3(0, 0.7, 0);

/** Pulls the camera back on narrow screens so the whole bench stays in frame. */
export function fitDistance(aspect: number) {
  return WIDE_DISTANCE * Math.min(1.9, Math.max(1, 1.35 / aspect));
}

export function createStage(host: HTMLElement) {
  const small = host.clientWidth < 760;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(palette.sky);

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 120);
  camera.position.copy(VIEW_DIRECTION).multiplyScalar(WIDE_DISTANCE).add(HOME_TARGET);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(HOME_TARGET);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minPolarAngle = 0.55;
  controls.maxPolarAngle = 1.18;
  controls.minAzimuthAngle = -0.35;
  controls.maxAzimuthAngle = 1.75;

  const sky = new THREE.HemisphereLight('#fff7ea', '#9a8a70', 1.25);
  scene.add(sky);
  const sun = new THREE.DirectionalLight('#fff0d8', 2.6);
  sun.position.set(7, 13, 6);
  sun.castShadow = true;
  const mapSize = small ? 1024 : 2048;
  sun.shadow.mapSize.set(mapSize, mapSize);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);
  const fill = new THREE.DirectionalLight('#dfe8ff', 0.5);
  fill.position.set(-8, 6, -4);
  scene.add(fill);

  const day = { background: new THREE.Color(palette.sky), sun: new THREE.Color('#fff0d8') };
  const night = { background: new THREE.Color('#1f1d19'), sun: new THREE.Color('#9fb3d9') };
  const background = scene.background as THREE.Color;

  /** Fades daylight towards a dim, cool moonlight. 0 is day, 1 is evening. */
  function evening(amount: number) {
    background.lerpColors(day.background, night.background, amount);
    sun.color.lerpColors(day.sun, night.sun, amount);
    sun.intensity = THREE.MathUtils.lerp(2.6, 0.35, amount);
    sky.intensity = THREE.MathUtils.lerp(1.25, 0.18, amount);
    fill.intensity = THREE.MathUtils.lerp(0.5, 0.12, amount);
  }

  function resize() {
    const { clientWidth: w, clientHeight: h } = host;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const distance = fitDistance(camera.aspect);
    controls.minDistance = distance * 0.62;
    controls.maxDistance = distance * 1.15;
    const offset = camera.position.clone().sub(controls.target).setLength(distance);
    camera.position.copy(controls.target).add(offset);
  }

  return { renderer, scene, camera, controls, resize, evening, small };
}
