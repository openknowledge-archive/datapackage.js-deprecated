var createReadStream = require('../').createReadStream
  , fs = require('fs')
  , path = require('path')
  , assert = require('assert');

describe('streams', function(){
  var dpkg;
  var dpkgRoot = path.resolve(__dirname, 'data/dpkg1/');  

  beforeEach(function(){
    dpkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'data/dpkg1/package.json')));
  });

  it('should return a vanilla stream of a resource with a "data" property', function(done){
    var s = createReadStream(dpkgRoot, dpkg, 'test');
    s.on('error', function(err){ throw err; });
    s.on('data', function(data){
      var expected = [
        {"a": "a", "b": "1", "c": "1.2"},
        {"a": "x", "b": "2", "c": "2.3"},
        {"a": "y", "b": "3", "c": "3.4"}
      ];      
      assert.deepEqual(JSON.parse(data.toString()), expected);      
    });
    s.on('end', done);    
  });

  it('should return a vanilla stream of a resource with a "path" property', function(done){
    var dpkg2 = require(path.join(dpkgRoot, 'node_modules', 'dpkg2', 'package.json'));
    var s = createReadStream(path.join(dpkgRoot, 'node_modules', 'dpkg2'), dpkg2, 'seq');
    var str = '';
    s.on('error', function(err){ throw err; });
    s.on('data', function(data){
      str += data.toString();
    });
    s.on('end', function(){
      var expected = ['"seq"',"5","null","111","148"].join('\n') + '\n';     
      assert.deepEqual(str, expected);      
      done()
    });
  });

  it('should return a vanilla stream of a resource with an "url" property (as Buffer)', function(done){
    var body = [];
    var s = createReadStream(dpkgRoot, dpkg, 'url');
    s.on('error', function(err){ throw err; });
    s.on('data', function(chunk){
      body.push(chunk);
    });
    s.on('end', function(){
      fs.readFile(path.resolve(__dirname, 'data/test.csv'), function(err, expected){
        if(err) throw err;
        assert.deepEqual(Buffer.concat(body), expected);
        done()
      });     
    });
  });

  it('should stream an SDF resource in objectMode without foreignkeys', function(done){
    var expected = [
      {"a": "a", "b": "1", "c": "1.2"},
      {"a": "x", "b": "2", "c": "2.3"},
      {"a": "y", "b": "3", "c": "3.4"}
    ];

    var s = createReadStream(dpkgRoot, dpkg, 'test', {objectMode:true});
    s.on('error', function(err){ throw err; });

    var counter = 0;
    s.on('data', function(data){ assert.deepEqual(data, expected[counter++]); });
    s.on('end', done);
  });

  it('should coerce values', function(done){
    var expected = [
      {"a": "a", "b": 1, "c": 1.2},
      {"a": "x", "b": 2, "c": 2.3},
      {"a": "y", "b": 3, "c": 3.4}
    ];

    var s = createReadStream(dpkgRoot, dpkg, 'test', {coerce:true});
    s.on('error', function(err){ throw err; });

    var counter = 0;
    s.on('data', function(obj){
      for(var key in obj){
        assert.strictEqual(obj[key], expected[counter][key]);          
      }
      counter++;
    });

    s.on('end', done);       
  });

  it('should stream an SDF resource in objectMode with foreignkeys', function(done){
    var expected = [
      {x: 10, date: '2012-08-02', seq: '5'},
      {x: 20, date: '2012-08-16', seq: 'null'},
      {x: 30, date: '2012-09-20', seq: '111'},
      {x: 40, date: '2012-10-04', seq: '148'}
    ];

    var s = createReadStream(dpkgRoot, dpkg, 'foreign', {foreignkeys:true});
    s.on('error', function(err){ throw err; });

    var counter = 0;
    s.on('data', function(data){ assert.deepEqual(data, expected[counter++]); });

    s.on('end', done);       
  });


  it('should stream an SDF resource in objectMode with foreignkeys and transform the result in line delimited json (as Buffer)', function(done){
    var expected = [
      {x: 10, date: '2012-08-02', seq: '5'},
      {x: 20, date: '2012-08-16', seq: 'null'},
      {x: 30, date: '2012-09-20', seq: '111'},
      {x: 40, date: '2012-10-04', seq: '148'}
    ].map(function(x){return new Buffer(JSON.stringify(x) + '\n');});

    var s = createReadStream(dpkgRoot, dpkg, 'foreign', {foreignkeys:true, ldjsonify:true});
    s.on('error', function(err){ throw err; });

    var counter = 0;
    s.on('data', function(data){ 
      assert.deepEqual(data, expected[counter++]); 
    });

    s.on('end', done);       
  });


});
