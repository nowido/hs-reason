//------------------------------------------------------------------------------
var fs = require('fs');
//------------------------------------------------------------------------------

function implContentPromise(stream, asText)
{
    return new Promise((resolve, reject) => 
    {
    	var contentChunks = [];
    	var length = 0;
        
        stream.once('error', e => 
        { 
            reject(e); 
        });

    	stream.on('data', chunk => 
    	{ 
    	    length += chunk.length; 
    	    contentChunks.push(chunk); 
    	});
    
    	stream.once('end', () => 
    	{ 
    	    stream.removeAllListeners('data'); 
    	    
    	    var content = Buffer.concat(contentChunks, length);
    	    
    	    if(asText)
    	    {
    	        resolve(content.toString());    
    	    }
    	    else
    	    {
    	        resolve(content);
    	    }
        });		
    });    
}

function implFileContentPromise(path, asText)
{
    return Promise.resolve(path).then(fs.createReadStream).then(stream => 
    {
        return implContentPromise(stream, asText);
    });
}

exports.content = implContentPromise;
exports.file = implFileContentPromise;

//------------------------------------------------------------------------------

function implCachedFilesPromise(registry)
{
    var files = Object.keys(registry).map(key => 
    {   
        var entry = registry[key];
        
        return implFileContentPromise(entry.path, entry.mode === 'text');
    });
    
    return Promise.all(files);
}

exports.cached = implCachedFilesPromise;

//------------------------------------------------------------------------------
