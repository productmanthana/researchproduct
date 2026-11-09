import "../ideas-conversation-workspace/_group.css";
import { AcademicAnswer } from "./_AcademicAnswer";

// Layout verification using the citation supplied in the user's screenshot.
const title="WIP: Integrating Generative AI into Project-Based Learning for Advanced Power Systems Analysis";
const content=`## References

[1] Anthony Robol, Robert J. Kerestes, April A. Dukes, Mary Besterfield-Sacre (2025). ${title}. IEEE Frontiers in Education Conference (FIE) https://doi.org/10.1109/fie63693.2025.11328632 Evidence: Abstract only

[2] Saved reference with a publisher webpage. https://example.org/article Evidence: Full text excerpt

[3] Saved reference without a source URL.

## Author review

These entries demonstrate reference presentation only; no new research claims are made.`;

export function References(){
  return <main className="min-h-screen bg-[hsl(var(--background))] px-5 py-8 text-[hsl(var(--foreground))] sm:px-12">
    <div className="mx-auto max-w-[820px]"><p className="mb-2 text-xs uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Evidora · Reference layout verification</p><h1 className="mb-5 font-serif text-3xl">Professional, linked references</h1>
      <AcademicAnswer content={content} inline={text=>text} referenceSources={[{title,url:"https://doi.org/10.1109/fie63693.2025.11328632"}]} linkCitations/>
    </div>
  </main>;
}
