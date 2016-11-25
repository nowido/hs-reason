//------------------------------------------------------------------------------
var https = require('https');
var url = require('url');
//------------------------------------------------------------------------------

var asyncrw = require('./asyncrw.js');
var base64 = require('./base64.js');

//------------------------------------------------------------------------------

const noCommandPresent = 'NoCommandPresent';
const unrecognizedCommand = 'UnrecognizedCommand';

//------------------------------------------------------------------------------

function buildQueryPart(args)
{
    var s = '';
    
    var keys = Object.keys(args);
    
    var prefix = '?';
    
    keys.forEach(key => 
    {
        if(key !== 'content')
        {
            s += prefix + key + '=' + args[key];
            prefix = '&';
        }
    });
    
    return s;
}

//------------------------------------------------------------------------------

function makeRequest(method, reqUrl, headers, content)
{
    return new Promise((resolve, reject) => 
    {
        var req = https.request
        ({
            hostname: reqUrl.host, 
            path: reqUrl.path,
            method: method,
            headers: headers
        });
        
        req.once('error', reject);
        
        req.once('response', res => 
        {
            if(res.statusCode < 300)
            {
                asyncrw.content(res, true)
                    .then(resolve)
                    .catch(reject);
            }
            else if(res.headers["location"])
            {
                makeRequest(method, res.headers["location"], headers, content)
                    .then(resolve)
                    .catch(reject);
            }
            else
            {
                asyncrw.content(res, true)
                    .then(reject)
                    .catch(err => 
                    {
                        var errObject = 
                        {
                            error: err, 
                            statusCode: res.statusCode
                        };
                        
                        reject(errObject);        
                    });
            }
        });
        
        if(content)
        {
            req.write(content);
        }
        
        req.end();
    });
}

//------------------------------------------------------------------------------

function implDownload(reqUrl, asText)
{
    return new Promise((resolve, reject) => 
    {
        var parsedUrl = url.parse(reqUrl);
        
        var req = https.request
        ({
            hostname: parsedUrl.hostname, 
            path: parsedUrl.path,
            method: 'GET'
        });
        
        req.once('error', reject);
        
        req.once('response', res => 
        {
            if(res.statusCode < 300)
            {
                asyncrw.content(res, asText)
                    .then(resolve)
                    .catch(reject);
            }
            else if(res.headers["location"])
            {
                implDownload(res.headers["location"], asText)
                    .then(resolve)
                    .catch(reject);
            }
            else
            {
                asyncrw.content(res, asText)
                    .then(reject)
                    .catch(err => 
                    {
                        var errObject = 
                        {
                            error: err, 
                            statusCode: res.statusCode
                        };
                        
                        reject(errObject);        
                    });
            }
        });
        
        req.end();
    });    
}

function implUpload(reqUrl, content)
{
    return new Promise((resolve, reject) => 
    {
        var parsedUrl = url.parse(reqUrl);
        
        var req = https.request
        ({
            hostname: parsedUrl.hostname, 
            path: parsedUrl.path,
            method: 'PUT'
        });
        
        req.once('error', reject);
        
        req.once('response', res => 
        {
            if(res.statusCode < 300)
            {
                asyncrw.content(res, true)
                    .then(resolve)
                    .catch(reject);
            }
            else if(res.headers["location"])
            {
                implUpload(res.headers["location"], content)
                    .then(resolve)
                    .catch(reject);
            }
            else
            {
                asyncrw.content(res, true)
                    .then(reject)
                    .catch(err => 
                    {
                        var errObject = 
                        {
                            error: err, 
                            statusCode: res.statusCode
                        };
                        
                        reject(errObject);        
                    });
            }
        });
        
        req.write(content);
        
        req.end();
    });    
}

//------------------------------------------------------------------------------

function implResourcesGeneral(method, op, args, yadStuff)
{
    var reqUrl = 
    {
        host: yadStuff.yadHost, 
        path: '/v1/disk/resources' + op + buildQueryPart(args)
    };
    
    return makeRequest(method, reqUrl, yadStuff.yadApiHeaders);
}

function implGetMetaInfo(args, yadStuff)
{
    return implResourcesGeneral('GET', '', args, yadStuff);
}

function implCreateFolder(args, yadStuff)
{
    return implResourcesGeneral('PUT', '', args, yadStuff);
}

function implDelete(args, yadStuff)
{
    return implResourcesGeneral('DELETE', '', args, yadStuff);
}

function implCopy(args, yadStuff)
{
    return implResourcesGeneral('POST', '/copy', args, yadStuff);
}

function implMove(args, yadStuff)
{
    return implResourcesGeneral('POST', '/move', args, yadStuff);
}

function implGetDownloadUrl(args, yadStuff)
{
    return implResourcesGeneral('GET', '/download', args, yadStuff);
}

function implGetUploadUrl(args, yadStuff)
{
    return implResourcesGeneral('GET', '/upload', args, yadStuff);
}

//------------------------------------------------------------------------------

function implReadFile(args, yadStuff)
{
    return new Promise((resolve, reject) => 
    {
        var asText = args.asText;
        
        delete args['asText'];
        
        implResourcesGeneral('GET', '/download', args, yadStuff)
        .then(link => 
        {
            var linkObj = JSON.parse(link);
            
            return implDownload(linkObj.href, asText);
        })
        .then(content => 
        {
            if(asText)
            {
                resolve(content);
            }
            else
            {
                resolve(base64.binToBase64(content));
            }
        })
        .catch(reject);
    });
}

function implWriteFile(args, yadStuff)
{
    return new Promise((resolve, reject) => 
    {
        var asText = args.asText;
        
        delete args['asText'];
        
        var data = asText ? args.content : base64.base64ToBin(args.content);
        
        implResourcesGeneral('GET', '/upload', args, yadStuff)
        .then(link => 
        {
            var linkObj = JSON.parse(link);
            
            return implUpload(linkObj.href, data);
        })
        .then(resolve)
        .catch(reject);
    });    
}

//------------------------------------------------------------------------------

var commandsRegistry = 
{
    'GETMETAINFO':      implGetMetaInfo,
    'CREATEFOLDER':     implCreateFolder,
    'DELETE':           implDelete,
    'COPY':             implCopy,
    'MOVE':             implMove,
    'GETDOWNLOADURL':   implGetDownloadUrl,
    'GETUPLOADURL':     implGetUploadUrl,
    'READ':             implReadFile,
    'WRITE':            implWriteFile
};

//------------------------------------------------------------------------------

function implExecuteCommand(args, yadStuff)
{
    if(args.command)
    {
        var registryEntry = commandsRegistry[args.command.toUpperCase()];
        
        delete args['command'];
    
        if(registryEntry)
        {
            return registryEntry(args, yadStuff);
        }
        else
        {
            return Promise.reject(unrecognizedCommand);
        }
    }
    else
    {
        return Promise.reject(noCommandPresent);
    }
}

//------------------------------------------------------------------------------

function implCreateYad(yadToken)
{
    var yadStuff = 
    {
        yadApiHeaders: 
        {
            'Authorization': 'OAuth ' + yadToken,
            'Accept' : 'application/json',
            'Content-Type': 'application/json'
        },
        
        yadHost: 'cloud-api.yandex.net'
    };
    
    var entry = 
    {
        executeCommand: args => 
        {
            return implExecuteCommand(args, yadStuff);
        }
    };
    
    return entry;
}

//------------------------------------------------------------------------------

exports.init = implCreateYad;

//------------------------------------------------------------------------------
