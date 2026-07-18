import { IconButton } from './controls';
import type { ViewPreset } from '../settings';

interface ToolbarProps {
  autoRotate: boolean;
  paused: boolean;
  cameraType: 'perspective' | 'orthographic';
  panelsOpen: boolean;
  onToggleRotate: () => void;
  onTogglePause: () => void;
  onToggleCamera: () => void;
  onReset: () => void;
  onFit: () => void;
  onView: (v: ViewPreset) => void;
  onFullscreen: () => void;
  onTogglePanels: () => void;
  onHideUI: () => void;
}

const VIEWS: { key: ViewPreset; label: string }[] = [
  { key: 'front', label: 'Front' },
  { key: 'back', label: 'Back' },
  { key: 'left', label: 'Left' },
  { key: 'right', label: 'Right' },
  { key: 'top', label: 'Top' },
  { key: 'bottom', label: 'Bottom' },
];

export function Toolbar(props: ToolbarProps) {
  return (
    <div className="toolbar" role="toolbar" aria-label="Viewer controls">
      <div className="toolbar-group views" aria-label="Standard views">
        {VIEWS.map((v) => (
          <button key={v.key} className="view-btn" onClick={() => props.onView(v.key)} title={`${v.label} view`}>
            {v.label}
          </button>
        ))}
      </div>

      <div className="toolbar-group">
        <IconButton label="Fit molecule to view" onClick={props.onFit}>⤢</IconButton>
        <IconButton label="Reset camera" onClick={props.onReset}>⟲</IconButton>
        <IconButton
          label={`Camera: ${props.cameraType} (click to switch)`}
          onClick={props.onToggleCamera}
        >
          {props.cameraType === 'perspective' ? '⬡' : '▱'}
        </IconButton>
        <IconButton
          label={props.autoRotate ? 'Turn auto-rotation off' : 'Turn auto-rotation on'}
          onClick={props.onToggleRotate}
          active={props.autoRotate}
        >
          ↻
        </IconButton>
        <IconButton
          label={props.paused ? 'Resume motion' : 'Pause all motion'}
          onClick={props.onTogglePause}
          active={props.paused}
        >
          {props.paused ? '▶' : '‖'}
        </IconButton>
        <IconButton label="Full-screen presentation" onClick={props.onFullscreen}>⛶</IconButton>
        <IconButton
          label={props.panelsOpen ? 'Hide side panels' : 'Show side panels'}
          onClick={props.onTogglePanels}
          active={props.panelsOpen}
        >
          ≡
        </IconButton>
        <IconButton label="Hide all controls (presentation mode)" onClick={props.onHideUI}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        </IconButton>
      </div>
    </div>
  );
}
