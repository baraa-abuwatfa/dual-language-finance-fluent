type ChartOpts = { width: number; height: number; max: number; min?: number; padX?: number };
type Point = readonly [number, number];

function points(values: readonly number[], { width, height, max, min = 0, padX = 0 }: ChartOpts): Point[] {
  const step = (width - padX * 2) / Math.max(values.length - 1, 1);
  return values.map((v, i) => [padX + i * step, height - ((v - min) / (max - min)) * height] as const);
}

/** Builds a smooth SVG path through evenly spaced points. */
export function smoothPath(values: readonly number[], opts: ChartOpts) {
  const pts = points(values, opts);
  return pts.reduce((d, [x1, y1], i) => {
    const prev = pts[i - 1];
    if (!prev) return `M ${x1} ${y1}`;
    const [x0, y0] = prev;
    const cx = (x0 + x1) / 2;
    return `${d} C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }, "");
}

export function areaPath(values: readonly number[], opts: ChartOpts) {
  const pts = points(values, opts);
  const first = pts[0]?.[0] ?? 0;
  const last = pts.at(-1)?.[0] ?? opts.width;
  return `${smoothPath(values, opts)} L ${last} ${opts.height} L ${first} ${opts.height} Z`;
}
