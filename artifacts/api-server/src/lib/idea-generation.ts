/** New ideation topics must not silently inherit the most recently saved idea. */
export function initialIdeaEvidence(request:{kind:string;prompt:string}) {
  // Do not turn an explicit close-reading/visual request into abstract-only work.
  return request.kind==="ideas"&&!/\b(?:full[- ]?text|full papers?|entire papers?|read (?:the |these |my )?(?:pdfs?|papers?)|inspect|figures?|diagrams?|images?|page[- ]by[- ]page)\b/i.test(request.prompt);
}

export function isFreshIdeaTopic(request:{kind:string;prompt:string;parentId?:string},hasSelectedIdea:boolean) {
  return request.kind==="ideas"&&!request.parentId&&!hasSelectedIdea&&
    !/\b(?:my|our|this|the|selected|saved|current|above)\s+(?:research\s+)?(?:ideas?|topic|project|references?|draft|documents?|uploads?)\b/i.test(request.prompt);
}

export function studioSearchQuestion(prompt:string,project:{name:string;description:string},selectedIdea:string,freshTopic:boolean) {
  return (freshTopic?prompt:
    `${prompt}\nProject topic: ${project.name}. ${project.description.slice(0,1500)}\nSelected idea: ${selectedIdea.slice(0,1500)}`).slice(0,5000);
}

export const IDEA_INSTRUCTIONS=`Produce exactly five distinct, developed and feasible research ideas in the ideas array, each with title/problem/question/method/feasibility.
The CURRENT user topic controls the subject. Do not silently reinterpret a broad power-generation topic as an old wind-turbine or education project. Use earlier project material only where genuinely relevant. For a broad topic propose diverse sub-directions, not five variants of an unrelated previous idea.
Aim for approximately 200–300 useful words PER idea across its four text fields, proportionate to the question and evidence. This is a development target, not permission to pad or invent facts.
problem: explain the concrete problem, why it is worth investigating, scope and a candidate gap to verify. Never say no studies or measured relationships exist unless evidence establishes that absence; missing evidence in this search proves nothing about global novelty.
question: a precise research question, followed by 2–3 testable objectives or a clearly labelled proposed hypothesis. Define the comparison and outcome.
method: a practical proposed protocol, data or simulation source, baseline/control, variables, evaluation measures and validation approach. Use clear short paragraphs or numbered steps. Distinguish supplied inputs from inputs still required.
feasibility: realistic equipment/data/software requirements, skills, resource assumptions, risks/ethics and a concrete first validation step; explain the intended contribution as expected, not achieved.
Write natural professional academic prose with domain-specific detail. Avoid generic filler and unsupported percentages, sample sizes, time estimates or completed results. Source-supported factual context can cite the supplied numbered references; proposed methods are plans, not established findings.
Use content for a concise topic framing and comparison of the five directions, not a second full copy of every card. These are proposed investigations, not proven novel discoveries.`;

export const IDEA_REVIEW_INSTRUCTIONS=`
This is an IDEA SET. You MUST additionally return "ideas": exactly five corrected objects, each with title/problem/question/method/feasibility. Review every field in every idea against the request and evidence, not only the summary content. Preserve the five directions' useful objectives, detailed proposed protocol, validation and feasibility; do not reduce them to one-line disclaimers. Rephrase unsupported literature-absence claims as candidate gaps to investigate. Reject unrelated old-project topic drift. Keep all source citations consistent with supplied evidence, do not add new facts or achieved results.`;

export function invalidIdeaCitations(ideas:{problem:string;question:string;method:string;feasibility:string}[],sourceCount:number) {
  return ideas.some(idea=>[idea.problem,idea.question,idea.method,idea.feasibility].some(text=>
    [...text.matchAll(/\[(\d+)\]/g)].some(m=>Number(m[1])<1||Number(m[1])>sourceCount)));
}
