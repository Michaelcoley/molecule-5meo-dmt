# Molecule data pipeline

The molecule library is generated from PubChem, not hand-authored. Two scripts
reproduce it (Node 18+, no dependencies):

```bash
node scripts/fetch-molecules.mjs      # resolves CIDs, downloads 3D SDFs -> src/data/sdf/, writes molecule-props.json
node scripts/generate-metadata.mjs    # molecule-props.json -> src/data/moleculeMeta.generated.ts
```

- `fetch-molecules.mjs` holds the master list (`id`, display name, full name,
  category, candidate PubChem names/CIDs). For each entry it resolves a CID,
  fetches `MolecularFormula / MolecularWeight / InChIKey / SMILES / IUPACName`,
  and downloads the **3D** conformer SDF (`record_type=3d`, falling back to 2D
  only if no 3D conformer exists — none currently do). SDFs are saved verbatim
  to `src/data/sdf/<id>.sdf`.
- `generate-metadata.mjs` turns the fetched properties into
  `src/data/moleculeMeta.generated.ts`. Validation `expectedCounts` are derived
  at load time from each `MolecularFormula` (see `parseFormula` in
  `src/data/molecules.ts`), so the embedded 3D structure is checked against the
  authoritative PubChem formula.

To add a compound: add a row to the `LIST` in `fetch-molecules.mjs`, run both
scripts, and (optionally) add a `CURATED` entry in `src/data/molecules.ts` for a
richer description or asserted structural features.

`molecule-props.json` is the cached fetch result (CIDs, formulae, identifiers,
coordinate provenance) and doubles as a provenance record.
