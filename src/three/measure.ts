/**
 * Pure vector maths for the measurement tools. Kept free of Three.js so it can
 * be unit-tested in isolation and reused by exporters. All distances are in
 * Ångström (the native unit of the SDF coordinates); all angles in degrees.
 */

export type Vec3 = readonly [number, number, number];

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const norm = (a: Vec3): number => Math.sqrt(dot(a, a));

/** Interatomic distance (Å). */
export function distance(a: Vec3, b: Vec3): number {
  return norm(sub(a, b));
}

/** Angle a–b–c about the central atom b, in degrees (0..180). */
export function angle(a: Vec3, b: Vec3, c: Vec3): number {
  const u = sub(a, b);
  const v = sub(c, b);
  const denom = norm(u) * norm(v);
  if (denom === 0) return 0;
  const cosine = Math.min(1, Math.max(-1, dot(u, v) / denom));
  return (Math.acos(cosine) * 180) / Math.PI;
}

/**
 * Dihedral (torsion) angle a–b–c–d in degrees (-180..180), using the standard
 * IUPAC convention via the atan2 formulation for numerical stability.
 */
export function dihedral(a: Vec3, b: Vec3, c: Vec3, d: Vec3): number {
  const b1 = sub(b, a);
  const b2 = sub(c, b);
  const b3 = sub(d, c);
  const n1 = cross(b1, b2);
  const n2 = cross(b2, b3);
  const m1 = cross(n1, [b2[0] / norm(b2), b2[1] / norm(b2), b2[2] / norm(b2)]);
  const x = dot(n1, n2);
  const y = dot(m1, n2);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

/** Component of (p - origin) perpendicular to `axis`, normalised. Used for
 *  placing the two cylinders of a double bond stably in a chemical plane. */
export function perpendicularInPlane(origin: Vec3, p: Vec3, axis: Vec3): Vec3 {
  const rel = sub(p, origin);
  const axNorm = norm(axis);
  if (axNorm === 0) return [0, 1, 0];
  const unit: Vec3 = [axis[0] / axNorm, axis[1] / axNorm, axis[2] / axNorm];
  const proj = dot(rel, unit);
  const perp: Vec3 = [rel[0] - proj * unit[0], rel[1] - proj * unit[1], rel[2] - proj * unit[2]];
  const pn = norm(perp);
  if (pn < 1e-6) {
    // Degenerate (collinear) — fall back to an arbitrary stable perpendicular.
    const seed: Vec3 = Math.abs(unit[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
    const c = cross(unit, seed);
    const cn = norm(c);
    return [c[0] / cn, c[1] / cn, c[2] / cn];
  }
  return [perp[0] / pn, perp[1] / pn, perp[2] / pn];
}
