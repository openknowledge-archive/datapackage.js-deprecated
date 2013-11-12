var fs = require('fs')
  , path = require('path')
  , util = require('util')
  , clone = require('clone')
  , Readable = require("stream").Readable
  , PassThrough = require('stream').PassThrough
  , Parser = require("stream-csv-enhanced/Parser")
  , Streamer = require("stream-csv-enhanced/Streamer")
  , Packer = require("stream-csv-enhanced/Packer")
  , AsObject = require("stream-csv-enhanced/AsObject")
  , Streamify = require('./Streamifier')
  , Ldjsonify = require('./Ldjsonifier')
  , Filter = require('./Filter')
  , request = require('request')
  , MergeObjectStreams = require('merge-object-streams')
  , Validator = require('jts-validator');

function getResource(dpkg, name){
  return clone(dpkg.resources.filter(function(x){return x.name===name})[0]);
};

/**
 * return a readable stream
 */
function createReadStream(dpkgRoot, dpkg, resourceName, options){

  options = clone(options) || {};
  if(options.coerce || options.ldjsonify || options.foreignkeys){
    options.objectMode = true;
  }

  var stream;

  var resource = getResource(dpkg, resourceName);
  if(!resource){
    stream = new Readable(options);   
    process.nextTick(function(){
      stream.emit('error', new Error('resource does not exist'));
    });
    return stream;
  }

  //number of schema.field that are foreign keys (in case of SDF)
  var fkFields = (resource.schema && resource.schema.fields.filter(function(x){ return 'foreignkey' in x; })) || [];

  if(!options.foreignkeys || !fkFields.length || !options.objectMode){ //without objectMode, no support for foreignkeys
    stream =  getResourceStream(dpkgRoot, resource, options);    
    if(options.coerce && ('schema' in resource)){
      stream = stream.pipe(new Validator(resource.schema));
    }
    if(options.ldjsonify){
      stream = stream.pipe(new Ldjsonify());
    }
    return stream;
  }

  //everything below => foreignkeys and streams in objectMode

  stream = new PassThrough(options); //used so that we can return stream before the callbacks (due to I/O to fetch the package.json of the dependencies) have completed
  var streams = [];
  var nStreams = fkFields.length;
  //everything but the foreignkeys
  if(fkFields.length < resource.schema.fields.length){
    streams.push(getResourceStream(dpkgRoot, resource, options));
    nStreams++;
  }

  //the foreignkeys
  fkFields.forEach(function(field, i){
    getForeignResource(dpkgRoot, dpkg, field.foreignkey, options, function(err, field, fkStream){

      if(err){
        process.nextTick(function(){
          stream.emit('error', err);
        });
      } else {
        streams.push(fkStream);

        //replace field in resource.shema (to resolve the foreignkey)
        for(var j=0; j<resource.schema.fields.length; j++){
          if ( ('foreignkey' in resource.schema.fields[j]) && (resource.schema.fields[j]['foreignkey']['field'] === field.name) ){
            resource.schema.fields[j] = field;
            break;
          }
        }

        if(streams.length === nStreams){
          var m = new MergeObjectStreams(streams);
          if(options.coerce){
            m = m.pipe(new Validator(resource.schema));
          }
          if(options.ldjsonify){
            m = m.pipe(new Ldjsonify());
          }
          m.pipe(stream);
        }
      }

    });
  });
  
  return stream;
};


/**
 * return a stream of the resource and handles the objectMode option
 */
function getResourceStream(dpkgRoot, resource, options){

  var stream;

  //order matters
  if('data' in resource){
    stream =  new Streamify(resource.data, options);
  } else if('url' in resource){
    stream = request(resource.url);
  } else if('path' in resource){
    stream = fs.createReadStream(path.resolve(dpkgRoot, resource.path));
  } else {
    stream = new Readable(options);
    process.nextTick(function(){
      stream.emit('error', new Error('could not find "data", "url" or "path"'));
    });
  }

  if(!options.objectMode){
    return stream;
  }
  
  if(resource.format === 'csv'){
    var parser = new Parser();
    var streamer = new Streamer();
    var packer = new Packer();

    var asobject = new AsObject();

    stream = stream.pipe(parser)
      .pipe(streamer)
      .pipe(packer)
      .pipe(asobject);
  }
  
  return stream;
};

/**
 * return a stream (in objectMode) of the field specified in the foreignkey
 * object 
 *
 * TODO optimize and take into account how npm handles cyclic
 * dependencies (see
 * https://github.com/isaacs/npm/blob/master/doc/files/npm-folders.md)
 */
function getForeignResource(dpkgRoot, dpkg, foreignkey, options, callback){

  //foreignkey within the same datapacakge
  if(!('datapackage' in foreignkey)){
    return _streamit(dpkgRoot, dpkg, foreignkey, options, callback);
  }
  
  dpkgRoot = path.resolve(dpkgRoot, 'node_modules', foreignkey.datapackage);
  fs.readFile(path.join(dpkgRoot, 'package.json'), function(err, file){
    if(err) return callback(err);

    try{
      var dpkg = JSON.parse(file);
    } catch(e){
      return callback(e);
    }

    return _streamit(dpkgRoot, dpkg, foreignkey, options, callback);
  });
  
};

//helper function
function _streamit(dpkgRoot, dpkg, foreignkey, options, callback){
  var resource = getResource(dpkg, foreignkey.resource);
  if(!resource){
    return callback(new Error('resource does not exist'));
  }

  var field = resource.schema.fields.filter(function(x){ return x.name === foreignkey.field;})[0];
  if(!field){
    return callback(new Error('field does not exist'));
  }
  
  if('foreignkey' in field){
    return getForeignResource(dpkgRoot, field.foreignkey, callback);
  } else {
    var stream = getResourceStream(dpkgRoot, resource, options);
    var filter = new Filter([field.name]);
    return callback(null, field, stream.pipe(filter)); 
  }
};

module.exports = createReadStream;
