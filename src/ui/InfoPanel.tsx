import { useState } from 'react';
import type { Molecule } from '../data/molecule';
import { atomLabel } from '../data/molecule';
import { elementInfo } from '../data/elements';
import { Section } from './controls';
import { FormulaText } from './FormulaText';
import type { MeasureResult } from '../three/MoleculeViewer';

interface Props {
  molecule: Molecule;
  selectedAtom: number | null;
  selectedBond: number | null;
  measure: MeasureResult | null;
  onCopySMILES: () => void;
  copied: boolean;
}

export function InfoPanel(props: Props) {
  const { molecule } = props;
  const meta = molecule.meta;
  const v = molecule.validation;
  const [screenReaderOpen, setSR] = useState(false);

  return (
    <aside className="panel info-panel" aria-label="Molecular information">
      <header className="panel-head">
        <h1>{meta.commonName}</h1>
        <p className="subtitle">{meta.fullName}</p>
      </header>

      <Section title="Identity">
        <dl className="kv">
          <div><dt>IUPAC</dt><dd>{meta.iupacName}</dd></div>
          <div><dt>Formula</dt><dd className="formula"><FormulaText formula={meta.formula} /></dd></div>
          <div><dt>Mol. weight</dt><dd>{meta.molecularWeight} g/mol</dd></div>
          <div><dt>PubChem CID</dt><dd>
            <a href={`https://pubchem.ncbi.nlm.nih.gov/compound/${meta.pubchemCID}`} target="_blank" rel="noreferrer">
              {meta.pubchemCID}
            </a>
          </dd></div>
          <div><dt>InChIKey</dt><dd className="mono">{meta.inchiKey}</dd></div>
          <div><dt>SMILES</dt><dd className="mono smiles">
            {meta.canonicalSMILES}
            <button className="mini-btn" onClick={props.onCopySMILES}>{props.copied ? 'Copied ✓' : 'Copy'}</button>
          </dd></div>
        </dl>
      </Section>

      <Section title="Composition">
        <div className="composition">
          <div className="atom-total"><strong>{v.counts.total}</strong> atoms</div>
          <ul className="comp-list">
            {molecule.composition.map((c) => {
              const info = elementInfo(c.symbol);
              return (
                <li key={c.symbol}>
                  <span className="swatch" style={{ background: `#${info.cpkColor.toString(16).padStart(6, '0')}` }} aria-hidden />
                  <span className="comp-el">{info.name} ({c.symbol})</span>
                  <span className="comp-count">×{c.count}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </Section>

      <Section title="Structure validation" defaultOpen={false}>
        <p className={`valid-banner ${v.valid ? 'ok' : 'bad'}`}>
          {v.valid ? '✓ Structure validated' : '✕ Validation failed'}
        </p>
        <ul className="feature-list">
          {v.features.map((f) => (
            <li key={f.id} className={f.ok ? 'ok' : 'bad'} title={f.detail}>
              <span aria-hidden>{f.ok ? '✓' : '✕'}</span> {f.label}
            </li>
          ))}
        </ul>
        {v.errors.length > 0 && (
          <ul className="error-list">{v.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        )}
      </Section>

      <Section title="Selection">
        {props.selectedAtom !== null ? (
          <AtomDetails molecule={molecule} index={props.selectedAtom} />
        ) : props.selectedBond !== null ? (
          <BondDetails molecule={molecule} index={props.selectedBond} />
        ) : (
          <p className="muted">Click an atom or bond to inspect it. Double-click an atom to focus the camera.</p>
        )}
        {props.measure && <MeasureDetails molecule={molecule} m={props.measure} />}
      </Section>

      <Section title="Screen-reader description" defaultOpen={false}>
        <button className="mini-btn" aria-expanded={screenReaderOpen} onClick={() => setSR((s) => !s)}>
          {screenReaderOpen ? 'Hide' : 'Show'} text description
        </button>
        {screenReaderOpen && (
          <p className="sr-desc">
            {meta.srDescription} The model contains {v.counts.total} atoms: {v.counts.C} carbon,{' '}
            {v.counts.H} hydrogen, {v.counts.N} nitrogen{v.counts.O ? `, and ${v.counts.O} oxygen` : ''}.
          </p>
        )}
      </Section>

      <p className="disclaimer">{meta.conformerNote}</p>
      <p className="disclaimer subtle">
        Kekulé mode draws four alternating double bonds; this is a conventional depiction of a single
        delocalised aromatic π-system (see Aromaticity in the settings panel).
      </p>
    </aside>
  );
}

function AtomDetails({ molecule, index }: { molecule: Molecule; index: number }) {
  const atom = molecule.atoms[index];
  const info = elementInfo(atom.element);
  const p = molecule.properties[index];
  return (
    <dl className="kv detail">
      <div><dt>Atom</dt><dd>{atomLabel(atom)} (index {index})</dd></div>
      <div><dt>Element</dt><dd>{info.name}</dd></div>
      <div><dt>Atomic number</dt><dd>{info.atomicNumber}</dd></div>
      <div><dt>Hybridization</dt><dd>{p.hybridization === 'n/a' ? '—' : p.hybridization}</dd></div>
      <div><dt>Geometry</dt><dd>{p.geometry}</dd></div>
      <div><dt>Aromatic</dt><dd>{p.aromatic ? 'yes' : 'no'}</dd></div>
      <div><dt>Formal charge</dt><dd>{atom.charge}</dd></div>
      <div><dt>Coordinates (Å)</dt><dd className="mono">{atom.x.toFixed(3)}, {atom.y.toFixed(3)}, {atom.z.toFixed(3)}</dd></div>
    </dl>
  );
}

function BondDetails({ molecule, index }: { molecule: Molecule; index: number }) {
  const b = molecule.bonds[index];
  const a1 = molecule.atoms[b.a];
  const a2 = molecule.atoms[b.b];
  const aromatic = molecule.properties[b.a].aromatic && molecule.properties[b.b].aromatic;
  const orderName = b.order === 1 ? 'single' : b.order === 2 ? 'double' : b.order === 3 ? 'triple' : 'aromatic';
  return (
    <dl className="kv detail">
      <div><dt>Bond</dt><dd>{atomLabel(a1)} – {atomLabel(a2)}</dd></div>
      <div><dt>Order</dt><dd>{b.order} ({orderName})</dd></div>
      <div><dt>Aromatic</dt><dd>{aromatic ? 'yes (delocalised)' : 'no'}</dd></div>
      <div><dt>Length</dt><dd>{b.length.toFixed(3)} Å</dd></div>
    </dl>
  );
}

function MeasureDetails({ molecule, m }: { molecule: Molecule; m: MeasureResult }) {
  const labels = m.atomIndices.map((i) => atomLabel(molecule.atoms[i])).join(' – ');
  const name = m.kind === 'distance' ? 'Distance' : m.kind === 'angle' ? 'Bond angle' : 'Dihedral angle';
  return (
    <div className="measure-result">
      <div className="measure-name">{name}</div>
      <div className="measure-atoms">{labels}</div>
      <div className="measure-value">{m.value.toFixed(m.unit === 'Å' ? 3 : 2)} {m.unit}</div>
    </div>
  );
}
