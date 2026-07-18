/**
 * MoleculeViewer — owns the entire Three.js scene: renderer, dual cameras,
 * OrbitControls, lighting rig, museum base, procedural atom/bond geometry,
 * CSS2D labels, picking, measurement overlays, camera framing/animation, and
 * export hooks. React drives it purely through `applySettings()` and a small
 * set of imperative methods; no per-frame React re-rendering occurs.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import type { Molecule } from '../data/molecule';
import { atomLabel } from '../data/molecule';
import { elementInfo, elementColor } from '../data/elements';
import { DEFAULT_SETTINGS, type ViewerSettings, type ViewPreset, type BackgroundMode } from '../settings';
import { createLighting, type LightingRig } from './lighting';
import { createMuseumBase, type BaseAssembly } from './museumBase';
import { distance as vdist, angle as vangle, dihedral as vdihedral, perpendicularInPlane } from './measure';
import { fitDistance } from './cameraMath';

export interface MeasureResult {
  kind: 'distance' | 'angle' | 'dihedral';
  atomIndices: number[];
  value: number;
  unit: 'Å' | '°';
}

export interface ViewerCallbacks {
  onSelectAtom?: (index: number | null) => void;
  onSelectBond?: (index: number | null) => void;
  onMeasure?: (result: MeasureResult | null) => void;
  onHybridizationLegend?: (categories: { label: string; color: number }[]) => void;
}

// Distinct colours for the educational hybridization / geometry mode.
const HYBRID_COLORS: Record<string, { label: string; color: number }> = {
  'sp2-C': { label: 'sp² aromatic C', color: 0x4cc9f0 },
  'sp3-C': { label: 'sp³ tetrahedral C', color: 0xf6a641 },
  'N-planar': { label: 'planar indole N', color: 0x8a5cff },
  'N-pyramidal': { label: 'pyramidal amine N', color: 0xff5cae },
  'O-bent': { label: 'bent ether O', color: 0xff5c5c },
  H: { label: 'hydrogen', color: 0xf0f0f0 },
};

function hybridCategory(mol: Molecule, i: number): keyof typeof HYBRID_COLORS {
  const el = mol.atoms[i].element;
  const p = mol.properties[i];
  if (el === 'H') return 'H';
  if (el === 'O') return 'O-bent';
  if (el === 'N') return p.aromatic ? 'N-planar' : 'N-pyramidal';
  return p.hybridization === 'sp2' ? 'sp2-C' : 'sp3-C';
}

interface CameraAnim {
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
  start: number;
  duration: number;
}

export class MoleculeViewer {
  readonly molecule: Molecule;
  private container: HTMLElement;
  private settings: ViewerSettings;
  private callbacks: ViewerCallbacks;

  private renderer: THREE.WebGLRenderer;
  private labelRenderer: CSS2DRenderer;
  private scene: THREE.Scene;
  private perspCamera: THREE.PerspectiveCamera;
  private orthoCamera: THREE.OrthographicCamera;
  private camera: THREE.Camera & { position: THREE.Vector3 };
  private controls!: OrbitControls;
  private lighting: LightingRig;
  private base: BaseAssembly;

  private root: THREE.Group; // recentred molecule container
  private moleculeGroup: THREE.Group;
  private atomMeshes: (THREE.Mesh | null)[] = [];
  private atomLabelObjs: (CSS2DObject | null)[] = [];
  private bondPickMeshes: THREE.Mesh[] = [];
  private bondLabelObjs: CSS2DObject[] = [];
  private highlight: THREE.Mesh;

  private geometryCache = new Map<string, THREE.BufferGeometry>();
  private sharedCylinder: THREE.CylinderGeometry;

  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private measurePicks: number[] = [];
  private measureGroup: THREE.Group;

  private animationId = 0;
  private cameraAnim: CameraAnim | null = null;
  private disposed = false;
  private exportSegments = false;

  private sceneRadius: number;

  constructor(
    container: HTMLElement,
    molecule: Molecule,
    settings: ViewerSettings = DEFAULT_SETTINGS,
    callbacks: ViewerCallbacks = {},
  ) {
    this.container = container;
    this.molecule = molecule;
    this.settings = { ...settings };
    this.callbacks = callbacks;
    // Effective scene radius includes the largest atom's vdW extent.
    this.sceneRadius = molecule.boundingRadius + 1.7;

    // Renderer (alpha for transparent background export).
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.setAttribute('role', 'img');
    this.renderer.domElement.setAttribute(
      'aria-label',
      'Interactive 3D model of the 5-MeO-DMT molecule',
    );
    container.appendChild(this.renderer.domElement);

    // CSS2D label overlay.
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.inset = '0';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    this.labelRenderer.domElement.className = 'label-layer';
    container.appendChild(this.labelRenderer.domElement);

    this.scene = new THREE.Scene();

    // Cameras.
    this.perspCamera = new THREE.PerspectiveCamera(38, 1, 0.1, 500);
    this.orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 500);
    this.camera = this.perspCamera;

    this.lighting = createLighting(this.scene, this.renderer);
    this.scene.environment = this.lighting.envTexture;

    this.root = new THREE.Group();
    this.scene.add(this.root);

    this.base = createMuseumBase(molecule.boundingRadius);
    this.base.group.position.y = -this.sceneRadius * 0.85;
    this.scene.add(this.base.group);

    this.sharedCylinder = new THREE.CylinderGeometry(1, 1, 1, 20, 1, true);

    this.moleculeGroup = new THREE.Group();
    this.root.add(this.moleculeGroup);

    this.measureGroup = new THREE.Group();
    this.root.add(this.measureGroup);

    // Selection highlight (reusable, hidden until used).
    const hlGeo = new THREE.SphereGeometry(1, 24, 16);
    const hlMat = new THREE.MeshBasicMaterial({
      color: 0x7fd7ff,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    this.highlight = new THREE.Mesh(hlGeo, hlMat);
    this.highlight.visible = false;
    this.root.add(this.highlight);

    this.createControls();
    this.buildMolecule();
    this.applySettings(this.settings, true);
    this.resize();

    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.addEventListener('dblclick', this.onDoubleClick);
    this.renderer.domElement.addEventListener('pointermove', this.onPointerMove);

    this.frameToFit(false);
    this.animate(performance.now());
  }

  // ---------------------------------------------------------------------------
  // Controls
  // ---------------------------------------------------------------------------
  private createControls() {
    if (this.controls) this.controls.dispose();
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.9;
    this.controls.zoomSpeed = 0.9;
    this.controls.panSpeed = 0.8;
    this.controls.minDistance = this.sceneRadius * 0.4;
    this.controls.maxDistance = this.sceneRadius * 12;
    this.controls.target.set(0, 0, 0);
  }

  // ---------------------------------------------------------------------------
  // Geometry construction
  // ---------------------------------------------------------------------------
  private atomRadius(index: number): number {
    const el = this.molecule.atoms[index].element;
    const info = elementInfo(el);
    switch (this.settings.renderMode) {
      case 'space-filling':
        return info.vdwRadius;
      case 'stick':
        return 0.16;
      case 'wireframe':
        return 0.07;
      default:
        return info.covalentRadius * 0.34;
    }
  }

  private atomColor(index: number): number {
    if (this.settings.renderMode === 'hybridization') {
      return HYBRID_COLORS[hybridCategory(this.molecule, index)].color;
    }
    return elementColor(this.molecule.atoms[index].element, this.settings.accessiblePalette);
  }

  private bondBaseRadius(): number {
    switch (this.settings.renderMode) {
      case 'stick':
        return 0.16;
      case 'wireframe':
        return 0.025;
      case 'museum':
        return 0.085;
      default:
        return 0.09;
    }
  }

  private sphereGeometry(element: string, radius: number): THREE.BufferGeometry {
    const seg = this.exportSegments ? 96 : 32;
    const rings = this.exportSegments ? 64 : 24;
    const key = `${element}:${radius.toFixed(3)}:${seg}`;
    let geo = this.geometryCache.get(key);
    if (!geo) {
      geo = new THREE.SphereGeometry(radius, seg, rings);
      this.geometryCache.set(key, geo);
    }
    return geo;
  }

  private makeAtomMaterial(index: number): THREE.Material {
    const color = this.atomColor(index);
    const s = this.settings;
    if (s.renderMode === 'wireframe') {
      return new THREE.MeshBasicMaterial({ color, wireframe: true });
    }
    if (s.renderMode === 'museum') {
      return new THREE.MeshPhysicalMaterial({
        color,
        roughness: Math.min(0.9, s.atomRoughness),
        metalness: s.atomMetalness,
        clearcoat: 0.6,
        clearcoatRoughness: 0.25,
        envMapIntensity: s.envIntensity,
      });
    }
    return new THREE.MeshStandardMaterial({
      color,
      roughness: s.atomRoughness,
      metalness: s.atomMetalness,
      envMapIntensity: s.envIntensity,
    });
  }

  private makeBondMaterial(color: number): THREE.Material {
    const s = this.settings;
    if (s.renderMode === 'wireframe') return new THREE.MeshBasicMaterial({ color });
    if (s.renderMode === 'museum') {
      return new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.3,
        metalness: 0.35,
        clearcoat: 0.4,
        envMapIntensity: s.envIntensity,
      });
    }
    return new THREE.MeshStandardMaterial({
      color,
      roughness: Math.max(0.25, s.atomRoughness),
      metalness: s.atomMetalness,
      envMapIntensity: s.envIntensity,
    });
  }

  private isAromaticBond(bondIndex: number): boolean {
    const b = this.molecule.bonds[bondIndex];
    return this.molecule.properties[b.a].aromatic && this.molecule.properties[b.b].aromatic;
  }

  /** (Re)builds all atom + bond meshes for the current settings. */
  private buildMolecule() {
    // Dispose previous.
    this.clearMoleculeGroup();

    const mol = this.molecule;
    const showH = this.settings.showHydrogens;

    // Atoms.
    this.atomMeshes = mol.atoms.map((atom) => {
      if (atom.element === 'H' && !showH) return null;
      const radius = this.atomRadius(atom.index);
      const geo = this.sphereGeometry(atom.element, radius);
      const mat = this.makeAtomMaterial(atom.index);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(atom.x - mol.center[0], atom.y - mol.center[1], atom.z - mol.center[2]);
      mesh.scale.setScalar(this.settings.atomScale);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { type: 'atom', index: atom.index };
      this.moleculeGroup.add(mesh);
      return mesh;
    });

    // Bonds (skip in space-filling; skip bonds to hidden H).
    this.bondPickMeshes = [];
    if (this.settings.renderMode !== 'space-filling') {
      mol.bonds.forEach((bond) => {
        const a = mol.atoms[bond.a];
        const b = mol.atoms[bond.b];
        if (!showH && (a.element === 'H' || b.element === 'H')) return;
        this.buildBond(bond.index);
      });
    }

    this.buildLabels();
  }

  private posOf(i: number): THREE.Vector3 {
    const a = this.molecule.atoms[i];
    return new THREE.Vector3(
      a.x - this.molecule.center[0],
      a.y - this.molecule.center[1],
      a.z - this.molecule.center[2],
    );
  }

  private orientCylinder(mesh: THREE.Mesh, from: THREE.Vector3, to: THREE.Vector3, radius: number) {
    const dir = new THREE.Vector3().subVectors(to, from);
    const len = dir.length();
    mesh.position.copy(from).addScaledVector(dir, 0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    mesh.scale.set(radius, len, radius);
    mesh.userData.baseRadius = radius;
  }

  private buildBond(bondIndex: number) {
    const bond = this.molecule.bonds[bondIndex];
    const pa = this.posOf(bond.a);
    const pb = this.posOf(bond.b);
    const mid = new THREE.Vector3().addVectors(pa, pb).multiplyScalar(0.5);
    const colorA = this.atomColor(bond.a);
    const colorB = this.atomColor(bond.b);
    const baseR = this.bondBaseRadius() * this.settings.bondThickness;

    const aromatic = this.isAromaticBond(bondIndex);
    const delocalized = this.settings.aromaticMode === 'delocalized';

    // Effective drawn multiplicity.
    let multiplicity = bond.order;
    if (aromatic && delocalized) multiplicity = 1; // uniform aromatic connector
    if (multiplicity > 3) multiplicity = 1;

    // Perpendicular offset for multi-bonds, held stable in the local chemical
    // plane using a neighbouring atom as the in-plane reference.
    const offsets = this.multiBondOffsets(bondIndex, multiplicity, baseR);

    const subRadius = multiplicity > 1 ? baseR * 0.62 : baseR;

    for (const off of offsets) {
      const oa = pa.clone().add(off);
      const ob = pb.clone().add(off);
      const om = mid.clone().add(off);
      const halfA = new THREE.Mesh(this.sharedCylinder, this.makeBondMaterial(colorA));
      const halfB = new THREE.Mesh(this.sharedCylinder, this.makeBondMaterial(colorB));
      this.orientCylinder(halfA, oa, om, subRadius);
      this.orientCylinder(halfB, om, ob, subRadius);
      // unitRadius is the radius at bondThickness === 1, so the thickness
      // slider can rescale live without compounding the build-time thickness.
      const unitRadius = subRadius / Math.max(0.0001, this.settings.bondThickness);
      for (const h of [halfA, halfB]) {
        h.castShadow = this.settings.renderMode !== 'wireframe';
        h.receiveShadow = true;
        h.userData = { type: 'bond', index: bondIndex, baseRadius: subRadius, unitRadius };
        this.moleculeGroup.add(h);
        this.bondPickMeshes.push(h);
      }
    }

    // Delocalised aromatic: add a thin inner accent ring cylinder to signal
    // partial double-bond character without drawing a full Kekulé double bond.
    if (aromatic && delocalized) {
      const off = this.aromaticInwardOffset(bondIndex, baseR * 1.1);
      if (off) {
        const accent = new THREE.Mesh(
          this.sharedCylinder,
          new THREE.MeshStandardMaterial({
            color: 0x9fb4d8,
            roughness: 0.5,
            metalness: 0.1,
            transparent: true,
            opacity: 0.6,
          }),
        );
        this.orientCylinder(accent, pa.clone().add(off), pb.clone().add(off), baseR * 0.28);
        accent.userData = { type: 'bond', index: bondIndex, baseRadius: baseR * 0.28 };
        this.moleculeGroup.add(accent);
      }
    }
  }

  /** Returns offset vectors (one per parallel cylinder) for a bond. */
  private multiBondOffsets(bondIndex: number, multiplicity: number, baseR: number): THREE.Vector3[] {
    if (multiplicity <= 1) return [new THREE.Vector3(0, 0, 0)];
    const dir = this.aromaticInwardOffset(bondIndex, 1) ?? this.genericPerp(bondIndex);
    const sep = baseR * 1.7;
    if (multiplicity === 2) {
      return [dir.clone().multiplyScalar(sep * 0.5), dir.clone().multiplyScalar(-sep * 0.5)];
    }
    // triple
    return [
      new THREE.Vector3(0, 0, 0),
      dir.clone().multiplyScalar(sep),
      dir.clone().multiplyScalar(-sep),
    ];
  }

  /** Unit offset pointing toward the ring interior (keeps double bonds in the
   *  molecular plane); null when the bond is not part of a ring. */
  private aromaticInwardOffset(bondIndex: number, scale: number): THREE.Vector3 | null {
    const bond = this.molecule.bonds[bondIndex];
    // Find a shared aromatic neighbour to define the plane / interior direction.
    const adjA = this.neighborsOf(bond.a).filter((n) => n !== bond.b);
    const adjB = this.neighborsOf(bond.b).filter((n) => n !== bond.a);
    const ref = [...adjA, ...adjB].find((n) => this.molecule.properties[n].aromatic);
    if (ref === undefined) return null;
    const pa: [number, number, number] = [this.posOf(bond.a).x, this.posOf(bond.a).y, this.posOf(bond.a).z];
    const pb: [number, number, number] = [this.posOf(bond.b).x, this.posOf(bond.b).y, this.posOf(bond.b).z];
    const pr: [number, number, number] = [this.posOf(ref).x, this.posOf(ref).y, this.posOf(ref).z];
    const axis: [number, number, number] = [pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]];
    const perp = perpendicularInPlane(pa, pr, axis);
    return new THREE.Vector3(perp[0], perp[1], perp[2]).multiplyScalar(scale);
  }

  private genericPerp(bondIndex: number): THREE.Vector3 {
    const bond = this.molecule.bonds[bondIndex];
    const dir = new THREE.Vector3().subVectors(this.posOf(bond.b), this.posOf(bond.a)).normalize();
    const seed = Math.abs(dir.x) < 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    return new THREE.Vector3().crossVectors(dir, seed).normalize();
  }

  private neighborsOf(i: number): number[] {
    const out: number[] = [];
    for (const b of this.molecule.bonds) {
      if (b.a === i) out.push(b.b);
      else if (b.b === i) out.push(b.a);
    }
    return out;
  }

  // ---------------------------------------------------------------------------
  // Labels
  // ---------------------------------------------------------------------------
  private buildLabels() {
    this.atomLabelObjs = this.molecule.atoms.map((atom) => {
      const mesh = this.atomMeshes[atom.index];
      if (!mesh) return null;
      const el = document.createElement('div');
      el.className = 'atom-label';
      const obj = new CSS2DObject(el);
      obj.center.set(0.5, -0.4);
      mesh.add(obj);
      return obj;
    });

    this.bondLabelObjs = [];
    for (const bond of this.molecule.bonds) {
      const a = this.molecule.atoms[bond.a];
      const b = this.molecule.atoms[bond.b];
      if (!this.settings.showHydrogens && (a.element === 'H' || b.element === 'H')) continue;
      const el = document.createElement('div');
      el.className = 'bond-label';
      el.textContent = `${bond.length.toFixed(2)} Å`;
      const obj = new CSS2DObject(el);
      obj.position.copy(this.posOf(bond.a).add(this.posOf(bond.b)).multiplyScalar(0.5));
      obj.userData = { bondIndex: bond.index };
      this.moleculeGroup.add(obj);
      this.bondLabelObjs.push(obj);
    }
    this.updateLabelContent();
    this.updateLabelVisibility();
  }

  private updateLabelContent() {
    const mode = this.settings.atomLabelMode;
    this.atomLabelObjs.forEach((obj, i) => {
      if (!obj) return;
      const atom = this.molecule.atoms[i];
      const p = this.molecule.properties[i];
      let text: string = atom.element;
      if (mode === 'serial') text = String(atom.serial);
      else if (mode === 'full') text = atomLabel(atom);
      else if (mode === 'hybridization') text = p.hybridization === 'n/a' ? atom.element : p.hybridization;
      (obj.element as HTMLElement).textContent = text;
    });
  }

  private updateLabelVisibility() {
    // NB: CSS2DRenderer rewrites element.style.display from object.visible every
    // frame, so visibility must be driven through the CSS2DObject, not the DOM.
    const showA = this.settings.showAtomLabels;
    for (const obj of this.atomLabelObjs) if (obj) obj.visible = showA;
    const showB = this.settings.showBondLabels;
    for (const obj of this.bondLabelObjs) obj.visible = showB;
  }

  private clearMoleculeGroup() {
    for (const obj of this.atomLabelObjs) obj?.parent?.remove(obj);
    for (const obj of this.bondLabelObjs) obj.parent?.remove(obj);
    this.moleculeGroup.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        (o.material as THREE.Material).dispose?.();
      }
    });
    this.moleculeGroup.clear();
    this.atomMeshes = [];
    this.bondPickMeshes = [];
    this.atomLabelObjs = [];
    this.bondLabelObjs = [];
  }

  // ---------------------------------------------------------------------------
  // Settings application
  // ---------------------------------------------------------------------------
  applySettings(next: ViewerSettings, force = false) {
    const prev = this.settings;
    this.settings = { ...next };

    const structuralChanged =
      force ||
      prev.renderMode !== next.renderMode ||
      prev.aromaticMode !== next.aromaticMode ||
      prev.showHydrogens !== next.showHydrogens ||
      prev.accessiblePalette !== next.accessiblePalette;

    if (structuralChanged) {
      this.buildMolecule();
      if (next.renderMode === 'hybridization') {
        const cats = Object.values(HYBRID_COLORS);
        this.callbacks.onHybridizationLegend?.(cats);
      } else {
        this.callbacks.onHybridizationLegend?.([]);
      }
    } else {
      this.updateAppearance();
    }

    // Cheap, always-applied updates.
    this.updateLabelContent();
    this.updateLabelVisibility();
    this.setBackground(next.background);
    this.base.group.visible = next.showBase;
    this.base.setStyle(next.baseStyle);
    this.base.setShadowIntensity(next.shadowIntensity);

    this.lighting.key.intensity = next.directionalIntensity;
    this.lighting.fill.intensity = next.directionalIntensity * 0.4;
    this.lighting.rim.intensity = next.directionalIntensity * 0.5;
    this.lighting.ambient.intensity = next.ambientIntensity;
    this.lighting.key.castShadow = next.shadowIntensity > 0.01;
    this.scene.environment = next.envIntensity > 0 ? this.lighting.envTexture : null;

    this.controls.autoRotate = next.autoRotate && !next.paused && !next.reducedMotion;
    this.controls.autoRotateSpeed = next.autoRotateSpeed * 2.0;
    this.controls.enableDamping = !next.reducedMotion;

    if (prev.cameraType !== next.cameraType) this.setCameraType(next.cameraType);

    if (prev.measureMode !== next.measureMode && !next.measureMode) this.clearMeasurement();
  }

  private updateAppearance() {
    // Update per-atom material properties + scale without a rebuild.
    for (let i = 0; i < this.atomMeshes.length; i++) {
      const mesh = this.atomMeshes[i];
      if (!mesh) continue;
      mesh.scale.setScalar(this.settings.atomScale);
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if ('roughness' in mat) mat.roughness = this.settings.atomRoughness;
      if ('metalness' in mat) mat.metalness = this.settings.atomMetalness;
      if ('envMapIntensity' in mat) (mat as any).envMapIntensity = this.settings.envIntensity;
      mat.needsUpdate = true;
    }
    for (const mesh of this.bondPickMeshes) {
      const unit = (mesh.userData.unitRadius as number) ?? this.bondBaseRadius();
      const r = unit * this.settings.bondThickness;
      mesh.scale.x = r;
      mesh.scale.z = r;
    }
  }

  // ---------------------------------------------------------------------------
  // Background
  // ---------------------------------------------------------------------------
  private gradientTexture: THREE.Texture | null = null;
  private setBackground(mode: BackgroundMode) {
    if (mode === 'transparent') {
      this.scene.background = null;
      this.renderer.setClearColor(0x000000, 0);
      return;
    }
    this.renderer.setClearColor(0x000000, 1);
    if (mode === 'dark') this.scene.background = new THREE.Color(0x0e0f13);
    else if (mode === 'light') this.scene.background = new THREE.Color(0xf3f4f7);
    else if (mode === 'gradient') {
      if (!this.gradientTexture) this.gradientTexture = this.makeGradientTexture();
      this.scene.background = this.gradientTexture;
    }
  }

  private makeGradientTexture(): THREE.Texture {
    const c = document.createElement('canvas');
    c.width = 16;
    c.height = 256;
    const ctx = c.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#1b2130');
    g.addColorStop(0.55, '#12141b');
    g.addColorStop(1, '#070809');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 16, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // ---------------------------------------------------------------------------
  // Camera
  // ---------------------------------------------------------------------------
  private setCameraType(type: 'perspective' | 'orthographic') {
    const target = this.controls.target.clone();
    const pos = this.camera.position.clone();
    this.camera = type === 'perspective' ? this.perspCamera : this.orthoCamera;
    this.camera.position.copy(pos);
    this.resize();
    this.createControls();
    this.controls.target.copy(target);
    this.camera.lookAt(target);
  }

  /** Distance at which the molecule fills ~70% of the view (aspect-aware, so
   *  wide molecules are not clipped on tall portrait / phone screens). */
  private fitDistance(): number {
    const aspect = (this.container.clientWidth || 1) / (this.container.clientHeight || 1);
    return fitDistance(this.sceneRadius, this.perspCamera.fov, 0.72, aspect);
  }

  frameToFit(animated = true) {
    const dist = this.fitDistance();
    const dir = new THREE.Vector3(0.6, 0.35, 1).normalize();
    const to = dir.multiplyScalar(dist);
    this.moveCamera(to, new THREE.Vector3(0, 0, 0), animated);
    this.updateOrthoFrustum();
  }

  resetCamera() {
    this.frameToFit(true);
  }

  setView(preset: ViewPreset, animated = true) {
    const d = this.fitDistance();
    const dirs: Record<ViewPreset, THREE.Vector3> = {
      front: new THREE.Vector3(0, 0, 1),
      back: new THREE.Vector3(0, 0, -1),
      right: new THREE.Vector3(1, 0, 0),
      left: new THREE.Vector3(-1, 0, 0),
      top: new THREE.Vector3(0, 1, 0),
      bottom: new THREE.Vector3(0, -1, 0),
    };
    this.moveCamera(dirs[preset].multiplyScalar(d), new THREE.Vector3(0, 0, 0), animated);
  }

  focusAtom(index: number) {
    const mesh = this.atomMeshes[index];
    if (!mesh) return;
    const target = mesh.position.clone();
    const offset = this.camera.position.clone().sub(this.controls.target);
    const to = target.clone().add(offset.setLength(Math.max(offset.length() * 0.7, this.sceneRadius * 0.9)));
    this.moveCamera(to, target, true);
  }

  private moveCamera(toPos: THREE.Vector3, toTarget: THREE.Vector3, animated: boolean) {
    if (!animated || this.settings.reducedMotion) {
      this.camera.position.copy(toPos);
      this.controls.target.copy(toTarget);
      this.controls.update();
      this.updateOrthoFrustum();
      return;
    }
    this.cameraAnim = {
      fromPos: this.camera.position.clone(),
      toPos,
      fromTarget: this.controls.target.clone(),
      toTarget,
      start: performance.now(),
      duration: 650,
    };
  }

  private updateOrthoFrustum() {
    const dist = this.camera.position.distanceTo(this.controls.target);
    const aspect = this.container.clientWidth / Math.max(1, this.container.clientHeight);
    const halfH = dist * 0.36;
    const halfW = halfH * aspect;
    this.orthoCamera.left = -halfW;
    this.orthoCamera.right = halfW;
    this.orthoCamera.top = halfH;
    this.orthoCamera.bottom = -halfH;
    this.orthoCamera.updateProjectionMatrix();
  }

  // ---------------------------------------------------------------------------
  // Picking + selection
  // ---------------------------------------------------------------------------
  private setPointer(ev: PointerEvent | MouseEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private pick(): { type: 'atom' | 'bond'; index: number } | null {
    this.raycaster.setFromCamera(this.pointer, this.camera as THREE.PerspectiveCamera);
    const targets = [
      ...this.atomMeshes.filter((m): m is THREE.Mesh => !!m),
      ...this.bondPickMeshes,
    ];
    const hits = this.raycaster.intersectObjects(targets, false);
    if (!hits.length) return null;
    const ud = hits[0].object.userData;
    return { type: ud.type, index: ud.index };
  }

  private onPointerDown = (ev: PointerEvent) => {
    if (ev.button !== 0) return;
    this.setPointer(ev);
    // Defer to distinguish click from drag: only treat as selection if pointer
    // barely moved by pointerup.
    const startX = ev.clientX;
    const startY = ev.clientY;
    const up = (upEv: PointerEvent) => {
      window.removeEventListener('pointerup', up);
      if (Math.hypot(upEv.clientX - startX, upEv.clientY - startY) > 5) return;
      this.setPointer(upEv);
      const hit = this.pick();
      if (this.settings.measureMode) {
        if (hit?.type === 'atom') this.addMeasurePick(hit.index);
        return;
      }
      if (!hit) {
        this.select(null);
      } else if (hit.type === 'atom') {
        this.select({ type: 'atom', index: hit.index });
      } else {
        this.select({ type: 'bond', index: hit.index });
      }
    };
    window.addEventListener('pointerup', up);
  };

  private onDoubleClick = (ev: MouseEvent) => {
    this.setPointer(ev);
    const hit = this.pick();
    if (hit?.type === 'atom') this.focusAtom(hit.index);
  };

  private onPointerMove = (ev: PointerEvent) => {
    this.setPointer(ev);
    const hit = this.pick();
    this.renderer.domElement.style.cursor = hit ? 'pointer' : 'grab';
  };

  private select(sel: { type: 'atom' | 'bond'; index: number } | null) {
    if (!sel) {
      this.highlight.visible = false;
      this.callbacks.onSelectAtom?.(null);
      this.callbacks.onSelectBond?.(null);
      return;
    }
    if (sel.type === 'atom') {
      const mesh = this.atomMeshes[sel.index];
      if (mesh) {
        this.highlight.position.copy(mesh.position);
        this.highlight.scale.setScalar(this.atomRadius(sel.index) * this.settings.atomScale * 1.35);
        this.highlight.visible = true;
      }
      this.callbacks.onSelectBond?.(null);
      this.callbacks.onSelectAtom?.(sel.index);
    } else {
      const bond = this.molecule.bonds[sel.index];
      const mid = this.posOf(bond.a).add(this.posOf(bond.b)).multiplyScalar(0.5);
      this.highlight.position.copy(mid);
      this.highlight.scale.setScalar(this.bondBaseRadius() * this.settings.bondThickness * 2.4);
      this.highlight.visible = true;
      this.callbacks.onSelectAtom?.(null);
      this.callbacks.onSelectBond?.(sel.index);
    }
  }

  selectAtomExternal(index: number) {
    this.select({ type: 'atom', index });
    this.focusAtom(index);
  }

  // ---------------------------------------------------------------------------
  // Measurement
  // ---------------------------------------------------------------------------
  private addMeasurePick(index: number) {
    if (this.measurePicks.includes(index)) return;
    this.measurePicks.push(index);
    const needed = this.measurePicks.length;
    this.drawMeasurement();
    if (needed >= 4) this.emitMeasurement();
    else if (needed >= 2) this.emitMeasurement();
  }

  private emitMeasurement() {
    const picks = this.measurePicks;
    const p = (i: number): [number, number, number] => [
      this.molecule.atoms[i].x,
      this.molecule.atoms[i].y,
      this.molecule.atoms[i].z,
    ];
    let result: MeasureResult | null = null;
    if (picks.length === 2) {
      result = { kind: 'distance', atomIndices: [...picks], value: vdist(p(picks[0]), p(picks[1])), unit: 'Å' };
    } else if (picks.length === 3) {
      result = {
        kind: 'angle',
        atomIndices: [...picks],
        value: vangle(p(picks[0]), p(picks[1]), p(picks[2])),
        unit: '°',
      };
    } else if (picks.length === 4) {
      result = {
        kind: 'dihedral',
        atomIndices: [...picks],
        value: vdihedral(p(picks[0]), p(picks[1]), p(picks[2]), p(picks[3])),
        unit: '°',
      };
    }
    this.callbacks.onMeasure?.(result);
  }

  private drawMeasurement() {
    this.measureGroup.clear();
    const pts = this.measurePicks.map((i) => this.posOf(i));
    // markers
    for (const i of this.measurePicks) {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(this.atomRadius(i) * this.settings.atomScale * 1.2, 16, 12),
        new THREE.MeshBasicMaterial({ color: 0xffd54a, transparent: true, opacity: 0.5, depthWrite: false }),
      );
      m.position.copy(this.posOf(i));
      this.measureGroup.add(m);
    }
    if (pts.length >= 2) {
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffd54a }));
      this.measureGroup.add(line);
    }
  }

  clearMeasurement() {
    this.measurePicks = [];
    this.measureGroup.clear();
    this.callbacks.onMeasure?.(null);
  }

  // ---------------------------------------------------------------------------
  // Render loop
  // ---------------------------------------------------------------------------
  private animate = (t: number) => {
    if (this.disposed) return;
    this.animationId = requestAnimationFrame(this.animate);

    if (this.cameraAnim) {
      const a = this.cameraAnim;
      const k = Math.min(1, (t - a.start) / a.duration);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; // easeInOutQuad
      this.camera.position.lerpVectors(a.fromPos, a.toPos, e);
      this.controls.target.lerpVectors(a.fromTarget, a.toTarget, e);
      this.updateOrthoFrustum();
      if (k >= 1) this.cameraAnim = null;
    }

    if (!this.settings.paused) this.controls.update();
    else this.controls.update(); // damping still resolves; autoRotate is off

    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  };

  // ---------------------------------------------------------------------------
  // Resize
  // ---------------------------------------------------------------------------
  resize() {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // updateStyle must stay true (the default): on high-DPI displays the draw
    // buffer is devicePixelRatio× larger than the CSS box, and only the style
    // width/height keep the canvas visually the same size as its container.
    // Passing `false` here leaves the canvas displayed at buffer size (2× on
    // Retina), overflowing the stage while the CSS2D label overlay stays at 1×.
    this.renderer.setSize(w, h);
    this.labelRenderer.setSize(w, h);
    this.perspCamera.aspect = w / h;
    this.perspCamera.updateProjectionMatrix();
    this.updateOrthoFrustum();
  }

  // ---------------------------------------------------------------------------
  // Export helpers
  // ---------------------------------------------------------------------------
  /** Renders at an integer scale of the current viewport; returns a PNG blob. */
  async renderToPNG(scale: number, transparent: boolean): Promise<Blob> {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const prevBg = this.scene.background;
    this.exportSegments = true;
    this.buildMolecule();
    this.updateLabelVisibility();

    if (transparent) {
      this.scene.background = null;
      this.renderer.setClearColor(0x000000, 0);
    }
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(w * scale, h * scale, false);
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
    this.renderer.render(this.scene, this.camera);
    const blob = await new Promise<Blob>((res, rej) =>
      this.renderer.domElement.toBlob((b) => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/png'),
    );
    // Restore.
    this.scene.background = prevBg;
    this.setBackground(this.settings.background);
    this.exportSegments = false;
    this.buildMolecule();
    this.updateLabelVisibility();
    this.resize();
    return blob;
  }

  /** Data needed by the vector (SVG) exporter — world positions projected by
   *  the caller, with per-atom radius/colour and bond endpoints. */
  getExportScene() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const project = (v: THREE.Vector3) => v.clone().project(this.camera);
    // Camera-right vector (world space) for estimating on-screen atom radius.
    this.camera.updateMatrixWorld();
    const camRight = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 0);

    const atoms = this.atomMeshes
      .map((m, i) => {
        if (!m) return null;
        const world = m.getWorldPosition(new THREE.Vector3());
        const ndc = project(world.clone());
        const r = this.atomRadius(i) * this.settings.atomScale;
        const edge = project(world.clone().addScaledVector(camRight, r));
        const pxRadius = Math.abs(edge.x - ndc.x) * (width / 2);
        return {
          index: i,
          element: this.molecule.atoms[i].element,
          color: this.atomColor(i),
          radius: r,
          pxRadius: Math.max(1.5, pxRadius),
          world,
          ndc,
          depth: ndc.z,
        };
      })
      .filter((a): a is NonNullable<typeof a> => a !== null);

    const bonds = this.molecule.bonds
      .filter((b) => {
        if (this.settings.renderMode === 'space-filling') return false;
        if (!this.settings.showHydrogens) {
          const ea = this.molecule.atoms[b.a].element;
          const eb = this.molecule.atoms[b.b].element;
          if (ea === 'H' || eb === 'H') return false;
        }
        return true;
      })
      .map((b) => {
        const pa = this.moleculeGroup.localToWorld(this.posOf(b.a));
        const pb = this.moleculeGroup.localToWorld(this.posOf(b.b));
        return {
          index: b.index,
          a: b.a,
          b: b.b,
          order: b.order,
          aromatic: this.isAromaticBond(b.index),
          colorA: this.atomColor(b.a),
          colorB: this.atomColor(b.b),
          ndcA: project(pa.clone()),
          ndcB: project(pb.clone()),
        };
      });

    return {
      atoms,
      bonds,
      width,
      height,
      aromaticMode: this.settings.aromaticMode,
    };
  }

  getMoleculeGroupForExport(): THREE.Group {
    return this.moleculeGroup;
  }

  getRenderer() {
    return this.renderer;
  }

  // ---------------------------------------------------------------------------
  // Teardown
  // ---------------------------------------------------------------------------
  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.animationId);
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.removeEventListener('dblclick', this.onDoubleClick);
    this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.clearMoleculeGroup();
    this.controls.dispose();
    this.lighting.dispose();
    this.base.dispose();
    this.sharedCylinder.dispose();
    for (const g of this.geometryCache.values()) g.dispose();
    this.geometryCache.clear();
    this.gradientTexture?.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.labelRenderer.domElement.remove();
  }
}
