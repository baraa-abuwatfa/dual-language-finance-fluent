type ChartOpts = { width: number; height: number; max: number; min?: number; padX?: number };

function points(values: readonly number[], { width, height, max, min = 0, padX = 0 }: ChartOpts) {
  const step = (width - padX * 2) / (values.length - 1);
  return values.map((v, i) => [padX + i * step, height - ((v - min) / (max - min)) * height] as const);
}

/** Builds a smooth SVG path through evenly spaced points. */
export function smoothPath(values: readonly number[], opts: ChartOpts) {
  const pts = points(values, opts);
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  return d;
}

export function areaPath(values: readonly number[], opts: ChartOpts) {
  const pts = points(values, opts);
  const first = pts[0][0];
  const last = pts[pts.length - 1][0];
  return `${smoothPath(values, opts)} L ${last} ${opts.height} L ${first} ${opts.height} Z`;
}
