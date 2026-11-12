import CSL from 'citeproc';
import { styles } from './styles.js';
import { locales } from './locales.js';
const proxied = Symbol.for('proxied');
const getWrapperProxy = function (original) {
  const proxy = function (state, entry) {
    if (state.sys.wrapBibliographyEntry) {
      const [prefix, postfix] = state.sys.wrapBibliographyEntry(this.system_id);
      entry = [prefix, entry, postfix].join('');
    }
    return original.call(this, state, entry);
  };
  proxy[proxied] = true;
  return proxy;
};
for (const format in CSL.Output.Formats) {
  const original = CSL.Output.Formats[format]['@bibliography/entry'];
  if (!original || original[proxied]) {
    continue;
  }
  CSL.Output.Formats[format]['@bibliography/entry'] = getWrapperProxy(original);
}
function retrieveLocale(locale) {
  if (locales.has(locale)) {
    return locales.get(locale);
  }
  const unnormalised = locale.replace('-', '_');
  if (locales.has(unnormalised)) {
    return locales.get(unnormalised);
  }
  return {};
}
const engines = {};
const fetchEngine = function (styleName, locale, styleXml, retrieveItem, retrieveLocale) {
  const engineHash = `${styleName}|${locale}`;
  let engine;
  if (engines[engineHash] instanceof CSL.Engine) {
    engine = engines[engineHash];
    engine.sys.retrieveItem = retrieveItem;
    engine.sys.wrapBibliographyEntry = undefined;
    engine.updateItems([]);
  } else {
    engine = engines[engineHash] = new CSL.Engine({
      retrieveLocale,
      retrieveItem
    }, styleXml, locale, true);
  }
  return engine;
};
const prepareEngine = function (data, styleName, locale, format) {
  if (!CSL.Output.Formats[format] || !CSL.Output.Formats[format]['@bibliography/entry']) {
    throw new TypeError(`Cannot find format '${format}'`);
  }
  if (!styles.has(styleName)) {
    throw new TypeError(`Cannot find style '${styleName}'`);
  }
  const items = data.reduce((store, entry) => {
    store[entry.id] = entry;
    return store;
  }, {});
  locale = locales.has(locale) ? locale : undefined;
  const callback = function (key) {
    if (Object.prototype.hasOwnProperty.call(items, key)) {
      return items[key];
    } else {
      throw new Error(`Cannot find entry with id '${key}'`);
    }
  };
  const engine = fetchEngine(styleName, locale, styles.get(styleName), callback, retrieveLocale);
  engine.setOutputFormat(format);
  engine.opt.development_extensions.wrap_url_and_doi = false;
  return engine;
};
export default prepareEngine;
export { fetchEngine };