import { MOLECULE_META } from '../data/molecule';

/** Museum-style information plaque overlaid at the base of the stage. */
export function Plaque() {
  return (
    <div className="plaque" aria-label="Museum plaque">
      <div className="plaque-inner">
        <div className="plaque-name">{MOLECULE_META.commonName}</div>
        <div className="plaque-sub">5-Methoxy-N,N-dimethyltryptamine</div>
        <div className="plaque-meta">
          C<sub>13</sub>H<sub>18</sub>N<sub>2</sub>O · {MOLECULE_META.molecularWeight} g/mol
        </div>
        <div className="plaque-cid">PubChem CID {MOLECULE_META.pubchemCID}</div>
      </div>
    </div>
  );
}
