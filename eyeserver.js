var express = require('express'),
    Eye = require('./eye');

function EyeServer(options) {
  options = options || {};
  
  eyeServer = express.createServer();
  eyeServer.constructor = EyeServer;
  eyeServer.prototype = EyeServer.prototype;
  
  var eye = new Eye();
  
  eyeServer.use(express.bodyParser());
  eyeServer.get (/^\/$/, handleEyeRequest);
  eyeServer.post(/^\/$/, handleEyeRequest);
  
  function handleEyeRequest (req, res, next) {
    var reqParams = req.query,
        body = req.body || {},
        data = reqParams.data || [],
        query = reqParams.query || body.query,
        settings = {};
    
    // make sure data is an array
    if(typeof(data) === 'string')
      data = data.split(',');
    
    // add body data
    if(typeof(body.data) === 'string')
      data.push(body.data);
    else if(body.data instanceof Array)
      data.push.apply(data, body.data);
    
    // collect data and data URIs
    settings.data = [];
    // inspect all data parameters in request parameters
    data.forEach(function (item) {
      if(!item.match(/^https?:\/\//))
        // item is N3 data – push it
        settings.data.push(item);
      else
        // item is list of URIs – push each of them
        settings.data.push.apply(settings.data, item.split(','));
    });
    
    // do a reasoner pass by default
    settings.pass = true;
    
    // add query if present
    if(query) {
      settings.query = query;
      delete settings.pass;
    }

    // add debug information if requested
    if(options.debug)
      settings.originalUrl = req.originalUrl;

    // execute the reasoner and return result or error
    (options.eye || eye).execute(settings, function (error, result) {
      if(!error) {
        res.header('Content-Type', 'text/n3');
        res.send(result + '\n');
      }
      else {
        res.header('Content-Type', 'text/plain');
        res.send(error + '\n', 400);
      }
    });
  }
  
  return eyeServer;
}

module.exports = EyeServer;
