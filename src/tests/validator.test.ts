import { describe, it, expect } from 'vitest';
import { parseSDF } from '../data/sdfParser';
import { validateMolecule } from '../data/validator';
import { getMoleculeSpec } from '../data/molecules';

const fiveMeo = getMoleculeSpec('5meo-dmt');
const dmt = getMoleculeSpec('dmt');
const specOf = (s: typeof fiveMeo) => ({ expectedCounts: s.expectedCounts, requiredFeatures: s.requiredFeatures });

describe('molecular validator (spec-driven)', () => {
  const mol = parseSDF(fiveMeo.sdf);
  const report = validateMolecule(mol, specOf(fiveMeo));

  it('passes overall validation for the authentic 5-MeO-DMT structure', () => {
    expect(report.valid).toBe(true);
    expect(report.errors).toHaveLength(0);
  });

  it('confirms the exact expected composition', () => {
    const e = fiveMeo.expectedCounts;
    expect(report.counts.C).toBe(e.C);
    expect(report.counts.H).toBe(e.H);
    expect(report.counts.N).toBe(e.N);
    expect(report.counts.O).toBe(e.O);
    expect(report.counts.total).toBe(e.total);
  });

  it('identifies every defining structural feature', () => {
    const ids = report.features.filter((f) => f.ok).map((f) => f.id).sort();
    expect(ids).toEqual(
      ['ethylamine', 'indole', 'indole-nh', 'methoxy', 'n-methyls', 'tertiary-amine'].sort(),
    );
  });

  it('flags a tampered structure (missing an atom) as invalid', () => {
    const broken = { ...mol, atoms: mol.atoms.slice(0, 33) };
    const r = validateMolecule(broken, specOf(fiveMeo));
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });
});

describe('spec enforcement across molecules', () => {
  const fiveMeoMol = parseSDF(fiveMeo.sdf);
  const dmtMol = parseSDF(dmt.sdf);

  it('validates DMT against its own spec (no methoxy required)', () => {
    const r = validateMolecule(dmtMol, specOf(dmt));
    expect(r.valid).toBe(true);
    expect(r.counts.O ?? 0).toBe(0);
    expect(r.features.map((f) => f.id)).not.toContain('methoxy');
  });

  it('rejects DMT when checked against the 5-MeO-DMT spec (wrong counts + methoxy)', () => {
    const r = validateMolecule(dmtMol, specOf(fiveMeo));
    expect(r.valid).toBe(false);
    // DMT has no oxygen, so the methoxy feature cannot be satisfied.
    expect(r.features.find((f) => f.id === 'methoxy')?.ok).toBe(false);
  });

  it('rejects 5-MeO-DMT when checked against the DMT spec (wrong counts)', () => {
    const r = validateMolecule(fiveMeoMol, specOf(dmt));
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });
});
