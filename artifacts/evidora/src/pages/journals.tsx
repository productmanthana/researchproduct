import { Newspaper } from "lucide-react";
import { StudioPage } from "@/components/studio/studio-page";

export default function Page() {
  return <StudioPage cfg={{
    kind: "journal", saveKind: "journal", kicker: "Journal draft", title: "Write a draft for your journal.",
    intro: "Describe your topic and choose a journal, or start with a standard format. Add your name and institution when you’re ready. Review the journal’s latest instructions before submitting.",
    placeholder: "e.g. A review article on field arsenic test kits, aimed at an environmental science journal", cta: "Create journal draft", templateKind: "journal", templateLabel: "Choose a journal",
    emptyArt: <Newspaper className="h-12 w-12 text-[hsl(var(--teal))] opacity-70" strokeWidth={1.2} />,
  }} />;
}
