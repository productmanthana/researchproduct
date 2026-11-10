/** Search rewrites must never silently erase the user's output requirements. */
export function preserveReportRequirements(original:string,resolved:string) {
  const page=/\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)[ -]*pages?\b/i.exec(original);
  const words=/\b(\d{2,5})[ -]*words?\b/i.exec(original);
  const constraints:string[]=[];
  if(page)constraints.push(`Requested document length: ${page[1]} pages in total, including figures and references.`);
  if(words)constraints.push(`Requested text length: ${words[1]} words.`);
  if(/\b(?:diagram|figure|chart|plot|schematic)s?\b/i.test(original))constraints.push("Include the requested evidence-supported visuals; never fabricate measurements.");
  if(page||/\b(?:report|overview)\b/i.test(original))constraints.push("Prepare a developed research report with a relevant explanatory figure where supported.");
  return constraints.length?`${resolved}\n\nOutput requirements (retain throughout processing):\n${constraints.join("\n")}`:resolved;
}
