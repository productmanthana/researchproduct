import { BookOpenText } from "lucide-react";
import { StudioPage } from "@/components/studio/studio-page";

export default function Page() {
  return <StudioPage cfg={{
    kind: "literature", saveKind: "literature", kicker: "Literature review", title: "Map what is already known.",
    intro: "Turn your project papers, notes and new discoveries into a structured literature review with themes, gaps and references.",
    placeholder: "e.g. Community-led water testing for arsenic in rural Bihar: what has been tried and what still fails?", cta: "Write literature review", 
    emptyArt: <BookOpenText className="h-12 w-12 text-[hsl(var(--teal))] opacity-70" strokeWidth={1.2} />,
  }} />;
}
