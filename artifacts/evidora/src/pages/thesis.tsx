import { GraduationCap } from "lucide-react";
import { StudioPage } from "@/components/studio/studio-page";

export default function Page() {
  return <StudioPage cfg={{
    kind: "thesis", saveKind: "thesis", kicker: "Thesis draft", title: "Chapters, not a blank page.",
    intro: "A chapter-by-chapter thesis working draft grounded in your evidence. A full thesis is written and checked in separate parts and can take substantially longer than a chat answer. State a shorter word/page target if needed. Missing results and approvals remain placeholders; you remain the author.",
    placeholder: "e.g. MSc thesis: evaluating three arsenic removal filters in Nalanda district", cta: "Draft thesis chapters", templateKind: "thesis", templateLabel: "Institution formatting profile",
    emptyArt: <GraduationCap className="h-12 w-12 text-[hsl(var(--teal))] opacity-70" strokeWidth={1.2} />,
  }} />;
}
