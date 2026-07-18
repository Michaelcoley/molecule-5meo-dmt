import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildMolecule, MOLECULES, DEFAULT_MOLECULE_ID } from './data/molecule';
import { MoleculeViewer, type MeasureResult } from './three/MoleculeViewer';
import { isWebGLAvailable } from './three/webgl';
import { DEFAULT_SETTINGS, STORAGE_KEY, type ViewerSettings, type ViewPreset } from './settings';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Toolbar } from './ui/Toolbar';
import { InfoPanel } from './ui/InfoPanel';
import { SettingsPanel, type ExportKind } from './ui/SettingsPanel';
import { Plaque } from './ui/Plaque';
import {
  exportGLTF, exportJSON, exportPNG, exportSDF, exportSVG, printInfoSheet, copySMILES,
} from './export/exporters';

const MOLECULE_KEY = '5meo-dmt-molecule-id-v1';

export function App() {
  const webgl = useMemo(isWebGLAvailable, []);
  const [moleculeId, setMoleculeId] = useState<string>(() => {
    try {
      return localStorage.getItem(MOLECULE_KEY) || DEFAULT_MOLECULE_ID;
    } catch {
      return DEFAULT_MOLECULE_ID;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(MOLECULE_KEY, moleculeId);
    } catch {
      /* storage may be unavailable */
    }
  }, [moleculeId]);
  const molecule = useMemo(() => buildMolecule(moleculeId), [moleculeId]);

  const prefersReduced = useMemo(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    [],
  );
  const [settings, setSettings] = useLocalStorage<ViewerSettings>(STORAGE_KEY, {
    ...DEFAULT_SETTINGS,
    reducedMotion: prefersReduced,
    autoRotate: !prefersReduced,
  });

  const stageRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<MoleculeViewer | null>(null);

  const [selectedAtom, setSelectedAtom] = useState<number | null>(null);
  const [selectedBond, setSelectedBond] = useState<number | null>(null);
  const [measure, setMeasure] = useState<MeasureResult | null>(null);
  const [legend, setLegend] = useState<{ label: string; color: number }[]>([]);
  // Panels start collapsed on small screens so the model owns the viewport.
  const [panelsOpen, setPanelsOpen] = useState(() => window.innerWidth > 1080);
  const [uiHidden, setUiHidden] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Mount the viewer once. Validation errors surface before rendering.
  useEffect(() => {
    if (!webgl || !stageRef.current) return;
    if (!molecule.validation.valid) {
      // Developer-facing error — still constructs, but log loudly.
      console.error('[5-MeO-DMT] Molecular validation failed:', molecule.validation);
    }
    const viewer = new MoleculeViewer(stageRef.current, molecule, settings, {
      onSelectAtom: setSelectedAtom,
      onSelectBond: setSelectedBond,
      onMeasure: setMeasure,
      onHybridizationLegend: setLegend,
    });
    viewerRef.current = viewer;

    const ro = new ResizeObserver(() => viewer.resize());
    ro.observe(stageRef.current);

    return () => {
      ro.disconnect();
      viewer.dispose();
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webgl, molecule]);

  // Push settings changes into the viewer.
  useEffect(() => {
    viewerRef.current?.applySettings(settings);
  }, [settings]);

  // Clear any selection/measurement when switching molecules.
  useEffect(() => {
    setSelectedAtom(null);
    setSelectedBond(null);
    setMeasure(null);
  }, [molecule]);

  const update = useCallback(
    (patch: Partial<ViewerSettings>) => setSettings((s) => ({ ...s, ...patch })),
    [setSettings],
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  // Toolbar handlers
  const onView = useCallback((v: ViewPreset) => viewerRef.current?.setView(v), []);
  const onFit = useCallback(() => viewerRef.current?.frameToFit(true), []);
  const onReset = useCallback(() => viewerRef.current?.resetCamera(), []);
  const onFullscreen = useCallback(() => {
    const el = appRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  }, []);

  const onCopySMILES = useCallback(async () => {
    const ok = await copySMILES(molecule.meta.canonicalSMILES);
    setCopied(ok);
    showToast(ok ? 'SMILES copied to clipboard' : 'Copy failed');
    window.setTimeout(() => setCopied(false), 1800);
  }, [showToast, molecule]);

  const onExport = useCallback(
    async (kind: ExportKind) => {
      const viewer = viewerRef.current;
      if (!viewer) return;
      try {
        switch (kind) {
          case 'png2': await exportPNG(viewer, 2, false); break;
          case 'png4': await exportPNG(viewer, 4, false); break;
          case 'png8': await exportPNG(viewer, 8, false); break;
          case 'pngTransparent': await exportPNG(viewer, 2, true); break;
          case 'svg': exportSVG(viewer, false, settings.background === 'light' ? '#f3f4f7' : null); break;
          case 'svgLabels': exportSVG(viewer, true, settings.background === 'light' ? '#f3f4f7' : null); break;
          case 'glb': await exportGLTF(viewer, true); break;
          case 'gltf': await exportGLTF(viewer, false); break;
          case 'json': exportJSON(molecule); break;
          case 'sdf': exportSDF(molecule); break;
          case 'print': printInfoSheet(molecule); break;
        }
        showToast('Export ready');
      } catch (err) {
        console.error(err);
        showToast('Export failed');
      }
    },
    [molecule, settings.background, showToast],
  );

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape') { setUiHidden(false); return; }
      switch (e.key.toLowerCase()) {
        case 'f': onFit(); break;
        case 'r': onReset(); break;
        case ' ': e.preventDefault(); update({ paused: !settings.paused }); break;
        case 'h': update({ showHydrogens: !settings.showHydrogens }); break;
        case 'l': update({ showAtomLabels: !settings.showAtomLabels }); break;
        case 'm': update({ measureMode: !settings.measureMode }); break;
        case 'u': setUiHidden((v) => !v); break;
        case 'p': setPanelsOpen((v) => !v); break;
        case '1': onView('front'); break;
        case '2': onView('back'); break;
        case '3': onView('left'); break;
        case '4': onView('right'); break;
        case '5': onView('top'); break;
        case '6': onView('bottom'); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [settings, update, onFit, onReset, onView]);

  if (!webgl) {
    const m = molecule.meta;
    return (
      <div className="webgl-fallback">
        <h1>{m.commonName}</h1>
        <p>
          This museum-quality molecular display requires WebGL, which is unavailable or disabled in
          this browser. Please enable hardware acceleration or try a current version of Chrome,
          Firefox, Safari, or Edge.
        </p>
        <pre>
{`Name      ${m.fullName}
Formula   ${m.formula}
Weight    ${m.molecularWeight} g/mol
PubChem   CID ${m.pubchemCID}
SMILES    ${m.canonicalSMILES}`}
        </pre>
      </div>
    );
  }

  const panelsVisible = panelsOpen && !uiHidden;

  return (
    <div
      ref={appRef}
      className={`app ${panelsVisible ? '' : 'panels-hidden'} ${uiHidden ? 'ui-hidden' : ''} bg-${settings.background}`}
    >
      <div className="stage-wrap">
        <div ref={stageRef} className="stage" tabIndex={0} aria-label="3D molecular viewport" />
        {settings.showPlaque && <Plaque meta={molecule.meta} />}
        {toast && <div className="toast" role="status">{toast}</div>}
      </div>

      {!uiHidden && (
        <Toolbar
          autoRotate={settings.autoRotate}
          paused={settings.paused}
          cameraType={settings.cameraType}
          panelsOpen={panelsOpen}
          onToggleRotate={() => update({ autoRotate: !settings.autoRotate })}
          onTogglePause={() => update({ paused: !settings.paused })}
          onToggleCamera={() => update({ cameraType: settings.cameraType === 'perspective' ? 'orthographic' : 'perspective' })}
          onReset={onReset}
          onFit={onFit}
          onView={onView}
          onFullscreen={onFullscreen}
          onTogglePanels={() => setPanelsOpen((v) => !v)}
          onHideUI={() => setUiHidden(true)}
        />
      )}

      {panelsVisible && (
        <div className="panels">
          <button className="panels-close" aria-label="Close panels" onClick={() => setPanelsOpen(false)}>
            ✕ Close
          </button>
          <InfoPanel
            molecule={molecule}
            selectedAtom={selectedAtom}
            selectedBond={selectedBond}
            measure={measure}
            onCopySMILES={onCopySMILES}
            copied={copied}
          />
          <SettingsPanel
            settings={settings}
            update={update}
            legend={legend}
            onExport={onExport}
            molecules={MOLECULES.map((m) => ({ id: m.id, name: m.meta.commonName }))}
            moleculeId={moleculeId}
            onSelectMolecule={setMoleculeId}
          />
        </div>
      )}

      {uiHidden && (
        <button
          className="ui-restore"
          aria-label="Show controls"
          title="Show controls (Esc)"
          onClick={() => setUiHidden(false)}
        >
          <span aria-hidden>⚙</span>
        </button>
      )}
    </div>
  );
}
