/**
 * True vector (SVG) export. This does NOT embed a raster screenshot: it
 * re-projects the current camera view into 2D and emits vector circles
 * (with radial gradients for shading), vector bond lines/polygons, and text
 * labels, painted back-to-front by depth. The result is resolution-independent
 * line art that scales cleanly at any size.
 */

import type { MoleculeViewer } from '../three/MoleculeViewer';

type ExportScene = ReturnType<MoleculeViewer['getExportScene']>;

function hex(color: number): string {
  return '#' + color.toString(16).padStart(6, '0');
}

function shade(color: number, factor: number): string {
  const r = Math.min(255, Math.round(((color >> 16) & 0xff) * factor));
  const g = Math.min(255, Math.round(((color >> 8) & 0xff) * factor));
  const b = Math.min(255, Math.round((color & 0xff) * factor));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

interface Screen {
  x: number;
  y: number;
}

function toScreen(ndc: { x: number; y: number }, w: number, h: number): Screen {
  return { x: (ndc.x * 0.5 + 0.5) * w, y: (-ndc.y * 0.5 + 0.5) * h };
}

export function exportSceneToSVG(
  scene: ExportScene,
  opts: { labels?: boolean; background?: string | null } = {},
): string {
  const { width: w, height: h } = scene;
  const parts: string[] = [];

  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="Inter, system-ui, sans-serif">`,
  );
  parts.push(`<title>${scene.meta.commonName} — ${scene.meta.fullName}</title>`);

  // Gradient defs for each atom colour (soft top-left highlight).
  const gradientIds = new Map<number, string>();
  const defs: string[] = [];
  let gid = 0;
  for (const a of scene.atoms) {
    if (!gradientIds.has(a.color)) {
      const id = `atom-grad-${gid++}`;
      gradientIds.set(a.color, id);
      defs.push(
        `<radialGradient id="${id}" cx="0.35" cy="0.32" r="0.75">` +
          `<stop offset="0%" stop-color="${shade(a.color, 1.55)}"/>` +
          `<stop offset="55%" stop-color="${hex(a.color)}"/>` +
          `<stop offset="100%" stop-color="${shade(a.color, 0.55)}"/>` +
          `</radialGradient>`,
      );
    }
  }
  parts.push(`<defs>${defs.join('')}</defs>`);

  if (opts.background) parts.push(`<rect width="${w}" height="${h}" fill="${opts.background}"/>`);

  // Build a unified, depth-sorted draw list so bonds and atoms interleave
  // correctly (painter's algorithm, far to near).
  interface Item {
    depth: number;
    svg: string;
  }
  const items: Item[] = [];

  const atomByIndex = new Map(scene.atoms.map((a) => [a.index, a]));

  for (const b of scene.bonds) {
    const A = atomByIndex.get(b.a);
    const B = atomByIndex.get(b.b);
    if (!A || !B) continue;
    const sa = toScreen(b.ndcA, w, h);
    const sb = toScreen(b.ndcB, w, h);
    const midDepth = (b.ndcA.z + b.ndcB.z) / 2;
    const strokeW = Math.max(1.5, (A.pxRadius + B.pxRadius) * 0.28);
    const mx = (sa.x + sb.x) / 2;
    const my = (sa.y + sb.y) / 2;
    // Split colouring: each half tinted by its atom.
    let line =
      `<line x1="${sa.x.toFixed(1)}" y1="${sa.y.toFixed(1)}" x2="${mx.toFixed(1)}" y2="${my.toFixed(1)}" ` +
      `stroke="${hex(b.colorA)}" stroke-width="${strokeW.toFixed(1)}" stroke-linecap="round"/>` +
      `<line x1="${mx.toFixed(1)}" y1="${my.toFixed(1)}" x2="${sb.x.toFixed(1)}" y2="${sb.y.toFixed(1)}" ` +
      `stroke="${hex(b.colorB)}" stroke-width="${strokeW.toFixed(1)}" stroke-linecap="round"/>`;
    // Double bond in Kekulé mode: draw a parallel thinner line offset in-plane.
    if (b.order === 2 && !(b.aromatic && scene.aromaticMode === 'delocalized')) {
      const dx = sb.x - sa.x;
      const dy = sb.y - sa.y;
      const len = Math.hypot(dx, dy) || 1;
      const off = strokeW * 0.9;
      const ox = (-dy / len) * off;
      const oy = (dx / len) * off;
      line +=
        `<line x1="${(sa.x + ox).toFixed(1)}" y1="${(sa.y + oy).toFixed(1)}" ` +
        `x2="${(sb.x + ox).toFixed(1)}" y2="${(sb.y + oy).toFixed(1)}" ` +
        `stroke="${hex(b.colorA)}" stroke-width="${(strokeW * 0.5).toFixed(1)}" stroke-linecap="round" opacity="0.85"/>`;
    }
    items.push({ depth: midDepth, svg: line });
  }

  for (const a of scene.atoms) {
    const s = toScreen(a.ndc, w, h);
    const grad = gradientIds.get(a.color)!;
    let svg =
      `<circle cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="${a.pxRadius.toFixed(1)}" ` +
      `fill="url(#${grad})" stroke="${shade(a.color, 0.5)}" stroke-width="0.6"/>`;
    if (opts.labels) {
      svg +=
        `<text x="${s.x.toFixed(1)}" y="${(s.y + 3).toFixed(1)}" text-anchor="middle" ` +
        `font-size="${Math.max(7, a.pxRadius * 0.9).toFixed(0)}" fill="${
          a.element === 'H' || a.element === 'C' ? '#111' : '#fff'
        }" font-weight="600">${a.element}</text>`;
    }
    items.push({ depth: a.depth, svg });
  }

  items.sort((p, q) => q.depth - p.depth); // far (larger z) first
  for (const it of items) parts.push(it.svg);

  parts.push('</svg>');
  return parts.join('\n');
}
