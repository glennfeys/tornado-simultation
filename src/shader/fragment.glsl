// Modified from Three.js examples
//
// Original source:
// https://github.com/mrdoob/three.js/blob/master/examples/js/shaders/VolumeShader.js
// MIT License: 2010-2019 three.js authors
//
// This does not use the depthbuffer.
// Better visualisations should use the depthbuffer.

precision highp float;
precision mediump sampler3D;

uniform float u_N;
uniform bool u_vel;

uniform sampler3D u_data;

varying vec3 v_camera;
varying vec3 v_position;

const int MAX_STEPS = 128;
const float relative_step_size = 2.0 * 1.73 / float(MAX_STEPS);

float sample_density(vec3 texcoords) {
  vec3 uv = ((texcoords + 1.0) * (u_N - 2.0) + 1.0) / (2.0 * (u_N - 1.0));
  /* Sample float value from a 3D texture. Assumes intensity data. */

  return texture(u_data, uv).x;
}

vec4 apply_colormap(float val) {
  return vec4(vec3(0.5, 0.5, 0.5) * clamp(1.0 - val, 0.0, 1.0),
              clamp(pow(val, 0.08), 0.0, 1.0));
}

vec4 apply_colormap2(float val) {
  return vec4(clamp(1.0-val, 0.0, 1.0), clamp(val, 0.0, 1.0), 0.0, val);
}

bool inUnit(float v) { return v >= -1.1 && v <= 1.1; }

bool inBox(vec3 p) { return inUnit(p.x) && inUnit(p.y) && inUnit(p.z); }

float cast_ray(vec3 start_loc, vec3 step) {
  vec3 loc = start_loc;
  float ray_density = 0.0;

  // Enter the raycasting loop.
  while (inBox(loc) &&
         length(v_position - loc) < length(v_position - v_camera)) {
    // Sample from the 3D texture
    ray_density += sample_density(loc);
    // Advance location deeper into the volume
    loc += step;
  }

  // Resolve final density
  return 1.0 - exp(-ray_density / float(MAX_STEPS) * 20.0);
}
void main() {
  // Calculate unit vector pointing in the view direction through this fragment.
  vec3 view_ray = normalize(v_camera - v_position);

  vec3 step = relative_step_size * normalize(view_ray);

  float value = abs(cast_ray(v_position, step));
  if (u_vel == false) {
    gl_FragColor = apply_colormap(value);
  } else {
    gl_FragColor = apply_colormap2(value);
  }
}