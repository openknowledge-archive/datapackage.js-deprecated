var util = require("util")
  , Readable = require("stream").Readable;


function Streamify(obj, options){
  options = options || {};

  Readable.call(this, options);

  if (options.objectMode){
    Array.isArray(obj) ? obj : [ obj ];
  } else {
    obj = [ JSON.stringify(obj) ];
  }

  this._obj = obj;
  this._i = 0;
  this._iEnd = obj.length;
};

util.inherits(Streamify, Readable);

Streamify.prototype._read = function (size){
  this.push(this._obj[this._i++]);
  if(this._i === this._iEnd){
    this.push(null);
  }
};

module.exports = Streamify;
