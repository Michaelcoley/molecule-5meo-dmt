import type { ViewerSettings, RenderMode, AromaticMode, BackgroundMode, BaseStyle, AtomLabelMode } from '../settings';
import { Section, Segmented, Slider, Toggle } from './controls';

interface LegendCat {
  label: string;
  color: number;
}

interface Props {
  settings: ViewerSettings;
  update: (patch: Partial<ViewerSettings>) => void;
  legend: LegendCat[];
  onExport: (kind: ExportKind) => void;
}

export type ExportKind =
  | 'png2' | 'png4' | 'png8' | 'pngTransparent'
  | 'svg' | 'svgLabels'
  | 'glb' | 'gltf'
  | 'json' | 'sdf' | 'print';

const RENDER_MODES: { value: RenderMode; label: string }[] = [
  { value: 'museum', label: 'Museum' },
  { value: 'ball-stick', label: 'Ball & stick' },
  { value: 'space-filling', label: 'Space-filling' },
  { value: 'stick', label: 'Licorice' },
  { value: 'wireframe', label: 'Wireframe' },
  { value: 'hybridization', label: 'Hybridization' },
];

const BASE_STYLES: { value: BaseStyle; label: string }[] = [
  { value: 'acrylic', label: 'Acrylic' },
  { value: 'matte-black', label: 'Matte black' },
  { value: 'brushed-aluminum', label: 'Aluminium' },
  { value: 'walnut', label: 'Walnut' },
  { value: 'gallery-white', label: 'Gallery' },
];

export function SettingsPanel({ settings, update, legend, onExport }: Props) {
  return (
    <aside className="panel settings-panel" aria-label="Display settings">
      <h2 className="panel-title">Display</h2>

      <Section title="Rendering style">
        <div className="mode-grid">
          {RENDER_MODES.map((m) => (
            <button
              key={m.value}
              className={`mode-btn ${settings.renderMode === m.value ? 'active' : ''}`}
              aria-pressed={settings.renderMode === m.value}
              onClick={() => update({ renderMode: m.value })}
            >
              {m.label}
            </button>
          ))}
        </div>
        {settings.renderMode === 'hybridization' && legend.length > 0 && (
          <ul className="legend">
            {legend.map((c) => (
              <li key={c.label}>
                <span className="swatch" style={{ background: `#${c.color.toString(16).padStart(6, '0')}` }} aria-hidden />
                {c.label}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Aromaticity">
        <Segmented<AromaticMode>
          value={settings.aromaticMode}
          onChange={(v) => update({ aromaticMode: v })}
          options={[
            { value: 'kekule', label: 'Kekulé', title: 'Alternating double bonds' },
            { value: 'delocalized', label: 'Delocalised', title: 'Uniform aromatic connectors' },
          ]}
        />
        <p className="hint">
          Alternating double bonds are a conventional representation of a single delocalised aromatic
          π-system.
        </p>
      </Section>

      <Section title="Scene">
        <Segmented<BackgroundMode>
          label="Background"
          value={settings.background}
          onChange={(v) => update({ background: v })}
          options={[
            { value: 'dark', label: 'Dark' },
            { value: 'gradient', label: 'Gradient' },
            { value: 'light', label: 'Light' },
            { value: 'transparent', label: 'None' },
          ]}
        />
        <Toggle label="Display base" checked={settings.showBase} onChange={(v) => update({ showBase: v })} />
        {settings.showBase && (
          <Segmented<BaseStyle>
            label="Base material"
            value={settings.baseStyle}
            onChange={(v) => update({ baseStyle: v })}
            options={BASE_STYLES}
          />
        )}
        <Toggle label="Information plaque" checked={settings.showPlaque} onChange={(v) => update({ showPlaque: v })} />
      </Section>

      <Section title="Atoms & labels">
        <Toggle label="Show hydrogens" checked={settings.showHydrogens} onChange={(v) => update({ showHydrogens: v })} />
        <Toggle label="Atom labels" checked={settings.showAtomLabels} onChange={(v) => update({ showAtomLabels: v })} />
        {settings.showAtomLabels && (
          <Segmented<AtomLabelMode>
            value={settings.atomLabelMode}
            onChange={(v) => update({ atomLabelMode: v })}
            options={[
              { value: 'element', label: 'Element' },
              { value: 'serial', label: 'Number' },
              { value: 'full', label: 'Full' },
              { value: 'hybridization', label: 'Hybrid.' },
            ]}
          />
        )}
        <Toggle label="Bond length labels" checked={settings.showBondLabels} onChange={(v) => update({ showBondLabels: v })} />
      </Section>

      <Section title="Measurement" defaultOpen={false}>
        <Toggle
          label="Measurement mode"
          hint="Click 2 atoms for distance, 3 for angle, 4 for dihedral"
          checked={settings.measureMode}
          onChange={(v) => update({ measureMode: v })}
        />
        <p className="hint">Pick 2 atoms → distance · 3 atoms → angle · 4 atoms → dihedral.</p>
      </Section>

      <Section title="Motion" defaultOpen={false}>
        <Toggle label="Auto-rotate" checked={settings.autoRotate} onChange={(v) => update({ autoRotate: v })} />
        <Slider label="Rotation speed" min={0.1} max={3} step={0.1} value={settings.autoRotateSpeed}
          onChange={(v) => update({ autoRotateSpeed: v })} format={(v) => `${v.toFixed(1)}×`} />
        <Toggle label="Pause all motion" checked={settings.paused} onChange={(v) => update({ paused: v })} />
      </Section>

      <Section title="Materials & lighting" defaultOpen={false}>
        <Slider label="Atom scale" min={0.3} max={2} step={0.05} value={settings.atomScale} onChange={(v) => update({ atomScale: v })} />
        <Slider label="Bond thickness" min={0.4} max={2.5} step={0.05} value={settings.bondThickness} onChange={(v) => update({ bondThickness: v })} />
        <Slider label="Roughness" min={0} max={1} step={0.02} value={settings.atomRoughness} onChange={(v) => update({ atomRoughness: v })} />
        <Slider label="Metalness" min={0} max={1} step={0.02} value={settings.atomMetalness} onChange={(v) => update({ atomMetalness: v })} />
        <Slider label="Reflections" min={0} max={2} step={0.05} value={settings.envIntensity} onChange={(v) => update({ envIntensity: v })} />
        <Slider label="Ambient light" min={0} max={2} step={0.05} value={settings.ambientIntensity} onChange={(v) => update({ ambientIntensity: v })} />
        <Slider label="Key/directional light" min={0} max={3} step={0.05} value={settings.directionalIntensity} onChange={(v) => update({ directionalIntensity: v })} />
        <Slider label="Shadow intensity" min={0} max={1} step={0.02} value={settings.shadowIntensity} onChange={(v) => update({ shadowIntensity: v })} />
      </Section>

      <Section title="Accessibility" defaultOpen={false}>
        <Toggle label="High-contrast palette" checked={settings.accessiblePalette} onChange={(v) => update({ accessiblePalette: v })} />
        <Toggle label="Reduce motion" checked={settings.reducedMotion} onChange={(v) => update({ reducedMotion: v })} />
      </Section>

      <Section title="Export" defaultOpen={false}>
        <div className="export-grid">
          <button onClick={() => onExport('png2')}>PNG 2×</button>
          <button onClick={() => onExport('png4')}>PNG 4×</button>
          <button onClick={() => onExport('png8')}>PNG 8×</button>
          <button onClick={() => onExport('pngTransparent')}>PNG (α)</button>
          <button onClick={() => onExport('svg')}>SVG</button>
          <button onClick={() => onExport('svgLabels')}>SVG + labels</button>
          <button onClick={() => onExport('glb')}>GLB</button>
          <button onClick={() => onExport('gltf')}>glTF</button>
          <button onClick={() => onExport('json')}>JSON</button>
          <button onClick={() => onExport('sdf')}>SDF</button>
          <button onClick={() => onExport('print')}>Print sheet</button>
        </div>
      </Section>
    </aside>
  );
}
