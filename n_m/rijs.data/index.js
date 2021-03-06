// -------------------------------------------
// Adds support for data resources
// -------------------------------------------
module.exports = function data(ripple){
  log('creating')
  ripple
    .on('change.data')
    .filter(([name, change]) => header('content-type', 'application/data')(ripple.resources[name]))
    .filter(([name, change]) => change && change.key)
    .map(([name, change]) => ripple
      .resources[name]
      .body
      .emit('change', (change || null), not(is.in(['bubble']))))

  ripple.types['application/data'] = {
    header: 'application/data'
  , ext: '*.data.js'
  , selector: res => `[data~="${res.name}"]`
  , extract: el => (attr(`data`)(el) || '').split(' ')
  , check: res => is.obj(res.body)
  , load(res) {
      let exported = require(res.headers.path)
      exported = exported.default || exported
      exported = is.fn(exported) ? exported(ripple) : exported
      res.headers['content-type'] = this.header
      ripple(merge(res)(exported))
      return ripple.resources[res.name]
    }
  , parse(res){ 
      const existing = ripple.resources[res.name] || {}

      extend(res.headers)(existing.headers)
      res.body = set()(
        res.body || []
      , existing.body && existing.body.log
      , is.num(res.headers.log) ? res.headers.log : -1
      )
      overwrite(res.body.on)(listeners(existing))
      res.body.on('change.bubble', change => {
        ripple.emit('change', ripple.change = [res.name, change], not(is.in(['data'])))
        delete ripple.change
      })

      if (res.headers.loaded && !res.headers.loading)
        res.headers.loading = Promise.resolve(res.headers.loaded(ripple, res))
          .then(() => { 
            delete res.headers.loading
            return res
          })

      return res
    }
  }

  return ripple
}

const overwrite = require('utilise/overwrite')
    , header = require('utilise/header')
    , extend = require('utilise/extend')
    , merge = require('utilise/merge')
    , attr = require('utilise/attr')
    , not = require('utilise/not')
    , key = require('utilise/key')
    , set = require('utilise/set')
    , fn = require('utilise/fn')
    , is = require('utilise/is')
    , log = require('utilise/log')('[ri/types/data]')
    , listeners = key('body.on')