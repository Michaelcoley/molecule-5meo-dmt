/**
 * Element reference data for the elements present in 5-MeO-DMT (C, H, N, O).
 *
 * Colours follow the conventional CPK / Jmol convention. Two palettes are
 * provided: a refined "museum" palette (carbon rendered as dark charcoal, as
 * requested) and a higher-contrast accessibility palette that remains
 * distinguishable for colour-vision deficiencies and does not rely on colour
 * alone (element symbols are always available as labels).
 *
 * Radii are in Ångström. Covalent radii are used for ball-and-stick / stick
 * modes; van der Waals radii for space-filling. Sources are listed in
 * DATA_SOURCES.md.
 */

export type ElementSymbol =
  | 'C' | 'H' | 'N' | 'O'
  | 'P' | 'S' | 'F' | 'Cl' | 'Br' | 'I';

export interface ElementInfo {
  symbol: ElementSymbol;
  name: string;
  atomicNumber: number;
  /** Standard atomic weight (g/mol). */
  atomicWeight: number;
  /** Covalent radius (Å) — Cordero et al. 2008. */
  covalentRadius: number;
  /** Van der Waals radius (Å) — Bondi 1964. */
  vdwRadius: number;
  /** Museum / CPK-inspired colour (hex). */
  cpkColor: number;
  /** Higher-contrast accessibility colour (hex). */
  accessibleColor: number;
}

export const ELEMENTS: Record<ElementSymbol, ElementInfo> = {
  C: {
    symbol: 'C',
    name: 'Carbon',
    atomicNumber: 6,
    atomicWeight: 12.011,
    covalentRadius: 0.76,
    vdwRadius: 1.7,
    cpkColor: 0x2b2b30, // dark charcoal
    accessibleColor: 0x4d4d55,
  },
  H: {
    symbol: 'H',
    name: 'Hydrogen',
    atomicNumber: 1,
    atomicWeight: 1.008,
    covalentRadius: 0.31,
    vdwRadius: 1.2,
    cpkColor: 0xf5f5f5, // white
    accessibleColor: 0xffffff,
  },
  N: {
    symbol: 'N',
    name: 'Nitrogen',
    atomicNumber: 7,
    atomicWeight: 14.007,
    covalentRadius: 0.71,
    vdwRadius: 1.55,
    cpkColor: 0x3050f8, // blue
    accessibleColor: 0x2f7bff,
  },
  O: {
    symbol: 'O',
    name: 'Oxygen',
    atomicNumber: 8,
    atomicWeight: 15.999,
    covalentRadius: 0.66,
    vdwRadius: 1.52,
    cpkColor: 0xe8322a, // red
    accessibleColor: 0xff6a00,
  },
  P: {
    symbol: 'P',
    name: 'Phosphorus',
    atomicNumber: 15,
    atomicWeight: 30.974,
    covalentRadius: 1.07,
    vdwRadius: 1.8,
    cpkColor: 0xff8000, // orange
    accessibleColor: 0xff9d2e,
  },
  S: {
    symbol: 'S',
    name: 'Sulfur',
    atomicNumber: 16,
    atomicWeight: 32.06,
    covalentRadius: 1.05,
    vdwRadius: 1.8,
    cpkColor: 0xd4b000, // yellow
    accessibleColor: 0xe6c200,
  },
  F: {
    symbol: 'F',
    name: 'Fluorine',
    atomicNumber: 9,
    atomicWeight: 18.998,
    covalentRadius: 0.57,
    vdwRadius: 1.47,
    cpkColor: 0x59c53c, // green
    accessibleColor: 0x57d13a,
  },
  Cl: {
    symbol: 'Cl',
    name: 'Chlorine',
    atomicNumber: 17,
    atomicWeight: 35.45,
    covalentRadius: 1.02,
    vdwRadius: 1.75,
    cpkColor: 0x35b535, // green
    accessibleColor: 0x36c536,
  },
  Br: {
    symbol: 'Br',
    name: 'Bromine',
    atomicNumber: 35,
    atomicWeight: 79.904,
    covalentRadius: 1.2,
    vdwRadius: 1.85,
    cpkColor: 0xa52a1e, // brown-red
    accessibleColor: 0xc65a3a,
  },
  I: {
    symbol: 'I',
    name: 'Iodine',
    atomicNumber: 53,
    atomicWeight: 126.904,
    covalentRadius: 1.39,
    vdwRadius: 1.98,
    cpkColor: 0x8f00b5, // violet
    accessibleColor: 0xb14ecf,
  },
};

export function elementInfo(symbol: string): ElementInfo {
  const info = ELEMENTS[symbol as ElementSymbol];
  if (!info) throw new Error(`Unsupported element for this molecule: ${symbol}`);
  return info;
}

export function elementColor(symbol: string, accessible: boolean): number {
  const info = elementInfo(symbol);
  return accessible ? info.accessibleColor : info.cpkColor;
}
