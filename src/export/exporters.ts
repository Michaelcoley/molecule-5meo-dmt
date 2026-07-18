/**
 * Export utilities: high-resolution / transparent PNG, GLB & glTF (true 3D),
 * atom/bond JSON, raw SDF, SMILES clipboard copy, SVG (delegated), and a
 * printable museum information sheet.
 */

import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import type { MoleculeViewer } from '../three/MoleculeViewer';
import type { Molecule } from '../data/molecule';
import { MOLECULE_META, atomLabel } from '../data/molecule';
import { elementInfo } from '../data/elements';
import { exportSceneToSVG } from './svgExporter';

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function downloadText(text: string, filename: string, mime = 'text/plain') {
  downloadBlob(new Blob([text], { type: mime }), filename);
}

export async function exportPNG(viewer: MoleculeViewer, scale: number, transparent: boolean) {
  const blob = await viewer.renderToPNG(scale, transparent);
  const tag = transparent ? 'transparent' : `${scale}x`;
  downloadBlob(blob, `5meo-dmt-${tag}.png`);
}

export function exportSVG(viewer: MoleculeViewer, labels: boolean, background: string | null) {
  const svg = exportSceneToSVG(viewer.getExportScene(), { labels, background });
  downloadText(svg, '5meo-dmt-view.svg', 'image/svg+xml');
}

export async function exportGLTF(viewer: MoleculeViewer, binary: boolean) {
  const exporter = new GLTFExporter();
  const group = viewer.getMoleculeGroupForExport();
  const result = await exporter.parseAsync(group, { binary, onlyVisible: true });
  if (binary) {
    downloadBlob(new Blob([result as ArrayBuffer], { type: 'model/gltf-binary' }), '5meo-dmt.glb');
  } else {
    downloadText(JSON.stringify(result, null, 2), '5meo-dmt.gltf', 'model/gltf+json');
  }
}

export function exportJSON(molecule: Molecule) {
  const data = {
    meta: MOLECULE_META,
    validation: {
      valid: molecule.validation.valid,
      counts: molecule.validation.counts,
      features: molecule.validation.features.map((f) => ({ id: f.id, label: f.label, ok: f.ok })),
    },
    atoms: molecule.atoms.map((a) => ({
      index: a.index,
      serial: a.serial,
      label: atomLabel(a),
      element: a.element,
      atomicNumber: elementInfo(a.element).atomicNumber,
      position: { x: a.x, y: a.y, z: a.z },
      charge: a.charge,
      hybridization: molecule.properties[a.index].hybridization,
      geometry: molecule.properties[a.index].geometry,
      aromatic: molecule.properties[a.index].aromatic,
    })),
    bonds: molecule.bonds.map((b) => ({
      index: b.index,
      atomA: b.a,
      atomB: b.b,
      order: b.order,
      length: Number(b.length.toFixed(4)),
    })),
  };
  downloadText(JSON.stringify(data, null, 2), '5meo-dmt-data.json', 'application/json');
}

export function exportSDF(molecule: Molecule) {
  downloadText(molecule.sdfText, '5meo-dmt.sdf', 'chemical/x-mdl-sdfile');
}

export async function copySMILES(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(MOLECULE_META.canonicalSMILES);
    return true;
  } catch {
    return false;
  }
}

export function printInfoSheet(molecule: Molecule) {
  const win = window.open('', '_blank', 'width=800,height=1000');
  if (!win) return;
  const comp = molecule.composition
    .map((c) => `${c.symbol}<sub>${c.count}</sub>`)
    .join(' ');
  win.document.write(`<!doctype html><html><head><title>${MOLECULE_META.commonName} — Information Sheet</title>
  <style>
    @page { margin: 2cm; }
    body { font-family: Georgia, 'Times New Roman', serif; color:#1a1a1a; line-height:1.5; }
    h1 { font-size: 28px; margin-bottom: 2px; letter-spacing: .5px; }
    h2 { font-size: 15px; font-weight: normal; font-style: italic; color:#555; margin-top:0; }
    .rule { border:0; border-top:2px solid #222; margin:16px 0; }
    table { border-collapse: collapse; width:100%; font-size:13px; }
    td { padding:4px 8px; border-bottom:1px solid #ddd; }
    td:first-child { color:#666; width:38%; }
    .mono { font-family: 'Courier New', monospace; }
    footer { margin-top:24px; font-size:11px; color:#888; }
  </style></head><body>
  <h1>${MOLECULE_META.commonName}</h1>
  <h2>${MOLECULE_META.fullName}</h2>
  <hr class="rule"/>
  <table>
    <tr><td>IUPAC name</td><td>${MOLECULE_META.iupacName}</td></tr>
    <tr><td>Molecular formula</td><td>${comp} &nbsp; (${MOLECULE_META.formula})</td></tr>
    <tr><td>Molecular weight</td><td>${MOLECULE_META.molecularWeight} g/mol</td></tr>
    <tr><td>PubChem CID</td><td>${MOLECULE_META.pubchemCID}</td></tr>
    <tr><td>InChIKey</td><td class="mono">${MOLECULE_META.inchiKey}</td></tr>
    <tr><td>Canonical SMILES</td><td class="mono">${MOLECULE_META.canonicalSMILES}</td></tr>
    <tr><td>Total atoms</td><td>${molecule.validation.counts.total}</td></tr>
  </table>
  <footer>${MOLECULE_META.conformerNote}<br/>Coordinates: PubChem CID ${MOLECULE_META.pubchemCID} 3D conformer.</footer>
  <script>window.onload = () => { window.print(); }</script>
  </body></html>`);
  win.document.close();
}
