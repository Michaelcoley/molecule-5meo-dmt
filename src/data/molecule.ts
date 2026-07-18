/**
 * Assembles the fully-annotated molecule model used throughout the app from
 * the embedded, authentic PubChem CID 1832 3D conformer. The SDF is imported
 * verbatim (?raw) so coordinates are never regenerated at runtime.
 */

import rawSDF from './5meo-dmt.sdf?raw';
import { parseSDF, type ParsedMolecule, type ParsedAtom, type ParsedBond } from './sdfParser';
import { computeAtomProperties, type AtomProperties } from './hybridization';
import { validateMolecule, type ValidationReport } from './validator';
import { elementInfo } from './elements';

/** Static reference identity of the compound. */
export const MOLECULE_META = {
  commonName: '5-MeO-DMT',
  fullName: '5-methoxy-N,N-dimethyltryptamine',
  iupacName: '2-(5-methoxy-1H-indol-3-yl)-N,N-dimethylethanamine',
  formula: 'C13H18N2O',
  molecularWeight: 218.3, // g/mol
  pubchemCID: 1832,
  inchiKey: 'ZSTKHSQDNIGFLM-UHFFFAOYSA-N',
  canonicalSMILES: 'COc1ccc2c(c1)c(CCN(C)C)c[nH]2',
  conformerNote:
    'Displayed geometry is the PubChem CID 1832 3D conformer (a single, energetically reasonable conformation). Rotatable side-chain and methoxy bonds permit many conformations in reality.',
} as const;

export interface EnrichedBond extends ParsedBond {
  /** Bond length in Ångström, computed from the embedded coordinates. */
  length: number;
}

export interface Molecule {
  raw: ParsedMolecule;
  atoms: ParsedAtom[];
  bonds: EnrichedBond[];
  properties: AtomProperties[];
  /** Geometric centre (centroid of all atoms), in Å. */
  center: [number, number, number];
  /** Radius of the bounding sphere about the centre, in Å. */
  boundingRadius: number;
  composition: { symbol: string; count: number; weightContribution: number }[];
  validation: ValidationReport;
  sdfText: string;
}

function distance(a: ParsedAtom, b: ParsedAtom): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function buildMolecule(sdfText: string = rawSDF): Molecule {
  const raw = parseSDF(sdfText);
  const properties = computeAtomProperties(raw);
  const validation = validateMolecule(raw);

  const bonds: EnrichedBond[] = raw.bonds.map((b) => ({
    ...b,
    length: distance(raw.atoms[b.a], raw.atoms[b.b]),
  }));

  // Centroid + bounding radius.
  const n = raw.atoms.length;
  const c: [number, number, number] = [0, 0, 0];
  for (const a of raw.atoms) {
    c[0] += a.x;
    c[1] += a.y;
    c[2] += a.z;
  }
  c[0] /= n;
  c[1] /= n;
  c[2] /= n;
  let boundingRadius = 0;
  for (const a of raw.atoms) {
    const d = Math.sqrt((a.x - c[0]) ** 2 + (a.y - c[1]) ** 2 + (a.z - c[2]) ** 2);
    if (d > boundingRadius) boundingRadius = d;
  }

  // Elemental composition ordered C, H, N, O.
  const order = ['C', 'H', 'N', 'O'];
  const counts: Record<string, number> = {};
  for (const a of raw.atoms) counts[a.element] = (counts[a.element] ?? 0) + 1;
  const composition = order
    .filter((s) => counts[s])
    .map((symbol) => ({
      symbol,
      count: counts[symbol],
      weightContribution: counts[symbol] * elementInfo(symbol).atomicWeight,
    }));

  return {
    raw,
    atoms: raw.atoms,
    bonds,
    properties,
    center: c,
    boundingRadius,
    composition,
    validation,
    sdfText,
  };
}

/** Human-readable label for an atom, e.g. "C10" or "N3". */
export function atomLabel(atom: ParsedAtom): string {
  return `${atom.element}${atom.serial}`;
}
