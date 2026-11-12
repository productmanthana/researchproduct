import { Fragment, useMemo, type ReactNode } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import "./math.css";

/**
 * LaTeX found in generated manuscripts:
 *   display  \[ … \]   or  $$ … $$
 *   inline   \( … \)   or  $ … $  (only when the contents really look mathematical,
 *                                so currency amounts in prose stay untouched).
 */
const INLINE = /\\\(([\s\S]+?)\\\)|(?<![\\$])\$(?![\s$])([^$\n]+?)\$(?!\d)/g;
const DISPLAY_WHOLE = /^\s*(?:\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\])\s*$/;
const DISPLAY_ANY = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]/g;

const MATHY = /[\\^_{}=+\-<>≤≥≠±×÷·√∑∏∫∞∂∇πθλμρσφΔΩ]/;

function typeset(tex: string, display: boolean) {
  try {
    return katex.renderToString(tex.trim(), {
      displayMode: display, throwOnError: false, strict: false, trust: false,
      output: "htmlAndMathml", errorColor: "hsl(8 64% 44%)",
    });
  } catch {
    return null;
  }
}

/** One typeset expression. Falls back to the plain source if KaTeX cannot read it. */
export function MathTex({ tex, display = false }: { tex: string; display?: boolean }) {
  const html = useMemo(() => typeset(tex, display), [tex, display]);
  if (!html) return <span className="academic-math is-broken">{tex}</span>;
  return <span className={`academic-math${display ? " is-display" : ""}`} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** A block that is nothing but one display equation, or undefined for ordinary prose. */
export function displayMath(block: string): string | undefined {
  const match = DISPLAY_WHOLE.exec(block);
  if (!match) return undefined;
  const tex = (match[1] ?? match[2] ?? "").trim();
  return tex || undefined;
}

/** Splits a block so display equations sit between the prose that surrounds them. */
export function splitDisplayMath(block: string): { text?: string; tex?: string }[] {
  const parts: { text?: string; tex?: string }[] = [];
  let at = 0;
  for (const match of block.matchAll(DISPLAY_ANY)) {
    if (match.index == null) continue;
    if (match.index > at) parts.push({ text: block.slice(at, match.index) });
    parts.push({ tex: (match[1] ?? match[2] ?? "").trim() });
    at = match.index + match[0].length;
  }
  if (!parts.length) return [{ text: block }];
  if (at < block.length) parts.push({ text: block.slice(at) });
  return parts;
}

/** Inline equations inside text that still needs bold, citation and link rendering. */
export function inlineMath(text: string, renderText: (text: string) => ReactNode): ReactNode {
  if (!text.includes("\\(") && !text.includes("$")) return renderText(text);
  const nodes: ReactNode[] = [];
  let at = 0;
  for (const match of text.matchAll(INLINE)) {
    if (match.index == null) continue;
    const tex = match[1] ?? match[2] ?? "";
    if (match[2] !== undefined && !MATHY.test(tex)) continue;
    if (match.index > at) nodes.push(<Fragment key={nodes.length}>{renderText(text.slice(at, match.index))}</Fragment>);
    nodes.push(<MathTex key={nodes.length} tex={tex} />);
    at = match.index + match[0].length;
  }
  if (!nodes.length) return renderText(text);
  if (at < text.length) nodes.push(<Fragment key={nodes.length}>{renderText(text.slice(at))}</Fragment>);
  return <>{nodes}</>;
}
