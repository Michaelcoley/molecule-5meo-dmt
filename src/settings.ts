/**
 * Central view/render settings shared between the React UI and the Three.js
 * viewer. A single serialisable object keeps state predictable and makes
 * local-storage persistence trivial.
 */

export type RenderMode =
  | 'ball-stick'
  | 'space-filling'
  | 'stick'
  | 'wireframe'
  | 'museum'
  | 'hybridization';

export type AromaticMode = 'kekule' | 'delocalized';
export type BackgroundMode = 'dark' | 'light' | 'transparent' | 'gradient';
export type CameraType = 'perspective' | 'orthographic';
export type BaseStyle =
  | 'acrylic'
  | 'matte-black'
  | 'brushed-aluminum'
  | 'walnut'
  | 'gallery-white';
export type AtomLabelMode = 'element' | 'serial' | 'full' | 'hybridization';
export type ViewPreset = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';

export interface ViewerSettings {
  renderMode: RenderMode;
  aromaticMode: AromaticMode;
  background: BackgroundMode;
  cameraType: CameraType;

  showHydrogens: boolean;
  showAtomLabels: boolean;
  atomLabelMode: AtomLabelMode;
  showBondLabels: boolean;
  showBase: boolean;
  baseStyle: BaseStyle;
  showPlaque: boolean;

  autoRotate: boolean;
  autoRotateSpeed: number; // deg/sec-ish multiplier
  paused: boolean;

  // Material / appearance
  atomScale: number;
  bondScale: number;
  bondThickness: number;
  atomRoughness: number;
  atomMetalness: number;
  envIntensity: number;
  ambientIntensity: number;
  directionalIntensity: number;
  shadowIntensity: number;

  // Accessibility
  accessiblePalette: boolean;
  reducedMotion: boolean;

  // Scientific
  measureMode: boolean;
}

export const DEFAULT_SETTINGS: ViewerSettings = {
  renderMode: 'museum',
  aromaticMode: 'kekule',
  background: 'dark',
  cameraType: 'perspective',

  showHydrogens: true,
  showAtomLabels: false,
  atomLabelMode: 'element',
  showBondLabels: false,
  showBase: true,
  baseStyle: 'acrylic',
  showPlaque: true,

  autoRotate: true,
  autoRotateSpeed: 0.6,
  paused: false,

  atomScale: 1.0,
  bondScale: 1.0,
  bondThickness: 1.0,
  atomRoughness: 0.35,
  atomMetalness: 0.15,
  envIntensity: 1.0,
  ambientIntensity: 0.55,
  directionalIntensity: 1.15,
  shadowIntensity: 0.55,

  accessiblePalette: false,
  reducedMotion: false,

  measureMode: false,
};

export const STORAGE_KEY = '5meo-dmt-viewer-settings-v1';
