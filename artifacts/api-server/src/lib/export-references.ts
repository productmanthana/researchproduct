type Source = { title?: string; url?: string; paperId?: string };
export type ExportReference = { number: number; citation: string; href?: string; linkLabel?: string };
const cleanTitle = (s: string) => s.replace(/\s+[—–-]\s*page\s+\d+\b/gi, "").replace(/\s+/g, " ").trim();
const normal = (s: string) => cleanTitle(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

function safeUrl(value?: string): string | undefined {
  try {
    const url = new URL(value ?? "");
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return;
    if (/^#(?:page|p)=\d+/i.test(url.hash)) url.hash = "";
    return url.href;
  } catch { return; }
}
function identityUrl(value: string): string {
  const url = new URL(value);
  url.searchParams.delete("page");
  return url.href.replace(/\/$/, "").toLowerCase();
}
function linkLabel(href: string) {
  const url = new URL(href);
  if (!/^(?:www\.)?doi\.org$/i.test(url.hostname)) return "View source";
  try { return `DOI: ${decodeURIComponent(url.pathname.slice(1))}`; } catch { return "View DOI"; }
}
export function parseExportReference(text: string): ExportReference | undefined {
  const match = /^\[(\d+)\]\s+([\s\S]+)$/.exec(text.trim());
  if (!match) return;
  const raw = match[2].replace(/\s+Evidence:\s*[\s\S]*$/i, "").trim();
  const markdown = /\[([^\]]+)\]\((https?:\/\/\S+)\)\s*$/.exec(raw);
  // documentBlocks converts Markdown links to "label (URL)" for ordinary prose.
  const wrapped = markdown ? undefined : /(?:View source|View DOI|DOI:\s*\S+)\s+\((https?:\/\/\S+)\)\s*$/i.exec(raw);
  const plain = markdown || wrapped ? undefined : /https?:\/\/[^\s<>]+/i.exec(raw);
  const href = safeUrl(markdown?.[2] ?? wrapped?.[1] ?? plain?.[0].replace(/[.,;]+$/, ""));
  const citation = cleanTitle(markdown ? raw.slice(0, markdown.index) : wrapped ? raw.slice(0, wrapped.index) : plain ? raw.slice(0, plain.index) + raw.slice(plain.index + plain[0].length) : raw)
    .replace(/\s+([,.;])/g, "$1").trim();
  return { number: Number(match[1]), citation, href, linkLabel: href ? linkLabel(href) : undefined };
}

function remapCitations(text: string, map: Map<number, number>) {
  return text.replace(/\[(\d+(?:\s*(?:,|-|–)\s*\d+)*)\](?!\()/g, (original, inner: string) => {
    const values: number[] = [];
    for (const part of inner.split(",")) {
      const range = /^(\d+)\s*[-–]\s*(\d+)$/.exec(part.trim());
      if (range) {
        const low = Number(range[1]), high = Number(range[2]);
        if (high < low || high - low > 100) return original;
        for (let i = low; i <= high; i++) values.push(i);
      } else values.push(Number(part.trim()));
    }
    if (!values.every(value => map.has(value))) return original;
    return `[${[...new Set(values.map(value => map.get(value)!))].sort((a, b) => a - b).join(", ")}]`;
  });
}

/** Export-only transformation. Saved prose and page-specific evidence remain untouched. */
export function prepareExportReferences<T extends { content: string; metadata?: any }>(row: T): T {
  const heading = /^#{1,6}[ \t]+(?:References|Bibliography|Works cited|Reference list)[ \t]*:?[ \t]*$/im.exec(row.content);
  if (!heading) return row;
  const start = heading.index + heading[0].length;
  const tail = row.content.slice(start);
  const nextHeading = /^#{1,6}\s+/m.exec(tail);
  const end = nextHeading ? start + nextHeading.index : row.content.length;
  const bibliography = row.content.slice(start, end);
  const starts = [...bibliography.matchAll(/^[ \t]*\[(\d+)\][ \t]+/gm)];
  if (!starts.length) return row;
  const entries = starts.map((m, i) => parseExportReference(bibliography.slice(m.index, starts[i + 1]?.index ?? bibliography.length)))
    .filter((entry): entry is ExportReference => !!entry);
  if (!entries.length || entries.length !== starts.length) return row;
  const map = new Map<number, number>(), keys = new Map<string, number>(), unique: ExportReference[] = [];
  const sources: Source[] = row.metadata?.sources ?? [];
  for (const entry of entries) {
    const source = sources[entry.number - 1];
    // Do not trust positional metadata after the researcher has edited a bibliography.
    const matchesSource = source?.title && normal(entry.citation).includes(normal(source.title));
    const href = entry.href ?? (matchesSource ? safeUrl(source.url) : undefined);
    const doi = href && /^(?:www\.)?doi\.org$/i.test(new URL(href).hostname) ? new URL(href).pathname.toLowerCase() : undefined;
    const key = doi ? `doi:${doi}` : matchesSource && source.paperId ? `paper:${source.paperId}`
      : href ? `url:${identityUrl(href)}|${normal(entry.citation)}` : `citation:${normal(entry.citation)}`;
    let number = keys.get(key);
    if (!number) {
      number = unique.length + 1;
      keys.set(key, number);
      unique.push({ ...entry, number, href, linkLabel: href ? linkLabel(href) : undefined });
    }
    map.set(entry.number, number);
  }
  const formatted = unique.map(entry => {
    const link = entry.href ? ` [${entry.linkLabel}](${entry.href.replace(/\(/g, "%28").replace(/\)/g, "%29")})` : "";
    return `[${entry.number}] ${entry.citation}${link}`;
  }).join("\n\n");
  const prefix = remapCitations(row.content.slice(0, heading.index), map);
  const suffix = remapCitations(row.content.slice(end), map);
  const introduction = bibliography.slice(0, starts[0].index).trim();
  const content = `${prefix}${heading[0]}\n\n${introduction ? `${introduction}\n\n` : ""}${formatted}\n\n${suffix}`.trimEnd();
  const figures = row.metadata?.figures?.map((figure: any) => ({
    ...figure,
    ...Object.fromEntries(["caption", "explanation", "provenance"].filter(key => typeof figure[key] === "string")
      .map(key => [key, remapCitations(figure[key], map)])),
  }));
  return { ...row, content, ...(figures ? { metadata: { ...row.metadata, figures } } : {}) };
}
