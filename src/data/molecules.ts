/**
 * Registry of the compounds this display can render. Each entry pairs an
 * authentic PubChem 3D conformer (imported verbatim via ?raw) with its
 * reference identity and a validation spec (expected element counts + the
 * structural features that must be present). Adding a molecule here is all it
 * takes to make it selectable — nothing downstream is hard-coded to a single
 * compound.
 */

import fiveMeoSDF from './5meo-dmt.sdf?raw';
import dmtSDF from './dmt.sdf?raw';

/** Structural features the validator knows how to detect. */
export type FeatureId =
  | 'indole'
  | 'methoxy'
  | 'tertiary-amine'
  | 'n-methyls'
  | 'ethylamine'
  | 'indole-nh';

export interface ExpectedCounts {
  C: number;
  H: number;
  N: number;
  O: number;
  total: number;
}

export interface MoleculeMeta {
  id: string;
  commonName: string;
  /** Lower-cased full chemical name. */
  fullName: string;
  /** Title-cased name for the plaque / subtitle. */
  subtitle: string;
  iupacName: string;
  formula: string;
  molecularWeight: number; // g/mol
  pubchemCID: number;
  inchiKey: string;
  canonicalSMILES: string;
  /** Conformer disclaimer, tailored to each molecule's flexible bonds. */
  conformerNote: string;
  /** Prose screen-reader description (atom counts are appended dynamically). */
  srDescription: string;
}

export interface MoleculeSpec {
  id: string;
  meta: MoleculeMeta;
  /** Raw SDF text (authentic PubChem 3D conformer). */
  sdf: string;
  expectedCounts: ExpectedCounts;
  requiredFeatures: FeatureId[];
}

const FIVE_MEO_DMT: MoleculeSpec = {
  id: '5meo-dmt',
  sdf: fiveMeoSDF,
  expectedCounts: { C: 13, H: 18, N: 2, O: 1, total: 34 },
  requiredFeatures: ['indole', 'methoxy', 'ethylamine', 'n-methyls', 'indole-nh', 'tertiary-amine'],
  meta: {
    id: '5meo-dmt',
    commonName: '5-MeO-DMT',
    fullName: '5-methoxy-N,N-dimethyltryptamine',
    subtitle: '5-Methoxy-N,N-dimethyltryptamine',
    iupacName: '2-(5-methoxy-1H-indol-3-yl)-N,N-dimethylethanamine',
    formula: 'C13H18N2O',
    molecularWeight: 218.3,
    pubchemCID: 1832,
    inchiKey: 'ZSTKHSQDNIGFLM-UHFFFAOYSA-N',
    canonicalSMILES: 'COc1ccc2c(c1)c(CCN(C)C)c[nH]2',
    conformerNote:
      'Displayed geometry is the PubChem CID 1832 3D conformer (a single, energetically reasonable conformation). Rotatable side-chain and methoxy bonds permit many conformations in reality.',
    srDescription:
      '5-MeO-DMT is a serotonergic tryptamine. Its structure is a planar bicyclic indole ring system (a benzene ring fused to a pyrrole ring bearing an N–H). A methoxy group (–OCH₃) is attached at the 5-position of the benzene ring. At the 3-position of the pyrrole ring a two-carbon ethyl chain connects to a tertiary amine nitrogen carrying two methyl groups.',
  },
};

const DMT: MoleculeSpec = {
  id: 'dmt',
  sdf: dmtSDF,
  expectedCounts: { C: 12, H: 16, N: 2, O: 0, total: 30 },
  requiredFeatures: ['indole', 'ethylamine', 'n-methyls', 'indole-nh', 'tertiary-amine'],
  meta: {
    id: 'dmt',
    commonName: 'DMT',
    fullName: 'N,N-dimethyltryptamine',
    subtitle: 'N,N-Dimethyltryptamine',
    iupacName: '2-(1H-indol-3-yl)-N,N-dimethylethanamine',
    formula: 'C12H16N2',
    molecularWeight: 188.27,
    pubchemCID: 6089,
    inchiKey: 'BYPFEZZEUUWMEJ-UHFFFAOYSA-N',
    canonicalSMILES: 'CN(C)CCc1c[nH]c2ccccc12',
    conformerNote:
      'Displayed geometry is the PubChem CID 6089 3D conformer (a single, energetically reasonable conformation). Rotatable side-chain bonds permit many conformations in reality.',
    srDescription:
      'DMT (N,N-dimethyltryptamine) is a serotonergic tryptamine. Its structure is a planar bicyclic indole ring system (a benzene ring fused to a pyrrole ring bearing an N–H). At the 3-position of the pyrrole ring a two-carbon ethyl chain connects to a tertiary amine nitrogen carrying two methyl groups. Unlike 5-MeO-DMT, the benzene ring carries no methoxy substituent.',
  },
};

export const MOLECULES: MoleculeSpec[] = [FIVE_MEO_DMT, DMT];
export const DEFAULT_MOLECULE_ID = '5meo-dmt';

export function getMoleculeSpec(id: string): MoleculeSpec {
  return MOLECULES.find((m) => m.id === id) ?? FIVE_MEO_DMT;
}
