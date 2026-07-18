import { describe, it, expect } from 'vitest';
import { distance, angle, dihedral, perpendicularInPlane, type Vec3 } from '../three/measure';

describe('measurement maths', () => {
  it('computes Euclidean distance', () => {
    expect(distance([0, 0, 0], [3, 4, 0])).toBeCloseTo(5, 6);
  });

  it('computes a right angle', () => {
    expect(angle([1, 0, 0], [0, 0, 0], [0, 1, 0])).toBeCloseTo(90, 6);
  });

  it('computes a straight (180°) angle', () => {
    expect(angle([-1, 0, 0], [0, 0, 0], [1, 0, 0])).toBeCloseTo(180, 6);
  });

  it('computes a +90° dihedral', () => {
    const a: Vec3 = [1, 0, 0];
    const b: Vec3 = [0, 0, 0];
    const c: Vec3 = [0, 0, 1];
    const d: Vec3 = [0, 1, 1];
    expect(Math.abs(dihedral(a, b, c, d))).toBeCloseTo(90, 4);
  });

  it('computes a 180° (trans) dihedral', () => {
    const a: Vec3 = [0, 1, 0];
    const b: Vec3 = [0, 0, 0];
    const c: Vec3 = [1, 0, 0];
    const d: Vec3 = [1, -1, 0];
    expect(Math.abs(dihedral(a, b, c, d))).toBeCloseTo(180, 4);
  });

  it('perpendicularInPlane returns a unit vector orthogonal to the axis', () => {
    const perp = perpendicularInPlane([0, 0, 0], [1, 1, 0], [1, 0, 0]);
    const len = Math.hypot(perp[0], perp[1], perp[2]);
    const dotAxis = perp[0] * 1 + perp[1] * 0 + perp[2] * 0;
    expect(len).toBeCloseTo(1, 6);
    expect(dotAxis).toBeCloseTo(0, 6);
  });
});
