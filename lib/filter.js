var util = require("util")
  , clone = require('clone')
  , Transform = require("stream").Transform;

function Filter(keys, options) {
  options = clone(options) || {};
  options.objectMode = true;

  this._keys = keys.slice();

  Transform.call(this, options);
};

util.inherits(Filter, Transform);

Filter.prototype._transform = function(chunk, encoding, done){

  var obj = {};
  this._keys.forEach(function(key){
    if(key in chunk){
      obj[key] = chunk[key];
    }
  });

  this.push(obj);
  
  done();

};


module.exports = Filter;
