import { useMemo, useState } from 'react';

interface Mol {
  id: string;
  name: string;
  category: string;
}

const CATEGORY_ORDER = [
  'Tryptamines',
  'Lysergamides',
  'Phenethylamines',
  'Dissociatives',
  'Entactogens',
  'Other',
];

export function MoleculeSelector({
  molecules,
  selected,
  onSelect,
}: {
  molecules: Mol[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? molecules.filter((m) => m.name.toLowerCase().includes(q)) : molecules;
    const byCat = new Map<string, Mol[]>();
    for (const m of filtered) {
      if (!byCat.has(m.category)) byCat.set(m.category, []);
      byCat.get(m.category)!.push(m);
    }
    const ordered = [...byCat.keys()].sort(
      (a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b),
    );
    return ordered.map((cat) => ({ cat, items: byCat.get(cat)! }));
  }, [molecules, query]);

  return (
    <div className="mol-selector">
      <input
        type="search"
        className="mol-search"
        placeholder={`Search ${molecules.length} molecules…`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search molecules"
      />
      <div className="mol-scroll">
        {groups.length === 0 && <div className="hint">No matches.</div>}
        {groups.map((g) => (
          <div className="mol-group" key={g.cat}>
            <div className="mol-cat">{g.cat}</div>
            <div className="mode-grid" role="group" aria-label={g.cat}>
              {g.items.map((m) => (
                <button
                  key={m.id}
                  className={`mode-btn ${m.id === selected ? 'active' : ''}`}
                  aria-pressed={m.id === selected}
                  onClick={() => onSelect(m.id)}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
