/** Title-page lines a synopsis committee expects below the author: degree, department, guide and date. */
export function synopsisTitleLines(kind: string, d: Record<string, string | undefined>): string[] {
  if (kind !== "synopsis") return [];
  return [
    `Research synopsis submitted for ${d.degree || "[Degree required]"}`,
    d.department || "[Department required]",
    `Research guide: ${d.supervisor || "[Guide name required]"}`,
    ...(d.year ? [d.year] : []),
  ];
}
