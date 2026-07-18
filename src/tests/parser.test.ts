import { describe, it, expect } from 'vitest';
import rawSDF from '../data/5meo-dmt.sdf?raw';
import { parseSDF } from '../data/sdfParser';

describe('SDF parser', () => {
  const mol = parseSDF(rawSDF);

  it('reads the correct atom and bond counts', () => {
    expect(mol.atoms).toHaveLength(34);
    expect(mol.bonds).toHaveLength(35);
  });

  it('preserves element identities', () => {
    const counts = mol.atoms.reduce<Record<string, number>>((acc, a) => {
      acc[a.element] = (acc[a.element] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({ C: 13, H: 18, N: 2, O: 1 });
  });

  it('preserves 3D coordinates verbatim (first atom is the ether oxygen)', () => {
    const o = mol.atoms[0];
    expect(o.element).toBe('O');
    expect(o.x).toBeCloseTo(2.8263, 3);
    expect(o.y).toBeCloseTo(2.4254, 3);
    expect(o.z).toBeCloseTo(-0.0927, 3);
  });

  it('uses zero-based bond indices into the atom array', () => {
    for (const b of mol.bonds) {
      expect(b.a).toBeGreaterThanOrEqual(0);
      expect(b.b).toBeLessThan(34);
    }
  });

  it('records exactly four formal double bonds (Kekulé indole)', () => {
    const doubles = mol.bonds.filter((b) => b.order === 2);
    expect(doubles).toHaveLength(4);
  });

  it('reports the neutral free base (all formal charges zero)', () => {
    expect(mol.atoms.every((a) => a.charge === 0)).toBe(true);
  });
});
