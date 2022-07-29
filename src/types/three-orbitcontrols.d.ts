declare module "three-orbitcontrols" {
  // https://threejs.org/docs/#examples/en/controls/OrbitControls
  import { Object3D, Vector3 } from "three";

  export default class OrbitControls {
    autoRotate: boolean;
    autoRotateSpeed: number;
    dampingFactor: number;
    domElement: HTMLElement;
    enabled: boolean;
    enableDamping: boolean;
    enableKeys: boolean;
    enablePan: boolean;
    enableRotate: boolean;
    enableZoom: boolean;
    keyPanSpeed: number;
    keys: {
      LEFT: number;
      UP: number;
      RIGHT: number;
      BOTTOM: number;
    };
    maxAzimuthAngle: number;
    maxDistance: number;
    maxPolarAngle: number;
    maxZoom: number;
    minAzimuthAngle: number;
    minDistance: number;
    minPolarAngle: number;
    minZoom: number;
    mouseButtons: {
      LEFT: number;
      MIDDLE: number;
      RIGHT: number;
    };
    object: Object3D;
    panSpeed: number;
    position0: Vector3;
    rotateSpeed: number;
    screenSpacePanning: Boolean;
    target0: Vector3;
    target: Vector3;
    touches: {
      ONE: number;
      TWO: number;
    };
    zoom0: number;
    zoomSpeed: number;

    constructor(camera: Object3D, element: HTMLElement);
    dispose(): void;
    getAzimuthalAngle(): number;
    getPolarAngle(): number;
    reset(): void;
    saveState(): void;
    update(): boolean;
  }
}
