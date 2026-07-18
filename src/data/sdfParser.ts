/**
 * Minimal, robust parser for the MDL Molfile / SDF V2000 format.
 *
 * We only support the subset needed to faithfully load the PubChem CID 1832
 * 3D conformer: the counts line, the atom block (x/y/z + element + charge),
 * and the bond block (atom1/atom2/bond order). Coordinates, element
 * identities, connectivity, bond orders and formal charges are preserved
 * exactly as authored — no coordinates are regenerated or guessed.
 */

import type { ElementSymbol } from './elements';

export interface ParsedAtom {
  /** Zero-based index into the atom array. */
  index: number;
  /** One-based serial number as written in the SDF (used for readable labels). */
  serial: number;
  element: ElementSymbol;
  x: number;
  y: number;
  z: number;
  /** Formal charge (0 for the neutral free base). */
  charge: number;
}

export type BondOrder = 1 | 2 | 3 | 4; // 4 == aromatic (per MDL convention)

export interface ParsedBond {
  index: number;
  /** Zero-based atom indices. */
  a: number;
  b: number;
  order: BondOrder;
}

export interface ParsedMolecule {
  title: string;
  atoms: ParsedAtom[];
  bonds: ParsedBond[];
}

/** MDL charge field encoding (block-line convention) -> real formal charge. */
function decodeMdlCharge(code: number): number {
  switch (code) {
    case 1: return 3;
    case 2: return 2;
    case 3: return 1;
    case 5: return -1;
    case 6: return -2;
    case 7: return -3;
    default: return 0; // 0 and 4 (doublet radical) -> 0
  }
}

export function parseSDF(text: string): ParsedMolecule {
  const rawLines = text.split(/\r?\n/);
  if (rawLines.length < 4) {
    throw new Error('SDF parse error: file too short to contain a header.');
  }

  const title = rawLines[0].trim();
  const countsLine = rawLines[3];
  const atomCount = parseInt(countsLine.slice(0, 3), 10);
  const bondCount = parseInt(countsLine.slice(3, 6), 10);

  if (!Number.isFinite(atomCount) || !Number.isFinite(bondCount)) {
    throw new Error('SDF parse error: could not read atom/bond counts line.');
  }

  const atoms: ParsedAtom[] = [];
  const atomStart = 4;
  for (let i = 0; i < atomCount; i++) {
    const line = rawLines[atomStart + i];
    if (line == null) throw new Error(`SDF parse error: missing atom line ${i + 1}.`);
    const x = parseFloat(line.slice(0, 10));
    const y = parseFloat(line.slice(10, 20));
    const z = parseFloat(line.slice(20, 30));
    const element = line.slice(31, 34).trim() as ElementSymbol;
    const chargeCode = parseInt(line.slice(36, 39), 10);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
      throw new Error(`SDF parse error: bad coordinates on atom line ${i + 1}.`);
    }
    atoms.push({
      index: i,
      serial: i + 1,
      element,
      x,
      y,
      z,
      charge: decodeMdlCharge(Number.isFinite(chargeCode) ? chargeCode : 0),
    });
  }

  const bonds: ParsedBond[] = [];
  const bondStart = atomStart + atomCount;
  for (let i = 0; i < bondCount; i++) {
    const line = rawLines[bondStart + i];
    if (line == null) throw new Error(`SDF parse error: missing bond line ${i + 1}.`);
    const a = parseInt(line.slice(0, 3), 10) - 1;
    const b = parseInt(line.slice(3, 6), 10) - 1;
    const order = parseInt(line.slice(6, 9), 10) as BondOrder;
    if (a < 0 || b < 0 || a >= atomCount || b >= atomCount) {
      throw new Error(`SDF parse error: bond ${i + 1} references a non-existent atom.`);
    }
    bonds.push({ index: i, a, b, order: (order >= 1 && order <= 4 ? order : 1) as BondOrder });
  }

  // Handle explicit M CHG property lines (override block charges) if present.
  for (const line of rawLines) {
    if (line.startsWith('M  CHG')) {
      const parts = line.trim().split(/\s+/);
      const n = parseInt(parts[2], 10);
      for (let k = 0; k < n; k++) {
        const atomSerial = parseInt(parts[3 + k * 2], 10);
        const chg = parseInt(parts[4 + k * 2], 10);
        const atom = atoms[atomSerial - 1];
        if (atom) atom.charge = chg;
      }
    }
    if (line.startsWith('M  END')) break;
  }

  return { title, atoms, bonds };
}
