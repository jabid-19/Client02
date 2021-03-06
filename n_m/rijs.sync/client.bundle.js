var sync = (function () {
'use strict';

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
  return (p = p || []), p.concat(v) 
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

var index = function(url){
  if ( url === void 0 ) url = location.href.replace('http', 'ws');

  var io = emitterify({ attempt: 0 });
  io.ready = io.once('connected');
  io.connect = connect(io, url);
  io.connect(); 
  io.send = function (data) { return io.ready.then(function (socket) { return socket.send(data); }); };
  return io
};

var min$1 = Math.min;
var pow$1 = Math.pow;

var connect = function (io, url) { return function () {
  var WebSocket = window.WebSocket;
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

    return min$1(cap, base * pow$1(2, attempt));
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

var keys = function keys(o) { 
  return Object.keys(is_1.obj(o) || is_1.fn(o) ? o : {})
};

var datum = function datum(node){
  return node.__data__
};

var wrap = function wrap(d){
  return function(){
    return d
  }
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
         : o[k] || !keys$$1.length ? (set ? ((o[k] = is_1.fn(v) ? v(o[k], i) : v), o)
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

var client$2 = function(ref){
  if ( ref === void 0 ) ref = {};
  var socket = ref.socket; if ( socket === void 0 ) socket = index();

  socket.id = 0;

  var server = emitterify({ 
    socket: socket
  , send: send$1(socket)
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
      .map(reconnect(server)); }
    );

  socket
    .on('recv')
    .map(deserialise)
    .each(function (ref) {
      var id = ref.id;
      var data = ref.data;

      // TODO: check/warn if no sub
      var sink = socket.on[("$" + id)] && socket.on[("$" + id)][0];

      data.exec ? data.exec(sink, data.value)
    : !id       ? server.emit('recv', data)
                : socket.emit(("$" + id), data);
    });

  return server
};

var deserialise = function (input) { return (new Function(("return " + input)))(); };

var reconnect = function (server) { return function () { return server.subscriptions
  .map(function (ref) {
    var subscription = ref.subscription;

    return server.socket.send(subscription);
  }); }; };


    
var send$1 = function (socket, type) { return function (data, meta) {
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
    .map(function (d) { return send$1(socket, 'UNSUBSCRIBE')(id)
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
            : ( socket.send(blob.slice(start, start += blockSize))
              , window.setTimeout(next(id))
              ); }; };

  send$1(socket, 'BINARY')({ size: blob.size, meta: meta })
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

var to = { 
  arr: toArray
, obj: toObject
};

function toArray(d){
  return Array.prototype.slice.call(d, 0)
}

function toObject(d) {
  var by = 'id';

  return arguments.length == 1 
    ? (by = d, reduce)
    : reduce.apply(this, arguments)

  function reduce(p,v,i){
    if (i === 0) { p = {}; }
    p[is_1.fn(by) ? by(v, i) : v[by]] = v;
    return p
  }
}

var act = { add: add, update: update, remove: remove };
var str$3 = JSON.stringify;
var parse = JSON.parse;

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
        var s = str$3(o);
        root = parse(s); 
        log = log.concat({ type: 'update', value: parse(s), time: log.length });
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

var time = function time(ms, fn) {
  return arguments.length === 1 
       ? setTimeout(ms)
       : setTimeout(fn, ms)
};

var client = function sync(
  ripple
, ref
, ref$1
){
  if ( ref === void 0 ) ref = {};
  if ( ref$1 === void 0 ) ref$1 = {};
  var xrs = ref$1.xrs; if ( xrs === void 0 ) xrs = client$2;

  ripple.server = xrs();
  ripple.send = send(ripple);
  ripple.subscribe = subscribe(ripple);
  ripple.subscriptions = {};
  ripple.get = get(ripple);
  ripple.upload = upload(ripple);
  ripple.upload.id = 0;

  // TODO: other than cache pushes? ans: use server.type
  ripple
    .server
    .on('recv')
    .map(function (data, i, n) { return cache(ripple)(data, i, n); });

  return ripple
};

var send = function (ref) {
  var server = ref.server;

  return function (name, type, value) { return name instanceof Blob ? server.send(name, type)
: is_1.obj(name)         ? server.send(name)
                       : server.send({ name: name, type: type, value: value }); };
};

var get = function (ripple) { return function (name, k) { return ripple
  .subscribe(name, k)
  .filter(function (d, i, n) { return n.source.emit('stop'); })
  .start(); }; };

var cache = function (ripple, n, k) { return function (change) {
  if (name && change.name && name != change.name) { ripple.link(name, change.name); }
  var name = change.name = change.name || n;
  if (!change.type) { change.type = 'update'; }
  if (is_1.def(k)) { change.key = k + "." + (str(change.key)); }
  !change.key && change.type == 'update'
    ? ripple(body(change))
    : set(change)(ripple.resources[name] ? ripple(name) : ripple(name, {}));

  ripple.change = change;
  
  return key(k)(ripple(name))
}; };

var subscribe = function (ripple) { return function (name, k) {
  if (is_1.arr(name)) { return merge(name.map(function (n) { return ripple.subscribe(n, k); }))
    .map(function (d) { return name.reduce(function (p, v, i) { return (p[v] = d[i], p); }, {}); }) }

  ripple.subscriptions[name] = ripple.subscriptions[name] || {};
  if (is_1.arr(k)) { return merge(k.map(function (k) { return ripple.subscribe(name, k); }))
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
      [].concat(raw.subs).map(function (o) { return o.next(value); });
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


// TODO: factor out
var merge = function (streams) {
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

return client;

}());
