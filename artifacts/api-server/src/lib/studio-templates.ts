import { layoutDescription } from "./studio-formatting";
// Profiles deliberately distinguish drafting guidance from publisher-certified templates.
const journal=(id:string,name:string,publisher:string,country:string,guidelines:string)=>({
  id,name,kind:"journal",publisher,country,guidelines,
  status:"Draft profile; verify current author guidelines. Quartile not verified.",
  requirements:["Title, authors and affiliations","Abstract and keywords","Introduction, methods, results, discussion and conclusion where appropriate","Numbered references; follow the journal's final citation instructions","Funding, competing interests, data availability and AI-use declarations","Do not invent results; mark missing research inputs"],
});
const profiles=[
  journal("ieee-access","IEEE Access","IEEE","USA","https://ieeeaccess.ieee.org/guide-for-authors/"),
  journal("ieee-energy","IEEE Transactions on Energy Conversion","IEEE","USA","https://ieee-pes.org/publications/transactions-on-energy-conversion/"),
  journal("ieee-sustainable","IEEE Transactions on Sustainable Energy","IEEE","USA","https://ieee-pes.org/publications/transactions-on-sustainable-energy/"),
  journal("ieee-industrial","IEEE Transactions on Industrial Informatics","IEEE","USA","https://www.ieee-ies.org/pubs/transactions-on-industrial-informatics"),
  journal("asme-energy-a","Journal of Energy Resources Technology, Part A: Sustainable and Renewable Energy","ASME","USA","https://journaltool.asme.org/home/JournalDescriptions.cfm?JournalID=41"),
  journal("sadhana","Sādhanā","Springer Nature","India","https://link.springer.com/journal/12046/submission-guidelines"),
  journal("jisc","Journal of the Indian Institute of Science","Springer Nature","India","https://link.springer.com/journal/41745/submission-guidelines"),
  journal("jiei","Journal of The Institution of Engineers (India): Series C","Springer Nature","India","https://link.springer.com/journal/40032/submission-guidelines"),
  journal("pramana","Pramana","Springer Nature","India","https://link.springer.com/journal/12043/submission-guidelines"),
  journal("current-science","Current Science","Current Science Association","India","https://www.currentscience.ac.in/"),
  journal("applied-energy","Applied Energy","Elsevier","International","https://www.sciencedirect.com/journal/applied-energy/publish/guide-for-authors"),
  journal("renewable-energy","Renewable Energy","Elsevier","International","https://www.sciencedirect.com/journal/renewable-energy/publish/guide-for-authors"),
  {id:"harvard",name:"Harvard Griffin GSAS",kind:"thesis",publisher:"University",country:"USA",guidelines:"https://gsas.harvard.edu/resource/dissertation-formatting-guidance",status:"Guidance-based draft; departmental review required",requirements:["US Letter, margins at least 1 inch, 12-point Times New Roman, double-spaced body","Title page, copyright, abstract, contents, front matter, chapters, bibliography, appendices","Continuous or chapter-based figure/table numbering; distinguish preliminary Roman and body Arabic page numbers"]},
  {id:"stanford",name:"Stanford University",kind:"thesis",publisher:"University",country:"USA",guidelines:"https://studentservices.stanford.edu/format-requirements-your-dissertation-or-thesis",status:"Draft structure; verify department and registrar requirements",requirements:["Title page, abstract, contents, chapters, references and appendices","Consistent headings and figure/table references","Student and supervisor must verify final formatting"]},
  {id:"iit-bombay",name:"IIT Bombay",kind:"thesis",publisher:"University",country:"India",guidelines:"https://acad.iitb.ac.in/files/2024-04/Dissertation17june09-10.pdf",status:"Guidance-based draft; verify programme requirements",requirements:["Title, approval and declaration pages, abstract, contents, chapters, references and appendices","Actual approval signatures and completed research must be supplied by the author"]},
  {id:"research-synopsis",name:"Research synopsis",kind:"synopsis",publisher:"Academic",country:"International",guidelines:"https://gsas.harvard.edu/resource/dissertation-formatting-guidance",status:"General proposal structure, not an institution-approved synopsis",requirements:["Background, problem, gap, objectives, research questions","Proposed methodology, ethics, resources, timeline, expected contribution and references"]},
];
const checked="2026-11-08";
const rankings:Record<string,{quartile:string;year:number;category:string;sourceUrl:string}>={
  "ieee-access":{quartile:"Q1",year:2025,category:"Engineering (miscellaneous)",sourceUrl:"https://www.scimagojr.com/journalsearch.php?q=21100374601&tip=sid"},
  "ieee-energy":{quartile:"Q1",year:2025,category:"Energy Engineering and Power Technology",sourceUrl:"https://www.scimagojr.com/journalsearch.php?q=28824&tip=sid"},
  "ieee-sustainable":{quartile:"Q1",year:2025,category:"Renewable Energy, Sustainability and the Environment",sourceUrl:"https://www.scimagojr.com/journalsearch.php?q=19700177027&tip=sid"},
  "ieee-industrial":{quartile:"Q1",year:2025,category:"Control and Systems Engineering",sourceUrl:"https://www.scimagojr.com/journalsearch.php?q=144912&tip=sid"},
  jisc:{quartile:"Q2",year:2025,category:"Multidisciplinary",sourceUrl:"https://www.scimagojr.com/journalsearch.php?q=22447&tip=sid"},
  jiei:{quartile:"Q3",year:2025,category:"Mechanical Engineering",sourceUrl:"https://www.scimagojr.com/journalsearch.php?q=21100831410&tip=sid"},
  pramana:{quartile:"Q3",year:2025,category:"Physics and Astronomy (miscellaneous)",sourceUrl:"https://www.scimagojr.com/journalsearch.php?q=29642&tip=sid"},
  "renewable-energy":{quartile:"Q1",year:2025,category:"Renewable Energy, Sustainability and the Environment",sourceUrl:"https://www.scimagojr.com/journalsearch.php?q=27569&tip=sid"},
  "current-science":{quartile:"Q3",year:2025,category:"Multidisciplinary",sourceUrl:"https://www.scimagojr.com/journalsearch.php?q=20699&tip=sid"},
  sadhana:{quartile:"Q2",year:2025,category:"Multidisciplinary",sourceUrl:"https://www.scimagojr.com/journalsearch.php?q=23531&tip=sid"},
  "applied-energy":{quartile:"Q1",year:2025,category:"Energy (miscellaneous)",sourceUrl:"https://www.scimagojr.com/journalsearch.php?q=28801&tip=sid"},
};
const verified=new Set(["ieee-access","sadhana","jisc","jiei","pramana","applied-energy","harvard","stanford","iit-bombay"]);
export const studioTemplates=profiles.map(p=>({
  ...p,layoutDescription:layoutDescription(p.id),ranking:rankings[p.id],
  verifiedAt:verified.has(p.id)?checked:undefined,
  status:`${verified.has(p.id)?"Official guidance reviewed; supported layout rules applied":"Draft profile; final guidelines require review"}. Not a publisher/university approval.${p.kind==="journal"&&!rankings[p.id]?" Quartile not verified.":""}`,
  guidelines:p.id==="ieee-access"?"https://ieeeaccess.ieee.org/authors/submission-guidelines/":p.id==="stanford"?"https://studentservices.stanford.edu/my-academics/earn-my-degree/dissertations-and-theses/prepare-your-work-submission/format":p.id==="iit-bombay"?"https://acad.iitb.ac.in/sites/default/files/2024-04/Dissertation17june09-10.pdf":p.guidelines,
  officialTemplateUrl:p.id==="ieee-access"?"https://ieeeaccess.ieee.org/wp-content/uploads/2025/08/Access-Template-2024.docx":undefined,
  requirements:p.id==="stanford"?["US Letter, 10–12 point standard font, 1.5 inch left margin and 1 inch other margins; 1.5 or double-spaced body","Uppercase title page; do not include copyright or signature pages (inserted by Stanford)","Preliminary numbering begins iv after the unnumbered title; body begins 1; review actual title-page wording"]:p.id==="iit-bombay"?["July 2025 guidance: A4, 12-point Times New Roman, 1.5-spaced body; no-header top 30 mm, bottom 22 mm, left 30 mm, right 20 mm","Title sheet, declaration with AI-use disclosure, abstract, contents, chapters, references; actual approval sheet only when required","500-word abstract; lower-case Roman preliminaries; Arabic body numbering; chapter-wise figures and tables"]:p.id==="sadhana"?["Double-spaced Word/LaTeX typescript; research and reviews within 20 pages","Short title, author names and affiliations; running title ≤60 characters; up to six keywords","Informative abstract, numbered sections, square-bracket numbered citations, funding and disclosure declarations"]:p.requirements,
}));
