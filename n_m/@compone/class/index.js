module.exports = definition => assign(
   definition.class               ? definition.class
: !definition.prototype           ? classed(definition)
:  definition.prototype.render    ? definition
:  definition.prototype.connected ? definition
                                  : classed(definition)
)

const { assign } = Object

const classed = render => render.class = render.class || class { 
  render(){ render.apply(this, arguments) } 
}