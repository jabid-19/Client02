// -------------------------------------------
// Loads resources from the /resources folder
// -------------------------------------------
// TODO: rename loader
module.exports = function loader(ripple, {
  dir = '.'
, watch = isNonProd()
, pattern = '/**/!(*test).{css,js}'
, autoload = 'resources'
, autolink = '/resources/components/**/!(*test).{css,js}'
, aliases = {}
} = {}){
  log('creating', { watch })
  
  glob(autolink, { root: dir })
    .map(path => ripple.link(rel(dir, path), rtype(ripple, path).shortname(path)))

  const { r = '', resdirs = r } = require('minimist')(process.argv.slice(2))
      , load = register(ripple, dir)
      , folders = resdirs
          .split(',')
          .concat(resolve(dir, autoload))
          .filter(Boolean)
          .map(d => resolve(d))
          .map(append(pattern))

  ripple.watcher = chokidar.watch(folders, { ignored: /\b_/ })
    .on('error', err)
    .on('add', load)
    .on('change', load)
    .on('ready', async () => {
      if (!watch) ripple.watcher.close()
      
      await Promise.all(values(ripple.resources)
        .map(res => res.headers.loading))
        .catch(err)

      def(ripple, 'ready', true)
      ripple.emit('ready')
    })

  ripple.load = (name, alias) => {
    if (ripple.resources[name])
      return ripple.resources[name]

    const path = bresolve(ripple.aliases.dst[name] || name, resolve(dir, 'foo'))
        , canonical = rel(dir, path)

    if (alias) {
      ripple.link(canonical, alias)
    } else if (!ripple.aliases.dst[name] && name != canonical) {
      ripple.link(name, canonical)
    }
    
    return load(path)
  }

  // TODO: move back to core as chainable 
  ripple.resource = (name, body, headers) => {
    // is.str(body)
    //   ? ripple.load(body, name)
    ripple(name, body, headers)
    return ripple
  }

  return ripple
}

const register = (ripple, dir) => path => {
  const type = rtype(ripple, path)

  if (!exists(path)) 
    throw new Error(`no such resource at ${path}`)
  if (!type)
    throw new Error(`could not understand how to load resource at ${path}`)

  // TODO: should probably let loaders do this
  delete require.cache[path]

  return type.load({ 
    name: rel(dir, path)
  , headers: { path } 
  })
}

const rtype = (ripple, path) => values(ripple.types)
  .filter(d => d.ext)
  .sort(za('ext.length'))
  .find(({ ext }) => minimatch(basename(path), ext))

const rel = (dir, path) => './' + relative(dir, path).replace(/\\/g, '/')

const bresolve = (module, parent) => require('browser-resolve').sync(module, { filename: parent })

function isNonProd(){
  return lo(process.env.NODE_ENV) != 'prod' && lo(process.env.NODE_ENV) != 'production'
}

const { resolve, relative, basename } = require('path')
    , exists = require('fs').existsSync
    , glob = require('glob').sync
    , chokidar = require('chokidar')
    , append = require('utilise/append')
    , values = require('utilise/values')
    , keys = require('utilise/keys')
    , def = require('utilise/def')
    , key = require('utilise/key')
    , is = require('utilise/is')
    , lo = require('utilise/lo')
    , by = require('utilise/by')
    , za = require('utilise/za')
    , log = require('utilise/log')('[ri/resdir]')
    , err = require('utilise/err')('[ri/resdir]')
    , minimatch = require('minimatch')
    , extname = path => [''].concat(path.split('.').slice(1)).join('.')