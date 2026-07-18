import type { MoleculeMeta } from '../data/molecule';
import { FormulaText } from './FormulaText';

/** Museum-style information plaque overlaid at the base of the stage. */
export function Plaque({ meta }: { meta: MoleculeMeta }) {
  return (
    <div className="plaque" aria-label="Museum plaque">
      <div className="plaque-inner">
        <div className="plaque-name">{meta.commonName}</div>
        <div className="plaque-sub">{meta.subtitle}</div>
        <div className="plaque-meta">
          <FormulaText formula={meta.formula} /> · {meta.molecularWeight} g/mol
        </div>
        <div className="plaque-cid">PubChem CID {meta.pubchemCID}</div>
      </div>
    </div>
  );
}
