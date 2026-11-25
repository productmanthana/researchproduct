import { z } from "zod";
import { createCanvas, loadImage, type Image } from "@napi-rs/canvas";
import { jsonCall } from "./ai-json";

export type Callout = { label: string; x: number; y: number };
type Box = { x: number; y: number; w: number; h: number };

const Points = z.object({ points: z.array(z.object({ label: z.string(), x: z.number().min(0).max(1), y: z.number().min(0).max(1), visible: z.boolean() })) });
const RULES = `Grid lines are drawn every 0.1 of the image's width and height and numbered along the top and left edges (0.1 … 0.9). x and y are fractions (0–1) of that image's width and height, read off the grid to two decimals, and must land on a solid part of the named component as drawn, never on empty background or a neighbouring part. Set visible false when the component cannot be clearly identified; never guess a position.`;

/**
 * Finds where each named component appears in the generated picture (fractions of width/height):
 * a coarse pass on the whole picture, a zoomed pass around each point, then a snap off any background.
 */
export async function locateCallouts(png: Buffer, labels: string[]): Promise<Callout[]> {
  const image = await loadImage(png), full = { x: 0, y: 0, w: image.width, h: image.height };
  const coarse = await jsonCall(`You locate components in a technical illustration overlaid with a red reference grid. ${RULES} Where a part appears both in the main view and an enlarged inset, point at the clearer one.
Return JSON {"points":[{"label":"exact label as supplied","x":0.00,"y":0.00,"visible":true}]}.`,
    [{ type: "text", text: JSON.stringify({ labels }) }, gridded(image, full, image.width)]);
  const found = Points.parse(coarse.value).points.filter(p => p.visible && labels.includes(p.label)).map(({ label, x, y }) => ({ label, x, y }));
  const refined = await refine(image, found).catch(() => found);
  return snapToSubject(image, refined);
}

/** Each point gets a zoomed crop around it, so the second look can correct a nearby miss. */
async function refine(image: Image, callouts: Callout[]): Promise<Callout[]> {
  if (!callouts.length) return callouts;
  const crops = callouts.map(c => {
    const w = image.width * 0.3, h = image.height * 0.3;
    return { x: Math.min(Math.max(0, c.x * image.width - w / 2), image.width - w), y: Math.min(Math.max(0, c.y * image.height - h / 2), image.height - h), w, h };
  });
  const result = await jsonCall(`Each image is a zoomed crop of one technical illustration, overlaid with a red reference grid, and is preceded by the component it should show. ${RULES} Coordinates are fractions of that crop, not of the whole illustration. If the named component is not inside its crop, set visible false.
Return JSON {"points":[{"label":"exact label as supplied","x":0.00,"y":0.00,"visible":true}]} with one entry per crop, in order.`,
    callouts.flatMap((c, i) => [{ type: "text", text: `Crop ${i + 1}: ${c.label}` }, gridded(image, crops[i], 640)]));
  const points = Points.parse(result.value).points;
  return callouts.map((c, i) => {
    const p = points.find(p => p.label === c.label), box = crops[i];
    return p?.visible ? { label: c.label, x: (box.x + p.x * box.w) / image.width, y: (box.y + p.y * box.h) / image.height } : c;
  });
}

/** A region of the picture with a numbered 10×10 grid, so positions can be read rather than estimated. Only sent for locating. */
function gridded(image: Image, box: Box, outWidth: number) {
  const w = Math.round(outWidth), h = Math.round(outWidth * box.h / box.w);
  const canvas = createCanvas(w, h), ctx = canvas.getContext("2d");
  ctx.drawImage(image, box.x, box.y, box.w, box.h, 0, 0, w, h);
  ctx.strokeStyle = "rgba(220,0,0,0.55)"; ctx.lineWidth = 2; ctx.fillStyle = "#d00000"; ctx.font = "bold 20px sans-serif";
  for (let i = 1; i < 10; i++) {
    const x = w * i / 10, y = h * i / 10;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    ctx.fillText(`0.${i}`, x + 4, 22); ctx.fillText(`0.${i}`, 4, y - 6);
  }
  return { type: "image_url", image_url: { url: `data:image/png;base64,${canvas.toBuffer("image/png").toString("base64")}`, detail: "high" } };
}

/** A point that lands on plain background moves to the nearest drawn part within a short radius. Background is the row's colour at the picture edges. */
function snapToSubject(image: Image, callouts: Callout[]): Callout[] {
  const w = image.width, h = image.height;
  const canvas = createCanvas(w, h), ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const px = ctx.getImageData(0, 0, w, h).data;
  const at = (x: number, y: number) => { const i = (y * w + x) * 4; return [px[i], px[i + 1], px[i + 2]]; };
  const rowBackground = (y: number) => { const a = at(4, y), b = at(w - 5, y); return a.map((v, k) => (v + b[k]) / 2); };
  const background = (x: number, y: number) => { const p = at(x, y), bg = rowBackground(y); return p.every((v, k) => Math.abs(v - bg[k]) < 22); };
  const radius = Math.round(Math.min(w, h) * 0.12);
  return callouts.map(c => {
    const cx = Math.round(c.x * (w - 1)), cy = Math.round(c.y * (h - 1));
    if (!background(cx, cy)) return c;
    for (let r = 4; r <= radius; r += 4)
      for (let a = 0; a < 360; a += 10) {
        const x = Math.round(cx + r * Math.cos(a * Math.PI / 180)), y = Math.round(cy + r * Math.sin(a * Math.PI / 180));
        if (x >= 0 && y >= 0 && x < w && y < h && !background(x, y)) return { ...c, x: x / w, y: y / h };
      }
    return c;
  });
}

const GAP = 58, FONT = 26;

/** Draws the illustration with labels in side margins and leader lines to each component, like a textbook cutaway. */
export async function drawCallouts(png: Buffer, callouts: Callout[]): Promise<{ bytes: Buffer; width: number; height: number }> {
  const image = await loadImage(png);
  const probe = createCanvas(10, 10).getContext("2d");
  probe.font = `600 ${FONT}px sans-serif`;
  const MARGIN = Math.ceil(Math.max(200, ...callouts.map(c => probe.measureText(c.label).width)) + 60);
  const width = image.width + MARGIN * 2, height = image.height;
  const canvas = createCanvas(width, height), ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, width, height);
  ctx.drawImage(image, MARGIN, 0);
  ctx.font = `600 ${FONT}px sans-serif`; ctx.textBaseline = "middle";
  for (const side of ["left", "right"] as const) {
    const group = callouts.filter(c => (c.x < 0.5) === (side === "left")).sort((a, b) => a.y - b.y);
    // Spread labels vertically so none overlap, keeping each near its component's height.
    const ys: number[] = [];
    group.forEach((c, i) => ys.push(Math.max(c.y * height, (ys[i - 1] ?? 20) + (i ? GAP : 0))));
    for (let i = ys.length - 1, limit = height - 30; i >= 0; i--) { ys[i] = Math.min(ys[i], limit); limit = ys[i] - GAP; }
    group.forEach((c, i) => {
      const px = MARGIN + c.x * image.width, py = c.y * height, ly = ys[i];
      const text = c.label, tw = ctx.measureText(text).width;
      const tx = side === "left" ? MARGIN - 24 - tw : MARGIN + image.width + 24, anchor = side === "left" ? MARGIN - 14 : MARGIN + image.width + 14;
      ctx.strokeStyle = "#2f3e46"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(anchor, ly); ctx.lineTo(px, py); ctx.stroke();
      ctx.fillStyle = "#2f3e46"; ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#1d2b33"; ctx.fillText(text, Math.max(8, tx), ly);
    });
  }
  return { bytes: canvas.toBuffer("image/png"), width, height };
}
