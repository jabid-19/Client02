var fn = (function () {
  'use strict';

  var is_1 = is;
  is.fn      = isFunction;
  is.str     = isString;
  is.num     = isNumber;
  is.obj     = isObject;
  is.lit     = isLiteral;
  is.bol     = isBoolean;
  is.truthy  = isTruthy;
  is.falsy   = isFalsy;
  is.arr     = isArray;
  is.null    = isNull;
  is.def     = isDef;
  is.in      = isIn;
  is.promise = isPromise;
  is.stream  = isStream;

  function is(v){
    return function(d){
      return d == v
    }
  }

  function isFunction(d) {
    return typeof d == 'function'
  }

  function isBoolean(d) {
    return typeof d == 'boolean'
  }

  function isString(d) {
    return typeof d == 'string'
  }

  function isNumber(d) {
    return typeof d == 'number'
  }

  function isObject(d) {
    return typeof d == 'object'
  }

  function isLiteral(d) {
    return d.constructor == Object
  }

  function isTruthy(d) {
    return !!d == true
  }

  function isFalsy(d) {
    return !!d == false
  }

  function isArray(d) {
    return d instanceof Array
  }

  function isNull(d) {
    return d === null
  }

  function isDef(d) {
    return typeof d !== 'undefined'
  }

  function isPromise(d) {
    return d instanceof Promise
  }

  function isStream(d) {
    return !!(d && d.next)
  }

  function isIn(set) {
    return function(d){
      return !set ? false  
           : set.indexOf ? ~set.indexOf(d)
           : d in set
    }
  }

  var is$1 = /*#__PURE__*/Object.freeze({
    default: is_1,
    __moduleExports: is_1
  });

  var is$2 = ( is$1 && is_1 ) || is$1;

  var to = { 
    arr: toArray
  , obj: toObject
  };

  function toArray(d){
    return Array.prototype.slice.call(d, 0)
  }

  function toObject(d) {
    var by = 'id'
      ;

    return arguments.length == 1 
      ? (by = d, reduce)
      : reduce.apply(this, arguments)

    function reduce(p,v,i){
      if (i === 0) { p = {}; }
      p[is$2.fn(by) ? by(v, i) : v[by]] = v;
      return p
    }
  }
  var to_1 = to.arr;
  var to_2 = to.obj;

  var to$1 = /*#__PURE__*/Object.freeze({
    default: to,
    __moduleExports: to,
    arr: to_1,
    obj: to_2
  });

  var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  var client = typeof window != 'undefined';

  var client$1 = /*#__PURE__*/Object.freeze({
    default: client,
    __moduleExports: client
  });

  var client$2 = ( client$1 && client ) || client$1;

  var owner = client$2 ? /* istanbul ignore next */ window : commonjsGlobal;

  var owner$1 = /*#__PURE__*/Object.freeze({
    default: owner,
    __moduleExports: owner
  });

  var to$2 = ( to$1 && to ) || to$1;

  var owner$2 = ( owner$1 && owner ) || owner$1;

  var log = function log(ns){
    return function(d){
      if (!owner$2.console || !console.log.apply) { return d; }
      is$2.arr(arguments[2]) && (arguments[2] = arguments[2].length);
      var args = to$2.arr(arguments)
        , prefix = '[log][' + (new Date()).toISOString() + ']' + ns;

      args.unshift(prefix.grey ? prefix.grey : prefix);
      return console.log.apply(console, args), d
    }
  };

  var log$1 = /*#__PURE__*/Object.freeze({
    default: log,
    __moduleExports: log
  });

  var attr = function attr(name, value) {
    var args = arguments.length;
    
    return !is$2.str(name) && args == 2 ? attr(arguments[1]).call(this, arguments[0])
         : !is$2.str(name) && args == 3 ? attr(arguments[1], arguments[2]).call(this, arguments[0])
         :  function(el){
              var ctx = this || {};
              el = ctx.nodeName || is$2.fn(ctx.node) ? ctx : el;
              el = el.node ? el.node() : el;
              el = el.host || el;

              return args > 1 && value === false ? el.removeAttribute(name)
                   : args > 1                    ? (el.setAttribute(name, value), value)
                   : el.attributes.getNamedItem(name) 
                  && el.attributes.getNamedItem(name).value
            } 
  };

  var attr$1 = /*#__PURE__*/Object.freeze({
    default: attr,
    __moduleExports: attr
  });

  var lo = function lo(d){
    return (d || '').toLowerCase()
  };

  var lo$1 = /*#__PURE__*/Object.freeze({
    default: lo,
    __moduleExports: lo
  });

  var require$$0 = ( log$1 && log ) || log$1;

  var attr$2 = ( attr$1 && attr ) || attr$1;

  var lo$2 = ( lo$1 && lo ) || lo$1;

  var client_1 = function(ripple, ref) {
      if ( ref === void 0 ) ref = {};
      var dir = ref.dir; if ( dir === void 0 ) dir = ".";

      return log$2("creating"), ripple.require = (function (res) { return function (module) {
          if (module in res.headers.dependencies && ripple.resources[res.headers.dependencies[module]]) { return ripple(res.headers.dependencies[module]); }
          throw new Error(("Cannot find module: " + module + " for " + (res.name)));
      }; }), ripple.types["application/javascript"] = {
          header: header,
          selector: function (res) { return ((res.name) + ",[is~=\"" + (res.name) + "\"]"); },
          extract: function (el) { return (attr$2("is")(el) || "").split(" ").concat(lo$2(el.nodeName)); },
          ext: "*.js",
          shortname: function (path) { return basename(path).split(".").slice(0, -1).join("."); },
          check: function (res) { return is$2.fn(res.body); },
          load: !1,
          parse: function (res) {
              if ("cjs" == res.headers.format) {
                  var m = {
                      exports: {}
                  };
                  res.body(m, m.exports, ripple.require(res), {
                      env: {}
                  }), res.body = m.exports;
              }
              return res;
          }
      }, ripple;
  };

  var log$2 = require$$0("[ri/types/fn]"), header = "application/javascript";

  var basename;

  return client_1;

}());
