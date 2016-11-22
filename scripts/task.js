//------------------------------------------------------------------------------

var started = false;

//------------------------------------------------------------------------------

function constructObjectView(title, template, readOnly)
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
     * template.<field>.valueInputElementId (for bool, we use provided Id with radio control which represents "true")
     * template.<field>.value (optional)
     * template.<field>.valuePlaceholder (optional)
     * 
     * ...
     * 
     */
    
    function constructSubgroup(entry)
    {
        var sgmarkup;
        
            // radio group for boolean values
            
        if(entry.type === 'bool')
        {
            var groupName = generateUniqueKey();
            
            sgmarkup = '<div class="input-group">';
            
            var bin = 
            [
                {boolSemantic: 'true', tag: 'yes', checked: entry.value}, 
                {boolSemantic: 'false', tag: 'no', checked: !entry.value}
            ];
            
            bin.forEach(bv => 
            {
                sgmarkup +=
                    '<label class="radio-inline"><input type="radio" name="' + 
                    groupName + '"';
                    
                    if(bv.boolSemantic === 'true')
                    {
                        sgmarkup += ' id="' + entry.valueInputElementId + '"';
                    }

                if(bv.checked)
                {
                    sgmarkup += ' checked';
                }
                
                if(readOnly)
                {
                    sgmarkup += ' disabled';
                }
                
                sgmarkup += '>' + bv.tag + '</label>';
            });
            
            sgmarkup += '</div>';
            
            return sgmarkup;
        }
        
            // button which opens modal dialog for file selection
        
        if(entry.type === 'file')
        {
            if(readOnly)
            {
                sgmarkup = 
                    '<span class="help-block">[' + entry.value + ']</span>';
            }
            else
            {
                sgmarkup = 
                    '<div class="input-group"><button class="btn btn-default" aria-label="Open file dialog" type="button" id="' +
                    entry.valueInputElementId + 
                    '"><span class="glyphicon glyphicon-folder-open"></span></button><span class="help-block">' + 
                    (entry.value ? '[' + entry.value + ']': '') +
                    '</span></div>';
            }

            return sgmarkup;
        }
        
            // text/number input

        sgmarkup = 
            '<label for="' +
            entry.valueInputElementId +
            '" class="sr-only">' +
            (entry.description ? entry.description : (entry.name + ' value')) +
            '</label>' +
            '<div class="input-group">';
            
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
            //
        
        if(entry.type === 'string')  
        {
            sgmarkup += 
                '<input type="text" class="form-control"';
        }
        else if((entry.type === 'float') || (entry.type === 'int'))
        {
            sgmarkup += 
                '<input type="number" class="form-control" step="' + 
                ((entry.type === 'int') ? '1' : '0.1') + '"';
            
            if(entry.range && (entry.range.min !== undefined))
            {
                sgmarkup += ' min="' + entry.range.min + '"';
            }
            
            if(entry.range && (entry.range.max !== undefined))
            {
                sgmarkup += ' max="' + entry.range.max + '"';
            }
        }
            //
            
        if(entry.value !== undefined)
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
        
        sgmarkup += ' id="' + entry.valueInputElementId + '"';
        
        if(readOnly)
        {
            sgmarkup += ' disabled';    
        }
        
        sgmarkup += '></div>';

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
    $('#buttonSubmitTask').click(evt => {});    
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

function ViewBuilder(id)
{
    this.registry = 
    {
        'VIEWMODEL': ViewBuilder.prototype.parseViewModel.bind(this),
        'GRAIL': ViewBuilder.prototype.parseGrail.bind(this),
        'HEADER': ViewBuilder.prototype.parseHeader.bind(this),
        'BLOCK': ViewBuilder.prototype.parseBlock.bind(this),
        'ENTITY': ViewBuilder.prototype.parseEntity.bind(this),
        'VAR': ViewBuilder.prototype.parseVar.bind(this),
        'FILE': ViewBuilder.prototype.parseFile.bind(this),
        'BOOL': ViewBuilder.prototype.parseBool.bind(this)
    };
    
    this.vars = {};
    
    this.nameScopeStack = [];
    
    var template = $('#' + id);
    var templateContent = $(template.prop('content')); 

    this.html = this.parse(templateContent.children()[0]);
}

ViewBuilder.prototype.parse = function(node)
{
    var entryFn = this.registry[node.tagName];
    
    if(entryFn)
    {
        return entryFn(node);
    }
    
    return '<!-- ViewModel parser: unsupported or improper tag <' + node.tagName + '> -->';
}

ViewBuilder.prototype.parseViewModel = function(vmNode)
{
    // <viemodel> tag currently has no supported attributes;
    //  - interpreter is planned
    
    var markup = ['<div class="container" role="main">'];
    
    markup.push(this.parseChildren(vmNode));

    markup.push('</div>');
    
    return markup.join('');
}

ViewBuilder.prototype.parseChildren = function(vmNode)
{
    var markup = [];
    
    $(vmNode).children().each((index, entry) => 
    {
        markup.push(this.parse(entry));
    });
    
    return markup.join('');
}

ViewBuilder.prototype.parseGrail = function(vmNode)
{
    // <grail> tag may have children: 
    //  <grailheader>, <grailleft>, <grailmain>, <grailright>, <grailfooter>
    
    var children = $(vmNode).children();
    
    var present = {};
    
    children.each((index, entry) => 
    {
        if(!(entry.tagName in present))
        {
            present[entry.tagName] = entry;
        }
    });
    
    var grHeader = present['GRAILHEADER'];
    var grLeft = present['GRAILLEFT'];
    var grRight = present['GRAILRIGHT'];
    var grMain = present['GRAILMAIN'];
    var grFooter = present['GRAILFOOTER'];
    
    var markup = [];
    
    if(grHeader)
    {
        markup.push(this.parseGrailLine(grHeader));
    }

    var mainHtml = '';
    
    if(grMain)
    {
        var mainMarkup = ['<div class="col-md-8">'];
        
        mainMarkup.push(this.parseChildren(grMain));
        
        mainMarkup.push('</div>');
        
        mainHtml = mainMarkup.join('');
    }
    
    if(grLeft && grRight)
    {
        // 2 - 8 - 2
        
        markup.push('<div class="row"><div class="col-md-2">');
        
        markup.push(this.parseChildren(grLeft));
        
        markup.push('</div>');
        
        markup.push(mainHtml);
        
        markup.push('<div class="col-md-2">');
        
        markup.push(this.parseChildren(grRight));
        
        markup.push('</div></div>');
    }
    else if(grLeft)
    {
        // 4 - 8
        
        markup.push('<div class="row"><div class="col-md-4">');
        
        markup.push(this.parseChildren(grLeft));
        
        markup.push('</div>');
        
        markup.push(mainHtml);

        markup.push('</div>');
    }
    else if(grRight)
    {
        // 8 - 4
        
        markup.push('<div class="row">');
        
        markup.push(mainHtml);
         
        markup.push('<div class="col-md-4">');
        
        markup.push(this.parseChildren(grRight));
        
        markup.push('</div></div>');
    }
    
    if(grFooter)
    {
        markup.push(this.parseGrailLine(grFooter));    
    }
    
    return markup.join('');
}

ViewBuilder.prototype.parseGrailLine = function(grailHeaderNode)
{
    // <grailheader>, <grailfooter> tags have no attributes
    
    var markup = ['<div class="row"><div class="col-md-12">'];

    markup.push(this.parseChildren(grailHeaderNode));

    markup.push('</div></div>');
    
    return markup.join('');    
}

ViewBuilder.prototype.parseHeader = function(headerNode)
{
    // <header> tag has attributes:
    //  - title
    
    var markup = ['<div class="page-header"><h1>'];

    markup.push($(headerNode).attr('title'));
    
    markup.push('</h1></div>');
    
    return markup.join('');    
}

ViewBuilder.prototype.parseBlock = function(blockNode)
{
    // <block> tag has attributes:
    //  - title 
    //  
    
    var markup = ['<div class="panel panel-primary"><div class="panel-heading"><h3 class="panel-title">'];
    
    markup.push($(blockNode).attr('title'));
    
    markup.push('</h3></div><div class="panel-body">');
    
    markup.push(this.parseChildren(blockNode));
    
    markup.push('</div>');
    
    return markup.join('');
}

ViewBuilder.prototype.parseEntity = function(entityNode)
{
    // <entity> tag has attributes
    //  - name (optional)
    //  - fieldscaption (optional)
    //  - valuescaption (optional)
    //  - reference (i.e., not editable; optional)

    var nameScope = this.getCurrentNameScope();
    
    var fullName = nameScope + '.' + this.ensureName(entityNode);
    
    this.nameScopeStack.push(fullName);

    var entry = this.vars[fullName] = {type: 'entity'};
    
    if(this.isReference(entityNode, nameScope))
    {
        entry.reference = true;
    }
    
    var markup = ['<table class="table">'];
    
    var fc = $(entityNode).attr('fieldscaption');
    var vc = $(entityNode).attr('valuescaption');
    
    if(fc || vc)
    {
        markup.push('<thead><tr><th>');
        
        if(fc)
        {
            markup.push(fc);    
        }
        
        markup.push('</th><th>');
        
        if(vc)
        {
            markup.push(vc);     
        }
        
        markup.push('</th></tr></thead>');
    }
    
    markup.push('<tbody>');
    
    markup.push(this.parseChildren(entityNode));
    
    markup.push('</tbody></table>');
    
    this.nameScopeStack.pop();  

    return markup.join('');
}

ViewBuilder.prototype.getCurrentNameScope = function()
{
    if(this.nameScopeStack.length > 0)
    {
        var sp = this.nameScopeStack.length - 1;
        
        return this.nameScopeStack[sp];
    }
    else
    {
        return 'global';
    }
}

ViewBuilder.prototype.ensureName = function(node)
{
    var name = $(node).attr('name');
    
    if(!name)
    {
        name = generateUniqueKey();
    }
    
    return name;
}

ViewBuilder.prototype.isReference = function(node, nameScope)
{
    if(!nameScope)
    {
        nameScope = this.getCurrentNameScope();
    }
    
    var currentContext = this.vars[nameScope];
    
    var contextReference;
    
    if(currentContext && currentContext.reference)
    {
        contextReference = true;
    }
    
    return $(node).attr('reference') || contextReference;
}

ViewBuilder.prototype.parseVar = function(varNode)
{
    // <var> tag has attributes:
    //  - name
    //  - value
    
    var name = $(varNode).attr('name');
    var value = $(varNode).attr('value');
    
    var fullName = this.getCurrentNameScope() + '.' + name;
    
    this.vars[fullName] = value;
    
    return ''; // no html for variables
}

ViewBuilder.prototype.parseFile = function(fileNode)
{
    // <file> tag has attributes:
    //  - name
    //  - description
    //  - scope (optional)
    //  - path (optional on initial phase)
    //  - reference (i.e., not editable; optional)

    var name = $(fileNode).attr('name');
    var description = $(fileNode).attr('description');
    var scope = $(fileNode).attr('scope');
    var path = $(fileNode).attr('path');
    
    var nameScope = this.getCurrentNameScope();
    
    var fullName = nameScope + '.' + name;
    
    this.vars[fullName] = {type: 'file', scope: scope, path: path};

    var markup = ['<tr><td>']; 
    
    markup.push(description);
    
    markup.push('</td><td>');
    
    if(this.isReference(fileNode, nameScope))
    {
        markup.push('<span class="help-block">[');
        markup.push(path);
        markup.push(']</span>');    
    }
    else
    {
        markup.push('<div class="input-group"><button class="btn btn-default" aria-label="Open file dialog" type="button" id="');
        markup.push(fullName);
        markup.push('"><span class="glyphicon glyphicon-folder-open"></span></button>');
        
        if(path && (path.length > 0))
        {
            markup.push('<span class="help-block">');
            markup.push(path);
            markup.push('</span>');
        }
        
        markup.push('</div>');
    }
    
    markup.push('</td></tr>');
    
    return markup.join('');
}

ViewBuilder.prototype.parseBool = function(boolNode)
{
    // <bool> tag has attributes:
    //  - name
    //  - description
    //  - value
    //  - reference (i.e., not editable; optional)
    
    var name = $(boolNode).attr('name');
    var description = $(boolNode).attr('description');
    
    var value = $(boolNode).attr('value');
    
    value = (value === 'true') ? true : false;

    var nameScope = this.getCurrentNameScope();
    
    var fullName = nameScope + '.' + name;
    
    this.vars[fullName] = {type: 'bool', value: value};

    var markup = ['<tr><td>']; 
    
    markup.push(description);
    
    markup.push('</td><td><div class="input-group">');

    var reference = this.isReference(boolNode, nameScope);
    
    var groupName = generateUniqueKey();
    
    var bin = 
    [
        {boolSemantic: 'true', tag: 'yes', checked: value}, 
        {boolSemantic: 'false', tag: 'no', checked: !value}
    ];
            
    bin.forEach(bv => 
    {
        markup.push('<label class="radio-inline"><input type="radio" name="');
        markup.push(groupName);
        markup.push('"');    

        if(bv.boolSemantic === 'true')
        {
            markup.push(' id="');
            markup.push(fullName);
            markup.push('"'); 
        }

        if(bv.checked)
        {
            markup.push(' checked');
        }
        
        if(reference)
        {
            markup.push(' disabled');
        }
        
        markup.push('>');
        markup.push(bv.tag);
        markup.push('</label>');
    });
    
    markup.push('</div></td></tr>');
    
    return markup.join('');
}

//------------------------------------------------------------------------------

function main(commander)
{
    var caution = 'be cautious, analyse your problem';
    var invent = 'try invent exclusive title';
    
    var objectTemplate = 
    {
        trainDataFile: 
        {
            name: 'Train data file',
            type: 'file',
            value: '/csv/1.csv', 
            valueInputElementId: 'inputTrainDataFile'
        },
        testDataFile: 
        {
            name: 'Test data file',
            type: 'file',
            value: '/csv/2.csv', 
            valueInputElementId: 'inputTestDataFile'
        },
        yAmplitude:
        {
            name: 'Separation amplitude',
            hintAddonGlyph: 'glyphicon-adjust',
            type: 'float',
            valueInputElementId: 'inputAmplitude',
            value: 2.0,
            range: {min: 0.1},
            valuePlaceholder: caution
        },
        clusterizationRadius:
        {
            name: 'Clusterization radius (in unit space)',
            hintAddonGlyph: 'glyphicon-record',
            type: 'float',
            range: {min: 0},
            value: 2.2,
            valueInputElementId: 'inputClusterizationRadius',
            valuePlaceholder: caution
        },
        qFactor:
        {
            name: 'Q factor',
            hintAddonGlyph: 'glyphicon-scale',
            type: 'float',
            range: {min: 1},
            value: 4,
            valueInputElementId: 'inputQFactor',
            valuePlaceholder: caution
        },
        anfisRulesCount:
        {
            name: 'ANFIS rules count',
            hintAddonGlyph: 'glyphicon-option-vertical',
            type: 'int',
            valueInputElementId: 'inputAnfisRulesCount',
            range: {min: 1},
            valuePlaceholder: caution
        },
        adaptiveAnfisRulesCount:
        {
            name: 'Adaptive ANFIS rules count',
            type: 'bool',
            valueInputElementId: 'inputAdaptiveAnfisRulesCount',
            value: false
        },
        lbfgsIterationsCount:
        {
            name: 'L-BFGS iterations count',
            hintAddonGlyph: 'glyphicon-hourglass',
            type: 'int',
            value: 1000,
            valueInputElementId: 'inputLbfgsIterationsCount',
            range: {min: 1},
            valuePlaceholder: caution
        },
        lbfgsHistorySize:
        {
            name: 'L-BFGS history size',
            hintAddonGlyph: 'glyphicon-cog',
            type: 'int',
            value: 10,
            valueInputElementId: 'inputLbfgsHistorySize',
            range: {min: 1},
            valuePlaceholder: '~10-20, greater is slower'
        },
        lbfgsReportStepsCount:
        {
            name: 'L-BFGS report steps count',
            hintAddonGlyph: 'glyphicon-dashboard',
            type: 'int',
            value: 20,
            valueInputElementId: 'inputLbfgsReportStepsCount',
            range: {min: 1},
            valuePlaceholder: 'low values will populate your logs faster'
        },
        goodErrorThreshold:
        {
            name: 'Error threshold for good classifiers',
            hintAddonGlyph: 'glyphicon-filter',
            type: 'float',
            valueInputElementId: 'inputGoodErrorThreshold',
            value: 0.25,
            range: {min: 0, max: 0.5},
            valuePlaceholder: '0.5 is very bad; lower is better'
        },
        goodModelsTargetToken: 
        {
            name: 'Good models token',
            description: 'Token to access stored good models',
            hintAddonGlyph: 'glyphicon-random',
            type: 'string',
            valueInputElementId: 'inputGoodModelsTargetToken',
            valuePlaceholder: invent
        },
        bestModelTargetToken: 
        {
            name: 'Best model token',
            description: 'Token to access stored best model',
            hintAddonGlyph: 'glyphicon-random',
            type: 'string',
            valueInputElementId: 'inputBestModelTargetToken',
            valuePlaceholder: invent
        }
    };
    
    var objectTable = constructObjectView
    (
        {fieldsHeader: 'Field', valuesHeader: 'Value'}, 
        objectTemplate,
        false
    ); 
    
    $('#objectTableContainer').html(objectTable);    

    var controller = new Controller();
    
    var model = new Model(commander);
    
    var view = new View();
    
    controller.connectModel(model);
    controller.connectView(view);
    
    model.connectController(controller);
    
    model.getDataFilesList();
    
    var viewBuilder = new ViewBuilder("mainViewModel");
    
    console.log(viewBuilder.html);
    
    console.log(viewBuilder.vars);
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
