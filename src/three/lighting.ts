/**
 * Professional three-point lighting rig plus hemispheric ambient, with an
 * optional generated studio environment map for physically-based reflections.
 * Intensities are exposed so the settings panel can adjust them live.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export interface LightingRig {
  key: THREE.DirectionalLight;
  fill: THREE.DirectionalLight;
  rim: THREE.DirectionalLight;
  ambient: THREE.HemisphereLight;
  envTexture: THREE.Texture;
  dispose(): void;
}

export function createLighting(scene: THREE.Scene, renderer: THREE.WebGLRenderer): LightingRig {
  // Soft key light (main), casts shadows.
  const key = new THREE.DirectionalLight(0xffffff, 1.15);
  key.position.set(6, 9, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 60;
  key.shadow.camera.left = -12;
  key.shadow.camera.right = 12;
  key.shadow.camera.top = 12;
  key.shadow.camera.bottom = -12;
  key.shadow.bias = -0.0004;
  key.shadow.radius = 6;

  // Lower-intensity fill from the opposite side.
  const fill = new THREE.DirectionalLight(0xcfe0ff, 0.45);
  fill.position.set(-8, 3, 4);

  // Subtle cool rim/back light for separation.
  const rim = new THREE.DirectionalLight(0xbcd0ff, 0.6);
  rim.position.set(-3, 6, -9);

  // Hemispheric ambient (sky/ground).
  const ambient = new THREE.HemisphereLight(0xdfe8ff, 0x20242c, 0.55);

  scene.add(key, fill, rim, ambient);

  // Generated studio environment for PBR reflections (no external HDR needed).
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  return {
    key,
    fill,
    rim,
    ambient,
    envTexture,
    dispose() {
      scene.remove(key, fill, rim, ambient);
      envTexture.dispose();
    },
  };
}
