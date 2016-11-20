//------------------------------------------------------------------------------

var started = false;

//------------------------------------------------------------------------------

function Logger(containerElement)
{
    this.id = generateUniqueKey();
    
    $(containerElement).append('<div id="' + this.id + '"></div>');
    
    this.root = $('#' + this.id);
    
    this.root
        //.css({'overflow-y' : 'scroll', 'height': '100%'})
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
    commander.promiseCommand('REDIS', ['aincex', 'q', 3])
        .then(context => 
        {
            info.log(context.message.answer);
        });

    /*
    var yadCommand = 
    {
        command: 'GETMETAINFO',
        path: 'app:/',
        limit: 100,
        offset: 0,
        fields: '_embedded.items.name,_embedded.total,name'
    };

    var yadCommand = 
    {
        command: 'CREATEFOLDER',
        path: 'app:/Foo'
    };
    
    var yadCommand = 
    {
        command: 'DELETE',
        path: 'app:/a.json'
    };

    var yadCommand = 
    {
        command: 'DELETE',
        path: 'app:/3.txt'
    };

    var yadCommand = 
    {
        command: 'COPY',
        from: 'app:/2.txt',
        path: 'app:/3.txt'
    };

    var yadCommand = 
    {
        command: 'MOVE',
        from: 'app:/2.txt',
        path: 'app:/3.txt'
    };

    var yadCommand = 
    {
        command: 'GETUPLOADURL',
        path: 'app:/3.txt'
    };

    var yadCommand = 
    {
        command: 'WRITE',
        path: 'app:/3.txt',
        asText: true,
        overwrite: true,
        content: 'Foo Bar 12345'
    };
    
    */

    var yadCommand = 
    {
        command: 'READ',
        path: 'app:/art.jpg'
    };

    commander.promiseCommand('YAD', yadCommand)
        .then(context => 
        {
            var buf = base64ToBin(context.message.answer);
            
            info.log(buf.length);
            
            var yadCommand2 = 
            {
                command: 'WRITE',
                path: 'app:/art2.jpg',
                content: binToBase64(buf)
            };
            
            commander.promiseCommand('YAD', yadCommand2)
                .then(ctx => 
                {
                    info.log(typeof(ctx.message.answer) + ': ' + ctx.message.answer);
                })
                .catch(errContext => 
                {
                    info.log(typeof(errContext.message.error) + ': ' + errContext.message.error);
                });
            
            //info.log(typeof(context.message.answer) + ': ' + context.message.answer);
        })
        .catch(errContext => 
        {
            info.log(typeof(errContext.message.error) + ': ' + errContext.message.error);
        });

    setInterval(function(){
        
        commander.issueCommand('PING', {}, function(context){
            
            info.log(context.message.answer);
        });
        
    }, 1000);    
}

//------------------------------------------------------------------------------

$(document).ready(function(){

    document.title = 'Computational node';
    
    var bsContainer = $('#main');
    
    var info = new Logger(bsContainer);
    
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
