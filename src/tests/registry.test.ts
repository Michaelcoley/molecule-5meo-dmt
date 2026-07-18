import { describe, it, expect } from 'vitest';
import { MOLECULES } from '../data/molecules';
import { buildMolecule } from '../data/molecule';
import { elementInfo } from '../data/elements';

describe('molecule registry', () => {
  it('registers the full compound library with unique ids', () => {
    expect(MOLECULES.length).toBeGreaterThanOrEqual(49);
    expect(MOLECULES[0].id).toBe('5meo-dmt');
    const ids = MOLECULES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length); // no duplicates
    for (const id of ['psilocin', 'lsd', 'mescaline', 'ketamine', 'salvinorin-a', '2c-b']) {
      expect(ids).toContain(id);
    }
  });

  for (const spec of MOLECULES) {
    describe(`${spec.meta.commonName} (${spec.id})`, () => {
      const mol = buildMolecule(spec.id);

      it('builds from an authentic conformer and passes its own validation', () => {
        expect(mol.validation.valid).toBe(true);
        expect(mol.validation.errors).toHaveLength(0);
      });

      it('matches the exact expected composition (including heteroatoms)', () => {
        for (const [el, n] of Object.entries(spec.expectedCounts)) {
          if (el === 'total') {
            expect(mol.atoms.length).toBe(n);
          } else {
            expect(mol.atoms.filter((a) => a.element === el)).toHaveLength(n);
          }
        }
      });

      it('reproduces the reference molecular weight', () => {
        const total = mol.composition.reduce((s, c) => s + c.weightContribution, 0);
        expect(Math.abs(total - mol.meta.molecularWeight)).toBeLessThan(0.5);
      });

      it('only uses elements with known reference data', () => {
        for (const a of mol.atoms) expect(() => elementInfo(a.element)).not.toThrow();
      });

      it('confirms every required structural feature', () => {
        expect(mol.validation.features.every((f) => f.ok)).toBe(true);
        expect(mol.validation.features.map((f) => f.id).sort()).toEqual([...spec.requiredFeatures].sort());
      });
    });
  }
});

describe('heteroatom molecules', () => {
  it('2C-B contains a bromine atom', () => {
    const mol = buildMolecule('2c-b');
    expect(mol.atoms.some((a) => a.element === 'Br')).toBe(true);
    expect(mol.composition.find((c) => c.symbol === 'Br')?.count).toBe(1);
  });

  it('psilocybin contains a phosphorus atom and four oxygens', () => {
    const mol = buildMolecule('psilocybin');
    expect(mol.atoms.filter((a) => a.element === 'P')).toHaveLength(1);
    expect(mol.atoms.filter((a) => a.element === 'O')).toHaveLength(4);
  });

  it('MDMA validates via its methylenedioxy ring', () => {
    const mol = buildMolecule('mdma');
    expect(mol.validation.features.find((f) => f.id === 'methylenedioxy')?.ok).toBe(true);
  });
});
