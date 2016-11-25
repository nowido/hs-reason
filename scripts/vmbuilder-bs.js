//------------------------------------------------------------------------------

function ViewBuilder(idTemplate, idMountPoint)
{
    this.registry = 
    {
        'VIEWMODEL': this.parseViewModel.bind(this),
        'GRAIL': this.parseGrail.bind(this),
        'HEADER': this.parseHeader.bind(this),
        'BLOCK': this.parseBlock.bind(this),
        'ENTITY': this.parseEntity.bind(this),
        'CONST': this.parseConst.bind(this),
        'FILE': this.parseFile.bind(this),
        'BOOL': this.parseBool.bind(this),
        'FLOAT': this.parseFloat.bind(this),
        'INT': this.parseInt.bind(this),
        'STRING': this.parseString.bind(this),
        'COLLECTION': this.parseCollection.bind(this),
        'STATION': this.parseStation.bind(this),
        'COMMAND': this.parseCommand.bind(this),
        'STATUS': this.parseStatus.bind(this),
        'INDICATOR': this.parseIndicator.bind(this)
    };
    
    this.eventHandlers = 
    {
        'string': {eventType: 'change', handler: this.onInputChange}, 
        'int': {eventType: 'change', handler: this.onInputChange}, 
        'float': {eventType: 'change', handler: this.onInputChange}, 
        'bool': {eventType: 'change', handler: this.onInputChange},
        'command': {eventType: 'click', handler: this.onCommand},
        'collection': {eventType: 'click', handler: this.onCollectionItemSelect}
    };
    
    this.updateHandlers = 
    {
        'string': this.updateInput, 
        'int': this.updateInput, 
        'float': this.updateInput, 
        'bool': this.updateInput,
        'collection': this.updateCollection,
        'indicator': this.updateIndicator
    };
    
    this.castHandlers = 
    {
        'int' : this.castInt,
        'float': this.castFloat,
        'bool': this.castBool
    };
    
    this.vars = {};

    this.nameInfix = generateUniqueKey(6);
    this.rexNameInfix = new RegExp(this.nameInfix);

    this.nameScopeStack = [];
    
    var template = $('#' + idTemplate);
    var templateContent = $(template.prop('content')); 

    this.html = this.parse(templateContent.children()[0]);
    
    if(idMountPoint)
    {
        this.insertTo(idMountPoint);
    }
}

//------------------------------------------------------------------------------

ViewBuilder.prototype.insertTo = function(idMountPoint)
{
    $('#' + idMountPoint).html(this.html);
     
    this.setHandlers(Object.keys(this.vars)); 
}

//------------------------------------------------------------------------------

ViewBuilder.prototype.getCurrentNameScope = function()
{
    if(this.nameScopeStack.length > 0)
    {
        var sp = this.nameScopeStack.length - 1;
        
        return this.nameScopeStack[sp];
    }
    else
    {
        return '';
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

ViewBuilder.prototype.composeName = function(nameScope, name)
{
    if(nameScope.length === 0)
    {
        return name;
    }
    else
    {
        return nameScope + this.nameInfix + name;
    }
}

ViewBuilder.prototype.resolveValue = function(nameScope, value, type)
{
    // "value", "{localvarname}", "{scoped-nameInfix-varname}"
    
    var templated = /^\{.*\}$/.test(value);
    
    if(templated)
    {
        var varName = value.substring(1, value.length - 1);
        
        var global = this.rexNameInfix.test(varName);

        var resolvedName;
        
        if(global)
        {
            resolvedName = varName;
        }
        else
        {
            resolvedName = this.composeName(nameScope, varName);
        }
                
        value = this.vars[resolvedName];
    }
    
    if(type)
    {
        value = this.cast(value, type);
    }
    
    return value;
}

ViewBuilder.prototype.resolveAttr = function(nameScope, node, attribute, type)
{
    var attrValue = $(node).attr(attribute);
    
    if(attrValue !== undefined)
    {
        return this.resolveValue(nameScope, attrValue, type);
    }
    else
    {
        return attrValue;
    }
}

//------------------------------------------------------------------------------

ViewBuilder.prototype.castBool = function(value)
{
    return (value === 'true') ? true : false;
}

ViewBuilder.prototype.castInt = function(value)
{
    var tryInt = parseInt(value);
    
    return isNaN(tryInt) ? undefined : tryInt;
}

ViewBuilder.prototype.castFloat = function(value)
{
    var tryFloat = parseFloat(value);
    
    return isNaN(parseFloat(value)) ? undefined : tryFloat; 
}

ViewBuilder.prototype.cast = function(value, type)
{
    if(typeof(value) === 'string')
    {
        var handler = this.castHandlers[type];
        
        if(handler)
        {
            return handler(value);
        }
    }
    
    return value;
}

//------------------------------------------------------------------------------

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

//------------------------------------------------------------------------------

ViewBuilder.prototype.parse = function(node)
{
    var entryFn = this.registry[node.tagName];
    
    if(entryFn)
    {
        return entryFn(node);
    }
    
    return '<!-- ViewModel parser: unsupported or improper tag <' + node.tagName + '> -->';
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

//------------------------------------------------------------------------------

ViewBuilder.prototype.parseViewModel = function(vmNode)
{
    // <viemodel> tag currently has no supported attributes;
    //  - interpreter is planned
    
    var markup = ['<div class="container" role="main">'];
    
    markup.push(this.parseChildren(vmNode));

    markup.push('</div>');
    
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

    var markup = ['<div class="panel panel-primary"><div class="panel-heading"><h3 class="panel-title">'];
    markup.push($(blockNode).attr('title'));
    markup.push('</h3></div><div class="panel-body">');
    markup.push(this.parseChildren(blockNode));
    markup.push('</div></div>');
    
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
    
    var fullName = this.composeName(nameScope, this.ensureName(entityNode));
    
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

ViewBuilder.prototype.parseConst = function(varNode)
{
    // <const> tag has attributes:
    //  - name
    //  - value
    
    var name = $(varNode).attr('name');
    var value = $(varNode).attr('value');
    
    var nameScope = this.getCurrentNameScope();
    var fullName = this.composeName(nameScope, name);
    
    this.vars[fullName] = value;
    
    return ''; // no html for constants
}

ViewBuilder.prototype.parseFile = function(fileNode)
{
    // <file> tag has attributes:
    //  - name
    //  - description (may be templated)
    //  - scope (optional, may be templated)
    //  - path (optional on initial phase, may be templated)
    //  - reference (i.e., not editable; optional)

    var name = $(fileNode).attr('name');
    
    var nameScope = this.getCurrentNameScope();
    
    var fullName = this.composeName(nameScope, name);
    
    var description = this.resolveAttr(nameScope, fileNode, 'description');
    var scope = this.resolveAttr(nameScope, fileNode, 'scope');
    var path = this.resolveAttr(nameScope, fileNode, 'path');
    
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
        markup.push('"><span class="glyphicon glyphicon-folder-open" aria-hidden="true"></span></button>');
        
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
    //  - description (may be templated)
    //  - value (may be templated)
    //  - reference (i.e., not editable; optional)
    
    var name = $(boolNode).attr('name');
    
    var nameScope = this.getCurrentNameScope();
    
    var fullName = this.composeName(nameScope, name);

    var description = this.resolveAttr(nameScope, boolNode, 'description');
    
    var value = this.resolveAttr(nameScope, boolNode, 'value', 'bool');

    this.vars[fullName] = {type: 'bool', value: value};

    var markup = ['<tr><td>']; 
    
    markup.push(description);
    
    markup.push('</td><td><div class="input-group">');

    var reference = this.isReference(boolNode, nameScope);
    
    var groupName = generateUniqueKey();
    
    var bin = 
    [
        {boolSemantic: true, tag: 'yes', checked: value}, 
        {boolSemantic: false, tag: 'no', checked: !value}
    ];
            
    bin.forEach(bv => 
    {
        markup.push('<label class="radio-inline"><input type="radio" name="');
        markup.push(groupName);
        markup.push('"');    
        
        markup.push(' id="');
        markup.push(fullName + (bv.boolSemantic ? '' : 'false'));
        markup.push('"');

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

ViewBuilder.prototype.buildInputGroup = function(type, entry)
{
    var markup = ['<tr><td>']; 
    markup.push(entry.description);
    markup.push('</td><td><label for="');
    markup.push(entry.fullName);
    markup.push('" class="sr-only">');
    markup.push(entry.description);
    markup.push('</label><div class="input-group">');        

    var addonId;
    
    if(entry.hintglyph)
    {
        markup.push('<span class="input-group-addon"><span class="glyphicon ');
        markup.push(entry.hintglyph);
        markup.push('" aria-hidden="true"></span></span>');
    }
    else if(entry.hint)
    {
        addonId = generateUniqueKey();
        
        markup.push('<span class="input-group-addon" id="');
        markup.push(addonId);
        markup.push('">');
        markup.push(entry.hint);
        markup.push('</span>');
    }
    
    markup.push('<input type="');
    
    if(type === 'string')
    {
        markup.push('text');
    }
    else
    {
        markup.push('number');
    }
    
    markup.push('" class="form-control"');
    
    if(entry.min !== undefined)
    {
        markup.push(' min="');    
        markup.push(entry.min);
        markup.push('"');
    }
    
    if(entry.max !== undefined)
    {
        markup.push(' max="');    
        markup.push(entry.max);
        markup.push('"');
    }

    if(!entry.step)
    {
        if(type === 'int')
        {
            entry.step = 1;
        }
        else if(type === 'float')
        {
            entry.step = 0.1;
        }
    }
    
    markup.push(' step="');    
    markup.push(entry.step);
    markup.push('"');

    if(entry.value !== undefined)
    {
        markup.push(' value="');    
        markup.push(entry.value);
        markup.push('"');
    }

    if(entry.placeholder !== undefined)
    {
        markup.push(' placeholder="');    
        markup.push(entry.placeholder);
        markup.push('"');
    }

    if(addonId)
    {
        markup.push(' aria-describedby="');    
        markup.push(addonId);
        markup.push('"');
    }
    
    markup.push(' id="');
    markup.push(entry.fullName);
    markup.push('"');

    if(entry.reference)
    {
        markup.push(' disabled');
    }
    
    markup.push('></div>');

    return markup.join('');
}

ViewBuilder.prototype.parseNumeric = function(numericNode, type)
{
    // <float>, <int> tags have attributes:
    //  - name
    //  - value (optional, may be templated)
    //  - min, max (both optional, both may be templated)
    //  - step (optional, may be templated)
    //  - description (may be templated)
    //  - hint (optional, may be templated, mutually exclusive with hintglyph)
    //  - hintglyph (optional, may be templated, mutually exclusive with hint)
    //  - placeholder (optional, may be templated)
    //  - reference (i.e., not editable; optional)
    
    var name = $(numericNode).attr('name');
    
    var nameScope = this.getCurrentNameScope();
    
    var fullName = this.composeName(nameScope, name);

    var value = this.resolveAttr(nameScope, numericNode, 'value', type);
    
    var min = this.resolveAttr(nameScope, numericNode, 'min', type);
    var max = this.resolveAttr(nameScope, numericNode, 'max', type);

    if(min > max)
    {
        var t = min;
        min = max;
        max = t;
    }
    
    var step = this.resolveAttr(nameScope, numericNode, 'step', type);

    var description = this.resolveAttr(nameScope, numericNode, 'description');
    var hintglyph = this.resolveAttr(nameScope, numericNode, 'hintglyph');
    var hint = this.resolveAttr(nameScope, numericNode, 'hint');
    var placeholder = this.resolveAttr(nameScope, numericNode, 'placeholder');
    
    this.vars[fullName] = {type: type, value: value, min: min, max: max};
    
    return this.buildInputGroup(type, 
    {
        fullName: fullName,
        description: description,
        hintglyph: hintglyph,
        hint: hint,
        min: min,
        max: max,
        step: step,
        value: value,
        placeholder: placeholder,
        reference: this.isReference(numericNode, nameScope)
    });
}

ViewBuilder.prototype.parseFloat = function(floatNode)
{
    return this.parseNumeric(floatNode, 'float');   
}

ViewBuilder.prototype.parseInt = function(intNode)
{
    return this.parseNumeric(intNode, 'int');   
}

ViewBuilder.prototype.parseString = function(stringNode)
{
    // <string> tag has attributes:
    //  - name
    //  - value (optional, may be templated)
    //  - description (may be templated)
    //  - hint (optional, may be templated, mutually exclusive with hintglyph)
    //  - hintglyph (optional, may be templated, mutually exclusive with hint)
    //  - placeholder (optional, may be templated)
    //  - reference (i.e., not editable; optional)
    
    var name = $(stringNode).attr('name');
    
    var nameScope = this.getCurrentNameScope();
    
    var fullName = this.composeName(nameScope, name);

    var value = this.resolveAttr(nameScope, stringNode, 'value');
    
    var description = this.resolveAttr(nameScope, stringNode, 'description');
    var hintglyph = this.resolveAttr(nameScope, stringNode, 'hintglyph');
    var hint = this.resolveAttr(nameScope, stringNode, 'hint');
    var placeholder = this.resolveAttr(nameScope, stringNode, 'placeholder');
    
    this.vars[fullName] = {type: 'string', value: value};

    return this.buildInputGroup('string', 
    {
        fullName: fullName,
        description: description,
        hintglyph: hintglyph,
        hint: hint,
        value: value,
        placeholder: placeholder,
        reference: this.isReference(stringNode, nameScope)
    });
}

ViewBuilder.prototype.parseCollection = function(collectionNode)
{
    // <collection> tag has attributes:
    //  - name
    //  - reference (i.e., not editable; optional)
    
    var name = $(collectionNode).attr('name');
    
    var nameScope = this.getCurrentNameScope();
    
    var fullName = this.composeName(nameScope, name);
    
    var entry = this.vars[fullName] = {type: 'collection'};
    
    if(this.isReference(collectionNode, nameScope))
    {
        entry.reference = true;
    }
    
    var markup = ['<ul class="list-group" id="'];
    
    markup.push(fullName);
    markup.push('"></ul>');

    return markup.join('');
}

ViewBuilder.prototype.parseStation = function(stationNode)
{
    // <station> currently has no attributes
    
    var markup = ['<table class="table table-condensed"><tr>'];
    markup.push(this.parseChildren(stationNode));
    markup.push('</tr></table>');
    
    return markup.join('');
}

ViewBuilder.prototype.parseCommand = function(commandNode)
{
    // <command> tag has attributes:
    //  - name
    //  - category (optional, may be templated; it is in {primary, default, success, info, warning, danger})
    //  - description (optional, may be templated)
    //  - hintglyph (optional, may be templated)
    
    var name = $(commandNode).attr('name');
    
    var nameScope = this.getCurrentNameScope();
    
    var fullName = this.composeName(nameScope, name);

    var category = this.resolveAttr(nameScope, commandNode, 'category');
    var description = this.resolveAttr(nameScope, commandNode, 'description');
    var hintglyph = this.resolveAttr(nameScope, commandNode, 'hintglyph');

    this.vars[fullName] = {type: 'command'};
    
    var markup = ['<td>'];
    markup.push('<button class="btn ');
    
    if(category)
    {
        markup.push('btn-' + category);    
    }
    else
    {
        markup.push('btn-default');    
    }
    
    markup.push('" id="');
    markup.push(fullName);
    markup.push('">');
    
    if(hintglyph)
    {
        markup.push('<span class="glyphicon ');
        markup.push(hintglyph);
        markup.push('" aria-hidden="true"></span>')
    }
    
    if(description)
    {
        markup.push(' ' + description);
    }
    
    markup.push('</button></td>');
    
    return markup.join('');
}

ViewBuilder.prototype.parseIndicator = function(indicatorNode)
{
    // <indicator> tag has attributes:
    //  - name
    //  - category (optional, may be templated; it is in {primary, default, success, info, warning, danger})
    //  - label (optional, may be templated)
    //  - hintglyph (optional, may be templated)
    
    var name = $(indicatorNode).attr('name');
    
    var nameScope = this.getCurrentNameScope();
    
    var fullName = this.composeName(nameScope, name);

    var category = this.resolveAttr(nameScope, indicatorNode, 'category');
    var label = this.resolveAttr(nameScope, indicatorNode, 'label');
    var hintglyph = this.resolveAttr(nameScope, indicatorNode, 'hintglyph');

    this.vars[fullName] = {type: 'indicator', value: {category: category, label: label, hintglyph: hintglyph}};
    
    var markup = ['<td><p>'];
    markup.push('<span class="');
    
    if(category)
    {
        markup.push('text-' + category);
    }
    else
    {
        markup.push('text-default');    
    }
    
    markup.push('" id="');
    markup.push(fullName);
    markup.push('">');
    
    if(hintglyph)
    {
        markup.push('<span class="glyphicon ');
        markup.push(hintglyph);
        markup.push('" aria-hidden="true" id="');
        markup.push(fullName);
        markup.push('hintglyph"></span>');
    }
    
    if(label)
    {
        markup.push('<span id="');
        markup.push(fullName);
        markup.push('label">');
        markup.push(label);
        markup.push('</span>');
    }
    
    markup.push('</span></p></td>');
    
    return markup.join('');
}

ViewBuilder.prototype.parseStatus = function(statusNode)
{
    var markup = ['<nav class="navbar navbar-default navbar-fixed-bottom"><div class="container" role="status"><div class="row"><div class="col-md-12">'];    
    markup.push(this.parseChildren(statusNode));
    markup.push('</div></div></div></nav>');
    
    return markup.join('');
}

//------------------------------------------------------------------------------

ViewBuilder.prototype.onInputChange = function(evt)
{
    // evt.data is {thisObject, id, entry}

    var obj = evt.data.thisObject;
    var id = evt.data.id;
    var entry = evt.data.entry;
    
    var elementNode = $('#' + id);
    
    if(entry.type === 'bool')
    {
        entry.value = elementNode.prop('checked');
    }
    else
    {
        entry.value = obj.cast(elementNode.val(), entry.type);
        
        // to do check range and hold syntax errors
    }
}

ViewBuilder.prototype.onCommand = function(evt)
{
    // evt.data is {thisObject, id, entry}
    
    // call entry.value.proc(entry.value.context) as callback  
    
    var entry = evt.data.entry;
    
    if(entry.value && entry.value.proc)
    {
        entry.value.proc(entry.value.context);
    }
}

ViewBuilder.prototype.onCollectionItemSelect = function(evt)
{
    // evt.data is {thisObject, id, entry}
    
    // call entry.value.proc(selectedItemIndex, entry.value.context) as callback      

    var id = evt.data.id;
    var entry = evt.data.entry;
    
    var selectedItemIndex = -1;
        
    $('#' + id).children().each((index, item) => 
    {
        var selected = (item === evt.target);
        
        if(selected)
        {
            selectedItemIndex = index;
        }

        $(item).toggleClass("active", selected);
    });
    
    if(selectedItemIndex >= 0)
    {
        if(entry.value && entry.value.proc)
        {
            entry.value.proc(selectedItemIndex, entry.value.context);
        }
    }
}

ViewBuilder.prototype.setHandlers = function(keys)
{
    keys.forEach(key => 
    {
        var entry = this.vars[key];
        
        if(typeof(entry) === 'object')
        {
            var eventEntry = this.eventHandlers[entry.type];
            
            if(eventEntry)
            {
                $('#' + key).on(eventEntry.eventType, null,
                {
                    thisObject: this, 
                    id: key, 
                    entry: entry
                }, eventEntry.handler);
            }
        }
    });
}

ViewBuilder.prototype.removeHandlers = function(keys)
{
    keys.forEach(key => 
    {
        var entry = this.vars[key];
        
        if(typeof(entry) === 'object')
        {
            var eventEntry = this.eventHandlers[entry.type];
            
            if(eventEntry)
            {
                $('#' + key).off(eventEntry.eventType, eventEntry.handler);
            }
        }
    });
}

//------------------------------------------------------------------------------

ViewBuilder.prototype.updateInput = function(key, value, entry)
{
    var elementNode = $('#' + key);
    
    if(entry.type === 'bool')
    {
        var sibling = $('#' + key + 'false');
        
        elementNode.prop('checked', value); 
        sibling.prop('checked', !value);
    }
    else
    {
        elementNode.val(value);
    }
}

ViewBuilder.prototype.updateCollection = function(key, value, entry)
{
    var collectionNode = $('#' + key);
    
    if(value.collection !== undefined)
    {
        var markup = [];
        
        value.collection.forEach(item => 
        {
            markup.push('<li class="list-group-item">');
            markup.push(item);
            markup.push('</li>');
        });
        
        collectionNode.html(markup.join(''));
    }
    else
    {
        collectionNode.html('');
    }
}

ViewBuilder.prototype.updateIndicator = function(key, value, entry)
{
    var indicatorNode = $('#' + key);
    
    var category = value.category;
    var hintglyph = value.hintglyph;
    var label = value.label;
    
    var markup = ['<span class="'];

    if(category)
    {
        markup.push('text-' + category);
    }
    else
    {
        markup.push('text-default');    
    }
    
    markup.push('" id="');
    markup.push(key);
    markup.push('">');
    
    if(hintglyph)
    {
        markup.push('<span class="glyphicon ');
        markup.push(hintglyph);
        markup.push('" aria-hidden="true" id="');
        markup.push(key);
        markup.push('hintglyph"></span>');
    }
    
    if(label)
    {
        markup.push('<span id="');
        markup.push(key);
        markup.push('label">');
        markup.push(label);
        markup.push('</span>');
    }
    
    markup.push('</span>');
    
    indicatorNode.replaceWith(markup.join(''));
}

ViewBuilder.prototype.update = function(key, value)
{
    var entry = this.vars[key];
    
    if(typeof(entry) === 'object')
    {
        var updateEntry = this.updateHandlers[entry.type];
        
        if(updateEntry)
        {
            updateEntry(key, value, entry);
        }
    }
}

//------------------------------------------------------------------------------

ViewBuilder.prototype.buildViewProperties = function(model)
{
    Object.keys(this.vars).forEach(key => 
    {
        var entry = this.vars[key];
        
        if(typeof(entry) === 'object')
        {
            var nameParts = key.split(this.nameInfix);
            
            var lastPartIndex = nameParts.length - 1;
            
            var obj = model;
            
            for(var i = 0; i < nameParts.length; ++i)
            {
                var part = nameParts[i];
                
                if(i < lastPartIndex)
                {
                    if(obj[part] === undefined)
                    {
                        obj[part] = {}; 
                    }
                        
                    obj = obj[part];    
                }
                else
                {
                    Object.defineProperty(obj, part, 
                    {
                        get: () => 
                        {
                            return this.vars[key].value;
                        },
                        set: value => 
                        {
                            this.vars[key].value = value; 
                            this.update(key, value);
                        } 
                    });
                }
            }
        }    
    });     
}

//------------------------------------------------------------------------------
