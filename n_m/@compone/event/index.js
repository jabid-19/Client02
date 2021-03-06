const emitterify = require('utilise/emitterify')

module.exports = function event(node, index) {
  node = node.host && node.host.nodeName ? node.host : node
  if (node.on) return
  node.listeners = {}

  const on = o => {
    const type = o.type.split('.').shift()
    if (!node.listeners[type])
      node.addEventListener(type, node.listeners[type] = 
        event => (!event.detail || !event.detail.emitted ? emit(type, [event, node.state, node]) : 0)
      )
  }

  const off = o => {
    if (!node.on[o.type] || !node.on[o.type].length) {
      node.removeEventListener(o.type, node.listeners[o.type])
      delete node.listeners[o.type]
    }
  }

  emitterify(node, { on, off })
  const { emit } = node

  node.emit = function(type, params){
    const detail = { params, emitted: true }
        , event = new CustomEvent(type, { detail, bubbles: false, cancelable: true })
    node.dispatchEvent(event)
    return emit(type, event)
  }
}