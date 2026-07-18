import { describe, it, expect } from 'vitest';
import rawSDF from '../data/5meo-dmt.sdf?raw';
import { parseSDF } from '../data/sdfParser';
import { validateMolecule, EXPECTED_COUNTS } from '../data/validator';

describe('molecular validator', () => {
  const mol = parseSDF(rawSDF);
  const report = validateMolecule(mol);

  it('passes overall validation for the authentic structure', () => {
    expect(report.valid).toBe(true);
    expect(report.errors).toHaveLength(0);
  });

  it('confirms the exact expected composition', () => {
    expect(report.counts.C).toBe(EXPECTED_COUNTS.C);
    expect(report.counts.H).toBe(EXPECTED_COUNTS.H);
    expect(report.counts.N).toBe(EXPECTED_COUNTS.N);
    expect(report.counts.O).toBe(EXPECTED_COUNTS.O);
    expect(report.counts.total).toBe(EXPECTED_COUNTS.total);
  });

  it('identifies every defining structural feature', () => {
    const ids = report.features.filter((f) => f.ok).map((f) => f.id).sort();
    expect(ids).toEqual(
      ['ethylamine', 'indole', 'indole-nh', 'methoxy', 'n-methyls', 'tertiary-amine'].sort(),
    );
  });

  it('flags a tampered structure (missing an atom) as invalid', () => {
    const broken = { ...mol, atoms: mol.atoms.slice(0, 33) };
    const r = validateMolecule(broken);
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });
});
