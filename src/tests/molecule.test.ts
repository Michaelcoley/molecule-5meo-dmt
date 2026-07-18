import { describe, it, expect } from 'vitest';
import { buildMolecule } from '../data/molecule';
import { fitDistance } from '../three/cameraMath';

describe('assembled molecule model', () => {
  const mol = buildMolecule('5meo-dmt');

  it('reproduces the molecular weight (~218.30 g/mol)', () => {
    const total = mol.composition.reduce((s, c) => s + c.weightContribution, 0);
    expect(total).toBeCloseTo(mol.meta.molecularWeight, 1);
  });

  it('computes chemically reasonable bond lengths', () => {
    for (const b of mol.bonds) {
      const ea = mol.atoms[b.a].element;
      const eb = mol.atoms[b.b].element;
      if (ea === 'H' || eb === 'H') {
        expect(b.length).toBeGreaterThan(0.9);
        expect(b.length).toBeLessThan(1.2);
      } else {
        expect(b.length).toBeGreaterThan(1.2);
        expect(b.length).toBeLessThan(1.6);
      }
    }
  });

  it('centres the molecule near the origin after recentring', () => {
    const cx = mol.atoms.reduce((s, a) => s + (a.x - mol.center[0]), 0) / mol.atoms.length;
    expect(Math.abs(cx)).toBeLessThan(1e-9);
  });

  it('has a positive bounding radius used for camera fitting', () => {
    expect(mol.boundingRadius).toBeGreaterThan(2);
    const dist = fitDistance(mol.boundingRadius + 1.7, 38, 0.72);
    expect(dist).toBeGreaterThan(mol.boundingRadius); // camera sits outside the molecule
  });
});
