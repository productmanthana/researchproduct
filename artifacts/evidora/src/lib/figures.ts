import type { StudioItem } from "@workspace/api-client-react";

export type FigureKind = "diagram" | "line" | "bar" | "scatter" | "theory" | "original" | "illustration";
export type StudioFigure = {
  id: string; title: string; caption: string; kind: FigureKind; provenance: string;
  layout?: "process" | "neural" | "cycle" | "system" | "taxonomy"; explanation?: string;
  sourceId?: string; sourceQuote?: string; xLabel?: string; yLabel?: string;
  series?: { name: string; points: { x: number | string; y: number }[] }[];
  nodes?: { id: string; label: string }[];
  edges?: { from: string; to: string; label?: string }[];
  expression?: string; range?: { min: number; max: number };
  svgPath?: string; pngPath?: string;
};

export const FIGURE_MARKER = /^\s*\[\[figure:([A-Za-z0-9_-]+)\]\]\s*$/;
export const FIGURE_KIND_LABEL: Record<FigureKind, string> = {
  diagram: "Diagram", line: "Line graph", bar: "Bar chart", scatter: "Scatter plot", theory: "Theoretical curve", original: "Original visual", illustration: "AI illustration",
};

export function figuresOf(item?: StudioItem | null): StudioFigure[] {
  const raw = (item?.metadata as Record<string, unknown> | null | undefined)?.figures;
  if (!Array.isArray(raw)) return [];
  return raw.filter((f): f is StudioFigure => !!f && typeof f === "object" && typeof (f as StudioFigure).id === "string");
}

export function figureNoticesOf(item?: StudioItem | null): string[] {
  const raw = (item?.metadata as Record<string, unknown> | null | undefined)?.figureNotices;
  return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
}

/** Figure ids in the order their markers appear in the text. */
export function markerOrder(content: string): string[] {
  const out: string[] = [];
  for (const line of content.split("\n")) {
    const m = FIGURE_MARKER.exec(line);
    if (m && !out.includes(m[1])) out.push(m[1]);
  }
  return out;
}

export const isOriginalFigure = (f: StudioFigure) => f.kind === "original" || f.kind === "illustration";
export const isNumericFigure = (f: StudioFigure) => f.kind !== "diagram" && f.kind !== "original" && f.kind !== "illustration" && (!!f.series?.length || f.kind === "theory");

const FIGURE_WORDS = /\b(add|create|insert|put|make|draw|generate|include|plot|build|show)\b[^.?!]{0,60}\b(diagram|graph|chart|figure|plot|flow ?chart|schematic|theoretical curve|curve)s?\b|\bplot (of|for|showing)\b|\btheoretical curve\b/;
export const isFigureRequest = (text: string) => FIGURE_WORDS.test(text.toLowerCase());

/** Appended to figure requests so the generator never invents data. */
export const FIGURE_GUARD = "\n\nFigure rules: use only data, tables or equations given above or found in the project sources. If none are available, do not invent values; explain what data is needed instead.";

/** Isolates standalone marker lines as their own blocks, matching the backend's block splitter. */
export const isolateMarkers = (content: string) =>
  content.split("\n").map(l => (FIGURE_MARKER.test(l) ? `\n${l.trim()}\n` : l)).join("\n");

export const ROUTE_FOR_KIND: Record<string, string> = {
  ideas: "/ask", idea: "/ask", literature: "/literature", synopsis: "/synopsis", journal: "/journals", thesis: "/thesis", answer: "/ask",
};
