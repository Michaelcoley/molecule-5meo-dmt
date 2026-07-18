import { describe, it, expect } from 'vitest';
import { buildMolecule } from '../data/molecule';
import { parseSDF } from '../data/sdfParser';
import { computeAtomProperties } from '../data/hybridization';
import { getMoleculeSpec } from '../data/molecules';

const spec = getMoleculeSpec('dmt');

describe('DMT (N,N-dimethyltryptamine) structure', () => {
  const raw = parseSDF(spec.sdf);

  it('parses the authentic PubChem CID 6089 conformer', () => {
    expect(raw.atoms).toHaveLength(30);
    expect(raw.bonds).toHaveLength(31);
    const counts = raw.atoms.reduce<Record<string, number>>((a, x) => {
      a[x.element] = (a[x.element] ?? 0) + 1;
      return a;
    }, {});
    expect(counts).toEqual({ C: 12, H: 16, N: 2 });
    expect(counts.O).toBeUndefined();
  });

  it('is a neutral free base with four Kekulé double bonds', () => {
    expect(raw.atoms.every((a) => a.charge === 0)).toBe(true);
    expect(raw.bonds.filter((b) => b.order === 2)).toHaveLength(4);
  });
});

describe('DMT assembled model', () => {
  const mol = buildMolecule('dmt');

  it('carries DMT metadata (CID 6089, ~188.27 g/mol)', () => {
    expect(mol.meta.commonName).toBe('DMT');
    expect(mol.meta.pubchemCID).toBe(6089);
    const total = mol.composition.reduce((s, c) => s + c.weightContribution, 0);
    expect(total).toBeCloseTo(mol.meta.molecularWeight, 1);
    expect(mol.meta.molecularWeight).toBeCloseTo(188.27, 1);
  });

  it('validates successfully with no oxygen and no methoxy feature', () => {
    expect(mol.validation.valid).toBe(true);
    expect(mol.validation.counts.O ?? 0).toBe(0);
    expect(mol.validation.features.map((f) => f.id)).not.toContain('methoxy');
  });
});

describe('DMT hybridization', () => {
  const raw = parseSDF(spec.sdf);
  const props = computeAtomProperties(raw);

  it('has 8 aromatic sp2 carbons and 4 sp3 carbons', () => {
    const aromaticC = raw.atoms.filter((a, i) => a.element === 'C' && props[i].aromatic);
    const sp3C = raw.atoms.filter((a, i) => a.element === 'C' && props[i].hybridization === 'sp3');
    expect(aromaticC).toHaveLength(8);
    expect(sp3C).toHaveLength(4); // 2 CH2 chain carbons + 2 N-methyls
  });

  it('classifies the two nitrogens as planar (indole) and pyramidal (amine), with no oxygen', () => {
    const geoms = raw.atoms.filter((a) => a.element === 'N').map((a) => props[a.index].geometry).sort();
    expect(geoms).toEqual(['trigonal planar', 'trigonal pyramidal']);
    expect(raw.atoms.some((a) => a.element === 'O')).toBe(false);
  });
});
