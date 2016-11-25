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
            
            if(listNames.length > 0)
            {
                entry.generalInfo = 
                {
                    category: 'success',
                    label: listNames.length + ' task items loaded'
                };
            }
            else
            {
                entry.generalInfo = 
                {
                    category: 'warning',
                    label: 'no task items present at the moment'
                };
            }
        })
        .catch(errContext => 
        {
            entry.generalInfo = 
            {
                category: 'danger',
                label: errContext.message.error
            };
        });
}

Model.prototype.composeDataBulk = function()
{
    var taskToEdit = this.taskToEdit;
    
    var modelData = 
    {
        yAmplitude: taskToEdit.yAmplitude,
        ySeparator: taskToEdit.ySeparator,
        clusterizationRadius: taskToEdit.clusterizationRadius,
        qFactor: taskToEdit.qFactor,
        anfisRulesCount: taskToEdit.anfisRulesCount,
        adaptiveAnfisRulesCount: taskToEdit.adaptiveAnfisRulesCount,
        lbfgsIterationsCount: taskToEdit.lbfgsIterationsCount,
        lbfgsHistorySize: taskToEdit.lbfgsHistorySize,
        lbfgsReportStepsCount: taskToEdit.lbfgsReportStepsCount,
        acceptableErrorThreshold: taskToEdit.acceptableErrorThreshold,
        acceptableModelsTargetToken: taskToEdit.acceptableModelsTargetToken,
        bestModelTargetToken: taskToEdit.bestModelTargetToken
    };
    
    return modelData;
}

Model.prototype.connect = function()
{
    this.connectionStatus =         
    {
        category: "success",
        label: " connected",
        hintglyph: "glyphicon-signal"
    };
}

Model.prototype.disconnect = function()
{
    this.connectionStatus =         
    {
        category: "warning",
        label: " disconnected",
        hintglyph: "glyphicon-plane"
    };
}

//------------------------------------------------------------------------------

function main(commander, model, viewBuilder)
{
    model.actionSubmit = 
    {
    proc: context => 
            {
                alert(context);    
            },
    context: '12345'
    };
    
    model.actionReset = 
    {
    proc: () => 
        {
            console.log(model.composeDataBulk());
        }    
    };
    
    model.tasksList = 
    {
    proc: index => 
            {
                model.taskToEdit.adaptiveAnfisRulesCount = (index % 2 === 0);
            }
    };
    
    model.getDataFilesList();
}

//------------------------------------------------------------------------------

$(document).ready(() =>
{
    var socket = io.connect();        
    
    const channel = 'message';
    
    var commander = new AsyncCommander(socket, channel);
    
    var viewBuilder = new ViewBuilder('mainViewModel', 'mountPoint');
    
    var model = new Model(commander);
    
    viewBuilder.buildViewProperties(model);

    socket.on('connect', () =>
    {
        model.connect();
           
        if(!started)
        {
            started = true;
            
            main(commander, model, viewBuilder);
        }
    });
    
    socket.on('disconnect', reason =>
    {
        model.disconnect();
    });
    
    socket.on(channel, message =>
    {
        commander.hold(message, socket);
    });
});

//------------------------------------------------------------------------------
