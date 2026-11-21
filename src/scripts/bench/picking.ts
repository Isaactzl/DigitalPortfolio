import * as THREE from 'three';
import { HOVER_EMISSIVE } from './materials';

export class Picker<Id extends string> {
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private meshes: THREE.Mesh[] = [];
  private owner = new Map<THREE.Object3D, Id>();

  constructor(
    private camera: THREE.Camera,
    private canvas: HTMLCanvasElement,
  ) {}

  register(id: Id, group: THREE.Group) {
    group.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      this.meshes.push(o);
      this.owner.set(o, id);
      const mat = o.material;
      if (mat instanceof THREE.MeshStandardMaterial && mat.emissive.getHex() === 0) {
        mat.emissive.copy(HOVER_EMISSIVE);
        mat.emissiveIntensity = 0;
      }
    });
  }

  setPointer(clientX: number, clientY: number) {
    const r = this.canvas.getBoundingClientRect();
    this.pointer.set(
      ((clientX - r.left) / r.width) * 2 - 1,
      -((clientY - r.top) / r.height) * 2 + 1,
    );
  }

  pick(): Id | null {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObjects(this.meshes, false)[0];
    return hit ? (this.owner.get(hit.object) ?? null) : null;
  }

  /** The point under the pointer on a plane facing the camera through `anchor`. */
  pointerAt(anchor: THREE.Vector3, out: THREE.Vector3) {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const normal = this.camera.getWorldDirection(new THREE.Vector3());
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, anchor);
    return this.raycaster.ray.intersectPlane(plane, out);
  }

  static glow(group: THREE.Group, on: boolean) {
    group.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      const mat = o.material;
      if (mat instanceof THREE.MeshStandardMaterial && mat.emissive.equals(HOVER_EMISSIVE)) {
        mat.emissiveIntensity = on ? 0.55 : 0;
      }
    });
  }
}
