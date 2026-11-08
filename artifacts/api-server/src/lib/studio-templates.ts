// Profiles deliberately distinguish drafting guidance from publisher-certified templates.
const journal=(id:string,name:string,publisher:string,country:string,guidelines:string)=>({
  id,name,kind:"journal",publisher,country,guidelines,
  status:"Draft profile; verify current author guidelines. Quartile not verified.",
  requirements:["Title, authors and affiliations","Abstract and keywords","Introduction, methods, results, discussion and conclusion where appropriate","Numbered references; follow the journal's final citation instructions","Funding, competing interests, data availability and AI-use declarations","Do not invent results; mark missing research inputs"],
});
export const studioTemplates=[
  journal("ieee-access","IEEE Access","IEEE","USA","https://ieeeaccess.ieee.org/guide-for-authors/"),
  journal("ieee-energy","IEEE Transactions on Energy Conversion","IEEE","USA","https://ieee-pes.org/publications/transactions-on-energy-conversion/"),
  journal("ieee-sustainable","IEEE Transactions on Sustainable Energy","IEEE","USA","https://ieee-pes.org/publications/transactions-on-sustainable-energy/"),
  journal("ieee-industrial","IEEE Transactions on Industrial Informatics","IEEE","USA","https://www.ieee-ies.org/pubs/transactions-on-industrial-informatics"),
  journal("asme-energy","Journal of Energy Resources Technology","ASME","USA","https://asmedigitalcollection.asme.org/energyresources"),
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
