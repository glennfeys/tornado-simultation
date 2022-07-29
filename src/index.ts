import * as THREE from "three";
import OrbitControls from "three-orbitcontrols";
import {
  AmbientLight,
  PointLight,
  AxesHelper,
  Vector3,
  Group,
  ArrowHelper,
  Clock,
  WebGLRenderer,
  Color,
  PerspectiveCamera,
  OrthographicCamera,
  Scene
} from "three";
import Solver from "./Solver";
import { fill, forEach } from "./util";
import ndarray from "ndarray";
import Stats from "stats-js";
import * as dat from "dat.gui";

// A new scene with physics, we call this a World (see physics/World.ts)
const scene = new Scene();
scene.background = new Color(1, 1, 1);
console.log('ok');

const gui = new dat.GUI();


const canvas = document.createElement("canvas");
const context = canvas.getContext("webgl2", {
  alpha: true,
  premultipliedAlpha: false,
  antialias: true
});
const renderer = new WebGLRenderer({ canvas: canvas, context: context as any });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);


camera.position.set(0, 2, 3);
scene.add(camera);
// OrbitControls makes the camara listen to the mouse
const controls = new OrbitControls(camera, renderer.domElement);
controls.autoRotate = false;

// Ambient lighting lits whole the scene
scene.add(new AmbientLight(0xccffff, 0.5));
// A light that will follow the camara
const cameraLight = new PointLight(0x99ffff, 0.3);
scene.add(cameraLight);

// A small help to view the space:
//  x-axis: red
//  y-axis: green
//  z-axis: blue
scene.add(new AxesHelper(0.2));

var N = 15;
const solver = new Solver(N, 1, 1);

gui.add(solver, 'period', 2, 50).name("Periode"); // TODO probably not very useful, this can modify the function used to control liquid flow
gui.add(solver, 'newN', 10, 20, 1).name("Grid size");

var f1 = gui.addFolder('Krachten');
f1.add(solver, 'gravity', -1, 1, 0.001).name("Zwaarteveld (g)");
f1.add(solver, 'magnitude', 0.1, 2).name("Sterkte randwaarden");
f1.add(solver, 'smokeDiffusion', 0, 0.1, 0.00001).name("Rook difusie kracht");
f1.open();


var f2 = gui.addFolder('Reynolds-getal (Diffusieconstante)');
f2.add(solver, 'v', 1, 100).name("Kar. snelheid (v)");
f2.add(solver, 'L', 0.1, 50).name("Kar. lengte (L)");
f2.add(solver, 'mu', 10 ** -10, 100).name("Viscositeit (mu)");
f2.open();

var f3 = gui.addFolder('Pijlen');
f3.add(solver, 'showArrows', true).name("Pijlen?");
f3.add(solver, 'hideOuterArrows', true).name("Verberg rand?");
f3.open();

var f = gui.addFolder('Aantal Iteraties');
f.add(solver, 'pressureIterations', 0, 60).name("Iteraties druk");
f.add(solver, 'diffusionIterations', 0, 60).name("Iteraties diffusie");

var f = gui.addFolder('Vorm');
f.add(solver, 'tornado').name("Tornado");
f.add(solver, 'vortex').name("Draaikolk");

var f = gui.addFolder('Kleuring');
f.add(solver, 'showVelocity', false).name("Snelheid?");

var f4 = gui.addFolder('Bediening');
f4.add(solver, 'reset').name("Reset");
f4.add(solver, 'play').name("Play");
f4.add(solver, 'pause').name("Pauze");
f4.open();

var drawArrows: Function;

initArrows(N);

function initArrows(N: number) {
  // Draw flow arrows to screen
  drawArrows = (() => {
    const arrows = ndarray<ArrowHelper>(new Array(N * N * N), [N, N, N]);
    const arrowsGroup = new Group();
    fill(arrows, (i, j, k) => {
      const x = (2 * i) / (N - 1) - 1;
      const y = (2 * j) / (N - 1) - 1;
      const z = (2 * k) / (N - 1) - 1;
      const ah = new ArrowHelper(new Vector3(0, 0, 0), new Vector3(x, y, z));
      ah.visible = false;
      ah.setColor(0xff0000);
      arrowsGroup.add(ah);
      return ah;
    });
    scene.add(arrowsGroup);


    return () => {
      forEach(arrows, (i, j, k, a: ArrowHelper) => {
        let dir = new Vector3(
          solver.u.get(0, i, j, k),
          solver.u.get(1, i, j, k),
          solver.u.get(2, i, j, k)
        );
        if (solver.hideOuterArrows && (i == 0 || j == 0 || k == 0 || i == N - 1 || j == N - 1 || k == N - 1)) {
          dir = new Vector3(0, 0, 0);
        }
        const length = dir.length();
        a.visible = length > 0.001 && solver.showArrows;
        dir.normalize();
        a.setLength(length);
        a.setDirection(dir);
      });
    };
  })();
}
drawArrows();


var smoke = solver.smoke;
scene.add(smoke);


// Fixed smoke densities
solver.reset();

// indicate new smoke should be displayed
smoke.needsUpdate = true;

// Code for stats in corner
const clock = new Clock();
const stats = new Stats();
stats.showPanel(1); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

// Main animation function
function animate() {
  requestAnimationFrame(animate);
  stats.begin();
  const dt = clock.getDelta();
  if (dt < 0.5) {
    // Let the light follow the camara
    controls.update();
    cameraLight.position.copy(camera.position);

    solver.update(dt == 0 ? 1 : dt);
    if (solver.isNew) {
      solver.setIsNew(false);
      changeN(solver.N);
    }
    drawArrows();

    // Render the scene
    renderer.render(scene, camera);
  }
  stats.end();
}

// Initialize main animation function loop
requestAnimationFrame(animate);


// Handle interactivity
window.addEventListener(
  "resize",
  () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  },
  false
);

function changeN(newN: number) {
  N = newN;
  smoke = solver.smoke;
  scene.add(smoke);
  drawArrows();
  initArrows(N);
}