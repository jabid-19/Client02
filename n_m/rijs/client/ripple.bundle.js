var rijs = (function () {
	'use strict';

	function commonjsRequire () {
		throw new Error('Dynamic requires are not currently supported by rollup-plugin-commonjs');
	}

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var client = typeof window != 'undefined';

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

	var flatten = function flatten(p,v){ 
	  if (v instanceof Array) { v = v.reduce(flatten, []); }
	  return p = p || [], p.concat(v) 
	};

	var has = function has(o, k) {
	  return k in o
	};

	var def = function def(o, p, v, w){
	  if (o.host && o.host.nodeName) { o = o.host; }
	  if (p.name) { v = p, p = p.name; }
	  !has(o, p) && Object.defineProperty(o, p, { value: v, writable: w });
	  return o[p]
	};

	var noop = function(){};

	var emitterify = function emitterify(body, hooks) {
	  body = body || {};
	  hooks = hooks || {};
	  def(body, 'emit', emit, 1);
	  def(body, 'once', once, 1);
	  def(body, 'off', off, 1);
	  def(body, 'on', on, 1);
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

	    return results.reduce(flatten, [])
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
	    var o = emitterify(opts.base || promise_1());
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
	      (stop.each || stop.then).call(stop, function(reason){ return o.source.emit('stop', reason) });
	      return o
	    };

	    o.off = function(fn){
	      return remove(o.li, fn), o
	    };

	    o.start = function(fn){
	      o.source.emit('start');
	      return o
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

	var colorfill_1 = colorfill();

	function colorfill(){
	  /* istanbul ignore next */
	  ['red', 'green', 'bold', 'grey', 'strip'].forEach(function(color) {
	    !is_1.str(String.prototype[color]) && Object.defineProperty(String.prototype, color, {
	      get: function() {
	        return String(this)
	      } 
	    });
	  });
	}

	var identity = function identity(d) {
	  return d
	};

	var wrap = function wrap(d){
	  return function(){
	    return d
	  }
	};

	var keys = function keys(o) { 
	  return Object.keys(is_1.obj(o) || is_1.fn(o) ? o : {})
	};

	var str = function str(d){
	  return d === 0 ? '0'
	       : !d ? ''
	       : is_1.fn(d) ? '' + d
	       : is_1.obj(d) ? JSON.stringify(d)
	       : String(d)
	};

	var key = function key(k, v){ 
	  var set = arguments.length > 1
	    , keys$$1 = is_1.fn(k) ? [] : str(k).split('.').filter(Boolean)
	    , root = keys$$1.shift();

	  return function deep(o, i){
	    var masked = {};
	    
	    return !o ? undefined 
	         : !is_1.num(k) && !k ? (set ? replace(o, v) : o)
	         : is_1.arr(k) ? (k.map(copy), masked)
	         : o[k] || !keys$$1.length ? (set ? (o[k] = is_1.fn(v) ? v(o[k], i) : v, o)
	                                       :  (is_1.fn(k) ? k(o) : o[k]))
	                                : (set ? (key(keys$$1.join('.'), v)(o[root] ? o[root] : (o[root] = {})), o)
	                                       :  key(keys$$1.join('.'))(o[root]))

	    function copy(k){
	      var val = key(k)(o);
	      val = is_1.fn(v)       ? v(val) 
	          : val == undefined ? v
	                           : val;
	    if (val != undefined) 
	        { key(k, is_1.fn(val) ? wrap(val) : val)(masked); }
	    }

	    function replace(o, v) {
	      keys(o).map(function(k){ delete o[k]; });
	      keys(v).map(function(k){ o[k] = v[k]; });
	      return o
	    }
	  }
	};

	var header = function header(header$1, value) {
	  var getter = arguments.length == 1;
	  return function(d){ 
	    return !d || !d.headers ? null
	         : getter ? key(header$1)(d.headers)
	                  : key(header$1)(d.headers) == value
	  }
	};

	var datum = function datum(node){
	  return node.__data__
	};

	var from_1 = from;
	from.parent = fromParent;

	function from(o){
	  return function(k){
	    return key(k)(o)
	  }
	}

	function fromParent(k){
	  return datum(this.parentNode)[k]
	}

	var values = function values(o) {
	  return !o ? [] : keys(o).map(from_1(o))
	};

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
	    p[is_1.fn(by) ? by(v, i) : v[by]] = v;
	    return p
	  }
	}

	var za = function az() {
	  return compare(to.arr(arguments))
	};

	function compare(keys){ 
	  return function(a, b){
	    if (!keys.length) { return 0 }
	    var k = keys[0]
	      , ka = key(k)(a) || ''
	      , kb = key(k)(b) || '';

	    return ka < kb ?  1 
	         : ka > kb ? -1 
	         : compare(keys.slice(1))(a, b)
	  }
	}

	var includes = function includes(pattern){
	  return function(d){
	    return d && d.indexOf && ~d.indexOf(pattern)
	  }
	};

	var text = {
	  header: 'text/plain'
	, check: function check(res){ return !includes('.html')(res.name) && !includes('.css')(res.name) && is_1.str(res.body) }
	};

	var owner = client ? /* istanbul ignore next */ window : global;

	var err = function err(ns){
	  return function(d){
	    if (!owner.console || !console.error.apply) { return d; }
	    is_1.arr(arguments[2]) && (arguments[2] = arguments[2].length);
	    var args = to.arr(arguments)
	      , prefix = '[err][' + (new Date()).toISOString() + ']' + ns;

	    args.unshift(prefix.red ? prefix.red : prefix);
	    return console.error.apply(console, args), d
	  }
	};

	var log = function log(ns){
	  return function(d){
	    if (!owner.console || !console.log.apply) { return d; }
	    is_1.arr(arguments[2]) && (arguments[2] = arguments[2].length);
	    var args = to.arr(arguments)
	      , prefix = '[log][' + (new Date()).toISOString() + ']' + ns;

	    args.unshift(prefix.grey ? prefix.grey : prefix);
	    return console.log.apply(console, args), d
	  }
	};

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

	var rijs_core = function core(ref){
	  if ( ref === void 0 ) ref = {};
	  var aliases = ref.aliases; if ( aliases === void 0 ) aliases = {};

	  log$1('creating');

	  ripple.resources = {};
	  ripple.link      = link(ripple);
	  ripple.register  = ripple;
	  ripple.types     = types();
	  return linkify(emitterify(ripple), aliases)

	  function ripple(name, body, headers){
	    return !name                                            ? ripple
	         : is_1.arr(name)                                     ? name.map(ripple)
	         : is_1.promise(name)                                 ? name.then(ripple).catch(err$1)
	         : is_1.obj(name) && !name.name                       ? ripple(values(name))
	         : is_1.fn(name)  &&  name.resources                  ? ripple(values(name.resources))
	         : is_1.str(name) && !body &&  ripple.resources[name] ? ripple.resources[name].body
	         : is_1.str(name) && !body && !ripple.resources[name] ? undefined
	         : is_1.str(name) &&  body                            ? register(ripple)({ name: name, body: body, headers: headers })
	         : is_1.obj(name)                                     ? register(ripple)(name)
	         : (err$1('could not find or create resource', name), false)
	  }
	};

	var register = function (ripple) { return function (ref) {
	  var name = ref.name;
	  var body = ref.body;
	  var headers = ref.headers; if ( headers === void 0 ) headers = {};

	  name = ripple.aliases.src[name] || name;
	  if (is_1.promise(body)) { return body.then(function (body) { return register(ripple)({ name: name, body: body, headers: headers }); }).catch(err$1) }
	  log$1('registering', name);
	  var res = normalise(ripple)({ name: name, body: body, headers: headers });

	  if (!res) { return err$1('failed to register', name), false }
	  ripple.resources[name] = res;
	  ripple.emit('change', [name, { 
	    type: 'update'
	  , value: res.body
	  , time: now(res)
	  }]);

	  return ripple.resources[name].body
	}; };

	var normalise = function (ripple) { return function (res) {
	  if (!header('content-type')(res)) { values(ripple.types).sort(za('priority')).some(contentType(res)); }
	  if (!header('content-type')(res)) { return err$1('could not understand resource', res), false }
	  return parse(ripple)(res)
	}; };

	var parse = function (ripple) { return function (res) {
	  var type = header('content-type')(res);
	  if (!ripple.types[type]) { return err$1('could not understand type', type), false }
	  return (ripple.types[type].parse || identity)(res)
	}; };

	var contentType = function (res) { return function (type) { return type.check(res) && (res.headers['content-type'] = type.header); }; };

	var types = function () { return [text].reduce(to.obj('header'), 1); };

	var linkify = function (ripple, aliases) {
	  ripple.aliases = { dst: {}, src: {} };
	  for (var name in aliases)
	    { ripple.link(aliases[name], name); }
	  return ripple
	};

	var link = function (ripple) { return function (from, to$$1) {
	  ripple.aliases.src[from] = to$$1;
	  ripple.aliases.dst[to$$1] = from;
	  Object.defineProperty(ripple.resources, from, { 
	    get: function get(){ return ripple.resources[to$$1] } 
	  , set: function set(value){ ripple.resources[to$$1] = value; } 
	  });
	}; };

	var err$1 = err('[ri/core]')
	    , log$1 = log('[ri/core]')
	    , now = function (d, t) { return (t = key('body.log.length')(d), is_1.num(t) ? t - 1 : t); };

	// -------------------------------------------
	// Exposes a convenient global instance 
	// -------------------------------------------
	var rijs_singleton = function singleton(ripple){
	  log$2('creating');
	  if (!owner.ripple) { owner.ripple = ripple; }
	  return ripple
	};

	var log$2 = log('[ri/singleton]');

	var copy = function copy(from, to){ 
	  return function(d){ 
	    return to[d] = from[d], d
	  }
	};

	var overwrite = function overwrite(to){ 
	  return function(from){
	    keys(from)
	      .map(copy(from, to));
	        
	    return to
	  }
	};

	var not = function not(fn){
	  return function(){
	    return !fn.apply(this, arguments)
	  }
	};

	var extend = function extend(to){ 
	  return function(from){
	    keys(from)
	      .filter(not(is_1.in(to)))
	      .map(copy(from, to));

	    return to
	  }
	};

	var merge_1 = merge;

	function merge(to){ 
	  return function(from){
	    for (x in from) 
	      { is_1.obj(from[x]) && is_1.obj(to[x])
	        ? merge(to[x])(from[x])
	        : (to[x] = from[x]); }
	    return to
	  }
	}

	var attr = function attr(name, value) {
	  var args = arguments.length;
	  
	  return !is_1.str(name) && args == 2 ? attr(arguments[1]).call(this, arguments[0])
	       : !is_1.str(name) && args == 3 ? attr(arguments[1], arguments[2]).call(this, arguments[0])
	       :  function(el){
	            var ctx = this || {};
	            el = ctx.nodeName || is_1.fn(ctx.node) ? ctx : el;
	            el = el.node ? el.node() : el;
	            el = el.host || el;

	            return args > 1 && value === false ? el.removeAttribute(name)
	                 : args > 1                    ? (el.setAttribute(name, value), value)
	                 : el.attributes.getNamedItem(name) 
	                && el.attributes.getNamedItem(name).value
	          } 
	};

	var act = { add: add, update: update, remove: remove }
	  , str$1 = JSON.stringify
	  , parse$1 = JSON.parse;

	var set = function set(d, skipEmit) {
	  return function(o, existing, max) {
	    if (!is_1.obj(o) && !is_1.fn(o))
	      { return o }

	    if (!is_1.obj(d)) { 
	      var log = existing || o.log || []
	        , root = o;

	      if (!is_1.def(max)) { max = log.max || 0; }
	      if (!max)    { log = []; }
	      if (max < 0) { log = log.concat(null); }
	      if (max > 0) {
	        var s = str$1(o);
	        root = parse$1(s); 
	        log = log.concat({ type: 'update', value: parse$1(s), time: log.length });
	      } 

	      def(log, 'max', max);
	      
	      root.log 
	        ? (root.log = log)
	        : def(emitterify(root, null), 'log', log, 1);

	      return root
	    }

	    if (is_1.def(d.key)) {
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
	  is_1.arr(o) 
	    ? o.splice(k, 0, v) 
	    : (o[k] = v);
	}

	function update(o, k, v) {
	  if (!is_1.num(k) && !k) {
	    if (!is_1.obj(v)) { return true }
	    for (var x in o) { delete o[x]; }
	    for (var x in v) { o[x] = v[x]; }
	  } else 
	    { o[k] = v; } 
	}

	function remove(o, k, v) { 
	  is_1.arr(o) 
	    ? o.splice(k, 1)
	    : delete o[k];
	}

	// -------------------------------------------
	// Adds support for data resources
	// -------------------------------------------
	var rijs_data = function data(ripple){
	  log$3('creating');
	  ripple
	    .on('change.data')
	    .filter(function (ref) {
	      var name = ref[0];
	      var change = ref[1];

	      return header('content-type', 'application/data')(ripple.resources[name]);
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
	      .emit('change', (change || null), not(is_1.in(['bubble'])));
	  });

	  ripple.types['application/data'] = {
	    header: 'application/data'
	  , ext: '*.data.js'
	  , selector: function (res) { return ("[data~=\"" + (res.name) + "\"]"); }
	  , extract: function (el) { return (attr("data")(el) || '').split(' '); }
	  , check: function (res) { return is_1.obj(res.body); }
	  , load: function load(res) {
	      var exported = commonjsRequire(res.headers.path);
	      exported = exported.default || exported;
	      exported = is_1.fn(exported) ? exported(ripple) : exported;
	      res.headers['content-type'] = this.header;
	      ripple(merge_1(res)(exported));
	      return ripple.resources[res.name]
	    }
	  , parse: function parse(res){ 
	      var existing = ripple.resources[res.name] || {};

	      extend(res.headers)(existing.headers);
	      res.body = set()(
	        res.body || []
	      , existing.body && existing.body.log
	      , is_1.num(res.headers.log) ? res.headers.log : -1
	      );
	      overwrite(res.body.on)(listeners(existing));
	      res.body.on('change.bubble', function (change) {
	        ripple.emit('change', ripple.change = [res.name, change], not(is_1.in(['data'])));
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

	var log$3 = log('[ri/types/data]')
	    , listeners = key('body.on');

	var djbx = function (str) {
	  var hash = 5381
	    , i = str.length;

	  while (i)
	    { hash = (hash * 33) ^ str.charCodeAt(--i); }

	  return hash >>> 0
	};

	var client_1 = function(ripple) {
	    return log$4("creating"), ripple.types["text/css"] = {
	        header: "text/css",
	        ext: "*.css",
	        selector: function (res) { return ("[css~=\"" + (res.name) + "\"]"); },
	        extract: function (el) { return (attr("css")(el) || "").split(" "); },
	        check: function (res) { return includes(".css")(res.name); },
	        shortname: function (path) { return basename(path); },
	        load: !1,
	        parse: function (res) { return (res.headers.hash = res.headers.hash || djbx(res.body), res); }
	    }, ripple;
	};

	var log$4 = log("[ri/types/css]");

	var basename;

	var lo = function lo(d){
	  return (d || '').toLowerCase()
	};

	var client_1$1 = function(ripple, ref) {
	    if ( ref === void 0 ) ref = {};
	    var dir = ref.dir; if ( dir === void 0 ) dir = ".";

	    return log$5("creating"), ripple.require = (function (res) { return function (module) {
	        if (module in res.headers.dependencies && ripple.resources[res.headers.dependencies[module]]) { return ripple(res.headers.dependencies[module]); }
	        throw new Error(("Cannot find module: " + module + " for " + (res.name)));
	    }; }), ripple.types["application/javascript"] = {
	        header: header$1,
	        selector: function (res) { return ((res.name) + ",[is~=\"" + (res.name) + "\"]"); },
	        extract: function (el) { return (attr("is")(el) || "").split(" ").concat(lo(el.nodeName)); },
	        ext: "*.js",
	        shortname: function (path) { return basename$1(path).split(".").slice(0, -1).join("."); },
	        check: function (res) { return is_1.fn(res.body); },
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

	var log$5 = log("[ri/types/fn]"), header$1 = "application/javascript";

	var basename$1;

	var nanosocket = function(url){
	  if ( url === void 0 ) url = location.href.replace('http', 'ws');

	  var io = emitterify({ attempt: 0 });
	  io.ready = io.once('connected');
	  io.connect = connect(io, url);
	  io.connect(); 
	  io.send = function (data) { return io.ready.then(function (socket) { return socket.send(data); }); };
	  return io
	};

	var min = Math.min;
	var pow = Math.pow;

	var connect = function (io, url) { return function () {
	  var WebSocket = window.WebSocket;
	  var location = window.location;
	  var setTimeout = window.setTimeout;
	  var socket = new WebSocket(url);
	  socket.onopen = function (d) { return io.emit('connected', socket); };
	  socket.onmessage = function (d) { return io.emit('recv', d.data); };
	  socket.onclose = function (d) { 
	    io.ready = io.once('connected');
	    io.emit('disconnected');
	    setTimeout(io.connect, backoff(++io.attempt));
	  };
	}; };

	var backoff = function (attempt, base, cap) {
	    if ( base === void 0 ) base = 100;
	    if ( cap === void 0 ) cap = 10000;

	    return min(cap, base * pow(2, attempt));
	};

	var cryo = createCommonjsModule(function (module) {
	(function() {

	  var CONTAINER_TYPES = 'object array date function'.split(' ');

	  var REFERENCE_FLAG = '_CRYO_REF_';
	  var INFINITY_FLAG = '_CRYO_INFINITY_';
	  var FUNCTION_FLAG = '_CRYO_FUNCTION_';
	  var UNDEFINED_FLAG = '_CRYO_UNDEFINED_';
	  var DATE_FLAG = '_CRYO_DATE_';

	  var OBJECT_FLAG = '_CRYO_OBJECT_';
	  var ARRAY_FLAG = '_CRYO_ARRAY_';

	  function typeOf(item) {
	    if (typeof item === 'object') {
	      if (item === null) { return 'null'; }
	      if (item && item.nodeType === 1) { return 'dom'; }
	      if (item instanceof Array) { return 'array'; }
	      if (item instanceof Date) { return 'date'; }
	      return 'object';
	    }
	    return typeof item;
	  }

	  // Same as and copied from _.defaults
	  function defaults(obj) {
	    var arguments$1 = arguments;

	    var length = arguments.length;
	    if (length < 2 || obj == null) { return obj; }
	    for (var index = 1; index < length; index++) {
	      var source = arguments$1[index],
	          keys = Object.keys(source),
	          l = keys.length;
	      for (var i = 0; i < l; i++) {
	        var key = keys[i];
	        if (obj[key] === void 0) { obj[key] = source[key]; }
	      }
	    }
	    return obj;
	  }
	  function stringify(item, options) {
	    var references = [];

	    // Backward compatibility with 0.0.6 that exepects `options` to be a callback.
	    options = typeof options === 'function' ? { prepare: options } : options;
	    options = defaults(options || {}, {
	      prepare: null,
	      isSerializable: function(item, key) {
	        return item.hasOwnProperty(key);
	      }
	    });

	    var root = cloneWithReferences(item, references, options);

	    return JSON.stringify({
	      root: root,
	      references: references
	    });
	  }

	  function cloneWithReferences(item, references, options, savedItems) {
	    // invoke callback before any operations related to serializing the item
	    if (options.prepare) { options.prepare(item); }

	    savedItems = savedItems || [];
	    var type = typeOf(item);

	    // can this object contain its own properties?
	    if (CONTAINER_TYPES.indexOf(type) !== -1) {
	      var referenceIndex = savedItems.indexOf(item);
	      // do we need to store a new reference to this object?
	      if (referenceIndex === -1) {
	        var clone = {};
	        referenceIndex = references.push({
	          contents: clone,
	          value: wrapConstructor(item)
	        }) - 1;
	        savedItems[referenceIndex] = item;
	        for (var key in item) {
	          if (options.isSerializable(item, key)) {
	            clone[key] = cloneWithReferences(item[key], references, options, savedItems);
	          }
	        }
	      }

	      // return something like _CRYO_REF_22
	      return REFERENCE_FLAG + referenceIndex;
	    }

	    // return a non-container object
	    return wrap(item);
	  }

	  function parse(string, options) {
	    var json = JSON.parse(string);

	    // Backward compatibility with 0.0.6 that exepects `options` to be a callback.
	    options = typeof options === 'function' ? { finalize: options } : options;
	    options = defaults(options || {}, { finalize: null });

	    return rebuildFromReferences(json.root, json.references, options);
	  }

	  function rebuildFromReferences(item, references, options, restoredItems) {
	    restoredItems = restoredItems || [];
	    if (starts(item, REFERENCE_FLAG)) {
	      var referenceIndex = parseInt(item.slice(REFERENCE_FLAG.length), 10);
	      if (!restoredItems.hasOwnProperty(referenceIndex)) {
	        var ref = references[referenceIndex];
	        var container = unwrapConstructor(ref.value);
	        var contents = ref.contents;
	        restoredItems[referenceIndex] = container;
	        for (var key in contents) {
	          container[key] = rebuildFromReferences(contents[key], references, options, restoredItems);
	        }
	      }

	      // invoke callback after all operations related to serializing the item
	      if (options.finalize) { options.finalize(restoredItems[referenceIndex]); }

	      return restoredItems[referenceIndex];
	    }

	    // invoke callback after all operations related to serializing the item
	    if (options.finalize) { options.finalize(item); }

	    return unwrap(item);
	  }

	  function wrap(item) {
	    var type = typeOf(item);
	    if (type === 'undefined') { return UNDEFINED_FLAG; }
	    if (type === 'function') { return FUNCTION_FLAG + item.toString(); }
	    if (type === 'date') { return DATE_FLAG + item.getTime(); }
	    if (item === Infinity) { return INFINITY_FLAG; }
	    if (type === 'dom') { return undefined; }
	    return item;
	  }

	  function wrapConstructor(item) {
	    var type = typeOf(item);
	    if (type === 'function' || type === 'date') { return wrap(item); }
	    if (type === 'object') { return OBJECT_FLAG; }
	    if (type === 'array') { return ARRAY_FLAG; }
	    return item;
	  }

	  function unwrapConstructor(val) {
	    if (typeOf(val) === 'string') {
	      if (val === UNDEFINED_FLAG) { return undefined; }
	      if (starts(val, FUNCTION_FLAG)) {
	        return (new Function("return " + val.slice(FUNCTION_FLAG.length)))();
	      }
	      if (starts(val, DATE_FLAG)) {
	        var dateNum = parseInt(val.slice(DATE_FLAG.length), 10);
	        return new Date(dateNum);
	      }
	      if (starts(val, OBJECT_FLAG)) {
	        return {};
	      }
	      if (starts(val, ARRAY_FLAG)) {
	        return [];
	      }
	      if (val === INFINITY_FLAG) { return Infinity; }
	    }
	    return val;
	  }

	  function unwrap(val) {
	    if (typeOf(val) === 'string') {
	      if (val === UNDEFINED_FLAG) { return undefined; }
	      if (starts(val, FUNCTION_FLAG)) {
	        var fn = val.slice(FUNCTION_FLAG.length);
	        var argStart = fn.indexOf('(') + 1;
	        var argEnd = fn.indexOf(')', argStart);
	        var args = fn.slice(argStart, argEnd);
	        var bodyStart = fn.indexOf('{') + 1;
	        var bodyEnd = fn.lastIndexOf('}') - 1;
	        var body = fn.slice(bodyStart, bodyEnd);
	        return new Function(args, body);
	      }
	      if (starts(val, DATE_FLAG)) {
	        var dateNum = parseInt(val.slice(DATE_FLAG.length), 10);
	        return new Date(dateNum);
	      }
	      if (val === INFINITY_FLAG) { return Infinity; }
	    }
	    return val;
	  }

	  function starts(string, prefix) {
	    return typeOf(string) === 'string' && string.slice(0, prefix.length) === prefix;
	  }

	  // Exported object
	  var Cryo = {
	    stringify: stringify,
	    parse: parse
	  };

	  // global on server, window in browser
	  var root = this;

	  // AMD / RequireJS
	  if (typeof undefined !== 'undefined' && undefined.amd) {
	    undefined('Cryo', [], function () {
	      return Cryo;
	    });
	  }

	  // node.js
	  else if ('object' !== 'undefined' && module.exports) {
	    module.exports = Cryo;
	  }

	  // included directly via <script> tag
	  else {
	    root.Cryo = Cryo;
	  }

	})();
	});

	var client$1 = function(ref){
	  if ( ref === void 0 ) ref = {};
	  var socket = ref.socket; if ( socket === void 0 ) socket = nanosocket();

	  socket.id = 0;

	  var xrs = emitterify({ 
	    socket: socket
	  , send: send(socket)
	  , get subscriptions(){
	      return values(socket.on)
	        .map(function (d) { return d && d[0]; })
	        .filter(function (d) { return d && d.type && d.type[0] == '$'; })
	    }
	  });
	  
	  socket
	    .once('disconnected')
	    .map(function (d) { return socket
	      .on('connected')
	      .map(reconnect(xrs)); }
	    );

	  socket
	    .on('recv')
	    .map(function (d) { return parse$2(d); })
	    .each(function (ref) {
	      var id = ref.id;
	      var data = ref.data;
	      var server = ref.server;

	      // TODO: check/warn if no sub
	      var sink = socket.on[("$" + id)] && socket.on[("$" + id)][0];

	      server    ? xrs.emit('recv', { id: id, data: data, server: server })
	    : data.exec ? data.exec(sink, data.value)
	                : socket.emit(("$" + id), data);
	    });

	  return xrs
	};

	var reconnect = function (xrs) { return function () { return xrs.subscriptions
	  // .map(d => d.type)
	  .map(function (ref) {
	    var subscription = ref.subscription;

	    return xrs.socket.send(subscription);
	  }); }; };

	var parse$2 = cryo.parse;

	var send = function (socket, type) { return function (data, meta) {
	  if (data instanceof window.Blob) 
	    { return binary(socket, data, meta) }

	  var id = str(++socket.id)
	      , output = socket.on(("$" + id))
	      , next = function (data, count) {
	        if ( count === void 0 ) count = 0;

	        return socket
	          .send(output.source.subscription = str({ id: id, data: data, type: type }))
	          .then(function (d) { return output.emit('sent', { id: id, count: count }); });
	  };

	  data.next 
	    ? data.map(next).source.emit('start')
	    : next(data);

	  output
	    .source
	    .once('stop')
	    .filter(function (reason) { return reason != 'CLOSED'; })
	    .map(function (d) { return send(socket, 'UNSUBSCRIBE')(id)
	      // TODO: also force stop on close of server created sub (?)
	      .filter(function (d, i, n) { return n.source.emit('stop', 'CLOSED'); }); }
	    );

	  return output
	}; };

	var binary = function (socket, blob, meta, start, blockSize) {
	  if ( start === void 0 ) start = 0;
	  if ( blockSize === void 0 ) blockSize = 1024;

	  var output = emitterify().on('recv')
	      , next = function (id) { return function () { return start >= blob.size 
	            ? output.emit('sent', { id: id })
	            : ( socket.send(blob.slice(start, start += blockSize)), window.setTimeout(next(id))); }; };

	  send(socket, 'BINARY')({ size: blob.size, meta: meta })
	    .on('sent', function (ref) {
	      var id = ref.id;

	      return next(id)();
	  })
	    .on('progress', function (received) { return output.emit('progress', { received: received, total: blob.size }); })
	    .map(output.next)
	    .source
	    .until(output.once('stop'));

	  return output
	};

	var time = function time(ms, fn) {
	  return arguments.length === 1 
	       ? setTimeout(ms)
	       : setTimeout(fn, ms)
	};

	var client$2 = function sync(
	  ripple
	, ref
	, ref$1
	){
	  if ( ref === void 0 ) ref = {};
	  if ( ref$1 === void 0 ) ref$1 = {};
	  var xrs = ref$1.xrs; if ( xrs === void 0 ) xrs = client$1;

	  ripple.server = xrs();
	  ripple.send = send$1(ripple);
	  ripple.subscribe = subscribe(ripple);
	  ripple.subscriptions = {};
	  ripple.get = get(ripple);
	  ripple.upload = upload(ripple);
	  ripple.upload.id = 0;

	  // TODO: other than cache pushes? ans: use server.type
	  ripple
	    .server
	    .on('recv')
	    .map(function (ref, i, n) {
	      var data = ref.data;
	      var server = ref.server;

	      return cache(ripple, server.name)(data, i, n);
	  });

	  return ripple
	};

	var send$1 = function (ref) {
	  var server = ref.server;

	  return function (name, type, value) { return name instanceof Blob ? server.send(name, type)
	: is_1.obj(name)         ? server.send(name)
	                       : server.send({ name: name, type: type, value: value }); };
	};

	var get = function (ripple) { return function (name, k) { return ripple
	  .subscribe(name, k)
	  .filter(function (d, i, n) { return n.source.emit('stop'); })
	  .start(); }; };

	var cache = function (ripple, name, k) { return function (change, i, n) {
	  if (change.name && name != change.name) { ripple.link(name, change.name); }
	  if (is_1.def(k)) { change.key = k + "." + (str(change.key)); }
	  !change.key && change.type == 'update'
	    ? ripple(body(extend({ name: name })(change)))
	    : set(change)(ripple.resources[name] ? ripple(name) : ripple(name, {}));

	  ripple.change = assign({ name: name }, change);
	  // TODO: change.key or key here?
	  return key(k)(ripple(name))
	}; };

	var subscribe = function (ripple) { return function (name, k) {
	  if (is_1.arr(name)) { return merge$1(name.map(function (n) { return ripple.subscribe(n, k); }))
	    .map(function (d) { return name.reduce(function (p, v, i) { return (p[v] = d[i], p); }, {}); }) }

	  ripple.subscriptions[name] = ripple.subscriptions[name] || {};
	  if (is_1.arr(k)) { return merge$1(k.map(function (k) { return ripple.subscribe(name, k); }))
	    .map(function (d) { return key(k)(ripple(name)); }) }
	  var output = emitterify().on('subscription');

	  output
	    .on('stop')
	    .each(function (d, i, n) {
	      raw.subs.splice(raw.subs.indexOf(output), 1);
	      time(1000, function () { 
	        if (raw.subs.length) { return }
	        raw.source.emit('stop');
	        ripple.subscriptions[name][k] = undefined;
	        output.emit('end');
	      });
	    });

	  if (ripple.subscriptions[name][k])
	    { output
	      .on('start')
	      .map(function () { return key(k)(ripple(name)); })
	      .filter(is_1.def)
	      .map(function (initial) { return output.next(initial); }); }

	  var raw = ripple.subscriptions[name][k] = ripple.subscriptions[name][k] || ripple
	    .send(name, 'SUBSCRIBE', k)
	    .map(cache(ripple, name, k))
	    .each(function (value) {
	      raw.subs.map(function (o) { return o.next(value); });
	      delete ripple.change;
	    });

	  raw.subs = raw.subs || [];
	  raw.subs.push(output);
	  
	  return output
	}; };

	var upload = function (ripple) { return function (name, form) {
	  var index = ++ripple.upload.id
	    , fields = {}
	    , size = 0
	    , next = function () {
	        if (!files.length) { return true }
	        var ref = files.shift();
	        var field = ref.field;
	        var filename = ref.filename;
	        var i = ref.i;
	        var blob = ref.blob;
	        return ripple
	          .send(blob, { filename: filename, field: field, i: i, index: index })
	          .on('progress', function (ref) {
	            var received = ref.received;
	            var total = ref.total;

	            return output.emit('progress', {
	            total: size
	          , received: 
	              size
	            - (blob.size - received)
	            - files.reduce(function (acc, d) { return (acc += d.blob.size); }, 0)
	          });
	        })
	          .then(next)
	      };

	  var files = keys(form)
	    .map(function (field) { return (fields[field] = form[field], field); })
	    .filter(function (field) { return form[field] instanceof FileList; })
	    .map(function (field) { 
	      fields[field] = [];
	      return to.arr(form[field])
	        .map(function (f) { return (size += f.size, f); })
	        .map(function (f, i) { return ({ field: field, filename: f.name, i: i, blob: f, sent: 0 }); })
	    })
	    .reduce(flatten, []);

	  var output = ripple.send({ 
	    files: files.length
	  , type: 'PREUPLOAD'
	  , fields: fields
	  , index: index
	  , size: size 
	  , name: name
	  }).once('sent', next);

	  return output
	}; };

	var body = function (ref) {
	  var name = ref.name;
	  var value = ref.value;
	  var headers = ref.headers;

	  return ({ name: name, headers: headers, body: value });
	};
	var assign = Object.assign;

	// TODO: factor out
	var merge$1 = function (streams) {
	  var output = emitterify().on('merged');
	  output.streams = streams;

	  streams.map(function (stream, i) { return stream.each(function (value) {
	      stream.latest = value;
	      var latest = streams.map(function (d) { return d.latest; });
	      if (latest.every(is_1.def)) { output.next(latest); }
	    }); }
	  );

	  output
	    .once('start')
	    .map(function (d) { return streams.map(function ($) { return $.source.emit('start'); }); });

	  output
	    .once('stop')
	    .map(function (d) { return streams.map(function ($) { return $.source.emit('stop'); }); });

	  return output
	};

	var ready = function ready(fn){
	  return document.body ? fn() : document.addEventListener('DOMContentLoaded', fn.bind(this))
	};

	var _class = function (definition) { return assign$1(
	   definition.class               ? definition.class
	: !definition.prototype           ? classed(definition)
	:  definition.prototype.render    ? definition
	:  definition.prototype.connected ? definition
	                                  : classed(definition)
	); };

	var assign$1 = Object.assign;

	var classed = function (render) { return render.class = render.class || class { 
	  render(){ render.apply(this, arguments); } 
	}; };

	var event = function event(node, index) {
	  node = node.host && node.host.nodeName ? node.host : node;
	  if (node.on) { return }
	  node.listeners = {};

	  var on = function (o) {
	    var type = o.type.split('.').shift();
	    if (!node.listeners[type])
	      { node.addEventListener(type, node.listeners[type] = 
	        function (event) { return (!event.detail || !event.detail.emitted ? emit(type, event) : 0); }
	      ); }
	  };

	  var off = function (o) {
	    if (!node.on[o.type].length) {
	      node.removeEventListener(o.type, node.listeners[o.type]);
	      delete node.listeners[o.type];
	    }
	  };

	  emitterify(node, { on: on, off: off });
	  var emit = node.emit;

	  node.emit = function(type, params){
	    var detail = { params: params, emitted: true }
	        , event = new CustomEvent(type, { detail: detail, bubbles: false, cancelable: true });
	    node.dispatchEvent(event);
	    return emit(type, event)
	  };
	};

	var noop$1 = function () {}
	    , HTMLElement = client && window.HTMLElement || class {}
	    , registry = client && window.customElements || {};

	var define = function define(name, component) {
	  if (arguments.length == 1) { component = name, name = "anon-" + (registry.anon++); }
	  if (component.wrapper) { return component.wrapper }
	  if (!name.includes('-')) { return; }
	  if (!client) { return wrap$1(_class(component)) }
	  var wrapped = registry.get(name);

	  if (wrapped) {
	    if (wrapped.class == _class(component)) { return wrapped }
	    wrapped.class = _class(component);
	    var instances = Array.from(document.querySelectorAll(name));
	    instances.map(function (node) {
	      node.disconnectedCallback();
	      node.methods.map(function (method) { delete node[method]; });
	      node.connectedCallback();
	    });
	  } else {
	    registry.define(name, wrapped = wrap$1(_class(component)));
	  }

	  return wrapped
	};

	var wrap$1 = function (component) {
	  component.wrapper = component.wrapper || class extends HTMLElement {
	    connectedCallback(){
	      var this$1 = this;
	 
	      var ref = component.wrapper.class;
	      var prototype = ref.prototype;
	      event(this);
	      this.state = this.state || {};
	      this.methods = Object
	        .getOwnPropertyNames(prototype)
	        .filter(function (method) { return !(method in disallowed); })
	        .map(function (method) { return (this$1[method] = prototype[method].bind(this$1), method); });

	      return Promise.resolve((this.connected || noop$1).call(this, this, this.state))
	        .then(function (d) {
	          this$1.initialised = true;
	          this$1.render();
	        })
	    }

	    render(){
	      var ref = component.wrapper.class;
	      var prototype = ref.prototype;
	      if (!this.initialised) { return }
	      return prototype.render.call(this, this, this.state)
	    }

	    disconnectedCallback(){
	      (this.disconnected || noop$1).call(this, this, this.state);
	      this.dispatchEvent(new CustomEvent('disconnected')); 
	      this.initialised = false;
	    }
	  };

	  component.wrapper.class = component;
	  return component.wrapper
	};

	var disallowed = { length: 1, prototype: 1, name: 1, render: 1 };

	registry.anon = registry.anon || 1;

	var rijs_components = function components(ripple){
	  if (!client) { return ripple }
	  log$6('creating');

	  // if no render is defined on a component, load up definition
	  Node.prototype.render = function(){
	    var name = this.nodeName.toLowerCase();
	    if (name.includes('-')) 
	      { this.fn$ = this.fn$ || ripple
	        .subscribe(name)
	        .map(function (component) { return define(name, component); }); }
	        // .until(new Promise(resolve => this.addEventListener('disconnected', () => {
	        //   if (!this.isConnected) resolve()
	        // })))
	  };
	  
	  // this is for backwards compatibility
	  Node.prototype.draw = function(){ 
	    this.render(); 
	  };

	  ready(function () { return Array.from(document.querySelectorAll('*'))
	    .filter(function (d) { return d.nodeName.includes('-'); })
	    .map(function (node) { return node.render(); }); }
	  );

	  return ripple
	};

	var log$6 = log('[ri/components]');

	var ripple = createCommonjsModule(function (module) {
	function create(opts) {
	    var ripple = rijs_core(opts);
	    return rijs_singleton(ripple, opts), rijs_data(ripple, opts), client_1(ripple, opts), client_1$1(ripple, opts), client$2(ripple, opts), rijs_components(ripple, opts), ripple;
	}

	!window.ripple && create(), module.exports = create;
	});

	return ripple;

}());
