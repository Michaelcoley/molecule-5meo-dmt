/**
 * Structural validation for an embedded molecule, driven by a per-molecule
 * spec (expected element counts + the structural features that must be
 * present). Runs before rendering so a corrupted or substituted structure
 * surfaces a clear developer error instead of silently drawing the wrong thing.
 *
 * Feature detectors work from the molecular graph (rings, bond orders,
 * hydrogen counts), never from hard-coded atom indices, so the same code
 * validates every compound in the registry.
 */

import type { ParsedMolecule } from './sdfParser';
import { buildAdjacency, findRings } from './hybridization';
import type { ExpectedCounts, FeatureId } from './molecules';

export interface FeatureCheck {
  id: FeatureId;
  label: string;
  ok: boolean;
  detail: string;
}

export interface ValidationSpec {
  expectedCounts: ExpectedCounts;
  requiredFeatures: FeatureId[];
}

export interface ValidationReport {
  valid: boolean;
  counts: Record<string, number>;
  errors: string[];
  warnings: string[];
  features: FeatureCheck[];
}

function countElements(mol: ParsedMolecule): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const a of mol.atoms) counts[a.element] = (counts[a.element] ?? 0) + 1;
  counts.total = mol.atoms.length;
  return counts;
}

/** Shared graph context computed once and passed to each feature detector. */
interface Ctx {
  mol: ParsedMolecule;
  adj: number[][];
  rings: number[][];
  five?: number[];
  six?: number[];
  neighborsOf: (i: number) => ParsedMolecule['atoms'];
  elementOf: (i: number) => string;
}

type Detector = (c: Ctx) => FeatureCheck;

const DETECTORS: Record<FeatureId, Detector> = {
  indole: ({ five, six, elementOf }) => {
    let fused = false;
    if (five && six) fused = five.filter((a) => six.includes(a)).length === 2;
    const pyrroleN = !!five && five.filter((i) => elementOf(i) === 'N').length === 1;
    return {
      id: 'indole',
      label: 'Fused indole ring system',
      ok: fused && pyrroleN,
      detail: fused
        ? `5-membered ring fused to 6-membered ring (${five!.length}+${six!.length}), one pyrrole nitrogen.`
        : 'Could not identify a fused 5/6 ring system.',
    };
  },

  methoxy: ({ mol, adj, six, neighborsOf, elementOf }) => {
    const oxygens = mol.atoms.filter((a) => a.element === 'O');
    let ok = false;
    if (oxygens.length >= 1) {
      const o = oxygens[0];
      const carbons = adj[o.index].filter((j) => elementOf(j) === 'C');
      if (carbons.length === 2) {
        const methyl = carbons.find((c) => neighborsOf(c).filter((n) => n.element === 'H').length === 3);
        const aromaticC = carbons.find((c) => six?.includes(c));
        ok = methyl !== undefined && aromaticC !== undefined;
      }
    }
    return {
      id: 'methoxy',
      label: 'Methoxy substituent (5-position)',
      ok,
      detail: ok ? 'O bridges an aromatic ring carbon and a CH3 group.' : 'No aromatic –OCH3 found.',
    };
  },

  methylenedioxy: ({ mol, adj, six, neighborsOf, elementOf }) => {
    // A CH2 bridging two oxygens, each attached to an aromatic ring carbon
    // (the 1,3-dioxole fused to benzene, as in MDMA / MDA).
    let ok = false;
    for (const c of mol.atoms.filter((a) => a.element === 'C')) {
      const os = adj[c.index].filter((j) => elementOf(j) === 'O');
      const hs = neighborsOf(c.index).filter((n) => n.element === 'H').length;
      if (os.length === 2 && hs === 2) {
        const bothOnRing = os.every((o) => adj[o].some((k) => k !== c.index && six?.includes(k)));
        if (bothOnRing) ok = true;
      }
    }
    return {
      id: 'methylenedioxy',
      label: 'Methylenedioxy ring',
      ok,
      detail: ok ? 'O–CH2–O bridge fused to the aromatic ring.' : 'No methylenedioxy bridge found.',
    };
  },

  'tertiary-amine': ({ mol, neighborsOf }) => {
    const amine = mol.atoms
      .filter((a) => a.element === 'N')
      .find((n) => {
        const nbrs = neighborsOf(n.index);
        return nbrs.length === 3 && nbrs.every((x) => x.element === 'C');
      });
    const neutral = amine ? amine.charge === 0 : false;
    return {
      id: 'tertiary-amine',
      label: 'Neutral tertiary amine (free base)',
      ok: !!amine && neutral,
      detail: amine
        ? `N bonded to 3 carbons, no N–H, formal charge ${amine.charge}.`
        : 'No trisubstituted amine nitrogen found.',
    };
  },

  'n-methyls': ({ mol, adj, neighborsOf }) => {
    const amine = mol.atoms
      .filter((a) => a.element === 'N')
      .find((n) => {
        const nbrs = neighborsOf(n.index);
        return nbrs.length === 3 && nbrs.every((x) => x.element === 'C');
      });
    let nMethyls = 0;
    if (amine) {
      for (const c of adj[amine.index]) {
        const hs = neighborsOf(c).filter((n) => n.element === 'H').length;
        const heavy = neighborsOf(c).filter((n) => n.element !== 'H').length;
        if (hs === 3 && heavy === 1) nMethyls++;
      }
    }
    return {
      id: 'n-methyls',
      label: 'Two terminal N-methyl groups',
      ok: nMethyls === 2,
      detail: `Found ${nMethyls} CH3 group(s) on the amine nitrogen.`,
    };
  },

  ethylamine: ({ mol, adj, five, six, neighborsOf, elementOf }) => {
    const amine = mol.atoms
      .filter((a) => a.element === 'N')
      .find((n) => neighborsOf(n.index).length === 3 && neighborsOf(n.index).every((x) => x.element === 'C'));
    let ok = false;
    if (amine && five) {
      for (const c1 of adj[amine.index]) {
        if (elementOf(c1) !== 'C') continue;
        if (neighborsOf(c1).filter((n) => n.element === 'H').length !== 2) continue; // CH2
        for (const c2 of adj[c1]) {
          if (c2 === amine.index || elementOf(c2) !== 'C') continue;
          if (neighborsOf(c2).filter((n) => n.element === 'H').length !== 2) continue; // CH2
          if (adj[c2].some((r) => five.includes(r) || six?.includes(r))) ok = true;
        }
      }
    }
    return {
      id: 'ethylamine',
      label: 'Two-carbon ethylamine side chain (3-position)',
      ok,
      detail: ok ? 'Indole C3 –CH2–CH2– N(CH3)2 chain confirmed.' : 'Ethylamine chain not confirmed.',
    };
  },

  'indole-nh': ({ mol, rings, neighborsOf }) => {
    const nh = mol.atoms
      .filter((a) => a.element === 'N')
      .find((n) => rings.some((r) => r.includes(n.index)) && neighborsOf(n.index).filter((x) => x.element === 'H').length === 1);
    return {
      id: 'indole-nh',
      label: 'Indole N–H',
      ok: !!nh,
      detail: nh ? 'Pyrrole-type ring nitrogen carries one hydrogen.' : 'No N–H on a ring nitrogen.',
    };
  },
};

export function validateMolecule(mol: ParsedMolecule, spec: ValidationSpec): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const counts = countElements(mol);
  const expected = spec.expectedCounts;

  // Every expected element must match exactly...
  for (const el of Object.keys(expected)) {
    if (el === 'total') continue;
    const got = counts[el] ?? 0;
    if (got !== expected[el]) errors.push(`Expected ${expected[el]} ${el} atoms, found ${got}.`);
  }
  // ...and no unexpected elements may be present.
  for (const el of Object.keys(counts)) {
    if (el === 'total') continue;
    if (!(el in expected)) errors.push(`Unexpected element ${el} present (${counts[el]}).`);
  }
  if (counts.total !== expected.total) {
    errors.push(`Expected ${expected.total} total atoms, found ${counts.total}.`);
  }

  const adj = buildAdjacency(mol);
  const rings = findRings(mol);
  const ctx: Ctx = {
    mol,
    adj,
    rings,
    five: rings.find((r) => r.length === 5),
    six: rings.find((r) => r.length === 6),
    neighborsOf: (i) => adj[i].map((j) => mol.atoms[j]),
    elementOf: (i) => mol.atoms[i].element,
  };

  const features = spec.requiredFeatures.map((id) => DETECTORS[id](ctx));
  for (const f of features) {
    if (!f.ok) warnings.push(`Structural feature not confirmed: ${f.label} — ${f.detail}`);
  }

  const valid = errors.length === 0 && features.every((f) => f.ok);
  return { valid, counts, errors, warnings, features };
}
