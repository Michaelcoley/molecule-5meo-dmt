/**
 * Assembles the fully-annotated molecule model used throughout the app from an
 * authentic PubChem 3D conformer in the registry. The SDF is parsed verbatim so
 * coordinates are never regenerated at runtime; validation runs against the
 * molecule's own spec.
 */

import { parseSDF, type ParsedMolecule, type ParsedAtom, type ParsedBond } from './sdfParser';
import { computeAtomProperties, type AtomProperties } from './hybridization';
import { validateMolecule, type ValidationReport } from './validator';
import { elementInfo } from './elements';
import { getMoleculeSpec, DEFAULT_MOLECULE_ID } from './molecules';
import type { MoleculeMeta } from './moleculeTypes';

export type { MoleculeMeta, MoleculeCategory } from './moleculeTypes';
export { MOLECULES, DEFAULT_MOLECULE_ID } from './molecules';

export interface EnrichedBond extends ParsedBond {
  /** Bond length in Ångström, computed from the embedded coordinates. */
  length: number;
}

export interface Molecule {
  id: string;
  meta: MoleculeMeta;
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

export function buildMolecule(id: string = DEFAULT_MOLECULE_ID): Molecule {
  const spec = getMoleculeSpec(id);
  const raw = parseSDF(spec.sdf);
  const properties = computeAtomProperties(raw);
  const validation = validateMolecule(raw, {
    expectedCounts: spec.expectedCounts,
    requiredFeatures: spec.requiredFeatures,
  });

  const bonds: EnrichedBond[] = raw.bonds.map((b) => ({
    ...b,
    length: distance(raw.atoms[b.a], raw.atoms[b.b]),
  }));

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

  const order = ['C', 'H', 'N', 'O', 'P', 'S', 'F', 'Cl', 'Br', 'I'];
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
    id: spec.id,
    meta: spec.meta,
    raw,
    atoms: raw.atoms,
    bonds,
    properties,
    center: c,
    boundingRadius,
    composition,
    validation,
    sdfText: spec.sdf,
  };
}

/** Human-readable label for an atom, e.g. "C10" or "N3". */
export function atomLabel(atom: ParsedAtom): string {
  return `${atom.element}${atom.serial}`;
}
