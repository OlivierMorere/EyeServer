var vows = require('vows'),
    should = require('should'),
    fs = require('fs'),
    path = require('path'),
    express = require('express');
var ResourceCache = require('../resourcecache');

vows.describe('ResourceCache').addBatch({
  'The ResourceCache module': {
    topic: function() { return ResourceCache; },
    
    'should be a function': function (ResourceCache) {
      ResourceCache.should.be.a('function');
    },
    
    'should make ResourceCache objects': function (ResourceCache) {
      ResourceCache().constructor.should.eql(ResourceCache);
      ResourceCache().should.be.an.instanceof(ResourceCache);
    },
    
    'should be a ResourceCache constructor': function (ResourceCache) {
      new ResourceCache().constructor.should.eql(ResourceCache);
      new ResourceCache().should.be.an.instanceof(ResourceCache);
    }
  },
  'A ResourceCache': {
    topic: new ResourceCache(),
    
    'when asked for its directory name': {
      topic: function(resourceCache) {
        return resourceCache.getDirectoryName(this.callback);
      },
      
      'should return the name of a temporary directory': function(err, dirName) {
        should.not.exist(err);
        dirName.should.match(/^\/tmp\/[\w\d_]+\/$/);
      },
      
      'should have created that temporary directory': function(err, dirName) {
        should.not.exist(err);
        path.existsSync(dirName).should.be.true;
      },
      
      'a second time': {
        topic: function(firstDirName, resourceCache) {
          var thiz = this;
          return resourceCache.getDirectoryName(function(err, secondDirName) {
            thiz.callback(err, firstDirName, secondDirName);
          });
        },
        
        'should return the name of the same temporary directory': function(err, firstDirName, secondDirName) {
          should.not.exist(err);
          secondDirName.should.eql(firstDirName);
        }
      }
    },
    
    'when caching a resource from a string': {
      topic: function(resourceCache) {
        return resourceCache.cacheFromString('contents', this.callback);
      },
      
      'should use a temporary file': function(err, result) {
        should.not.exist(err);
        result.should.match(/^\/tmp\/[\w\d_]+\/\d+\.tmp$/);
      },
      
      'should store the resource contents in this file': function(err, result) {
        should.not.exist(err);
        fs.readFileSync(result, 'utf8').should.eql('contents');
      }
    },
    
    'when caching an existing resource through HTTP': {
      topic: function(resourceCache) {
        return resourceCache.cacheFromUrl('http://127.0.0.1:8005/', this.callback);
      },
      
      'should use a temporary file': function(err, result) {
        should.not.exist(err);
        result.should.match(/^\/tmp\/[\w\d_]+\/\d+\.tmp$/);
      },
      
      'should store the resource contents in this file': function(err, result) {
        should.not.exist(err);
        fs.readFileSync(result, 'utf8').should.eql('contents');
      }
    },
    
    'when caching a non-existing resource through HTTP': {
      topic: function(resourceCache) {
        return resourceCache.cacheFromUrl('http://127.0.0.1:8005/notexists', this.callback);
      },
      
      'should result in an error': function(err, result) {
        err.should.eql('GET request to http://127.0.0.1:8005/notexists failed with status 404');
        should.not.exist(result);
      }
    }
  }
}).export(module);

dummyServer = express.createServer();
dummyServer.get(/^\/$/, function (req, res, next) { res.send('contents', 200); });
dummyServer.listen(8005);