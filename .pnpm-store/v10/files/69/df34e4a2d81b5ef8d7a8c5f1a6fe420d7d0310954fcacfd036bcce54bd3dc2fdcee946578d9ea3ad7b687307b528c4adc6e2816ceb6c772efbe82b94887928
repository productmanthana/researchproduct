import { util } from '@citation-js/core';
import prepareEngine from './engines.js';
function prepareCiteItem(citeItem) {
  return typeof citeItem === 'object' ? citeItem : {
    id: citeItem
  };
}
function prepareCitation(citation) {
  if (citation.citationItems) {
    return citation;
  }
  return {
    citationItems: [].concat(citation).map(prepareCiteItem),
    properties: {
      noteIndex: 0
    }
  };
}
function prepareCitations(context) {
  if (!context) {
    return [];
  }
  return context.map(prepareCitation);
}
export default function citation(data, options = {}) {
  const style = options.style || options.template || 'apa';
  const {
    lang,
    format = 'text'
  } = options;
  const ids = data.map(({
    id
  }) => id);
  const entries = options.entry ? options.entry : ids;
  if (options.downgradeCsl) {
    data = util.downgradeCsl(data);
  }
  const citeproc = prepareEngine(data, style, lang, format);
  const before = prepareCitations(options.citationsPre);
  const citation = prepareCitation(entries);
  const after = prepareCitations(options.citationsPost);
  const output = citeproc.rebuildProcessorState([...before, citation, ...after], format, []);
  return output[before.length][2];
}