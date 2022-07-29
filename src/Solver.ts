// @ts-check
import { reynolds } from './Helpers';
import ndarray from 'ndarray';
import Smoke from './Smoke';

import GPU from 'gpu.js';
import { fill } from './util';

//@ts-ignore
const gpu = new GPU();

/*

TODO: bouyancy toevoegen 
TODO: diffusie rook
TODO: Twee kleuring rookshader
TODO: paramters beschrijven in verslag
TODO: Kleuren cloud shader configureerbaar maken
TODO: Volledig wolkendek bovenaan i.c.m. bouyancy zodat trechter uit wolk naar beneden komt
TODO: Pas ook de randvoorwaarden van de diffusie toe d.m.v. GPU.JS
TODO: Configureerbaar maken van grid size (uitzoeken hoe dit kan met GPU.JS)

*/

///////////////////////////////////
/////GPU CONVENIENCE FUNCTIONS////
/////////////////////////////////

/**
 * GPU function to get values with clipping at the edges.
 * ======================================================
 * 
 * At the edges this function will return the nearest value in the discrete cube.
 */
gpu.addFunction(function getWithClipping(a: number[], x: number, y: number, z: number, N: number) {
    let x_eff = x;
    let y_eff = y;
    let z_eff = z;

    if (x >= N) {
        x_eff = N - 1;
    }
    else if (x < 0) {
        x_eff = 0;
    }

    if (y >= N) {
        y_eff = N - 1;
    }
    else if (y < 0) {
        y_eff = 0;
    }

    if (z >= N) {
        z_eff = N - 1;
    }
    else if (z < 0) {
        z_eff = 0;
    }

    return a[x_eff * (N * N) + y_eff * N + z_eff];
});

/**
 * GPU function to calculate the First Order Central Difference for a given direction at a given point
 */
gpu.addFunction(function firstOrderDifference(u: number[], x: number, y: number, z: number, d: number, N: number) {
    const delta = 1 / N;

    if (d == 0) {
        return (getWithClipping(u, x + 1, y, z, N) - getWithClipping(u, x - 1, y, z, N)) / (2 * delta)
    }
    else if (d == 1) {
        return (getWithClipping(u, x, y + 1, z, N) - getWithClipping(u, x, y - 1, z, N)) / (2 * delta)
    }
    else {
        // d == Direction.Z
        return (getWithClipping(u, x, y, z + 1, N) - getWithClipping(u, x, y, z - 1, N)) / (2 * delta)
    }
});

/**
 * GPU function to trilinearily interpolate values.
 */
gpu.addFunction(function trilinearlyInterpolate(u: number[], x: number, y: number, z: number, N: number) {
    let ix = Math.floor(x);
    let fx = x - ix;
    let iy = Math.floor(y);
    let fy = y - iy;
    let iz = Math.floor(z);
    let fz = z - iz;
    let w000 = getWithClipping(u, ix, iy, iz, N);
    let w010 = getWithClipping(u, ix, iy + 1, iz, N);
    let w100 = getWithClipping(u, ix + 1, iy, iz, N);
    let w110 = getWithClipping(u, ix + 1, iy + 1, iz, N);
    let w001 = getWithClipping(u, ix, iy, iz + 1, N);
    let w011 = getWithClipping(u, ix, iy + 1, iz + 1, N);
    let w101 = getWithClipping(u, ix + 1, iy, iz + 1, N);
    let w111 = getWithClipping(u, ix + 1, iy + 1, iz + 1, N);
    return (1.0 - fz) * ((1.0 - fy) * ((1.0 - fx) * w000 + fx * w100) + fy * ((1.0 - fx) * w010 + fx * w110)) + fz * ((1.0 - fy) * ((1.0 - fx) * w001 + fx * w101) + fy * ((1.0 - fx) * w011 + fx * w111));
});

export default class Solver {
    smoke: Smoke;
    u: ndarray;
    v: number;
    L: number;
    N: number;
    newN: number;
    smokeDiffusion: number;
    step: number;
    period: number;
    gravity: number;
    showArrows: boolean;
    hideOuterArrows: boolean;
    isPlaying: boolean;
    showVelocity: boolean;
    diffusionIterations: number;
    pressureIterations: number;
    magnitude: number;
    mu: number;
    shape: number; //0 = tornado, 1 = vortex
    computePressureOnGPU: Function;
    applyPressureBoundaryConditionsGPU: Function;
    diffuseOnGPU: Function;
    computeDivergenceOnGPU: Function;
    computeGradientOnGPU: Function;
    subtractArraysOnGPU: Function;
    gravityOnGPU: Function;
    advectOnGPU: Function;
    applyDiffuseBoundaryConditionsGPU: Function;
    applyDiffuseBoundaryConditionsGPUVortex: Function;
    smokeDiffusionOnGPU: Function;
    isNew: boolean;

    constructor(N: number = 15, L: number, v: number) {
        this.showVelocity = false;
        this.smoke = new Smoke(N, this.showVelocity); // contains particle quatities
        this.N = N;
        this.newN = N;
        this.u = ndarray(new Float32Array(N * N * N * 3), [3, N, N, N]); // Vectorfield of flow u
        this.v = v;
        this.L = L;
        this.smokeDiffusion = 0.001;
        this.step = 0;
        this.period = 20;
        this.gravity = 9.81 * 1 / 100;
        this.mu = 18.5 * (10 ** -3);
        this.showArrows = true;
        this.isPlaying = false;

        this.diffusionIterations = 35;
        this.pressureIterations = 50;
        this.hideOuterArrows = true;
        this.magnitude = 0.5;
        this.computePressureOnGPU = this.computePressureOnGPUDynamic(N);
        this.applyPressureBoundaryConditionsGPU = this.applyPressureBoundaryConditionsGPUDynamic(N);
        this.diffuseOnGPU = this.diffuseOnGPUDynamic(N);
        this.computeDivergenceOnGPU = this.computeDivergenceOnGPUDynamic(N);
        this.computeGradientOnGPU = this.computeGradientOnGPUDynamic(N);
        this.subtractArraysOnGPU = this.subtractArraysOnGPUDynamic(N);
        this.gravityOnGPU = this.gravityOnGPUDynamic(N);
        this.advectOnGPU = this.advectOnGPUDynamic(N);
        this.applyDiffuseBoundaryConditionsGPU = this.applyDiffuseBoundaryConditionsGPUDynamic(N);
        this.applyDiffuseBoundaryConditionsGPUVortex = this.applyDiffuseBoundaryConditionsGPUVortexDynamic(N);
        this.smokeDiffusionOnGPU = this.smokeDiffusionOnGPUDynamic(N);
        this.shape = 0;
        this.isNew = false;
    }

    reset() {
        if (this.N != this.newN || this.showVelocity != this.smoke.showVelocity) {
            this.changeN(this.newN);
        }

        // TODO: replace this with a new temperature field and a full cloud deck at the top of our simulation
        fill(this.smoke.density, (i, j, k) => {
            const d = (15 / this.N) * Math.hypot(i - this.N / 2 + 0, j - this.N, k - this.N / 2);
            return Math.exp(d * -d);
        });

        this.isPlaying = false;
        fill(this.u, (x, y, z, d) => 0);

        this.smoke.needsUpdate = true; // Tells Three.JS to perform an update
    }
    play() {
        this.isPlaying = true;
    }
    pause() {
        this.isPlaying = false;
    }
    update(dt: number = 1) {
        if (this.isPlaying) {
            // Step 1: Advection & Gravity, we want to perform the advection & gravity step on the values in `smoke`
            this.applyGravity(this.applySmokeDiffusion(this.advect(dt), this.smokeDiffusion, dt), this.gravity, dt);


            // Step 2: Get divergent vectorfield w through calculating diffusion
            let w = this.diffuse(dt);
            this.step += 1;

            // Step 4: Compute next pressure values p
            let p = this.computePressure(w);

            // Step 5: finally we have our new values for u by subtracting gradient(p) from w
            //fill(this.u, (d,x,y,z) => w.get(d,x,y,z) - gradient(p)(x,y,z,d));  
            this.subtractAndSetArrays(w, p);

            if (this.smoke.showVelocity) {
                for (let x = 0; x < this.N; x++) {
                    for (let y = 0; y < this.N; y++) {
                        for (let z = 0; z < this.N; z++) {
                            if (this.smoke.density.get(x, y, z) <= Math.pow(10.0, -10)) {
                                this.smoke.colors.set(x, y, z, 0.0);
                            } else {
                                let norm = Math.hypot(this.u.get(0, x, y, z), this.u.get(1, x, y, z), this.u.get(2, x, y, z));
                                this.smoke.colors.set(x, y, z, norm);
                            }
                        }
                    }
                }
            }

            this.smoke.needsUpdate = true; // Tells Three.JS to perform an update
        }
    }
    tornado() {
        this.shape = 0;
    }
    vortex() {
        this.shape = 1;
    }
    changeN(N: number) {
        this.N = N;
        this.isNew = true;
        this.computePressureOnGPU = this.computePressureOnGPUDynamic(N);
        this.applyPressureBoundaryConditionsGPU = this.applyPressureBoundaryConditionsGPUDynamic(N);
        this.diffuseOnGPU = this.diffuseOnGPUDynamic(N);
        this.computeDivergenceOnGPU = this.computeDivergenceOnGPUDynamic(N);
        this.computeGradientOnGPU = this.computeGradientOnGPUDynamic(N);
        this.subtractArraysOnGPU = this.subtractArraysOnGPUDynamic(N);
        this.gravityOnGPU = this.gravityOnGPUDynamic(N);
        this.advectOnGPU = this.advectOnGPUDynamic(N);
        this.applyDiffuseBoundaryConditionsGPU = this.applyDiffuseBoundaryConditionsGPUDynamic(N);
        this.applyDiffuseBoundaryConditionsGPUVortex = this.applyDiffuseBoundaryConditionsGPUVortexDynamic(N);
        this.smokeDiffusionOnGPU = this.smokeDiffusionOnGPUDynamic(N);
        this.u = ndarray(new Float32Array(N * N * N * 3), [3, N, N, N]);
        this.smoke = new Smoke(N, this.showVelocity);
    }
    setIsNew(b: boolean) {
        this.isNew = b;
    }


    /////////////////////////////
    ////Pressure & Diffusion////
    ///////////////////////////

    /* The methods below perform the diffusion & pressure computation step using GPU.js */

    computePressureOnGPUDynamic = (N: number) => gpu.createKernel(function (u: number[], b: number[], alpha: number, beta: number) {
        let z = this.thread.x % this.constants.N;
        let y = Math.floor(this.thread.x / this.constants.N) % this.constants.N;
        let x = Math.floor(this.thread.x / (this.constants.N * this.constants.N));
        let res = 0;

        if (x > 0 && x < this.constants.N - 1 && y > 0 && y < this.constants.N - 1 && z > 0 && z < this.constants.N - 1) {
            res += u[(x - 1) * (this.constants.N * this.constants.N) + (y) * this.constants.N + z];/*u[x - 1][y][z];*/
            res += u[(x + 1) * (this.constants.N * this.constants.N) + (y) * this.constants.N + z];/*u[x + 1][y][z];*/
            res += u[(x) * (this.constants.N * this.constants.N) + (y + 1) * this.constants.N + z];/*u[x][y + 1][z];*/
            res += u[(x) * (this.constants.N * this.constants.N) + (y - 1) * this.constants.N + z];/*u[x][y - 1][z];*/
            res += u[(x) * (this.constants.N * this.constants.N) + (y) * this.constants.N + z + 1];/*u[x][y][z+1];*/
            res += u[(x) * (this.constants.N * this.constants.N) + (y) * this.constants.N + z - 1];/*u[x][y][z-1];*/
            res += u[this.thread.x] * alpha;
        }
        return res * beta;
    }).setConstants({ N: N }).setPipeline(true).setOutput([N * N * N]);

    applyPressureBoundaryConditionsGPUDynamic = (N: number) => gpu.createKernel(function (u: number[]) {
        let z = this.thread.x % this.constants.N;
        let y = Math.floor(this.thread.x / this.constants.N) % this.constants.N;
        let x = Math.floor(this.thread.x / (this.constants.N * this.constants.N));
        return getWithClipping(u, x, y, z, this.constants.N);
    }).setConstants({ N: N }).setPipeline(true).setOutput([N * N * N]);

    applyDiffuseBoundaryConditionsGPUDynamic = (N: number) => gpu.createKernel(function (u: number[], magnitude: number, step: number, period: number) {

        let z = this.thread.x % this.constants.N;
        let y = Math.floor(this.thread.x / this.constants.N) % this.constants.N;
        let x = Math.floor(this.thread.x / (this.constants.N * this.constants.N)) % this.constants.N;
        let d = Math.floor(this.thread.x / (this.constants.N * this.constants.N * this.constants.N));


        let R = Math.abs(Math.sin((step) / period)) * magnitude * (this.constants.N - y) / (this.constants.N);
        //return u[x*(this.constants.N*this.constants.N*this.constants.N) + y*(this.constants.N*this.constants.N) + z*this.constants.N + d];
        //left plane
        if (x == 0) {
            if (y != 0 && z != 0 && y != this.constants.N - 1 && z != this.constants.N - 1) {
                if (d == 0) return R;                                  // in-flow
                if (d == 1) return u[d * (this.constants.N * this.constants.N * this.constants.N) + 1 * (this.constants.N * this.constants.N) + y * this.constants.N + z];  // free-slip
                if (d == 2) return R;                                  // in-flow
            }
            return 0;
        }
        //right plane
        if (x == this.constants.N - 1) {
            if (y != 0 && z != 0 && y != this.constants.N - 1 && z != this.constants.N - 1) {
                if (d == 0) return -R;                                  // in-flow
                if (d == 1) return u[d * (this.constants.N * this.constants.N * this.constants.N) + (this.constants.N - 2) * (this.constants.N * this.constants.N) + y * this.constants.N + z];  // free-slip
                if (d == 2) return -R;                                  // in-flow
            }
            return 0;
        }
        //bottom plane
        if (y == 0) {
            if (x != 0 && z != 0 && x != this.constants.N - 1 && z != this.constants.N - 1) {
                if (d == 0) return u[d * (this.constants.N * this.constants.N * this.constants.N) + x * (this.constants.N * this.constants.N) + 1 * this.constants.N + z];   // free-slip
                if (d == 1) return 0;  // out-flow
                if (d == 2) return u[d * (this.constants.N * this.constants.N * this.constants.N) + x * (this.constants.N * this.constants.N) + 1 * this.constants.N + z];   // free-slip
            }
            return 0;
        }
        //top plane
        if (y == this.constants.N - 1) {
            if (x != 0 && z != 0 && x != this.constants.N - 1 && z != this.constants.N - 1) {
                if (d == 0) return u[d * (this.constants.N * this.constants.N * this.constants.N) + x * (this.constants.N * this.constants.N) + (this.constants.N - 2) * this.constants.N + z];  // no-slip
                if (d == 1) return magnitude;                           // out-flow
                if (d == 2) return u[d * (this.constants.N * this.constants.N * this.constants.N) + x * (this.constants.N * this.constants.N) + (this.constants.N - 2) * this.constants.N + z];  // no-slip
            }
            return 0;
        }
        //back plane
        if (z == 0) {
            if (x != 0 && y != 0 && x != this.constants.N - 1 && y != this.constants.N - 1) {
                if (d == 0) return -R;                                 // in-flow
                if (d == 1) return u[d * (this.constants.N * this.constants.N * this.constants.N) + x * (this.constants.N * this.constants.N) + y * this.constants.N + 1];  // free-slip
                if (d == 2) return R;                                  // in-flow
            }
            return 0;
        }
        //front plane
        if (z == this.constants.N - 1) {
            if (x != 0 && y != 0 && x != this.constants.N - 1 && y != this.constants.N - 1) {
                if (d == 0) return R;                                  // in-flow
                if (d == 1) return u[d * (this.constants.N * this.constants.N * this.constants.N) + x * (this.constants.N * this.constants.N) + y * this.constants.N + (this.constants.N - 2)]; // free-slip
                if (d == 2) return -R;                                 // in-flow
            }
            return 0;
        }
        return u[d * (this.constants.N * this.constants.N * this.constants.N) + x * (this.constants.N * this.constants.N) + y * this.constants.N + z];

    }).setConstants({ N: N }).setPipeline(true).setOutput([N * N * N * 3]);

    applyDiffuseBoundaryConditionsGPUVortexDynamic = (N: number) => gpu.createKernel(function (u: number[], magnitude: number, step: number, period: number) {

        let z = this.thread.x % this.constants.N;
        let y = Math.floor(this.thread.x / this.constants.N) % this.constants.N;
        let x = Math.floor(this.thread.x / (this.constants.N * this.constants.N)) % this.constants.N;
        let d = Math.floor(this.thread.x / (this.constants.N * this.constants.N * this.constants.N));


        let R = Math.abs(Math.sin((step) / period)) * magnitude * (this.constants.N - y) / (this.constants.N);
        //left plane
        if (x == 0) {
            if (y != 0 && z != 0 && y != this.constants.N - 1 && z != this.constants.N - 1) {
                if (d == 0) return R;                                  // in-flow
                if (d == 1) return u[d * (this.constants.N * this.constants.N * this.constants.N) + 1 * (this.constants.N * this.constants.N) + y * this.constants.N + z];  // free-slip
                if (d == 2) return R;                                  // in-flow
            }
            return 0;
        }
        //right plane
        if (x == this.constants.N - 1) {
            if (y != 0 && z != 0 && y != this.constants.N - 1 && z != this.constants.N - 1) {
                if (d == 0) return -R;                                  // in-flow
                if (d == 1) return u[d * (this.constants.N * this.constants.N * this.constants.N) + (this.constants.N - 2) * (this.constants.N * this.constants.N) + y * this.constants.N + z];  // free-slip
                if (d == 2) return -R;                                  // in-flow
            }
            return 0;
        }
        //bottom plane
        if (y == 0) {
            if (x != 0 && z != 0 && x != this.constants.N - 1 && z != this.constants.N - 1) {
                if (d == 0) return u[d * (this.constants.N * this.constants.N * this.constants.N) + x * (this.constants.N * this.constants.N) + 1 * this.constants.N + z];  // no-slip
                if (d == 1) return -magnitude;                                                                                                             // out-flow
                if (d == 2) return u[d * (this.constants.N * this.constants.N * this.constants.N) + x * (this.constants.N * this.constants.N) + 1 * this.constants.N + z];  // no-slip
            }
            return 0;
        }
        //top plane
        if (y == this.constants.N - 1) {
            if (x != 0 && z != 0 && x != this.constants.N - 1 && z != this.constants.N - 1) {
                if (d == 0) return u[d * (this.constants.N * this.constants.N * this.constants.N) + x * (this.constants.N * this.constants.N) + (this.constants.N - 2) * this.constants.N + z];   // free-slip
                if (d == 1) return -u[d * (this.constants.N * this.constants.N * this.constants.N) + x * (this.constants.N * this.constants.N) + (this.constants.N - 2) * this.constants.N + z];  // out-flow
                if (d == 2) return u[d * (this.constants.N * this.constants.N * this.constants.N) + x * (this.constants.N * this.constants.N) + (this.constants.N - 2) * this.constants.N + z];   // free-slip
            }
            return 0;
        }
        //back plane
        if (z == 0) {
            if (x != 0 && y != 0 && x != this.constants.N - 1 && y != this.constants.N - 1) {
                if (d == 0) return -R;                                 // in-flow
                if (d == 1) return u[d * (this.constants.N * this.constants.N * this.constants.N) + x * (this.constants.N * this.constants.N) + y * this.constants.N + 1];  // free-slip
                if (d == 2) return R;                                  // in-flow
            }
            return 0;
        }
        //front plane
        if (z == this.constants.N - 1) {
            if (x != 0 && y != 0 && x != this.constants.N - 1 && y != this.constants.N - 1) {
                if (d == 0) return R;                                  // in-flow
                if (d == 1) return u[d * (this.constants.N * this.constants.N * this.constants.N) + x * (this.constants.N * this.constants.N) + y * this.constants.N + (this.constants.N - 2)]; // free-slip
                if (d == 2) return -R;                                 // in-flow
            }
            return 0;
        }
        return u[d * (this.constants.N * this.constants.N * this.constants.N) + x * (this.constants.N * this.constants.N) + y * this.constants.N + z];

    }).setConstants({ N: N }).setPipeline(true).setOutput([N * N * N * 3]);


    diffuseOnGPUDynamic = (N: number) => gpu.createKernel(function (u: number[], alpha: number, beta: number) {
        let z = this.thread.x % this.constants.N;
        let y = Math.floor(this.thread.x / this.constants.N) % this.constants.N;
        let x = Math.floor(this.thread.x / (this.constants.N * this.constants.N)) % this.constants.N;
        let d = Math.floor(this.thread.x / (this.constants.N * this.constants.N * this.constants.N));
        let res = 0;

        if (x > 0 && x < this.constants.N - 1 && y > 0 && y < this.constants.N - 1 && z > 0 && z < this.constants.N - 1) {
            res += u[d * (this.constants.N * this.constants.N * this.constants.N) + (x - 1) * (this.constants.N * this.constants.N) + (y) * this.constants.N + z];/*u[x - 1][y][z];*/
            res += u[d * (this.constants.N * this.constants.N * this.constants.N) + (x + 1) * (this.constants.N * this.constants.N) + (y) * this.constants.N + z];/*u[x + 1][y][z];*/
            res += u[d * (this.constants.N * this.constants.N * this.constants.N) + (x) * (this.constants.N * this.constants.N) + (y + 1) * this.constants.N + z];/*u[x][y + 1][z];*/
            res += u[d * (this.constants.N * this.constants.N * this.constants.N) + (x) * (this.constants.N * this.constants.N) + (y - 1) * this.constants.N + z];/*u[x][y - 1][z];*/
            res += u[d * (this.constants.N * this.constants.N * this.constants.N) + (x) * (this.constants.N * this.constants.N) + (y) * this.constants.N + z + 1];/*u[x][y][z+1];*/
            res += u[d * (this.constants.N * this.constants.N * this.constants.N) + (x) * (this.constants.N * this.constants.N) + (y) * this.constants.N + z - 1];/*u[x][y][z-1];*/
            res += u[this.thread.x] * alpha;
        }

        return res * beta;
    }).setConstants({ N: N }).setPipeline(true).setOutput([N * N * N * 3]);

    computeDivergenceOnGPUDynamic = (N: number) => gpu.createKernel(function (u_x: any, u_y: any, u_z: any) {
        let z = this.thread.x % this.constants.N;
        let y = Math.floor(this.thread.x / this.constants.N) % this.constants.N;
        let x = Math.floor(this.thread.x / (this.constants.N * this.constants.N));

        return firstOrderDifference(u_x, x, y, z, 0, this.constants.N) + firstOrderDifference(u_y, x, y, z, 1, this.constants.N) + firstOrderDifference(u_z, x, y, z, 2, this.constants.N);
    }).setConstants({ N: N }).setPipeline(true).setOutput([N * N * N]);

    computeGradientOnGPUDynamic = (N: number) => gpu.createKernel(function (p: any) {
        let z = this.thread.x % this.constants.N;
        let y = Math.floor(this.thread.x / this.constants.N) % this.constants.N;
        let x = Math.floor(this.thread.x / (this.constants.N * this.constants.N)) % this.constants.N;
        let d = Math.floor(this.thread.x / (this.constants.N * this.constants.N * this.constants.N))

        return firstOrderDifference(p, x, y, z, d, this.constants.N);
    }).setConstants({ N: N }).setPipeline(true).setOutput([N * N * N * 3]);

    subtractArraysOnGPUDynamic = (N: number) => gpu.createKernel(function (a: any, b: any) {
        return a[this.thread.x] - b[this.thread.x];
    }).setConstants({ N: N }).setOutput([N * N * N * 3]);

    /**
     * Performs the diffusion step on the current ndarray this.u.
     * @param dt Current timestep
     * @returns A new ndarray with the divergent values w used for calculation of the next u
     */
    diffuse(dt: number = 1) {
        let dx = 1 / this.N;
        let alpha: number = dx ** 3 / (reynolds(this.v, this.L, 1.2, this.mu) * dt);
        let beta: number = 1 / (6 + alpha);

        let u = this.diffuseOnGPU(this.u.data, alpha, beta);

        for (let i = 0; i <= this.diffusionIterations; i++) {
            u = this.diffuseOnGPU(u, alpha, beta);
        }

        switch (this.shape) {
            case 0:
                u = this.applyDiffuseBoundaryConditionsGPU(u, this.magnitude, this.step, this.period);
                break;
            case 1:
                u = this.applyDiffuseBoundaryConditionsGPUVortex(u, this.magnitude, this.step, this.period);
                break;
            default:
                break;
        }

        const u_new = ndarray(new Float32Array(this.N * this.N * this.N * 3), [3, this.N, this.N, this.N]);
        (u_new.data as Float32Array).set(u.toArray());

        return u_new
    }
    /**
     * For a given flow vectorfield this method will calculate the pressure p
     * @param w A divergent vectorfield representing the flow
     * @returns The pressure field p
     */
    computePressure(w: ndarray) {

        let p = ndarray(new Float32Array(this.N * this.N * this.N).fill(0), [this.N, this.N, this.N]);

        const div_w = this.computeDivergenceOnGPU(
            w.data.slice(0, this.N * this.N * this.N),
            w.data.slice(this.N * this.N * this.N, 2 * this.N * this.N * this.N),
            w.data.slice(2 * this.N * this.N * this.N, 3 * this.N * this.N * this.N));

        let dx = 1 / this.N;
        let alpha: number = -(dx ** 3);
        let beta: number = 1 / 6;

        //solvePressure(p, div_w, alpha, beta);

        let res = this.computePressureOnGPU(p.data, div_w, alpha, beta); // TODO add loops

        for (let i = 0; i <= this.pressureIterations; i++) {
            res = this.computePressureOnGPU(res, div_w, alpha, beta);
        }
        res = this.applyPressureBoundaryConditionsGPU(res.toArray());

        (p.data as Float32Array).set(res.toArray());

        return p;
    }

    /**
     * This method will subtract the gradient of field o from field s and will set the result in this.u.
     * @param s 
     * @param o 
     */
    subtractAndSetArrays(s: ndarray, o: ndarray) {
        (this.u.data as Float32Array).set(this.subtractArraysOnGPU(s.data, this.computeGradientOnGPU(o.data)));
    }

    /////////////////////////
    ///GRAVITY & ADVECTION///
    /////////////////////////

    // The methods below perform the gravity and advection steps using GPU.JS

    gravityOnGPUDynamic = (N: number) => gpu.createKernel(function (q: number[], g: number, dt: number) {
        let z = this.thread.x % this.constants.N;
        let y = Math.floor(this.thread.x / this.constants.N) % this.constants.N;
        let x = Math.floor(this.thread.x / (this.constants.N * this.constants.N));
        return trilinearlyInterpolate(q, x, y + dt * g, z, this.constants.N);
    }).setConstants({ N: N }).setOutput([N * N * N]);

    advectOnGPUDynamic = (N: number) => gpu.createKernel(function (q: number[], u_x: number[], u_y: number[], u_z: number[], dt: number) {
        let z = this.thread.x % this.constants.N;
        let y = Math.floor(this.thread.x / this.constants.N) % this.constants.N;
        let x = Math.floor(this.thread.x / (this.constants.N * this.constants.N));

        // Look at the vector (a,b,c) in self.u in position (x,y,z)
        let a = getWithClipping(u_x, x, y, z, this.constants.N);
        let b = getWithClipping(u_y, x, y, z, this.constants.N);
        let c = getWithClipping(u_z, x, y, z, this.constants.N);

        // origin_coords = (x,y,z) - dt*(u,v,w)
        return trilinearlyInterpolate(q, x - dt * a, y - dt * b, z - dt * c, this.constants.N);
    }).setConstants({ N: N }).setOutput([N * N * N]);

    smokeDiffusionOnGPUDynamic = (N: number) => gpu.createKernel(function (q: number[], n: number, f: number, dt: number) {
        let z = this.thread.x % this.constants.N;
        let y = Math.floor(this.thread.x / this.constants.N) % this.constants.N;
        let x = Math.floor(this.thread.x / (this.constants.N * this.constants.N));


        let u = f;
        let v = f;
        let w = f;
        if (x >= n / 2) {
            u = -u;
        }
        if (y >= n / 2) {
            v = -v;
        }
        if (z >= n / 2) {
            w = -w;
        }

        return trilinearlyInterpolate(q, x + (dt * u), y + (dt * v), z + (dt * w), this.constants.N);
    }).setConstants({ N: N }).setOutput([N * N * N]);

    /**
     * This method applies a gravity field to the given array
     * @param {number[]} q The array of values on which the gravity should be applied (flattened 3D array)
     * @param {number} g Magnitude of the downward force
     * @param {number} dt Timestep
     */
    applyGravity(q: number[], g: number, dt: number) {
        (this.smoke.density.data as Float32Array).set(this.gravityOnGPU(q, g, dt));
    }

    /**
     * This method applies a gravity field to the given array
     * @param {number[]} q The array of values on which the smoke diffusion should be applied (flattened 3D array)
     * @param {number} smokeDif The magnitude of the force by smoke diffusion
     * @param {number} dt Timestep
     * @returns the same array q but with updated va
     */
    applySmokeDiffusion(q: number[], smokeDif: number, dt: number) {
        return this.smokeDiffusionOnGPU(q, this.N, smokeDif, dt);
    }

    /**
     * This method should execute the advection step of our solver, for a given timestemp dt
     * @param dt Size of the timestep dt
     * @returns A new array representing the updated quantities in this.q
     */
    advect(dt: number) {
        return this.advectOnGPU(this.smoke.density.data,
            this.u.data.slice(0, this.N * this.N * this.N),
            this.u.data.slice(this.N * this.N * this.N, 2 * this.N * this.N * this.N),
            this.u.data.slice(2 * this.N * this.N * this.N, 3 * this.N * this.N * this.N), dt);
    }
}