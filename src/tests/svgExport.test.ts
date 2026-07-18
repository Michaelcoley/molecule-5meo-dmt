import { describe, it, expect } from 'vitest';
import { exportSceneToSVG } from '../export/svgExporter';

/** Minimal synthetic export scene (avoids needing a WebGL context in jsdom). */
function scene(aromaticMode: 'kekule' | 'delocalized') {
  return {
    width: 400,
    height: 300,
    aromaticMode,
    meta: { commonName: '5-MeO-DMT', fullName: '5-methoxy-N,N-dimethyltryptamine' },
    atoms: [
      { index: 0, element: 'C', color: 0x2b2b30, pxRadius: 20, ndc: { x: -0.3, y: 0, z: 0.1 }, depth: 0.1, radius: 0.26, world: {} },
      { index: 1, element: 'C', color: 0x2b2b30, pxRadius: 20, ndc: { x: 0.3, y: 0, z: -0.1 }, depth: -0.1, radius: 0.26, world: {} },
      { index: 2, element: 'O', color: 0xe8322a, pxRadius: 18, ndc: { x: 0.0, y: 0.5, z: 0.0 }, depth: 0, radius: 0.22, world: {} },
    ],
    bonds: [
      {
        index: 0, a: 0, b: 1, order: 2, aromatic: true,
        colorA: 0x2b2b30, colorB: 0x2b2b30,
        ndcA: { x: -0.3, y: 0, z: 0.1 }, ndcB: { x: 0.3, y: 0, z: -0.1 },
      },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe('SVG vector exporter', () => {
  it('emits a valid vector SVG with one circle per atom (not a raster image)', () => {
    const svg = exportSceneToSVG(scene('kekule'));
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).not.toContain('<image');
    expect(svg).not.toContain('data:image/png');
    const circles = (svg.match(/<circle/g) ?? []).length;
    expect(circles).toBe(3);
    expect(svg).toContain('radialGradient');
  });

  it('draws element labels only when requested', () => {
    expect(exportSceneToSVG(scene('kekule'), { labels: false })).not.toContain('<text');
    expect(exportSceneToSVG(scene('kekule'), { labels: true })).toContain('<text');
  });

  it('renders more bond lines in Kekulé mode than delocalised mode', () => {
    const kekule = (exportSceneToSVG(scene('kekule')).match(/<line/g) ?? []).length;
    const deloc = (exportSceneToSVG(scene('delocalized')).match(/<line/g) ?? []).length;
    expect(kekule).toBeGreaterThan(deloc);
  });
});
