var core = require('rijs.core')
  , update = require('utilise/update')
  , clone = require('utilise/clone')
  , expect = require('chai').expect
  , time = require('utilise/time')
  , keys = require('utilise/keys')
  , data = require('./')
  , key = require('utilise/key')
  , set = require('utilise/set')
  , to = require('utilise/to')

describe('Data Type', function() {

  it('should create data resource', function(){  
    var ripple = data(core())
    ripple('foo', { foo: 'bar' })
    expect(ripple('foo')).to.eql({ foo: 'bar' })
  })

  it('should not automatically create data resource if no body', function(){  
    var ripple = data(core())
    expect(ripple('foo')).to.be.not.ok
    expect(ripple.resources.foo).to.not.be.ok
  })

  it('should create data resource if body function', function(){  
    var ripple = data(core())
      , fn = d => 'foo'
    ripple('foo', fn, { 'content-type': 'application/data' })
    expect(ripple('foo')).to.eql(fn)
  })

  it('should not create data resource', function(){  
    var ripple = data(core())
    ripple('baz', String)
    expect(ripple.resources['baz']).to.not.be.ok
  })

  it('should emit local change events', function(){
    var ripple = data(core())
      , fn = function(){ result = to.arr(arguments) }
      , result

    ripple('foo', {}).on('change', fn)

    ripple('foo').emit('change')
    expect(result).to.eql([undefined])

    ripple('foo').emit('change', { change: 'yep' })
    expect(result).to.eql([{ change: 'yep' }])
  })

  it('should emit global change events', function(){
    var ripple = data(core())
      , fn = function(){ result = to.arr(arguments) }
      , result 

    ripple('foo', {})
    ripple.on('change', fn)

    ripple('foo').emit('change')
    expect(result).to.eql(['foo', undefined])

    ripple('foo').emit('change', { change: 'yep' })
    expect(result).to.eql(['foo', { change: 'yep' }])
  })

  it('should proxy global change events to local', function(){
    var ripple = data(core())
      , fn = function(){ result = to.arr(arguments) }
      , result 

    ripple('foo', {}).on('change', fn)

    ripple.emit('change', 'foo')
    expect(result).to.be.not.ok

    ripple.emit('change', ['foo'])
    expect(result).to.be.not.ok

    ripple.emit('change', ['foo', false])
    expect(result).to.be.not.ok

    ripple.emit('change', ['foo', { key: 'yep' }])
    expect(result).to.eql([{ key: 'yep' }])
  })

  it('should not duplicate listeners', function(){
    var ripple = data(core())
      
    ripple('foo', [1])
    ripple('foo', [2])
    
    expect(ripple.resources.foo.body.on.change.length).to.equal(1)
    expect(ripple.resources.foo.body.on.change.$bubble).to.be.a('function')
  })

  it('should not destroy existing headers by default', function(){
    var ripple = data(core())
    
    ripple({ name: 'name', body: ['foo'], headers: { foo: 'bar' }})
    expect(ripple.resources.name.headers.foo).to.be.eql('bar')

    ripple({ name: 'name', body: ['bar'] })
    expect(ripple.resources.name.headers.foo).to.be.eql('bar')

    ripple({ name: 'name', body: ['lorem'], headers: {} })
    expect(ripple.resources.name.headers.foo).to.be.eql('bar')

    ripple({ name: 'name', body: ['baz'], headers: { foo: 'baz'  } })
    expect(ripple.resources.name.headers.foo).to.be.eql('baz')
  })

  it('should not lose all listeners', function(){
    var ripple = data(core())
      
    ripple('foo', ['foo'])
      .on('change', String)
      .on('change.foo', Date)
      .on('foo', Function)
      .on('foo.bar', Boolean)

    ripple('foo', ['bar'])

    expect(ripple('foo').on.change[0]).to.eql(String)
    expect(ripple('foo').on.change.length).to.eql(3)
    expect(ripple('foo').on.change.$foo).to.eql(Date)
    
    expect(ripple('foo').on.foo[0]).to.eql(Function)
    expect(ripple('foo').on.foo.length).to.eql(2)
    expect(ripple('foo').on.foo.$bar).to.eql(Boolean)
  })

  it('should not lose log and update it on overwrite', function(){
    var ripple = data(core())
      , changes = []

    ripple.on('change', function(d, change){ changes.push(clone(change)) })

    ripple('foo', ['foo'])
    update(0, 'bar')(ripple('foo'))
 
    ripple('foo', ['baz'])
    update(0, 'boo')(ripple('foo'))

    expect(changes).to.eql([ 
      { time: 0, type: 'update', value: ['foo'] }
    , { time: 1, type: 'update', value:  'bar', key: '0' }
    , { time: 2, type: 'update', value: ['baz'] }
    , { time: 3, type: 'update', value:  'boo', key: '0' } 
    ])

    expect(ripple('foo').log).to.eql([null, null, null, null])
  })

  it('should not lose existing headers', function(){
    var ripple = data(core())
    ripple('foo', { bar: 1 }, { foo: { bar: 5 } })
    expect(ripple.resources.foo.headers.foo).to.eql({ bar: 5 })
    ripple('foo', { bar: 2 })
    expect(ripple.resources.foo.headers.foo).to.eql({ bar: 5 })
  })

  it('should make active change accessible', function(done){
    var ripple = data(core())
      , result

    ripple('foo', { bar: 5 })
    ripple.on('change', function(data){
      result = ripple.change
    })
      
    expect(ripple.change).to.be.not.ok
    update('bar', 15)(ripple('foo'))
    expect(ripple.change).to.be.not.ok

    time(10, function(){
      expect(result).to.eql(['foo', { type: 'update', key: 'bar', value: 15, time: 1 }])
      done()
    })
  })
})