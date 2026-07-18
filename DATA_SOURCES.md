# Data Sources

The app ships two authentically-sourced, selectable structures. Both are taken
**verbatim** from PubChem computed 3D conformers — no coordinates are guessed
from a 2D diagram or hand-edited — and each is validated against its own
composition + structural-feature spec before rendering.

## Molecular structure — 5-MeO-DMT (free base)

The 3D atomic coordinates, element identities, bond connectivity, bond orders,
and hydrogen placement are taken **verbatim** from the PubChem computed 3D
conformer. No coordinates were guessed from a 2D diagram or hand-edited.

- **Compound:** 5-MeO-DMT · 5-methoxy-N,N-dimethyltryptamine
- **PubChem CID:** 1832
- **Record retrieved:** `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/1832/record/SDF?record_type=3d`
- **Format:** MDL Molfile / SDF V2000 (`-OEChem` 3D conformer, reported RMSD 0.6 Å)
- **Local copy:** [`src/data/5meo-dmt.sdf`](src/data/5meo-dmt.sdf) (imported at build
  time via `?raw`) and [`public/data/5meo-dmt.sdf`](public/data/5meo-dmt.sdf) (served
  for the in-app "Download SDF" action).

The application never fetches this structure at runtime; the validated file is
embedded, so the display works fully offline.

### Reference identifiers

| Field | Value |
| --- | --- |
| Molecular formula | C₁₃H₁₈N₂O |
| Molecular weight | 218.30 g/mol |
| InChIKey | ZSTKHSQDNIGFLM-UHFFFAOYSA-N |
| Canonical SMILES | `COc1ccc2c(c1)c(CCN(C)C)c[nH]2` |

## Molecular structure — DMT / N,N-DMT (free base)

- **Compound:** DMT · N,N-dimethyltryptamine
- **PubChem CID:** 6089
- **Record retrieved:** `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/6089/record/SDF?record_type=3d`
- **Format:** MDL Molfile / SDF V2000 (`-OEChem` 3D conformer)
- **Local copy:** [`src/data/dmt.sdf`](src/data/dmt.sdf) (imported via `?raw`) and
  [`public/data/dmt.sdf`](public/data/dmt.sdf) (served for "Download SDF").

### Reference identifiers

| Field | Value |
| --- | --- |
| Molecular formula | C₁₂H₁₆N₂ |
| Molecular weight | 188.27 g/mol |
| InChIKey | BYPFEZZEUUWMEJ-UHFFFAOYSA-N |
| Canonical SMILES | `CN(C)CCc1c[nH]c2ccccc12` |

DMT is structurally 5-MeO-DMT without the 5-methoxy substituent: 12 C, 16 H,
2 N, 0 O; 30 atoms total.

## Element reference data

Rendering radii, colours, and atomic weights are drawn from standard tabulated
values (see [`src/data/elements.ts`](src/data/elements.ts)):

- **CPK / Jmol colour convention** for the base palette (carbon rendered as a
  refined dark charcoal for the museum aesthetic, as specified).
- **Covalent radii** — Cordero et al., *Dalton Trans.*, 2008 (used for
  ball-and-stick, licorice, and wireframe modes).
- **Van der Waals radii** — Bondi, *J. Phys. Chem.*, 1964 (used for the
  space-filling mode).
- **Standard atomic weights** — IUPAC conventional values.

## Rendering libraries

- [Three.js](https://threejs.org/) r0.169 — WebGL scene, procedural sphere and
  cylinder geometry, `OrbitControls`, `CSS2DRenderer`, `GLTFExporter`,
  `RoomEnvironment` (procedurally generated studio environment map).
- [React](https://react.dev/) 18 + [Vite](https://vitejs.dev/) 5 — application
  shell and build tooling.
- [Vitest](https://vitest.dev/) — unit tests.
