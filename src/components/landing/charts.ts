/** Builds a smooth SVG path through evenly spaced points. */
export function smoothPath(values: number[], width: number, height: number, max: number, min = 0) {
  const step = width / (values.length - 1);
  const pts = values.map((v, i) => [i * step, height - ((v - min) / (max - min)) * height] as const);
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  return d;
}

export function areaPath(values: number[], width: number, height: number, max: number, min = 0) {
  return `${smoothPath(values, width, height, max, min)} L ${width} ${height} L 0 ${height} Z`;
}
