import {
  Mesh,
  ShaderMaterial,
  BoxBufferGeometry,
  BackSide,
  DataTexture3D,
  RedFormat,
  FloatType,
  LinearFilter,
  UniformsUtils
} from "three";
// @ts-ignore
import vertexShader from "./shader/vertex.glsl";
// @ts-ignore
import fragmentShader from "./shader/fragment.glsl";
import ndarray from "ndarray";
import Solver from "./Solver";

const shader = {
  uniforms: {
    u_N: { value: 100 },
    u_data: { value: null },
    u_vel: { value: false }
  },
  vertexShader,
  fragmentShader
};

export default class Smoke extends Mesh {
  density: ndarray;
  colors: ndarray;
  showVelocity: boolean;
  densityTexture: DataTexture3D;

  set needsUpdate(update: boolean) {
    this.densityTexture.needsUpdate = update;
  }

  constructor(N: number, vel:boolean) {
    const density = ndarray(new Float32Array(N * N * N), [N, N, N]);
    const colors = ndarray(new Float32Array(N * N * N), [N, N, N]);
    var showVelocity = vel;

    var texture = null;
    if (showVelocity) {
      texture = new DataTexture3D(colors.data as Float32Array, N, N, N);
    } else {
      texture = new DataTexture3D(density.data as Float32Array, N, N, N);
    }
    
    texture.format = RedFormat;
    texture.type = FloatType;
    texture.minFilter = texture.magFilter = LinearFilter;
    texture.unpackAlignment = 1;

    // Material
    // Inspired by https://threejs.org/examples/?q=texture3d#webgl2_materials_texture3d
    const uniforms = UniformsUtils.clone(shader.uniforms);
    uniforms["u_N"].value = N;
    uniforms["u_data"].value = texture;
    uniforms["u_vel"].value = showVelocity;
    (window as any).uniforms = uniforms;

    const material = new ShaderMaterial({
      uniforms: uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
      side: BackSide // The volume shader uses the backface as its "reference point"
    });
    const geometry = new BoxBufferGeometry(2, 2, 2);

    super(geometry, material);
    this.density = density;
    this.colors = colors;
    this.showVelocity = showVelocity;
    this.densityTexture = texture;
  }
}
