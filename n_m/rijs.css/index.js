// -------------------------------------------
// Exposes a convenient global instance 
// -------------------------------------------
module.exports = function css(ripple){
  log('creating')
  ripple.types['text/css'] = {
    header: 'text/css'
  , ext: '*.css'
  , selector: res => `[css~="${res.name}"]`
  , extract: el => (attr(`css`)(el) || '').split(' ')
  , check(res){ return includes('.css')(res.name) }
  , shortname: path => basename(path)
  , load: !client && (res => {
      res.body = file(res.headers.path)
      res.headers['content-type'] = this.header
      res.headers.vary = ({ name }, { platform }) => `name:${name},ua:${platform.name}-${platform.version}`// TODO: how high can this be?
      ripple(res)
      return ripple.resources[res.name]
    })
  , parse(res){ 
      res.headers.hash = res.headers.hash || hash(res.body)
      return res
    }
  }

  return ripple
}

const log = require('utilise/log')('[ri/types/css]')
    , includes = require('utilise/includes')
    , client = require('utilise/client')
    , attr = require('utilise/attr')
    , hash = require('djbx')

if (!client) {
  var { basename } = require('path')
    , file = require('utilise/file')
}