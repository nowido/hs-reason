//------------------------------------------------------------------------------

var started = false;

//------------------------------------------------------------------------------

function Model(commander)
{
    this.commander = commander;
}

Model.prototype.connectController = function(controller)
{
    this.controller = controller;
}

Model.prototype.getDataFilesList = function()
{
    var entry = this;
    
    var yadCommand = 
    {
        command: 'GETMETAINFO',
        path: 'app:/csv',
        limit: 100,
        offset: 0,
        fields: '_embedded.items.name,_embedded.total,name'
    };
    
    entry.commander.promiseCommand('YAD', yadCommand)
        .then(responseContext => 
        {
            var listObject = JSON.parse(responseContext.message.answer);
            
            var listNames;
            
            if(listObject._embedded && (listObject._embedded.total > 0))
            {
                listNames = listObject._embedded.items.map(file => file.name);
            }
            else
            {
                listNames = [];
            }
            
            // to update view, touch property with full object, not a field
            //  (update is triggered by "set" accessor, 
            //      and field would be just common assignment to the "got" object)
            
            var collectionEntry = entry.tasksList;
            collectionEntry.collection = listNames;
            
            entry.tasksList = collectionEntry;
        })
        .catch(errContext => 
        {
            // to do assign to info field, view will update automatically
        });
}

//------------------------------------------------------------------------------

function main(commander)
{
    var viewBuilder = new ViewBuilder('mainViewModel', 'mountPoint');
    
    var model = new Model(commander);
    
    viewBuilder.buildModelProperties(model);
    
    model.actionSubmit = 
    {
    proc: context => 
            {
                alert(context);    
            },
    context: '12345'
    }
    
    model.tasksList = 
    {
    proc: (index, context) => 
            {
                alert(index + ', ' + context);    
            },
    context: '12345'
    }
    
    model.getDataFilesList();
}

//------------------------------------------------------------------------------

$(document).ready(() =>
{
    var socket = io.connect();        
    
    const channel = 'message';
    
    var commander = new AsyncCommander(socket, channel);
    
    var connectionStatusLabel = $('#connectionStatusLabel');
    
    connectionStatusLabel.addClass('label-danger').html('connecting...');
    
    socket.on('connect', () =>
    {
        connectionStatusLabel.toggleClass('label-danger label-success').html('connected');
           
        if(!started)
        {
            started = true;
            
            main(commander);
        }
    });
    
    socket.on('disconnect', reason =>
    {
        connectionStatusLabel.toggleClass('label-success label-danger').html('disconnected');   
    });
    
    socket.on(channel, message =>
    {
        commander.hold(message, socket);
    });
});

//------------------------------------------------------------------------------
