"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.add = add;
exports.dict = exports.config = void 0;
exports.has = has;
exports.input = void 0;
exports.list = list;
exports.output = void 0;
exports.remove = remove;
var input = _interopRequireWildcard(require("./input/index.js"));
exports.input = input;
var output = _interopRequireWildcard(require("./output.js"));
exports.output = output;
var dict = _interopRequireWildcard(require("./dict.js"));
exports.dict = dict;
var config = _interopRequireWildcard(require("./config.js"));
exports.config = config;
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const registers = {
  input,
  output,
  dict,
  config
};
const indices = {};
function add(ref, plugins = {}) {
  const mainIndex = indices[ref] = {};
  for (const type in plugins) {
    if (type === 'config') {
      mainIndex.config = {
        [ref]: plugins.config
      };
      registers.config.add(ref, plugins.config);
      continue;
    }
    const typeIndex = mainIndex[type] = {};
    const typePlugins = plugins[type];
    for (const name in typePlugins) {
      const typePlugin = typePlugins[name];
      typeIndex[name] = true;
      registers[type].add(name, typePlugin);
    }
  }
}
function remove(ref) {
  const mainIndex = indices[ref];
  for (const type in mainIndex) {
    const typeIndex = mainIndex[type];
    for (const name in typeIndex) {
      registers[type].remove(name);
    }
  }
  delete indices[ref];
}
function has(ref) {
  return ref in indices;
}
function list() {
  return Object.keys(indices);
}