var expect = require('chai').expect
  , client = require('utilise/client')
  , time = require('utilise/time')
  , path = require('path')
  , data = require('rijs.data')
  , core = require('rijs.core')
  , css = require('rijs.css')
  , fn = require('rijs.fn')
  , resdir = require('./')
  , fs = require('fs')
 
describe('Resources Folder', function(){

  it('should auto load resources folder', function(done){  
    var ripple = resdir(fn(css(data(core()))))
    ripple.on('ready', d => {
      expect(ripple('./resources/foo.js')).to.be.a('function')
      expect(ripple('./resources/bar.css')).to.equal('.bar {}')
      expect(ripple('./resources/sth/sth.js')).to.be.a('function')
      expect(ripple('data')).to.be.eql(String)
      expect(ripple('promise')).to.be.eql(Date)
      expect(ripple('component')).to.be.a('function')
      expect(ripple('component.css')).to.equal(':host {}')
      expect(ripple.resources.test).to.not.be.ok
      expect(ripple.resources['foo.test']).to.not.be.ok
      expect(ripple.resources['sth.test']).to.not.be.ok
      expect(ripple.resources['component.test']).to.not.be.ok
      ripple.watcher.close()
      done()
    })
  })

  it('should auto load from specific dir with opts', function(done){  
    var ripple = resdir(fn(css(data(core()))), { dir: path.resolve() })
    ripple.on('ready', d => {
      expect(ripple('./resources/foo.js')).to.be.a('function')
      expect(ripple('./resources/bar.css')).to.equal('.bar {}')
      expect(ripple('./resources/sth/sth.js')).to.be.a('function')
      expect(ripple('component')).to.be.a('function')
      expect(ripple('component.css')).to.equal(':host {}')
      expect(ripple('data')).to.be.eql(String)
      expect(ripple('promise')).to.be.eql(Date)
      expect(ripple.resources.test).to.not.be.ok
      ripple.watcher.close()
      done()
    })
  })

  it('should auto load with specific glob', function(done){  
    var ripple = resdir(fn(css(data(core()))), { dir: path.resolve('./resources'), autoload: '.', pattern: '/**/!(*test).{js,css}' })
    ripple.on('ready', d => {
      expect(ripple('./foo.js')).to.be.a('function')
      expect(ripple('./bar.css')).to.equal('.bar {}')
      expect(ripple('./sth/sth.js')).to.be.a('function')
      expect(ripple('data')).to.be.eql(String)
      expect(ripple('promise')).to.be.eql(Date)
      expect(ripple('component')).to.be.not.ok
      expect(ripple('component.css')).to.be.not.ok
      expect(ripple.resources.test).to.not.be.ok
      ripple.watcher.close()
      done()
    })
  })

  it('should auto load resources folder when no dir prop on opts', function(done){  
    var ripple = resdir(fn(css(data(core()))), { })
    ripple.on('ready', d => {
      expect(ripple('./resources/foo.js')).to.be.a('function')
      expect(ripple('./resources/bar.css')).to.equal('.bar {}')
      expect(ripple('./resources/sth/sth.js')).to.be.a('function')
      expect(ripple('component')).to.be.a('function')
      expect(ripple('component.css')).to.equal(':host {}')
      expect(ripple('data')).to.be.eql(String)
      expect(ripple('promise')).to.be.eql(Date)
      expect(ripple.resources.test).to.not.be.ok
      ripple.watcher.close()
      done()
    })
  })

  it('should watch for changes', function(done){  
    var ripple = resdir(fn(css(data(core()))))
      

    ripple.on('ready', d => {
      expect(cjs(ripple('./resources/foo.js')).name).to.be.eql('foo')
      fs.writeFileSync('./resources/foo.js', 'module.exports = function baz(){ }')

      ripple.once('change', function(){
        expect(cjs(ripple('./resources/foo.js')).name).to.be.eql('baz')
        fs.writeFileSync('./resources/foo.js', 'module.exports = function foo(){ }')
        ripple.watcher.close()
        done()
      })
    })
  })

  it('should ignore resources prefixed with _', function(done){  
    var ripple = resdir(fn(css(data(core()))))
    ripple.on('ready', d => {
      expect(ripple.resources.ignore).to.not.be.ok
      ripple.watcher.close()
      done()
    })
  })

  it('should invoke loaded function', function(done){
    var ripple = resdir(fn(css(data(core()))))
    ripple.on('ready', d => {
      expect(ripple.loadedResdir[0]).to.eql(ripple)
      expect(ripple.loadedResdir[1].name).to.eql('data')
      expect(ripple.loadedResdir[1].body).to.eql(String)
      delete ripple.loadedResdir

      // TODO: This is not unref'd preventing exit 
      fs.appendFileSync('./resources/some.data.js', ' ')
      time(100, d => {
        expect(ripple.loadedResdir[1].name).to.eql('data')
        expect(ripple.loadedResdir[1].body).to.eql(String)
        ripple.watcher.close()
        done()
      })
    })
  })

  it('should load from additional resdirs from command line', function(done){  
    process.argv = [
      0
    , 0
    , '--resdirs'
    , './tertiary,./secondary'
    ]

    var ripple = resdir(fn(css(data(core()))))
    ripple.on('ready', d => {
      expect('data' in ripple.resources).to.be.ok
      expect('secondary' in ripple.resources).to.be.ok
      expect('tertiary' in ripple.resources).to.be.ok
      ripple.watcher.close()
      done()
    })
  })

  it('should load from additional resdirs from command line - shortcut', function(done){  
    process.argv = [
      0
    , 0
    , '-r'
    , './tertiary,./secondary'
    ]

    var ripple = resdir(fn(css(data(core()))))
    ripple.on('ready', d => {
      expect('data' in ripple.resources).to.be.ok
      expect('secondary' in ripple.resources).to.be.ok
      expect('tertiary' in ripple.resources).to.be.ok
      ripple.watcher.close()
      done()
    })
  })

  it('should load but not watch files if disabled', function(done){  
    var ripple = resdir(fn(css(data(core()))), { watch: false })
    ripple.on('ready', d => {
      expect(ripple.loadedResdir[0]).to.eql(ripple)
      expect(ripple.loadedResdir[1].name).to.eql('data')
      expect(ripple.loadedResdir[1].body).to.eql(String)
      delete ripple.loadedResdir

      ripple.once('change', function(){
        throw new Error('this should not be called')
      })
      fs.appendFileSync('./resources/some.data.js', ' ')

      time(500, d => { 
        expect(ripple.loadedResdir).to.be.not.ok
        done()
      })
    })
  })

  it('should load but not watch files if disabled (prod by default)', function(done){  
    process.env.NODE_ENV = 'prod'
    var ripple = resdir(fn(css(data(core()))))
    ripple.on('ready', d => {
      expect(ripple.loadedResdir[0]).to.eql(ripple)
      expect(ripple.loadedResdir[1].name).to.eql('data')
      expect(ripple.loadedResdir[1].body).to.eql(String)
      delete ripple.loadedResdir

      ripple.once('change', function(){
        throw new Error('this should not be called')
      })
      fs.appendFileSync('./resources/some.data.js', ' ')

      time(500, d => { 
        expect(ripple.loadedResdir).to.be.not.ok
        done()
      })
    })
  })

  // TODO: replace with .load
  // it('should allow awaiting resource', function(done){  
  //   const ripple = resdir(fn(css(core())))
  //   ripple.get('foo').then(foo => {
  //     expect(foo.name).to.be.eql('foo')
  //     ripple.watcher.close()
  //     done()
  //   })
  // })

  // TODO: needed?
  // it('should emit loaded events', function(done){  
  //   var ripple = resdir(fn(css(data(core()))))
  //     , expected = [
  //         'bar.css'
  //       , 'data'
  //       , 'foo'
  //       , 'promise'
  //       , 'tertiary'
  //       , 'secondary'
  //       , 'component.css'
  //       , 'component'
  //       , 'sth'
  //       ].sort()

  //   ripple
  //     .on('loaded')
  //     .reduce((acc = [], d) => acc.concat(d))
  //     .filter(acc => acc.length == 9)
  //     .then(acc => expect(acc.sort()).to.be.eql(expected))
  //     .then(() => done())
  // })

})

function cjs(module) {
  const m = { exports: {} }
  module(m, m.exports)
  return m.exports
}