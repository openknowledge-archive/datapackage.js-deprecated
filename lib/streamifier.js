var util = require("util")
  , clone = require('clone')
  , Readable = require("stream").Readable;

/**
 * For inline data, we have no guarante that inline data is an
 * object. It can be a string (e.g inline CSV such as
 * "A,B,C\n1,2,3\n4,5,6")
 */

function Streamifier(inlineData, format, options){
  options = clone(options) || {};

  //we transform inlineData so that it is an Array
  if(typeof inlineData === 'string'){ 
    if(options.objectMode && (format === 'ldjson')){ //options.objectMode can be handled here
      inlineData = inlineData.split('/n').map(function(row){ if(row) { return JSON.parse(row);}; });
    } else {
      options.objectMode = false; //options.objectMode (if present) will be handled later as the string might need more parsing (CSV, ldJSON...)
      inlineData = [ new Buffer(inlineData) ];
    }
  } else { //object or array => format is json we can handle the objectMode option here
    
    if(options.objectMode){
      inlineData = Array.isArray(inlineData) ? inlineData : [ inlineData ];
    } else {
      inlineData = [ new Buffer(JSON.stringify(inlineData)) ];
    }    
  }

  Readable.call(this, options);

  this._inlineData = inlineData;
  this._i = 0;
  this._iEnd = inlineData.length;
};

util.inherits(Streamifier, Readable);

Streamifier.prototype._read = function (size){
  this.push(this._inlineData[this._i++]);
  if(this._i === this._iEnd){
    this.push(null);
  }
};

module.exports = Streamifier;
