/**
 * Registry of every selectable compound. Structure files live in `./sdf/` and
 * are glob-loaded verbatim at build time; display metadata is generated from
 * PubChem (`moleculeMeta.generated.ts`). Validation `expectedCounts` are derived
 * from each compound's authoritative PubChem molecular formula, so a mismatch
 * between the embedded 3D structure and the declared formula is caught.
 *
 * A small CURATED map adds richer descriptions and asserted structural features
 * for the flagship molecules; everything else is validated on composition.
 */

import { GENERATED_MOLECULES } from './moleculeMeta.generated';
import type { ExpectedCounts, FeatureId, MoleculeMeta, MoleculeSpec } from './moleculeTypes';

export type { FeatureId, ExpectedCounts, MoleculeMeta, MoleculeSpec, MoleculeCategory } from './moleculeTypes';

// Eagerly load all SDF structure files as raw text, keyed by molecule id.
const SDF_MODULES = import.meta.glob('./sdf/*.sdf', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function sdfFor(id: string): string {
  const sdf = SDF_MODULES[`./sdf/${id}.sdf`];
  if (!sdf) throw new Error(`Missing SDF for molecule "${id}" (expected ./sdf/${id}.sdf).`);
  return sdf;
}

/** Parse a molecular formula string (e.g. "C10H14BrNO2") into element counts + total. */
export function parseFormula(formula: string): ExpectedCounts {
  const counts: ExpectedCounts = {};
  let total = 0;
  for (const [, el, num] of formula.matchAll(/([A-Z][a-z]?)(\d*)/g)) {
    if (!el) continue;
    const n = num ? parseInt(num, 10) : 1;
    counts[el] = (counts[el] ?? 0) + n;
    total += n;
  }
  counts.total = total;
  return counts;
}

interface Curation {
  metaOverride?: Partial<MoleculeMeta>;
  requiredFeatures?: FeatureId[];
}

const CURATED: Record<string, Curation> = {
  '5meo-dmt': {
    metaOverride: {
      subtitle: '5-Methoxy-N,N-dimethyltryptamine',
      srDescription:
        '5-MeO-DMT is a serotonergic tryptamine: a planar bicyclic indole ring system (a benzene ring fused to a pyrrole bearing an N–H), a methoxy group at the 5-position, and a two-carbon ethylamine side chain at the 3-position ending in a tertiary amine with two methyl groups.',
    },
    requiredFeatures: ['indole', 'methoxy', 'ethylamine', 'n-methyls', 'indole-nh', 'tertiary-amine'],
  },
  dmt: {
    metaOverride: {
      subtitle: 'N,N-Dimethyltryptamine',
      srDescription:
        'DMT is a serotonergic tryptamine: a planar indole ring system (benzene fused to a pyrrole bearing an N–H) with a two-carbon ethylamine side chain at the 3-position ending in a tertiary amine carrying two methyl groups.',
    },
    requiredFeatures: ['indole', 'ethylamine', 'n-methyls', 'indole-nh', 'tertiary-amine'],
  },
  psilocybin: {
    metaOverride: {
      subtitle: '4-Phosphoryloxy-N,N-dimethyltryptamine',
      srDescription:
        'Psilocybin is the phosphorylated prodrug of psilocin: a tryptamine (indole with a two-carbon ethylamine side chain to a dimethylamino group) carrying a phosphate ester at the 4-position of the indole.',
    },
    requiredFeatures: ['indole', 'ethylamine', 'n-methyls', 'indole-nh', 'tertiary-amine'],
  },
  lsd: {
    metaOverride: {
      subtitle: 'Lysergic Acid Diethylamide',
      srDescription:
        'LSD is a semi-synthetic ergoline: a rigid tetracyclic core — an indole ring system (with an N–H) fused to two further rings bearing an N-methyl nitrogen — with a diethylamide group attached.',
    },
    requiredFeatures: ['indole-nh'],
  },
  mdma: {
    metaOverride: {
      subtitle: '3,4-Methylenedioxymethamphetamine',
      srDescription:
        'MDMA is a substituted amphetamine: a benzene ring closed by a methylenedioxy (O–CH2–O) ring, connected to a branched propan-2-amine side chain bearing an N-methyl group.',
    },
    requiredFeatures: ['methylenedioxy'],
  },
  '2c-b': {
    metaOverride: {
      subtitle: '4-Bromo-2,5-dimethoxyphenethylamine',
      srDescription:
        '2C-B is a substituted phenethylamine: a benzene ring with two methoxy groups (2- and 5-positions) and a bromine atom (4-position), connected to a two-carbon chain ending in a primary amine.',
    },
    requiredFeatures: ['methoxy'],
  },
};

export const MOLECULES: MoleculeSpec[] = GENERATED_MOLECULES.map((entry) => {
  const cur = CURATED[entry.id];
  const meta: MoleculeMeta = { ...entry, ...(cur?.metaOverride ?? {}) };
  return {
    id: entry.id,
    meta,
    sdf: sdfFor(entry.id),
    expectedCounts: parseFormula(meta.formula),
    requiredFeatures: cur?.requiredFeatures ?? entry.requiredFeatures ?? [],
  };
});

export const DEFAULT_MOLECULE_ID = '5meo-dmt';

export function getMoleculeSpec(id: string): MoleculeSpec {
  return MOLECULES.find((m) => m.id === id) ?? MOLECULES[0];
}
