import { Newspaper } from "lucide-react";
import { StudioPage } from "@/components/studio/studio-page";

export default function Page() {
  return <StudioPage cfg={{
    kind: "journal", saveKind: "journal", kicker: "Journal draft", title: "Shape a manuscript draft for a venue.",
    intro: "Choose a journal formatting profile, then generate a draft article structure from your topic and evidence. Profiles describe layout only; verify the venue's current guidelines yourself.",
    placeholder: "e.g. A review article on field arsenic test kits, aimed at an environmental science journal", cta: "Draft for this journal", templateKind: "journal", templateLabel: "Journal formatting profile",
    emptyArt: <Newspaper className="h-12 w-12 text-[hsl(var(--teal))] opacity-70" strokeWidth={1.2} />,
  }} />;
}
