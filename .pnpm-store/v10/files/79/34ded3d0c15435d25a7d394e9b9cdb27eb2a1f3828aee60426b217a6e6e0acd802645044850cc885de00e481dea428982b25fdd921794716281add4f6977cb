"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var log = _interopRequireWildcard(require("./log.js"));
var options = _interopRequireWildcard(require("./options.js"));
var set = _interopRequireWildcard(require("./set.js"));
var sort = _interopRequireWildcard(require("./sort.js"));
var get = _interopRequireWildcard(require("./get.js"));
var staticMethods = _interopRequireWildcard(require("./static.js"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function Cite(data, options = {}) {
  if (!(this instanceof Cite)) {
    return new Cite(data, options);
  }
  this._options = options;
  this.log = [];
  this.data = [];
  this.set(data, options);
  this.options(options);
  return this;
}
Object.assign(Cite.prototype, log, options, set, sort, get);
Cite.prototype[Symbol.iterator] = function* () {
  yield* this.data;
};
Object.assign(Cite, staticMethods);
var _default = exports.default = Cite;