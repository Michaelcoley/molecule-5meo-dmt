import { Fragment } from 'react';

/** Renders a molecular formula string (e.g. "C13H18N2O") with the digit runs
 *  subscripted, so it works for any compound in the registry. */
export function FormulaText({ formula }: { formula: string }) {
  const parts = formula.match(/[A-Za-z]+|\d+/g) ?? [formula];
  return (
    <>
      {parts.map((p, i) =>
        /^\d+$/.test(p) ? <sub key={i}>{p}</sub> : <Fragment key={i}>{p}</Fragment>,
      )}
    </>
  );
}
