// -------------------------------------------
// Synchronises resources between server/client
// -------------------------------------------
module.exports = function sync(
  ripple
, { server
  , certs
  , port = 5000
  , max = 1000
  } = {}
, { xrs = require('xrs/server')
  } = {}
){
  ripple.server = xrs({ 
    processor: processor(ripple)
  , serialise: serialise(ripple)
  , connected
  , certs
  , port 
  }, { http: server })

  // TODO: this should be populated by modules
  ripple.server.blacklist = ['loaded', 'loading', 'transpile', 'from', 'path', 'flattened', 'vary']
  ripple.server.cache = new LRUMap(max)
  ripple
    .on('change')
    // TODO: need multi-key lru/lfuda cache, or restore multi-level cache
    .map(([name]) => {
      for (const key of ripple.server.cache.keys()) {
        if (key.split(',').some(is(`name:${name}`)))
          ripple.server.cache.delete(key)
      }
    })
  return ripple
}

const processor = ripple => (req, res) => { 
  let reply

  return req.binary                       ? req.socket.uploads[req.data.meta.index].emit('file', req)
       : req.data.type == 'PREUPLOAD'     ? upload(ripple, req, res)
       : (reply = xres(ripple, req, res)) ? reply
       : req.data.type == 'SUBSCRIBE'     ? subscribe(ripple, req, res)(ripple.resources[req.data.name]) 
                                          : false
}

const serialise = ripple => (message, socket, next) => {
  if (!message.data.name) return next(message)
  const res = ripple.resources[message.data.name]
      , { vary = noop } = res.headers
      , { cache } = socket.server
      , key = vary(res, socket, message)

  if (!key) return next(message)
  if (cache.has(key)) return wrap(message.id, cache.get(key))
  deb('cache miss'.yellow, key, cache.size)
  const serialised = next(compress(message.data))
  cache.set(key, serialised)
  return wrap(message.id, serialised)
}

const wrap = (id, change) => id 
  ? `{"id":"${id}","data":${change}}`
  : `{"data":${change}}`

const compress = change => {
  delete change.key
  delete change.type 
  return change
}

const xres = (ripple, req, res) => {
  // TODO: this could be multiple resources?
  const { headers } = ripple.load(req.data.name)
      , { from = noop } = headers

  return unpromise(from(req, res))
} 

const subscribe = (ripple, { data, socket }) => ({ name, body, headers } = {}) => ripple
  .on('change')
  .on('start', function(){
    socket.subscriptions.named[name] = 1
    this.next(data.value
      ? [name, { type: 'update', key: data.value, value: key(data.value)(body) }]
      : [name, { type: 'update', value: body, headers }]
    )
  })
  .filter(([n]) => n == name)
  .map(arr => arr[1])
  .each(dependencies(ripple, data.name, socket)) // TODO: plugin (or opt?)
  .map(transpile(ripple, data.name, socket)) // TODO: plugin (or opt?)
  .filter(by('key', subset(data.value)))
  .map(format(name, data))
  .map(strip(ripple.server.blacklist))
  .unpromise()

const format = (name, data) => (change) => { 
  // TODO: separate change and resource here? or combine name into change?
  // if (name !== data.name) change.name = name
  change.name = name  // TODO: can use id and not always set name
  change.key = str(change.key).replace(data.value, '')
  return change
}

// TODO: rename module?
// TODO: put back resource level type transforms
const dependencies = ({ dir, server, resources }, name, socket) => async (change, i, n) => {
  let { headers } = resources[name]
    , type = 'SUBSCRIBE'
    , deps
    , pushed = 
        !headers.dependencies                    ? 0
      : !(deps = unsent(headers, socket)).length ? (change.headers = headers)
      : (deps.map(name => server.recv(socket, { type, name })), change.headers = headers)

  n.next(change)
}

const unsent = ({ flattened }, socket) => flattened 
  .filter(name => !socket.subscriptions.named[name])

const transpile = ({ resources }, name, { platform }, limit) => change => {
  const { headers } = resources[name]
  if (!(limit = key('transpile.limit')(headers)) || change.type !== 'update') return change

  const browser = `${platform.name}-${platform.version}`
  change.value = transform(change.value, platform) 
  return change
}

const transform = (thing, { name, version }) =>
  is.fn(thing)  ? fn(buble.transform(`(${thing})`, { target: { [name]: version, fallback }}).code)
: is.lit(thing) ? keys(thing)
                    .map(key => ({ key, val: transform(thing[key], { name, version }) }))
                    .reduce((p, v) => (p[v.key] = v.val, p), {})
                : thing

const strip = list => change => {
  if (!change.headers) return change
  change.headers = keys(change.headers)
    .filter(not(is.in(list)))
    .reduce((p, k) => (p[k] = change.headers[k], p), {})
  return change
} 

const upload = async (ripple, req, res) => {
  let uploads = req.socket.uploads = req.socket.uploads || {}
    , { name, index, fields, size } = req.data
    , upload = emitterify(uploads[index] = fields)

  if (size) await upload
    .on('file')
    .map(file => (upload[file.data.meta.field][file.data.meta.i] = file.binary, file))
    .reduce(((received = 0, file) => received += file.size))
    .until(received => received == size)

  delete uploads[index]

  return processor(ripple)({ 
    socket: req.socket
  , data: {
      name
    , type: 'UPLOAD'
    , value: upload
    }
  }, res)
}

const subset = (target = '') => (source = '') => str(source).startsWith(target)

const connected = socket => {
  socket.platform = parse(socket.handshake.headers['user-agent'])
  def(socket.subscriptions, 'named', {})
}

// TODO: factor out
const unpromise = d => (d && d.next ? d.unpromise() : d)

const major = (v, f) => 
    v                     ? v.split('.').shift() 
  : includes('xp')(lo(f)) ? 'xp'
                          : '?'

const parse = useragent => {
  let { name, version, os } = platform.parse(useragent)
  name = lo(name)
  version = major(version)
  os = {
    name: lo((os.family || '').split(' ').shift())
  , version: major(os.version, os.family)
  }

  if (os.name == 'os') os.name == 'osx'
  if (name == 'chrome mobile') name = 'chrome'
  if (name == 'microsoft edge') name = 'edge'

  return { 
    uid: `${name}-${version}-${os.name}-${os.version}`
  , version
  , name
  , os
  }
}

const by = require('utilise/by')
    , is = require('utilise/is')
    , lo = require('utilise/lo')
    , fn = require('utilise/fn')
    , str = require('utilise/str')
    , not = require('utilise/not')
    , key = require('utilise/key')
    , def = require('utilise/def')
    , keys = require('utilise/keys')
    , noop = require('utilise/noop')
    , values = require('utilise/values')
    , includes = require('utilise/includes')
    , emitterify = require('utilise/emitterify')
    , deb = require('utilise/deb')('[ri/sync]')
    , { LRUMap } = require('lru_map')
    , platform = require('platform')
    , buble = require('buble')
    , fallback = { ie: 8, suppress: true }