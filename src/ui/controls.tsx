import React from 'react';

export function Toggle(props: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="ctl-toggle" title={props.hint}>
      <span>{props.label}</span>
      <button
        role="switch"
        aria-checked={props.checked}
        aria-label={props.label}
        className={`switch ${props.checked ? 'on' : ''}`}
        onClick={() => props.onChange(!props.checked)}
      >
        <span className="knob" />
      </button>
    </label>
  );
}

export function Slider(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  const id = React.useId();
  return (
    <div className="ctl-slider">
      <label htmlFor={id}>
        <span>{props.label}</span>
        <output>{props.format ? props.format(props.value) : props.value.toFixed(2)}</output>
      </label>
      <input
        id={id}
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

export function Segmented<T extends string>(props: {
  label?: string;
  value: T;
  options: { value: T; label: string; title?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="ctl-segmented" role="group" aria-label={props.label}>
      {props.label && <div className="ctl-label">{props.label}</div>}
      <div className="seg-row">
        {props.options.map((o) => (
          <button
            key={o.value}
            className={o.value === props.value ? 'active' : ''}
            aria-pressed={o.value === props.value}
            title={o.title ?? o.label}
            onClick={() => props.onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function IconButton(props: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      className={`icon-btn ${props.active ? 'active' : ''}`}
      onClick={props.onClick}
      aria-label={props.label}
      aria-pressed={props.active}
      title={props.label}
    >
      {props.children}
    </button>
  );
}

export function Section(props: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="section" open={props.defaultOpen ?? true}>
      <summary>{props.title}</summary>
      <div className="section-body">{props.children}</div>
    </details>
  );
}
