/**
 * Derives chemical descriptors (rings, aromaticity, hybridization, local
 * geometry) directly from the parsed connectivity + bond orders. Nothing here
 * is hard-coded to 5-MeO-DMT; the same routines drive both the rendering
 * annotations and the structural validation, so the two can never disagree.
 */

import type { ParsedMolecule } from './sdfParser';

export type Hybridization = 'sp' | 'sp2' | 'sp3' | 'n/a';

export type Geometry =
  | 'trigonal planar'
  | 'tetrahedral'
  | 'trigonal pyramidal'
  | 'bent'
  | 'linear'
  | 'terminal';

export interface AtomProperties {
  hybridization: Hybridization;
  geometry: Geometry;
  aromatic: boolean;
  inRing: boolean;
  neighborCount: number;
}

export function buildAdjacency(mol: ParsedMolecule): number[][] {
  const adj: number[][] = mol.atoms.map(() => []);
  for (const b of mol.bonds) {
    // Defensive: ignore bonds that reference atoms outside the array (e.g. a
    // corrupted / partially-truncated structure) rather than crashing.
    if (!adj[b.a] || !adj[b.b]) continue;
    adj[b.a].push(b.b);
    adj[b.b].push(b.a);
  }
  return adj;
}

/** Shortest path (atom indices) between two atoms, optionally forbidding one edge. */
function shortestPath(
  adj: number[][],
  start: number,
  goal: number,
  forbid: [number, number] | null,
): number[] | null {
  const queue: number[] = [start];
  const prev = new Map<number, number>();
  const seen = new Set<number>([start]);
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === goal) {
      const path: number[] = [];
      let n: number | undefined = goal;
      while (n !== undefined) {
        path.push(n);
        n = prev.get(n);
      }
      return path.reverse();
    }
    for (const nb of adj[cur]) {
      if (forbid && ((cur === forbid[0] && nb === forbid[1]) || (cur === forbid[1] && nb === forbid[0]))) {
        continue;
      }
      if (!seen.has(nb)) {
        seen.add(nb);
        prev.set(nb, cur);
        queue.push(nb);
      }
    }
  }
  return null;
}

/**
 * Finds the smallest set of small rings (size <= maxSize) by, for each bond,
 * seeking the shortest alternative path between its endpoints. Adequate and
 * exact for fused 5/6-membered systems such as indole.
 */
export function findRings(mol: ParsedMolecule, maxSize = 6): number[][] {
  const adj = buildAdjacency(mol);
  const rings: number[][] = [];
  const seenKeys = new Set<string>();

  for (const bond of mol.bonds) {
    const alt = shortestPath(adj, bond.a, bond.b, [bond.a, bond.b]);
    if (!alt) continue;
    const ring = alt; // path from a..b already forms the ring with the removed bond
    if (ring.length < 3 || ring.length > maxSize) continue;
    const key = [...ring].sort((x, y) => x - y).join('-');
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    rings.push(ring);
  }
  return rings;
}

/** Atom indices that participate in any detected ring. */
function ringAtomSet(rings: number[][]): Set<number> {
  const s = new Set<number>();
  for (const r of rings) for (const a of r) s.add(a);
  return s;
}

export function computeAtomProperties(mol: ParsedMolecule): AtomProperties[] {
  const adj = buildAdjacency(mol);
  const rings = findRings(mol);
  const ringAtoms = ringAtomSet(rings);

  // A ring is treated as aromatic if it is 5- or 6-membered, made only of
  // C/N, and contains at least two formal double bonds (Kekulé) — matching the
  // indole pyrrole + benzene rings.
  const aromaticAtoms = new Set<number>();
  for (const ring of rings) {
    if (ring.length < 5 || ring.length > 6) continue;
    if (!ring.every((i) => mol.atoms[i].element === 'C' || mol.atoms[i].element === 'N')) continue;
    const ringSet = new Set(ring);
    let doubles = 0;
    for (const bond of mol.bonds) {
      if (ringSet.has(bond.a) && ringSet.has(bond.b) && bond.order === 2) doubles++;
    }
    if (doubles >= 2) ring.forEach((i) => aromaticAtoms.add(i));
  }

  const maxOrderByAtom = mol.atoms.map(() => 1);
  for (const b of mol.bonds) {
    maxOrderByAtom[b.a] = Math.max(maxOrderByAtom[b.a], b.order);
    maxOrderByAtom[b.b] = Math.max(maxOrderByAtom[b.b], b.order);
  }

  return mol.atoms.map((atom) => {
    const nb = adj[atom.index].length;
    const aromatic = aromaticAtoms.has(atom.index);
    const inRing = ringAtoms.has(atom.index);
    const maxOrder = maxOrderByAtom[atom.index];

    let hybridization: Hybridization = 'n/a';
    let geometry: Geometry = 'terminal';

    if (atom.element === 'H') {
      return { hybridization: 'n/a', geometry: 'terminal', aromatic, inRing, neighborCount: nb };
    }

    if (aromatic) {
      hybridization = 'sp2';
      geometry = 'trigonal planar';
    } else if (maxOrder >= 3) {
      hybridization = 'sp';
      geometry = 'linear';
    } else if (maxOrder === 2) {
      hybridization = 'sp2';
      geometry = 'trigonal planar';
    } else {
      hybridization = 'sp3';
      if (atom.element === 'C') geometry = 'tetrahedral';
      else if (atom.element === 'N') geometry = 'trigonal pyramidal';
      else if (atom.element === 'O') geometry = 'bent';
      else geometry = 'tetrahedral';
    }

    return { hybridization, geometry, aromatic, inRing, neighborCount: nb };
  });
}
