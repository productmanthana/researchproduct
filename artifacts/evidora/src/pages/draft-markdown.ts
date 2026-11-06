export type MarkdownSection = {
  id: string;
  heading: string;
  title: string;
  bodyStart: number;
  bodyEnd: number;
  body: string;
  leading: string;
  trailing: string;
};

export function markdownSections(markdown: string): MarkdownSection[] {
  const headings: { heading: string; start: number; bodyStart: number }[] = [];
  const pattern = /^#{1,2}[ \t]+.+$/gm;
  for (const match of markdown.matchAll(pattern)) {
    if (match.index == null) continue;
    headings.push({ heading: match[0], start: match.index, bodyStart: match.index + match[0].length });
  }
  if (!headings.length) {
    return [editableSection("document", "Document", 0, markdown.length, markdown)];
  }

  const sections: MarkdownSection[] = [];
  if (headings[0].start > 0) {
    const preamble = markdown.slice(0, headings[0].start);
    sections.push(editableSection("preamble", "Document introduction", 0, headings[0].start, preamble));
  }
  const occurrences = new Map<string, number>();
  headings.forEach((item, index) => {
    const end = headings[index + 1]?.start ?? markdown.length;
    const rawBody = markdown.slice(item.bodyStart, end);
    const number = (occurrences.get(item.heading) ?? 0) + 1;
    occurrences.set(item.heading, number);
    sections.push(editableSection(`${item.heading}:${number}`, item.heading, item.bodyStart, end, rawBody));
  });
  return sections;
}

function editableSection(id: string, heading: string, bodyStart: number, bodyEnd: number, raw: string): MarkdownSection {
  const leading = /^(\r?\n*)/.exec(raw)?.[0] ?? "";
  const afterLeading = raw.slice(leading.length);
  const trailing = /(\r?\n*)$/.exec(afterLeading)?.[0] ?? "";
  const title = heading.replace(/^#{1,2}\s+/, "").replace(/^\d+\.\s*/, "").trim() || heading;
  return { id, heading, title, bodyStart, bodyEnd, body: afterLeading.slice(0, afterLeading.length - trailing.length), leading, trailing };
}

/** Replace only a selected section's text; retain every other original byte. */
export function replaceMarkdownSection(markdown: string, section: MarkdownSection, body: string) {
  return markdown.slice(0, section.bodyStart) + section.leading + body + section.trailing + markdown.slice(section.bodyEnd);
}
