/**
 * Optional virtual museum base + contact-shadow catcher shown beneath the
 * molecule. The molecule is visually "supported" by the pedestal without any
 * fake chemical bonds — it simply floats above, anchored by the scene.
 */

import * as THREE from 'three';
import type { BaseStyle } from '../settings';

export interface BaseAssembly {
  group: THREE.Group;
  setStyle(style: BaseStyle): void;
  setShadowIntensity(v: number): void;
  dispose(): void;
}

interface StyleDef {
  color: number;
  roughness: number;
  metalness: number;
  transparent?: boolean;
  opacity?: number;
}

const STYLES: Record<BaseStyle, StyleDef> = {
  acrylic: { color: 0xdfe8f2, roughness: 0.08, metalness: 0.0, transparent: true, opacity: 0.28 },
  'matte-black': { color: 0x14151a, roughness: 0.9, metalness: 0.1 },
  'brushed-aluminum': { color: 0xb9bdc4, roughness: 0.35, metalness: 0.9 },
  walnut: { color: 0x3a241a, roughness: 0.55, metalness: 0.05 },
  'gallery-white': { color: 0xf2f2f0, roughness: 0.75, metalness: 0.0 },
};

export function createMuseumBase(radius: number): BaseAssembly {
  const group = new THREE.Group();
  group.name = 'museum-base';

  const pedestalRadius = radius * 1.25;
  const pedestalGeo = new THREE.CylinderGeometry(pedestalRadius, pedestalRadius * 1.05, radius * 0.25, 96, 1);
  const pedestalMat = new THREE.MeshStandardMaterial({ color: 0xdfe8f2 });
  const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
  pedestal.receiveShadow = true;
  pedestal.castShadow = false;

  // A subtle top rim to catch the key light.
  const rimGeo = new THREE.TorusGeometry(pedestalRadius, radius * 0.012, 16, 128);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.6 });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = radius * 0.125;

  // Soft radial contact shadow catcher (independent of the light for a clean
  // "gallery" look that reads even when shadows are subtle).
  const shadowTex = makeRadialShadowTexture();
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const shadowGeo = new THREE.PlaneGeometry(pedestalRadius * 2.4, pedestalRadius * 2.4);
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = radius * 0.128;

  group.add(pedestal, rim, shadow);

  function setStyle(style: BaseStyle) {
    const def = STYLES[style];
    pedestalMat.color.setHex(def.color);
    pedestalMat.roughness = def.roughness;
    pedestalMat.metalness = def.metalness;
    pedestalMat.transparent = !!def.transparent;
    pedestalMat.opacity = def.opacity ?? 1;
    pedestalMat.needsUpdate = true;
    rim.visible = style === 'brushed-aluminum' || style === 'acrylic';
  }

  function setShadowIntensity(v: number) {
    shadowMat.opacity = Math.max(0, Math.min(1, v));
  }

  function dispose() {
    pedestalGeo.dispose();
    pedestalMat.dispose();
    rimGeo.dispose();
    rimMat.dispose();
    shadowGeo.dispose();
    shadowMat.dispose();
    shadowTex.dispose();
  }

  return { group, setStyle, setShadowIntensity, dispose };
}

function makeRadialShadowTexture(): THREE.Texture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.05, size / 2, size / 2, size * 0.5);
  g.addColorStop(0, 'rgba(0,0,0,0.55)');
  g.addColorStop(0.55, 'rgba(0,0,0,0.22)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
