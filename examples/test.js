//------------------------------------------------------------------------------

var started = false;

//------------------------------------------------------------------------------

function Logger(containerElement)
{
    this.id = generateUniqueKey();
    
    $(containerElement).append('<div id="' + this.id + '"></div>');
    
    this.root = $('#' + this.id);
    
    this.root
        .css({'overflow' : 'auto', 'height': '100%'})
        .append('<div id="info'+ this.id + '"></div>');
    
    this.info = $('#info' + this.id);    
}

Logger.prototype.log = function(str)
{
    this.info.append('<p>' + str + '</p>');

    this.root.scrollTop(this.info.height());
}

//------------------------------------------------------------------------------

function main(commander, info)
{
    function onDownloadProgress(evt)
    {
        if(evt.lengthComputable)
        {
            info.log('download progress ' + (100 * evt.loaded/evt.total).toPrecision(3) + '%');    
        }
        else
        {
            info.log('download progress ' + evt.loaded);
        }
    }

    function onUploadProgress(evt)
    {
        if(evt.lengthComputable)
        {
            info.log('upload progress ' + (100 * evt.loaded/evt.total).toPrecision(3) + '%');    
        }
        else
        {
            info.log('upload progress ' + evt.loaded);
        }
    }
    
    var yadStorage = new YadStorage(commander);
    
    yadStorage.asyncDownload('app:/2.txt', onDownloadProgress)
        .then(data => 
        {
            info.log('done download, ' + data.size + ' bytes');
            
            yadStorage.asyncUpload('app:/3.txt', data, false, onUploadProgress)
                .then(response => 
                {
                    info.log('done upload');
                })
                .catch(errContext => 
                {
                    info.log('ERR upload');
                });
        })
        .catch(errContext => 
        {
            info.log('ERR download ' + errContext);
        });
}

//------------------------------------------------------------------------------

$(document).ready(() =>
{
    var info = new Logger(document.body);
    
    var socket = io.connect();        
    
    const channel = 'message';
    
    var commander = new AsyncCommander(socket, channel);
    
    socket.on('connect', function(){
       
        info.log('*connect'); 
        
        if(!started)
        {
            started = true;
            
            main(commander, info);
        }
    });
    
    socket.on('disconnect', function(reason){
       
       info.log('*disconnect: ' + reason); 
    });
    
    socket.on(channel, function(message){
        
        if(!commander.hold(message, socket)){
            
                // to do: make special dispatcher for incoming notifications 
                
            info.log('*unknown reason: ' + message.reason);
        }
    });
});

//------------------------------------------------------------------------------