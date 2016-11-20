//------------------------------------------------------------------------------
var fs = require('fs');
//------------------------------------------------------------------------------

function implContentPromise(stream, asText)
{
	var contentChunks = [];
	var length = 0;
    
    return new Promise((resolve, reject) => 
    {
        stream.once('error', e => 
        { 
            reject(e) 
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

exports.content = implContentPromise;

exports.file = (path, asText) => { 
    
    return implContentPromise(fs.createReadStream(path), asText); 
};

//------------------------------------------------------------------------------

function implCachedFilesPromise(registry)
{
    var files = registry.map(value => 
    {
        return implContentPromise(fs.createReadStream(value.path), value.mode === 'text');
    });
    
    return Promise.all(files);
}

exports.cached = implCachedFilesPromise;

//------------------------------------------------------------------------------