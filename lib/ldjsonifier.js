var util = require("util")
  , clone = require('clone')
  , Transform = require("stream").Transform;

function Ldjsonifier(options) {
  options = clone(options) || {};
  Transform.call(this, options);
  this._writableState.objectMode = true;
  this._readableState.objectMode = false;
};

util.inherits(Ldjsonifier, Transform);

Ldjsonifier.prototype._transform = function(chunk, encoding, done){
  this.push(JSON.stringify(chunk)+ '\n');  
  done();
};

module.exports = Ldjsonifier;
