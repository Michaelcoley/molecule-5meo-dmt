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
import psilocybinSDF from './psilocybin.sdf?raw';
import lsdSDF from './lsd.sdf?raw';
import mdmaSDF from './mdma.sdf?raw';
import twoCBSDF from './2c-b.sdf?raw';

/** Structural features the validator knows how to detect. */
export type FeatureId =
  | 'indole'
  | 'methoxy'
  | 'methylenedioxy'
  | 'tertiary-amine'
  | 'n-methyls'
  | 'ethylamine'
  | 'indole-nh';

/** Expected atom tally: element symbol -> count, plus a `total` key.
 *  A plain record so any element set (incl. Br, P, …) can be specified. */
export type ExpectedCounts = Record<string, number>;

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

const PSILOCYBIN: MoleculeSpec = {
  id: 'psilocybin',
  sdf: psilocybinSDF,
  expectedCounts: { C: 12, H: 17, N: 2, O: 4, P: 1, total: 36 },
  requiredFeatures: ['indole', 'ethylamine', 'n-methyls', 'indole-nh', 'tertiary-amine'],
  meta: {
    id: 'psilocybin',
    commonName: 'Psilocybin',
    fullName: 'psilocybin',
    subtitle: '4-Phosphoryloxy-N,N-dimethyltryptamine',
    iupacName: '[3-[2-(dimethylamino)ethyl]-1H-indol-4-yl] dihydrogen phosphate',
    formula: 'C12H17N2O4P',
    molecularWeight: 284.25,
    pubchemCID: 10624,
    inchiKey: 'QVDSEJDULKLHCG-UHFFFAOYSA-N',
    canonicalSMILES: 'CN(C)CCC1=CNC2=C1C(=CC=C2)OP(=O)(O)O',
    conformerNote:
      'Displayed geometry is the PubChem CID 10624 3D conformer (a single, energetically reasonable conformation). Rotatable side-chain and phosphate bonds permit many conformations in reality.',
    srDescription:
      'Psilocybin is the phosphorylated prodrug of psilocin: a tryptamine — a planar indole ring system (benzene fused to a pyrrole bearing an N–H) with a two-carbon ethylamine side chain to a dimethylamino group — carrying a phosphate ester at the 4-position of the indole.',
  },
};

const LSD: MoleculeSpec = {
  id: 'lsd',
  sdf: lsdSDF,
  expectedCounts: { C: 20, H: 25, N: 3, O: 1, total: 49 },
  requiredFeatures: ['indole-nh'],
  meta: {
    id: 'lsd',
    commonName: 'LSD',
    fullName: 'lysergic acid diethylamide',
    subtitle: 'Lysergic Acid Diethylamide',
    iupacName:
      '(6aR,9R)-N,N-diethyl-7-methyl-6,6a,8,9-tetrahydro-4H-indolo[4,3-fg]quinoline-9-carboxamide',
    formula: 'C20H25N3O',
    molecularWeight: 323.4,
    pubchemCID: 5761,
    inchiKey: 'VAYOSLLFUXYJDT-RDTXWAMCSA-N',
    canonicalSMILES: 'CCN(CC)C(=O)[C@H]1CN([C@@H]2CC3=CNC4=CC=CC(=C34)C2=C1)C',
    conformerNote:
      'Displayed geometry is the PubChem CID 5761 3D conformer (a single, energetically reasonable conformation). The rigid ergoline core is largely fixed; the diethylamide group is rotatable.',
    srDescription:
      'LSD (lysergic acid diethylamide) is a semi-synthetic ergoline. It has a rigid tetracyclic ergoline core — an indole ring system (with an N–H) fused to two further rings bearing an N-methyl nitrogen — and a diethylamide group attached to the ring system.',
  },
};

const MDMA: MoleculeSpec = {
  id: 'mdma',
  sdf: mdmaSDF,
  expectedCounts: { C: 11, H: 15, N: 1, O: 2, total: 29 },
  requiredFeatures: ['methylenedioxy'],
  meta: {
    id: 'mdma',
    commonName: 'MDMA',
    fullName: '3,4-methylenedioxymethamphetamine',
    subtitle: '3,4-Methylenedioxymethamphetamine',
    iupacName: '1-(1,3-benzodioxol-5-yl)-N-methylpropan-2-amine',
    formula: 'C11H15NO2',
    molecularWeight: 193.24,
    pubchemCID: 1615,
    inchiKey: 'SHXWCVYOXRDMCX-UHFFFAOYSA-N',
    canonicalSMILES: 'CC(CC1=CC2=C(C=C1)OCO2)NC',
    conformerNote:
      'Displayed geometry is the PubChem CID 1615 3D conformer (a single, energetically reasonable conformation). Rotatable side-chain bonds permit many conformations in reality.',
    srDescription:
      'MDMA (3,4-methylenedioxymethamphetamine) is a substituted amphetamine: a benzene ring closed by a methylenedioxy (O–CH2–O) ring, connected to a branched propan-2-amine side chain bearing an N-methyl group (a secondary amine).',
  },
};

const TWO_CB: MoleculeSpec = {
  id: '2c-b',
  sdf: twoCBSDF,
  expectedCounts: { C: 10, H: 14, Br: 1, N: 1, O: 2, total: 28 },
  requiredFeatures: ['methoxy'],
  meta: {
    id: '2c-b',
    commonName: '2C-B',
    fullName: '4-bromo-2,5-dimethoxyphenethylamine',
    subtitle: '4-Bromo-2,5-dimethoxyphenethylamine',
    iupacName: '2-(4-bromo-2,5-dimethoxyphenyl)ethanamine',
    formula: 'C10H14BrNO2',
    molecularWeight: 260.13,
    pubchemCID: 98527,
    inchiKey: 'YMHOBZXQZVXHBM-UHFFFAOYSA-N',
    canonicalSMILES: 'COC1=CC(=C(C=C1CCN)OC)Br',
    conformerNote:
      'Displayed geometry is the PubChem CID 98527 3D conformer (a single, energetically reasonable conformation). Rotatable side-chain and methoxy bonds permit many conformations in reality.',
    srDescription:
      '2C-B is a substituted phenethylamine: a benzene ring with two methoxy groups (2- and 5-positions) and a bromine atom (4-position), connected to a two-carbon chain ending in a primary amine.',
  },
};

export const MOLECULES: MoleculeSpec[] = [FIVE_MEO_DMT, DMT, PSILOCYBIN, LSD, MDMA, TWO_CB];
export const DEFAULT_MOLECULE_ID = '5meo-dmt';

export function getMoleculeSpec(id: string): MoleculeSpec {
  return MOLECULES.find((m) => m.id === id) ?? FIVE_MEO_DMT;
}
