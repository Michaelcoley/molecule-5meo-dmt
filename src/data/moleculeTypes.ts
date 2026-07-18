/** Shared molecule types (no runtime deps, so both the generated metadata and
 *  the validator can import them without a cycle). */

export type FeatureId =
  | 'indole'
  | 'methoxy'
  | 'methylenedioxy'
  | 'tertiary-amine'
  | 'n-methyls'
  | 'ethylamine'
  | 'indole-nh';

/** Expected atom tally: element symbol -> count, plus a `total` key. */
export type ExpectedCounts = Record<string, number>;

export type MoleculeCategory =
  | 'Tryptamines'
  | 'Lysergamides'
  | 'Phenethylamines'
  | 'Dissociatives'
  | 'Entactogens'
  | 'Other';

export interface MoleculeMeta {
  id: string;
  commonName: string;
  fullName: string;
  subtitle: string;
  iupacName: string;
  formula: string;
  molecularWeight: number; // g/mol
  pubchemCID: number;
  inchiKey: string;
  canonicalSMILES: string;
  conformerNote: string;
  srDescription: string;
  category: MoleculeCategory;
  /** Coordinate provenance: '3d' = PubChem 3D conformer, '2d' = flat 2D layout. */
  source: '3d' | '2d';
}

/** Generated metadata entry (may carry required structural features to assert). */
export interface MoleculeEntry extends MoleculeMeta {
  requiredFeatures?: FeatureId[];
}

export interface MoleculeSpec {
  id: string;
  meta: MoleculeMeta;
  sdf: string;
  expectedCounts: ExpectedCounts;
  requiredFeatures: FeatureId[];
}
