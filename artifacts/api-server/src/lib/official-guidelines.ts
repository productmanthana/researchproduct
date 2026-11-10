import https from "node:https";
import dns from "node:dns";
import { isIP } from "node:net";
import { publicIPv4 } from "./open-full-text";
import { extractPages } from "./documents";
import { studioTemplates } from "./studio-templates";

export type OfficialGuidelines = {
  templateId?: string; templateName?: string; sourceUrl?: string; fetchedAt?: string;
  status: "retrieved" | "unavailable" | "not_selected" | "user_supplied";
  text: string; message: string; coverage: string;
};
const cache = new Map<string, { expires: number; value: OfficialGuidelines }>();
/** Pinned public DNS, bounded body/deadline and revalidated redirects; never fetch user-supplied URLs. */
export async function downloadOfficialRules(address: string, redirects = 0, deadline = Date.now() + 15000): Promise<Buffer> {
  const url = new URL(address);
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")
    || redirects > 4 || Date.now() >= deadline || url.hostname.includes(":")
    || (isIP(url.hostname) && !publicIPv4(url.hostname))) return Promise.reject(new Error("Unsafe or expired official-source request"));
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      family: 4, headers: { "User-Agent": "EvidoraResearch/1.0 (submission instructions)", Accept: "text/html,application/pdf,text/plain" },
      lookup: (hostname, options, callback) => dns.lookup(hostname, { family: 4, all: true }, (error, addresses) => {
        if (error) return callback(error, "", 4);
        if (!addresses.length || addresses.some(a => !publicIPv4(a.address))) return callback(new Error("Private address rejected"), "", 4);
        if (typeof options === "object" && options.all) (callback as any)(null, addresses);
        else callback(null, addresses[0].address, 4);
      }),
    }, response => {
      response.on("error", reject);
      if ([301, 302, 303, 307, 308].includes(response.statusCode ?? 0) && response.headers.location) {
        response.resume();
        void downloadOfficialRules(new URL(response.headers.location, url).href, redirects + 1, deadline).then(resolve, reject); return;
      }
      if (response.statusCode !== 200) { response.resume(); reject(new Error(`Official website returned HTTP ${response.statusCode}`)); return; }
      let size = 0; const chunks: Buffer[] = [];
      response.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > 8 * 1024 * 1024) { response.destroy(new Error("Official source exceeds 8 MB")); return; }
        chunks.push(chunk);
      });
      response.on("end", () => resolve(Buffer.concat(chunks)));
    });
    const timer = setTimeout(() => request.destroy(new Error("Official-source request timed out")), Math.max(1, deadline - Date.now()));
    request.on("close", () => clearTimeout(timer)); request.on("error", reject);
  });
}
export function readableRules(html: string): string {
  return html.replace(/<(script|style|nav|footer|head)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(?:p|div|li|h[1-6]|tr)>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#(x[\da-f]+|\d+);/gi,(_,code:string)=>{const n=code[0].toLowerCase()==="x"?parseInt(code.slice(1),16):Number(code);return n>0&&n<=0x10ffff?String.fromCodePoint(n):"";})
    .replace(/&(ndash|mdash|lsquo|rsquo|ldquo|rdquo|hellip);/g,(_,name:string)=>({ndash:"–",mdash:"—",lsquo:"‘",rsquo:"’",ldquo:"“",rdquo:"”",hellip:"…"}[name]!))
    .replace(/[ \t]+/g, " ").replace(/\n\s*\n/g, "\n").trim();
}
export async function loadOfficialGuidelines(templateId?: string, downloader = downloadOfficialRules): Promise<OfficialGuidelines> {
  const template = studioTemplates.find(t => t.id === templateId);
  if (!template) return { status: "not_selected", text: "", message: "Choose a journal or university to check its submission requirements.", coverage: "No target selected." };
  const previous = cache.get(template.id);
  if (downloader===downloadOfficialRules && previous && previous.expires > Date.now()) return previous.value;
  const base = { templateId: template.id, templateName: template.name, sourceUrl: template.guidelines };
  try {
    const bytes = await downloader(template.guidelines);
    const text = bytes.subarray(0, 5).toString() === "%PDF-"
      ? (await extractPages(bytes)).map(p => p.text).join("\n\n") : readableRules(bytes.toString("utf8"));
    if (text.length < 500 || /just a moment|verify you are human|access denied|captcha|enable javascript and cookies/i.test(text.slice(0, 5000)))
      throw new Error("The official website did not return readable instructions");
    const value: OfficialGuidelines = { ...base, status: "retrieved", text: text.slice(0, 48000), fetchedAt: new Date().toISOString(),
      message: "Official submission instructions retrieved. Extracted checks are limited to the readable source; linked documents and departmental variations may add requirements.",
      coverage: `Read ${Math.min(text.length, 48000)} characters from the selected official source${text.length > 48000 ? "; source was truncated" : ""}. Not a certification of full compliance.` };
    if (cache.size >= 32) cache.delete(cache.keys().next().value!);
    if(downloader===downloadOfficialRules)cache.set(template.id, { expires: Date.now() + 6 * 3600000, value }); return value;
  } catch {
    return { ...base, status: "unavailable", text: "", message: "The official instructions could not be retrieved. Saved layout settings remain available, but current requirements have not been confirmed. Open the official source and supply its instructions for review.", coverage: "Official-source check unavailable; no current-compliance claim." };
  }
}
