import { ScrollText } from "lucide-react";
import { StudioPage } from "@/components/studio/studio-page";

export default function Page() {
  return <StudioPage cfg={{
    kind: "synopsis", saveKind: "synopsis", kicker: "Synopsis", title: "A synopsis your guide can read in ten minutes.",
    intro: "Background, problem, objectives, method and timeline drafted from your idea and evidence. Pick your institution's profile if it is listed.",
    placeholder: "e.g. My PhD synopsis on low-cost arsenic sensors for village wells", cta: "Draft synopsis", templateKind: "synopsis", templateLabel: "Institution formatting profile",
    emptyArt: <ScrollText className="h-12 w-12 text-[hsl(var(--teal))] opacity-70" strokeWidth={1.2} />,
  }} />;
}
