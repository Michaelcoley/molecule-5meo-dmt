import { IconButton } from './controls';
import type { ViewPreset } from '../settings';

interface ToolbarProps {
  autoRotate: boolean;
  paused: boolean;
  cameraType: 'perspective' | 'orthographic';
  onToggleRotate: () => void;
  onTogglePause: () => void;
  onToggleCamera: () => void;
  onReset: () => void;
  onFit: () => void;
  onView: (v: ViewPreset) => void;
  onFullscreen: () => void;
  onTogglePanels: () => void;
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
        <IconButton label="Toggle panels" onClick={props.onTogglePanels}>≡</IconButton>
      </div>
    </div>
  );
}
