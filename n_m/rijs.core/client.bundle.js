var core = (function () {
	'use strict';

	var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

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

	var client = typeof window != 'undefined';

	var client$1 = /*#__PURE__*/Object.freeze({
		default: client,
		__moduleExports: client
	});

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

	var client$2 = ( client$1 && client ) || client$1;

	var is$2 = ( is$1 && is_1 ) || is$1;

	var colorfill_1 = colorfill();

	function colorfill(){
	  /* istanbul ignore next */
	  ['red', 'green', 'bold', 'grey', 'strip'].forEach(function(color) {
	    !is$2.str(String.prototype[color]) && Object.defineProperty(String.prototype, color, {
	      get: function() {
	        return String(this)
	      } 
	    });
	  });
	}

	var identity = function identity(d) {
	  return d
	};

	var identity$1 = /*#__PURE__*/Object.freeze({
		default: identity,
		__moduleExports: identity
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

	var keys = function keys(o) { 
	  return Object.keys(is$2.obj(o) || is$2.fn(o) ? o : {})
	};

	var keys$1 = /*#__PURE__*/Object.freeze({
		default: keys,
		__moduleExports: keys
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

	var keys$2 = ( keys$1 && keys ) || keys$1;

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
	      keys$2(o).map(function(k){ delete o[k]; });
	      keys$2(v).map(function(k){ o[k] = v[k]; });
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

	var datum = function datum(node){
	  return node.__data__
	};

	var datum$1 = /*#__PURE__*/Object.freeze({
		default: datum,
		__moduleExports: datum
	});

	var datum$2 = ( datum$1 && datum ) || datum$1;

	var from_1 = from;
	from.parent = fromParent;

	function from(o){
	  return function(k){
	    return key$2(k)(o)
	  }
	}

	function fromParent(k){
	  return datum$2(this.parentNode)[k]
	}

	var from$1 = /*#__PURE__*/Object.freeze({
		default: from_1,
		__moduleExports: from_1
	});

	var from$2 = ( from$1 && from_1 ) || from$1;

	var values = function values(o) {
	  return !o ? [] : keys$2(o).map(from$2(o))
	};

	var values$1 = /*#__PURE__*/Object.freeze({
		default: values,
		__moduleExports: values
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

	var to$2 = ( to$1 && to ) || to$1;

	var za = function az() {
	  return compare(to$2.arr(arguments))
	};

	function compare(keys){ 
	  return function(a, b){
	    if (!keys.length) { return 0 }
	    var k = keys[0]
	      , ka = key$2(k)(a) || ''
	      , kb = key$2(k)(b) || '';

	    return ka < kb ?  1 
	         : ka > kb ? -1 
	         : compare(keys.slice(1))(a, b)
	  }
	}

	var za$1 = /*#__PURE__*/Object.freeze({
		default: za,
		__moduleExports: za
	});

	var includes = function includes(pattern){
	  return function(d){
	    return d && d.indexOf && ~d.indexOf(pattern)
	  }
	};

	var includes$1 = /*#__PURE__*/Object.freeze({
		default: includes,
		__moduleExports: includes
	});

	var includes$2 = ( includes$1 && includes ) || includes$1;

	var text = {
	  header: 'text/plain'
	, check: function check(res){ return !includes$2('.html')(res.name) && !includes$2('.css')(res.name) && is$2.str(res.body) }
	};
	var text_1 = text.header;
	var text_2 = text.check;

	var text$1 = /*#__PURE__*/Object.freeze({
		default: text,
		__moduleExports: text,
		header: text_1,
		check: text_2
	});

	var owner = client$2 ? /* istanbul ignore next */ window : commonjsGlobal;

	var owner$1 = /*#__PURE__*/Object.freeze({
		default: owner,
		__moduleExports: owner
	});

	var owner$2 = ( owner$1 && owner ) || owner$1;

	var err = function err(ns){
	  return function(d){
	    if (!owner$2.console || !console.error.apply) { return d; }
	    is$2.arr(arguments[2]) && (arguments[2] = arguments[2].length);
	    var args = to$2.arr(arguments)
	      , prefix = '[err][' + (new Date()).toISOString() + ']' + ns;

	    args.unshift(prefix.red ? prefix.red : prefix);
	    return console.error.apply(console, args), d
	  }
	};

	var err$1 = /*#__PURE__*/Object.freeze({
		default: err,
		__moduleExports: err
	});

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

	var split = function split(delimiter){
	  return function(d){
	    return d.split(delimiter)
	  }
	};

	var split$1 = /*#__PURE__*/Object.freeze({
		default: split,
		__moduleExports: split
	});

	var split$2 = ( split$1 && split ) || split$1;

	var identity$2 = ( identity$1 && identity ) || identity$1;

	var DEBUG = strip((client$2 ? (owner$2.location.search.match(/debug=(.*?)(&|$)/) || [])[1] : key$2('process.env.DEBUG')(owner$2)) || '')
	  , whitelist = DEBUG.split(',').map(split$2('/'));

	var deb = function deb(ns){
	  return DEBUG == '*' || whitelist.some(matches(ns)) ? out : identity$2

	  function out(d){
	    if (!owner$2.console || !console.log.apply) { return d; }
	    is$2.arr(arguments[2]) && (arguments[2] = arguments[2].length);
	    var args = to$2.arr(arguments)
	      , prefix = '[deb][' + (new Date()).toISOString() + ']' + ns;

	    args.unshift(prefix.grey ? prefix.grey : prefix);
	    return console.log.apply(console, args), d
	  }
	};

	function matches(ns) {
	  ns = strip(ns).split('/');
	  return function(arr){
	    return arr.length == 1 ? arr[0] == ns[0]
	         : arr.length == 2 ? arr[0] == ns[0] && arr[1] == ns[1]
	                           : false 
	  }
	}

	function strip(str) {
	  return str.replace(/(\[|\])/g, '')
	}

	var deb$1 = /*#__PURE__*/Object.freeze({
		default: deb,
		__moduleExports: deb
	});

	var emitterify$2 = ( emitterify$1 && emitterify ) || emitterify$1;

	var header$2 = ( header$1 && header ) || header$1;

	var values$2 = ( values$1 && values ) || values$1;

	var za$2 = ( za$1 && za ) || za$1;

	var text$2 = ( text$1 && text ) || text$1;

	var require$$0$1 = ( err$1 && err ) || err$1;

	var require$$1 = ( log$1 && log ) || log$1;

	var require$$2 = ( deb$1 && deb ) || deb$1;

	var core = createCommonjsModule(function (module) {
	// -------------------------------------------
	// API: Gets or sets a resource
	// -------------------------------------------
	// ripple('name')     - returns the resource body if it exists
	// ripple('name')     - creates & returns resource if it doesn't exist
	// ripple('name', {}) - creates & returns resource, with specified name and body
	// ripple({ ... })    - creates & returns resource, with specified name, body and headers
	// ripple.resources   - returns raw resources
	// ripple.register    - alias for ripple
	// ripple.on          - event listener for changes - all resources
	// ripple('name').on  - event listener for changes - resource-specific

	module.exports = function core(ref){
	  if ( ref === void 0 ) ref = {};
	  var aliases = ref.aliases; if ( aliases === void 0 ) aliases = {};

	  log('creating');

	  ripple.resources = {};
	  ripple.link      = link(ripple);
	  ripple.register  = ripple;
	  ripple.types     = types();
	  return linkify(emitterify$2(ripple), aliases)

	  function ripple(name, body, headers){
	    return !name                                            ? ripple
	         : is$2.arr(name)                                     ? name.map(ripple)
	         : is$2.promise(name)                                 ? name.then(ripple).catch(err)
	         : is$2.obj(name) && !name.name                       ? ripple(values$2(name))
	         : is$2.fn(name)  &&  name.resources                  ? ripple(values$2(name.resources))
	         : is$2.str(name) && !body &&  ripple.resources[name] ? ripple.resources[name].body
	         : is$2.str(name) && !body && !ripple.resources[name] ? undefined
	         : is$2.str(name) &&  body                            ? register(ripple)({ name: name, body: body, headers: headers })
	         : is$2.obj(name)                                     ? register(ripple)(name)
	         : (err('could not find or create resource', name), false)
	  }
	};

	var register = function (ripple) { return function (ref) {
	  var name = ref.name;
	  var body = ref.body;
	  var headers = ref.headers; if ( headers === void 0 ) headers = {};

	  name = ripple.aliases.src[name] || name;
	  if (is$2.promise(body)) { return body.then(function (body) { return register(ripple)({ name: name, body: body, headers: headers }); }).catch(err) }
	  deb('registering', name);
	  var res = normalise(ripple)({ name: name, body: body, headers: headers });

	  if (!res) { return err('failed to register', name), false }
	  ripple.resources[name] = res;
	  ripple.emit('change', [name, { 
	    type: 'update'
	  , value: res.body
	  , time: now(res)
	  }]);

	  return ripple.resources[name].body
	}; };

	var normalise = function (ripple) { return function (res) {
	  if (!header$2('content-type')(res)) { values$2(ripple.types).sort(za$2('priority')).some(contentType(res)); }
	  if (!header$2('content-type')(res)) { return err('could not understand resource', res), false }
	  return parse(ripple)(res)
	}; };

	var parse = function (ripple) { return function (res) {
	  var type = header$2('content-type')(res);
	  if (!ripple.types[type]) { return err('could not understand type', type), false }
	  return (ripple.types[type].parse || identity$2)(res)
	}; };

	var contentType = function (res) { return function (type) { return type.check(res) && (res.headers['content-type'] = type.header); }; };

	var types = function () { return [text$2].reduce(to$2.obj('header'), 1); };

	var linkify = function (ripple, aliases) {
	  ripple.aliases = { dst: {}, src: {} };
	  for (var name in aliases)
	    { ripple.link(aliases[name], name); }
	  return ripple
	};

	var link = function (ripple) { return function (from, to) {
	  if (from in ripple.resources && to == ripple.aliases.src[from]) { return }
	  ripple.aliases.src[from] = to;
	  ripple.aliases.dst[to] = from;
	  Object.defineProperty(ripple.resources, from, { 
	    get: function get(){ return ripple.resources[to] } 
	  , set: function set(value){ ripple.resources[to] = value; } 
	  , configurable: true
	  });
	}; };

	var err = require$$0$1('[ri/core]')
	    , log = require$$1('[ri/core]')
	    , deb = require$$2('[ri/core]')
	    , now = function (d, t) { return (t = key$2('body.log.length')(d), is$2.num(t) ? t - 1 : t); };
	});

	return core;

}());
