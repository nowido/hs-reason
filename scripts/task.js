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
            
            entry.controller.update
            ({
                listUpdate: {items: listNames}
            });
        })
        .catch(errContext => 
        {
            entry.controller.update
            ({
                infoUpdate: {warning: true, content: errContext.message.error}
            });
        });
}

//------------------------------------------------------------------------------

function Controller()
{
}

Controller.prototype.connectModel = function(model)
{
    this.model = model;
}

Controller.prototype.connectView = function(view)
{
    this.view = view;
}

/*
Controller.prototype.update = function(reason)
{
    if(reason.infoUpdate)
    {
        var info = reason.infoUpdate;
        
        if(info.warning)
        {
            this.view.setInfoLabelWarning(info.content);
        }
        else
        {
            this.view.setInfoLabelSuccess(info.content);
        }
    }
    else if(reason.listUpdate)
    {
        this.view.fillFilesList(reason.listUpdate.items);
    }
}
*/

Controller.prototype.update = function(reason)
{
    // from model to view
    
    console.log(reason);
}

Controller.prototype.notify = function(reason)
{
    // from view to model
    
    console.log(reason);
}

//------------------------------------------------------------------------------
/*
function View()
{
    this.infoLabel = $('#infoLabel');
    this.csvList = $('#csvList');
}

View.prototype.setInfoLabelSuccess = function(info)
{
    this.infoLabel.removeClass('text-warning').addClass('text-default').html(info);    
}

View.prototype.setInfoLabelWarning = function(info)
{
    this.infoLabel.removeClass('text-default').addClass('text-warning').html(info);    
}

View.prototype.fillFilesList = function(list)
{
    var markup = '';
    
    list.forEach(item => 
    {
        markup += '<li class="list-group-item">' + item + '</li>';        
    });
    
    this.csvList.html(markup);
    
    if(list.length > 0)
    {
        this.setInfoLabelSuccess('found ' + list.length + ' files in /csv');
    }
    else
    {
        this.setInfoLabelWarning('no data files in /csv');
    }
}
*/
//------------------------------------------------------------------------------

function main(commander)
{
    var viewBuilder = new ViewBuilder("mainViewModel");
    
        console.log(viewBuilder.vars);
    
    $('#mountPoint').html(viewBuilder.html);
    
    viewBuilder.setHandlers(Object.keys(viewBuilder.vars));
    
    viewBuilder.update('taskToEdit_clusterizationRadius', '123.456');
    
    var model = new Model(commander);
    
    var controller = new Controller();
    
    controller.connectModel(model);
    
    model.connectController(controller);
    
    controller.connectView(viewBuilder);
    
    viewBuilder.connectController(controller);

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
