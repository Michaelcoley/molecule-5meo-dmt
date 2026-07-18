import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));

const rows = JSON.parse(readFileSync(join(HERE, 'molecule-props.json'), 'utf8'));
const ok = rows.filter((r) => r.status === 'OK');

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const entries = ok.map((r) => {
  const cid = r.cid;
  const note =
    r.source === '3d'
      ? `Displayed geometry is the PubChem CID ${cid} 3D conformer (a single, energetically reasonable conformation). Rotatable bonds permit many conformations in reality.`
      : `Displayed geometry is derived from the PubChem CID ${cid} 2D structure (no 3D conformer was available); atoms are shown in a flat layout.`;
  const sr = `${r.name} (${r.full}) — molecular formula ${r.formula}, PubChem CID ${cid}. Shown as ${r.source === '3d' ? 'one energetically reasonable 3D conformer' : 'a flat 2D layout'}.`;
  return {
    id: r.id,
    commonName: r.name,
    fullName: r.full,
    subtitle: cap(r.full),
    iupacName: r.iupac || r.full,
    formula: r.formula,
    molecularWeight: Number(r.mw),
    pubchemCID: cid,
    inchiKey: r.inchikey || '',
    canonicalSMILES: r.smiles || '',
    conformerNote: note,
    srDescription: sr,
    category: r.cat,
    source: r.source,
  };
});

const body =
  `// AUTO-GENERATED from PubChem (scripts/fetch-molecules.mjs). Do not edit by hand.\n` +
  `import type { MoleculeEntry } from './moleculeTypes';\n\n` +
  `export const GENERATED_MOLECULES: MoleculeEntry[] = ${JSON.stringify(entries, null, 2)};\n`;

writeFileSync(join(HERE, '..', 'src', 'data', 'moleculeMeta.generated.ts'), body);
console.log(`wrote ${entries.length} entries`);
console.log('categories:', [...new Set(entries.map((e) => e.category))].join(', '));
console.log('any 2D:', entries.filter((e) => e.source === '2d').map((e) => e.commonName).join(', ') || 'none');
