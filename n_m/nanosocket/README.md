# Nanosocket

* Tiny: ~20 lines, ~1 kb bundled
* Handles reconnection with exponential backoff
* Receive responses via callback/promise/stream (checkout [emitterify](https://github.com/utilise/emitterify/#emitterify))

#### [example.html](https://rawgit.com/pemrouz/nanosocket/master/example.html):

  ```js
const socket = nanosocket('wss://echo.websocket.org')
// to connect to the same origin:
// const socket = nanosocket()

// log stream of incoming messages
socket.on('recv').map(d => console.log("recv", d))

// log all connection events
socket.on('connected').map(d => console.log("connected", d))

// log all disconnection events
socket.on('disconnected').map(d => console.log("disconnected", d))

// send a message
// note that this returns a promsie for when the message is actually sent
// since you can send when disconnected, and it will send after reconnecting etc
socket.send('boo').then(d => console.log("sent", d))
```