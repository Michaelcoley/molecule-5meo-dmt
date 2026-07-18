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

export type ElementSymbol = 'C' | 'H' | 'N' | 'O';

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
