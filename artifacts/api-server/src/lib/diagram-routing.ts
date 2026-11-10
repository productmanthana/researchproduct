export type Point = { x: number; y: number };
export type DiagramObstacle = { left: number; right: number; top: number; bottom: number };

export function crossesTextArea(a: Point, b: Point, box: DiagramObstacle): boolean {
  if (a.x === b.x) return a.x > box.left && a.x < box.right && Math.max(a.y, b.y) > box.top && Math.min(a.y, b.y) < box.bottom;
  if (a.y === b.y) return a.y > box.top && a.y < box.bottom && Math.max(a.x, b.x) > box.left && Math.min(a.x, b.x) < box.right;
  return true;
}

/** Orthogonal visibility-grid routing; node labels AND their external descriptions are obstacles. */
export function routeDiagramEdge(a: Point, b: Point, boxes: DiagramObstacle[], width: number, bottom: number): Point[] {
  const ports = (p: Point) => [
    { x: p.x - 194, y: p.y, tip: { x: p.x - 167, y: p.y } },
    { x: p.x + 194, y: p.y, tip: { x: p.x + 167, y: p.y } },
    { x: p.x, y: p.y - 114, tip: { x: p.x, y: p.y - 85 } },
  ];
  const clear = (p: Point, q: Point) => !boxes.some(box => crossesTextArea(p, q, box));
  const clearStub = (p: Point, q: Point, owner: Point) => !boxes.some(box =>
    !(owner.x > box.left && owner.x < box.right && owner.y > box.top && owner.y < box.bottom)
    && crossesTextArea(p, q, box));
  const candidates = ports(a).flatMap(start => ports(b).map(end => ({ start, end })))
    .filter(({ start, end }) => clearStub(start.tip, start, a) && clearStub(end, end.tip, b));
  const xs = [...new Set([36, width - 36, ...boxes.flatMap(r => [r.left - 14, r.right + 14]),
    ...candidates.flatMap(c => [c.start.x, c.end.x])])].sort((x, y) => x - y);
  const ys = [...new Set([158, bottom, ...boxes.flatMap(r => [r.top - 14, r.bottom + 14]),
    ...candidates.flatMap(c => [c.start.y, c.end.y])])].filter(y => y >= 158 && y <= bottom).sort((x, y) => x - y);
  const cols = xs.length;
  let best: { cost: number; points: Point[] } | undefined;
  for (const { start, end } of candidates) {
    const from = ys.indexOf(start.y) * cols + xs.indexOf(start.x);
    const to = ys.indexOf(end.y) * cols + xs.indexOf(end.x);
    if (from < 0 || to < 0) continue;
    const at = (index: number): Point => ({ x: xs[index % cols], y: ys[Math.floor(index / cols)] });
    const distance = (index: number) => Math.abs(at(index).x - end.x) + Math.abs(at(index).y - end.y);
    const costs = new Map([[from, 0]]), previous = new Map<number, number>();
    const queue = [from], closed = new Set<number>();
    while (queue.length) {
      queue.sort((i, j) => costs.get(i)! + distance(i) - costs.get(j)! - distance(j));
      const current = queue.shift()!;
      if (closed.has(current)) continue;
      if (current === to) {
        const indices = [to];
        while (indices.at(-1) !== from) indices.push(previous.get(indices.at(-1)!)!);
        const points = [start.tip, ...indices.reverse().map(at), end.tip];
        const simplified = points.filter((p, i) => !i || i === points.length - 1
          || !((points[i - 1].x === p.x && p.x === points[i + 1].x) || (points[i - 1].y === p.y && p.y === points[i + 1].y)));
        const cost = costs.get(to)! + simplified.length * 8;
        if (!best || cost < best.cost) best = { cost, points: simplified };
        break;
      }
      closed.add(current);
      const col = current % cols, row = Math.floor(current / cols);
      const neighbours = [col > 0 ? current - 1 : -1, col < cols - 1 ? current + 1 : -1,
        row > 0 ? current - cols : -1, row < ys.length - 1 ? current + cols : -1];
      for (const next of neighbours) {
        if (next < 0 || closed.has(next) || !clear(at(current), at(next))) continue;
        const cost = costs.get(current)! + Math.abs(at(current).x - at(next).x) + Math.abs(at(current).y - at(next).y);
        if (cost >= (costs.get(next) ?? Infinity)) continue;
        costs.set(next, cost); previous.set(next, current); queue.push(next);
      }
    }
  }
  // Never substitute a straight diagonal through text when routing cannot be completed.
  if (!best) throw new Error("Diagram connectors could not be routed clear of node text.");
  return best.points;
}
