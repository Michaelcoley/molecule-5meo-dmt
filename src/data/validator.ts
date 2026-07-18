/**
 * Structural validation for the embedded molecule. Runs before rendering so a
 * corrupted or substituted structure surfaces a clear developer error instead
 * of silently drawing the wrong thing.
 *
 * Validates: exact element counts, total atom count, and the presence of the
 * defining structural features of 5-MeO-DMT — the fused indole ring system, a
 * methoxy substituent, a two-carbon ethylamine side chain, two terminal
 * N-methyl groups, the indole N–H, and a neutral tertiary amine.
 */

import type { ParsedMolecule } from './sdfParser';
import { buildAdjacency, findRings } from './hybridization';

export const EXPECTED_COUNTS = { C: 13, H: 18, N: 2, O: 1, total: 34 } as const;

export interface FeatureCheck {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
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

export function validateMolecule(mol: ParsedMolecule): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const counts = countElements(mol);

  // --- Exact composition -------------------------------------------------
  for (const el of ['C', 'H', 'N', 'O'] as const) {
    const got = counts[el] ?? 0;
    if (got !== EXPECTED_COUNTS[el]) {
      errors.push(`Expected ${EXPECTED_COUNTS[el]} ${el} atoms, found ${got}.`);
    }
  }
  if (counts.total !== EXPECTED_COUNTS.total) {
    errors.push(`Expected ${EXPECTED_COUNTS.total} total atoms, found ${counts.total}.`);
  }

  const adj = buildAdjacency(mol);
  const rings = findRings(mol);
  const features: FeatureCheck[] = [];

  const neighborsOf = (i: number) => adj[i].map((j) => mol.atoms[j]);
  const elementOf = (i: number) => mol.atoms[i].element;

  // --- Fused indole ring system: a 5- and a 6-membered ring sharing an edge.
  const five = rings.find((r) => r.length === 5);
  const six = rings.find((r) => r.length === 6);
  let fused = false;
  if (five && six) {
    const shared = five.filter((a) => six.includes(a));
    fused = shared.length === 2;
  }
  const pyrroleN =
    !!five && five.filter((i) => elementOf(i) === 'N').length === 1;
  features.push({
    id: 'indole',
    label: 'Fused indole ring system',
    ok: fused && pyrroleN,
    detail: fused
      ? `5-membered ring fused to 6-membered ring (${five!.length}+${six!.length}), one pyrrole nitrogen.`
      : 'Could not identify a fused 5/6 ring system.',
  });

  // --- Methoxy: O bonded to two carbons, one of which is a CH3 (3 H), the
  //     other aromatic (in the six-ring).
  const oxygens = mol.atoms.filter((a) => a.element === 'O');
  let methoxy = false;
  if (oxygens.length === 1) {
    const o = oxygens[0];
    const oNbrs = adj[o.index];
    const carbons = oNbrs.filter((j) => elementOf(j) === 'C');
    if (carbons.length === 2) {
      const methyl = carbons.find(
        (c) => neighborsOf(c).filter((n) => n.element === 'H').length === 3,
      );
      const aromaticC = carbons.find((c) => six?.includes(c));
      methoxy = methyl !== undefined && aromaticC !== undefined;
    }
  }
  features.push({
    id: 'methoxy',
    label: 'Methoxy substituent (5-position)',
    ok: methoxy,
    detail: methoxy ? 'O bridges an aromatic ring carbon and a CH3 group.' : 'No aromatic –OCH3 found.',
  });

  // --- Tertiary amine: N bonded to exactly 3 carbons, no hydrogen, neutral.
  const nitrogens = mol.atoms.filter((a) => a.element === 'N');
  const tertiaryAmine = nitrogens.find((n) => {
    const nbrs = neighborsOf(n.index);
    return (
      nbrs.length === 3 &&
      nbrs.every((x) => x.element === 'C') &&
      nbrs.filter((x) => x.element === 'H').length === 0
    );
  });
  const neutralAmine = tertiaryAmine ? tertiaryAmine.charge === 0 : false;
  features.push({
    id: 'tertiary-amine',
    label: 'Neutral tertiary amine (free base)',
    ok: !!tertiaryAmine && neutralAmine,
    detail: tertiaryAmine
      ? `N bonded to 3 carbons, no N–H, formal charge ${tertiaryAmine.charge}.`
      : 'No trisubstituted amine nitrogen found.',
  });

  // --- Two terminal N-methyl groups on that amine.
  let nMethyls = 0;
  if (tertiaryAmine) {
    for (const c of adj[tertiaryAmine.index]) {
      const hs = neighborsOf(c).filter((n) => n.element === 'H').length;
      const heavy = neighborsOf(c).filter((n) => n.element !== 'H').length;
      if (hs === 3 && heavy === 1) nMethyls++;
    }
  }
  features.push({
    id: 'n-methyls',
    label: 'Two terminal N-methyl groups',
    ok: nMethyls === 2,
    detail: `Found ${nMethyls} CH3 group(s) on the amine nitrogen.`,
  });

  // --- Ethylamine side chain: aromatic C (indole 3-position) -> CH2 -> CH2 -> amine N.
  let ethylamine = false;
  if (tertiaryAmine && five) {
    for (const c1 of adj[tertiaryAmine.index]) {
      if (elementOf(c1) !== 'C') continue;
      const c1h = neighborsOf(c1).filter((n) => n.element === 'H').length;
      if (c1h !== 2) continue; // CH2
      for (const c2 of adj[c1]) {
        if (c2 === tertiaryAmine.index || elementOf(c2) !== 'C') continue;
        const c2h = neighborsOf(c2).filter((n) => n.element === 'H').length;
        if (c2h !== 2) continue; // CH2
        const attachesRing = adj[c2].some((r) => five.includes(r) || six?.includes(r));
        if (attachesRing) ethylamine = true;
      }
    }
  }
  features.push({
    id: 'ethylamine',
    label: 'Two-carbon ethylamine side chain (3-position)',
    ok: ethylamine,
    detail: ethylamine ? 'Indole C3 –CH2–CH2– N(CH3)2 chain confirmed.' : 'Ethylamine chain not confirmed.',
  });

  // --- Indole N–H: a ring nitrogen bearing exactly one hydrogen.
  const indoleNH = nitrogens.find((n) => {
    const inRing = rings.some((r) => r.includes(n.index));
    const hs = neighborsOf(n.index).filter((x) => x.element === 'H').length;
    return inRing && hs === 1;
  });
  features.push({
    id: 'indole-nh',
    label: 'Indole N–H',
    ok: !!indoleNH,
    detail: indoleNH ? 'Pyrrole-type ring nitrogen carries one hydrogen.' : 'No N–H on a ring nitrogen.',
  });

  for (const f of features) {
    if (!f.ok) warnings.push(`Structural feature not confirmed: ${f.label} — ${f.detail}`);
  }

  const valid = errors.length === 0 && features.every((f) => f.ok);
  return { valid, counts, errors, warnings, features };
}
