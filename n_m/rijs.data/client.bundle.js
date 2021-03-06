var data = (function () {
	'use strict';

	var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function commonjsRequire () {
		throw new Error('Dynamic requires are not currently supported by rollup-plugin-commonjs');
	}

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

	var keys = function keys(o) { 
	  return Object.keys(is$2.obj(o) || is$2.fn(o) ? o : {})
	};

	var keys$1 = /*#__PURE__*/Object.freeze({
		default: keys,
		__moduleExports: keys
	});

	var copy = function copy(from, to){ 
	  return function(d){ 
	    return to[d] = from[d], d
	  }
	};

	var copy$1 = /*#__PURE__*/Object.freeze({
		default: copy,
		__moduleExports: copy
	});

	var dir = ( keys$1 && keys ) || keys$1;

	var copy$2 = ( copy$1 && copy ) || copy$1;

	var overwrite = function overwrite(to){ 
	  return function(from){
	    dir(from)
	      .map(copy$2(from, to));
	        
	    return to
	  }
	};

	var overwrite$1 = /*#__PURE__*/Object.freeze({
		default: overwrite,
		__moduleExports: overwrite
	});

	var wrap = function wrap(d){
	  return function(){
	    return d
	  }
	};

	var wrap$1 = /*#__PURE__*/Object.freeze({
		default: wrap,
		__moduleExports: wrap
	});

	var str = function str(d){
	  return d === 0 ? '0'
	       : !d ? ''
	       : is$2.fn(d) ? '' + d
	       : is$2.obj(d) ? JSON.stringify(d)
	       : String(d)
	};

	var str$1 = /*#__PURE__*/Object.freeze({
		default: str,
		__moduleExports: str
	});

	var wrap$2 = ( wrap$1 && wrap ) || wrap$1;

	var str$2 = ( str$1 && str ) || str$1;

	var key = function key(k, v){ 
	  var set = arguments.length > 1
	    , keys = is$2.fn(k) ? [] : str$2(k).split('.').filter(Boolean)
	    , root = keys.shift();

	  return function deep(o, i){
	    var masked = {};
	    
	    return !o ? undefined 
	         : !is$2.num(k) && !k ? (set ? replace(o, v) : o)
	         : is$2.arr(k) ? (k.map(copy), masked)
	         : o[k] || !keys.length ? (set ? ((o[k] = is$2.fn(v) ? v(o[k], i) : v), o)
	                                       :  (is$2.fn(k) ? k(o) : o[k]))
	                                : (set ? (key(keys.join('.'), v)(o[root] ? o[root] : (o[root] = {})), o)
	                                       :  key(keys.join('.'))(o[root]))

	    function copy(k){
	      var val = key(k)(o);
	      val = is$2.fn(v)       ? v(val) 
	          : val == undefined ? v
	                           : val;
	    if (val != undefined) 
	        { key(k, is$2.fn(val) ? wrap$2(val) : val)(masked); }
	    }

	    function replace(o, v) {
	      dir(o).map(function(k){ delete o[k]; });
	      dir(v).map(function(k){ o[k] = v[k]; });
	      return o
	    }
	  }
	};

	var key$1 = /*#__PURE__*/Object.freeze({
		default: key,
		__moduleExports: key
	});

	var key$2 = ( key$1 && key ) || key$1;

	var header = function header(header$1, value) {
	  var getter = arguments.length == 1;
	  return function(d){ 
	    return !d || !d.headers ? null
	         : getter ? key$2(header$1)(d.headers)
	                  : key$2(header$1)(d.headers) == value
	  }
	};

	var header$1 = /*#__PURE__*/Object.freeze({
		default: header,
		__moduleExports: header
	});

	var not = function not(fn){
	  return function(){
	    return !fn.apply(this, arguments)
	  }
	};

	var not$1 = /*#__PURE__*/Object.freeze({
		default: not,
		__moduleExports: not
	});

	var not$2 = ( not$1 && not ) || not$1;

	var extend = function extend(to){ 
	  return function(from){
	    dir(from)
	      .filter(not$2(is$2.in(to)))
	      .map(copy$2(from, to));

	    return to
	  }
	};

	var extend$1 = /*#__PURE__*/Object.freeze({
		default: extend,
		__moduleExports: extend
	});

	var merge_1 = merge;

	function merge(to){ 
	  return function(from){
	    for (x in from) 
	      { is$2.obj(from[x]) && is$2.obj(to[x])
	        ? merge(to[x])(from[x])
	        : (to[x] = from[x]); }
	    return to
	  }
	}

	var merge$1 = /*#__PURE__*/Object.freeze({
		default: merge_1,
		__moduleExports: merge_1
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

	var promise_1 = promise;

	function promise() {
	  var resolve
	    , reject
	    , p = new Promise(function(res, rej){ 
	        resolve = res, reject = rej;
	      });

	  arguments.length && resolve(arguments[0]);
	  p.resolve = resolve;
	  p.reject  = reject;
	  return p
	}

	var promise$1 = /*#__PURE__*/Object.freeze({
		default: promise_1,
		__moduleExports: promise_1
	});

	var flatten = function flatten(p,v){ 
	  if (v instanceof Array) { v = v.reduce(flatten, []); }
	  return (p = p || []), p.concat(v) 
	};

	var flatten$1 = /*#__PURE__*/Object.freeze({
		default: flatten,
		__moduleExports: flatten
	});

	var has = function has(o, k) {
	  return k in o
	};

	var has$1 = /*#__PURE__*/Object.freeze({
		default: has,
		__moduleExports: has
	});

	var has$2 = ( has$1 && has ) || has$1;

	var def = function def(o, p, v, w){
	  if (o.host && o.host.nodeName) { o = o.host; }
	  if (p.name) { v = p, p = p.name; }
	  !has$2(o, p) && Object.defineProperty(o, p, { value: v, writable: w });
	  return o[p]
	};

	var def$1 = /*#__PURE__*/Object.freeze({
		default: def,
		__moduleExports: def
	});

	var promise$2 = ( promise$1 && promise_1 ) || promise$1;

	var flatten$2 = ( flatten$1 && flatten ) || flatten$1;

	var def$2 = ( def$1 && def ) || def$1;

	var noop = function(){};

	var emitterify = function emitterify(body, hooks) {
	  body = body || {};
	  hooks = hooks || {};
	  def$2(body, 'emit', emit, 1);
	  def$2(body, 'once', once, 1);
	  def$2(body, 'off', off, 1);
	  def$2(body, 'on', on, 1);
	  body.on['*'] = body.on['*'] || [];
	  return body

	  function emit(type, pm, filter) {
	    var li = body.on[type.split('.')[0]] || []
	      , results = [];

	    for (var i = 0; i < li.length; i++)
	      { if (!li[i].ns || !filter || filter(li[i].ns))
	        { results.push(call(li[i].isOnce ? li.splice(i--, 1)[0] : li[i], pm)); } }

	    for (var i = 0; i < body.on['*'].length; i++)
	      { results.push(call(body.on['*'][i], [type, pm])); }

	    return results.reduce(flatten$2, [])
	  }

	  function call(cb, pm){
	    return cb.next             ? cb.next(pm) 
	         : pm instanceof Array ? cb.apply(body, pm) 
	                               : cb.call(body, pm) 
	  }

	  function on(type, opts, isOnce) {
	    var id = type.split('.')[0]
	      , ns = type.split('.')[1]
	      , li = body.on[id] = body.on[id] || []
	      , cb = typeof opts == 'function' ? opts : 0;

	    return !cb &&  ns ? (cb = body.on[id]['$'+ns]) ? cb : push(observable(body, opts))
	         : !cb && !ns ? push(observable(body, opts))
	         :  cb &&  ns ? push((remove(li, body.on[id]['$'+ns] || -1), cb))
	         :  cb && !ns ? push(cb)
	                      : false

	    function push(cb){
	      cb.isOnce = isOnce;
	      cb.type = id;
	      if (ns) { body.on[id]['$'+(cb.ns = ns)] = cb; }
	      li.push(cb)
	      ;(hooks.on || noop)(cb);
	      return cb.next ? cb : body
	    }
	  }

	  function once(type, callback){
	    return body.on(type, callback, true)
	  }

	  function remove(li, cb) {
	    var i = li.length;
	    while (~--i) 
	      { if (cb == li[i] || cb == li[i].fn || !cb)
	        { (hooks.off || noop)(li.splice(i, 1)[0]); } }
	  }

	  function off(type, cb) {
	    remove((body.on[type] || []), cb);
	    if (cb && cb.ns) { delete body.on[type]['$'+cb.ns]; }
	    return body
	  }

	  function observable(parent, opts) {
	    opts = opts || {};
	    var o = emitterify(opts.base || promise$2());
	    o.i = 0;
	    o.li = [];
	    o.fn = opts.fn;
	    o.parent = parent;
	    o.source = opts.fn ? o.parent.source : o;
	    
	    o.on('stop', function(reason){
	      o.type
	        ? o.parent.off(o.type, o)
	        : o.parent.off(o);
	      return o.reason = reason
	    });

	    o.each = function(fn) {
	      var n = fn.next ? fn : observable(o, { fn: fn });
	      o.li.push(n);
	      return n
	    };

	    o.pipe = function(fn) {
	      return fn(o)
	    };

	    o.map = function(fn){
	      return o.each(function(d, i, n){ return n.next(fn(d, i, n)) })
	    };

	    o.filter = function(fn){
	      return o.each(function(d, i, n){ return fn(d, i, n) && n.next(d) })
	    };

	    o.reduce = function(fn, acc) {
	      return o.each(function(d, i, n){ return n.next(acc = fn(acc, d, i, n)) })
	    };

	    o.unpromise = function(){ 
	      var n = observable(o, { base: {}, fn: function(d){ return n.next(d) } });
	      o.li.push(n);
	      return n
	    };

	    o.next = function(value) {
	      o.resolve && o.resolve(value);
	      return o.li.length 
	           ? o.li.map(function(n){ return n.fn(value, n.i++, n) })
	           : value
	    };

	    o.until = function(stop){
	      return !stop     ? 0
	           : stop.each ? stop.each(o.stop) // TODO: check clean up on stop too
	           : stop.then ? stop.then(o.stop)
	           : stop.call ? o.filter(stop).map(o.stop)
	                       : 0
	    };

	    o.off = function(fn){
	      return remove(o.li, fn), o
	    };

	    o.start = function(stop){
	      o.until(stop);
	      o.source.emit('start');
	      return o
	    };

	    o.stop = function(reason){
	      return o.source.emit('stop', reason)
	    };

	    o[Symbol.asyncIterator] = function(){ 
	      return { 
	        next: function(){ 
	          return o.wait = new Promise(function(resolve){
	            o.wait = true;
	            o.map(function(d, i, n){
	              delete o.wait;
	              o.off(n);
	              resolve({ value: d, done: false });
	            });
	            o.emit('pull', o);
	          })
	        }
	      }
	    };

	    return o
	  }
	};

	var emitterify$1 = /*#__PURE__*/Object.freeze({
		default: emitterify,
		__moduleExports: emitterify
	});

	var emitterify$2 = ( emitterify$1 && emitterify ) || emitterify$1;

	var act = { add: add, update: update, remove: remove }
	  , str$3 = JSON.stringify
	  , parse = JSON.parse;

	var set = function set(d, skipEmit) {
	  return function(o, existing, max) {
	    if (!is$2.obj(o) && !is$2.fn(o))
	      { return o }

	    if (!is$2.obj(d)) { 
	      var log = existing || o.log || []
	        , root = o;

	      if (!is$2.def(max)) { max = log.max || 0; }
	      if (!max)    { log = []; }
	      if (max < 0) { log = log.concat(null); }
	      if (max > 0) {
	        var s = str$3(o);
	        root = parse(s); 
	        log = log.concat({ type: 'update', value: parse(s), time: log.length });
	      } 

	      def$2(log, 'max', max);
	      
	      root.log 
	        ? (root.log = log)
	        : def$2(emitterify$2(root, null), 'log', log, 1);

	      return root
	    }

	    if (is$2.def(d.key)) {
	      if (!apply(o, d.type, (d.key = '' + d.key).split('.').filter(Boolean), d.value))
	        { return false }
	    } else
	      { return false }

	    if (o.log && o.log.max) 
	      { o.log.push((d.time = o.log.length, o.log.max > 0 ? d : null)); }

	    if (!skipEmit && o.emit)
	      { o.emit('change', d); }

	    return o
	  }
	};

	function apply(body, type, path, value) {
	  var next = path.shift();

	  if (!act[type]) 
	    { return false }
	  if (path.length) { 
	    if (!(next in body)) 
	      { if (type == 'remove') { return true }
	      else { body[next] = {}; } }
	    return apply(body[next], type, path, value)
	  }
	  else {
	    return !act[type](body, next, value)
	  }
	}

	function add(o, k, v) {
	  is$2.arr(o) 
	    ? o.splice(k, 0, v) 
	    : (o[k] = v);
	}

	function update(o, k, v) {
	  if (!is$2.num(k) && !k) {
	    if (!is$2.obj(v)) { return true }
	    for (var x in o) { delete o[x]; }
	    for (var x in v) { o[x] = v[x]; }
	  } else 
	    { o[k] = v; } 
	}

	function remove(o, k, v) { 
	  is$2.arr(o) 
	    ? o.splice(k, 1)
	    : delete o[k];
	}

	var set$1 = /*#__PURE__*/Object.freeze({
		default: set,
		__moduleExports: set
	});

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

	var overwrite$2 = ( overwrite$1 && overwrite ) || overwrite$1;

	var header$2 = ( header$1 && header ) || header$1;

	var extend$2 = ( extend$1 && extend ) || extend$1;

	var merge$2 = ( merge$1 && merge_1 ) || merge$1;

	var attr$2 = ( attr$1 && attr ) || attr$1;

	var set$2 = ( set$1 && set ) || set$1;

	var require$$0 = ( log$1 && log ) || log$1;

	// -------------------------------------------
	// Adds support for data resources
	// -------------------------------------------
	var data = function data(ripple){
	  log$2('creating');
	  ripple
	    .on('change.data')
	    .filter(function (ref) {
	      var name = ref[0];
	      var change = ref[1];

	      return header$2('content-type', 'application/data')(ripple.resources[name]);
	  })
	    .filter(function (ref) {
	      var name = ref[0];
	      var change = ref[1];

	      return change && change.key;
	  })
	    .map(function (ref) {
	      var name = ref[0];
	      var change = ref[1];

	      return ripple
	      .resources[name]
	      .body
	      .emit('change', (change || null), not$2(is$2.in(['bubble'])));
	  });

	  ripple.types['application/data'] = {
	    header: 'application/data'
	  , ext: '*.data.js'
	  , selector: function (res) { return ("[data~=\"" + (res.name) + "\"]"); }
	  , extract: function (el) { return (attr$2("data")(el) || '').split(' '); }
	  , check: function (res) { return is$2.obj(res.body); }
	  , load: function load(res) {
	      var exported = commonjsRequire(res.headers.path);
	      exported = exported.default || exported;
	      exported = is$2.fn(exported) ? exported(ripple) : exported;
	      res.headers['content-type'] = this.header;
	      ripple(merge$2(res)(exported));
	      return ripple.resources[res.name]
	    }
	  , parse: function parse(res){ 
	      var existing = ripple.resources[res.name] || {};

	      extend$2(res.headers)(existing.headers);
	      res.body = set$2()(
	        res.body || []
	      , existing.body && existing.body.log
	      , is$2.num(res.headers.log) ? res.headers.log : -1
	      );
	      overwrite$2(res.body.on)(listeners(existing));
	      res.body.on('change.bubble', function (change) {
	        ripple.emit('change', ripple.change = [res.name, change], not$2(is$2.in(['data'])));
	        delete ripple.change;
	      });

	      if (res.headers.loaded && !res.headers.loading)
	        { res.headers.loading = Promise.resolve(res.headers.loaded(ripple, res))
	          .then(function () { 
	            delete res.headers.loading;
	            return res
	          }); }

	      return res
	    }
	  };

	  return ripple
	};

	var log$2 = require$$0('[ri/types/data]')
	    , listeners = key$2('body.on');

	return data;

}());
