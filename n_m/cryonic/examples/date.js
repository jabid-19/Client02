var Cryo = require('../lib/cryo');

var now = new Date();

var withJSON = JSON.parse(JSON.stringify(now));
console.log(withJSON instanceof Date);              // false

var withCryo = Cryo.parse(Cryo.stringify(now));
console.log(withCryo instanceof Date);              // true