//------------------------------------------------------------------------------

var started = false;

//------------------------------------------------------------------------------

function constructObjectView(title, template)
{
    /**
     * returns html markup <table>
     *
     * title.fieldsHeader
     * title.valuesHeader
     * 
     * template defines plain JavaScript object
     * no array or object field values supported
     * 
     * template.<field>.name
     * template.<field>.description (optional, sr-only)
     * template.<field>.hintAddon (optional, usually shorter version of description, or as you like)
     * template.<field>.hintAddonGlyph (optional, mutually exclusive with hintAddon)
     * template.<field>.type = string | int | float | bool | file
     * template.<field>.range = {min, max} (optional, used only with int | float)
     * template.<field>.fileScope = "/<folder>/<subfolder>/..." (optional, used only with file, protects navigating)
     * template.<field>.fileTypeFilter = ".csv,.jpg,.png,.doc" etc. (optional, used only with file)
     * template.<field>.valueInputElementId
     * template.<field>.value (optional)
     * template.<field>.valuePlaceholder (optional)
     * 
     * ...
     * 
     */
    
    function constructSubgroup(entry)
    {
        var sgmarkup = 
            '<label for="' +
            entry.valueInputElementId +
            '" class="sr-only">' +
            (entry.description ? entry.description : (entry.name + ' value')) +
            '</label>' +
            '<div class="input-group">';
        
        if(entry.type === 'string')  
        {
            var addonId;
            
            if(entry.hintAddonGlyph)
            {
                sgmarkup += 
                    '<span class="input-group-addon"><span class="glyphicon ' +
                    entry.hintAddonGlyph +
                    '"></span></span>';
            }
            else if(entry.hintAddon)
            {
                addonId = generateUniqueKey();
                
                sgmarkup += 
                    '<span class="input-group-addon" id="' +
                    addonId +
                    '">' +
                    entry.hintAddon +
                    '</span>';
            }
            
            sgmarkup += 
                '<input type="text" class="form-control" id="' + 
                entry.valueInputElementId + '"';
            
            if(entry.value)
            {
                sgmarkup += ' value="' + entry.value + '"';
            }
            
            if(entry.valuePlaceholder)
            {
                sgmarkup += ' placeholder="' + entry.valuePlaceholder + '"';
            }

            if(addonId)
            {
                sgmarkup += ' aria-describedby="' + addonId + '"';
            }
            
            sgmarkup += '>';
        }
        else if(entry.type === 'int')
        {
            
        }
        
        sgmarkup += '</div>';
        
        return sgmarkup;
    }
    
    var markup = 
        '<table class="table"><thead><tr><th>' + 
        title.fieldsHeader + 
        '</th><th>' +
        title.valuesHeader +
        '</th></tr></thead><tbody>';
        
    Object.keys(template).forEach(key => 
    {
        var entry = template[key];
        
        markup += 
            '<tr><td>' + 
            entry.name + 
            '</td><td>' +
            constructSubgroup(entry) +
            '</td></tr>';
    });
    
    markup += '</tbody></table>';
    
    return markup;
}

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

//------------------------------------------------------------------------------

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

//------------------------------------------------------------------------------

function main(commander)
{
    var model = new Model(commander);
    
    var view = new View();
    
    var controller = new Controller();
    
    controller.connectModel(model);
    controller.connectView(view);
    
    model.connectController(controller);
    
    model.getDataFilesList();
    
    /**
     * template.<field>.name
     * template.<field>.description (optional, sr-only)
     * template.<field>.hintAddon (optional, usually shorter version of description, or as you like)
     * template.<field>.hintAddonGlyph (optional, mutually exclusive with hintAddon)
     * template.<field>.type = string | int | float | bool | file
     * template.<field>.range = {min, max} (optional, used only with int | float)
     * template.<field>.fileScope = "/<folder>/<subfolder>/..." (optional, used only with file, protects navigating)
     * template.<field>.fileTypeFilter = ".csv,.jpg,.png,.doc" etc. (optional, used only with file)
     * template.<field>.valueInputElementId
     * template.<field>.value (optional)
     * template.<field>.valuePlaceholder (optional)
     */
     
    var objectTemplate = 
    {
        trainDataFile: 
        {
            name: 'Train data file',
            description: 'Train data file name',
            hintAddon: '/csv/file-name.csv',
            hintAddonGlyph: 'glyphicon-random',
            type: 'string',
            valueInputElementId: 'inputTrainDataFile',
            valuePlaceholder: 'type name of existing *.csv file'
        },
        testDataFile: 
        {
            name: 'Test data file',
            description: 'Test data file name',
            hintAddon: '/csv/file-name.csv',
            type: 'string',
            valueInputElementId: 'inputTestDataFile',
            value: '123.csv',
            valuePlaceholder: 'type name of existing *.csv file'
        }
    };
    
    var objectTable = constructObjectView({fieldsHeader: 'Field', valuesHeader: 'Value'}, objectTemplate); 
    
    $('#objectTableContainer').html(objectTable);    
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