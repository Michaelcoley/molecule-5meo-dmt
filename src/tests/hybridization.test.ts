import { describe, it, expect } from 'vitest';
import rawSDF from '../data/sdf/5meo-dmt.sdf?raw';
import { parseSDF } from '../data/sdfParser';
import { computeAtomProperties, findRings } from '../data/hybridization';

describe('ring detection & hybridization', () => {
  const mol = parseSDF(rawSDF);
  const rings = findRings(mol);
  const props = computeAtomProperties(mol);

  it('finds a fused 5- and 6-membered ring (indole)', () => {
    const sizes = rings.map((r) => r.length).sort();
    expect(sizes).toContain(5);
    expect(sizes).toContain(6);
    const five = rings.find((r) => r.length === 5)!;
    const six = rings.find((r) => r.length === 6)!;
    const shared = five.filter((a) => six.includes(a));
    expect(shared).toHaveLength(2); // fused along one bond
  });

  it('marks eight aromatic sp2 carbons in the indole framework', () => {
    const aromaticC = mol.atoms.filter((a, i) => a.element === 'C' && props[i].aromatic);
    expect(aromaticC).toHaveLength(8);
    expect(aromaticC.every((a) => props[a.index].hybridization === 'sp2')).toBe(true);
  });

  it('marks five sp3 tetrahedral carbons', () => {
    const sp3C = mol.atoms.filter((a, i) => a.element === 'C' && props[i].hybridization === 'sp3');
    expect(sp3C).toHaveLength(5);
    expect(sp3C.every((a) => props[a.index].geometry === 'tetrahedral')).toBe(true);
  });

  it('classifies the two nitrogens as planar (indole) and pyramidal (amine)', () => {
    const nitrogens = mol.atoms.filter((a) => a.element === 'N');
    const geoms = nitrogens.map((a) => props[a.index].geometry).sort();
    expect(geoms).toEqual(['trigonal planar', 'trigonal pyramidal']);
  });

  it('classifies the ether oxygen as bent sp3', () => {
    const o = mol.atoms.find((a) => a.element === 'O')!;
    expect(props[o.index].geometry).toBe('bent');
    expect(props[o.index].hybridization).toBe('sp3');
  });
});
