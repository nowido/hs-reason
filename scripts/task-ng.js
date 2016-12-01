//------------------------------------------------------------------------------

function MainController($scope, interService, socket, taskStorageService, modelDefaults)
{
    var vm = this;
    
    vm.trueValue = true;
    
    vm.modelPattern = 
    {
        trainDataPath: '',
        testDataPath: '',
        yAmplitude: modelDefaults.yAmplitude,
        ySeparator: modelDefaults.ySeparator,
        clusterizationRadius: modelDefaults.clusterizationRadius,
        qFactor: modelDefaults.qFactor,
        anfisRulesCount: 5,
        adaptiveAnfisRulesCount: modelDefaults.adaptiveAnfisRulesCount,
        lbfgsIterationsCount: modelDefaults.lbfgsIterationsCount,
        lbfgsHistorySize: modelDefaults.lbfgsHistorySize,
        lbfgsReportStepsCount: modelDefaults.lbfgsReportStepsCount,
        acceptableErrorThreshold: modelDefaults.acceptableErrorThreshold,
        acceptableModelsTargetToken: generateUniqueKey(),
        bestModelTargetToken: generateUniqueKey()
    };
    
    vm.pageCaption = 'Task preparation tool';
    
    vm.leftPanelCaption = 'System tasks';
    vm.mainPanelCaption = 'Task to edit';
    
    vm.taskGroupAriaLabel = 'Open task file or create new task';
    
    vm.newTaskTokenLabel = 'New task token:';
    vm.newTaskTokenAriaLabel = 'Invent name for the new task';
    
    vm.openTaskButtonCaption = 'Open ...';
    vm.newTaskButtonCaption = 'New';
    
    vm.fieldsCaption = 'Fields';
    vm.valuesCaption = 'Values';
    
    vm.caution = 'be cautious, analyse your problem';
    vm.invent = 'try invent exclusive title';
    
    vm.trainDataFieldCaption = 'Train data file';
    vm.trainDataAriaLabel = 'Open dialog to select train data file';
    
    vm.testDataFieldCaption = 'Test data file';
    vm.testDataAriaLabel = 'Open dialog to select test data file';
    
    vm.yAmplitudeFieldCaption = 'Y amplitude';
    vm.yAmplitudeAriaLabel = 'Output classes separation amplitude';
    vm.yAmplitudeMin = 0;
    vm.yAmplitudeStep = 0.1;
    vm.yAmplitude = modelDefaults.yAmplitude;
    
    vm.ySeparatorFieldCaption = 'Y separator';
    vm.ySeparatorAriaLabel = 'Output classes separation threshold';
    vm.ySeparatorStep = 0.1;

    vm.clusterizationRadiusFieldCaption = 'Clusterization radius';
    vm.clusterizationRadiusAriaLabel = vm.clusterizationRadiusFieldCaption;
    vm.clusterizationRadiusMin = 0;
    vm.clusterizationRadiusStep = 0.1;

    vm.qFactorFieldCaption = 'Q factor';
    vm.qFactorAriaLabel = vm.qFactorFieldCaption;
    vm.qFactorMin = 1;
    vm.qFactorStep = 0.1;

    vm.anfisRulesCountFieldCaption = 'ANFIS rules count';
    vm.anfisRulesCountAriaLabel = vm.anfisRulesCountFieldCaption;
    vm.anfisRulesCountMin = 1;
    vm.anfisRulesCountStep = 1;
    
    vm.adaptiveAnfisRulesCountFieldCaption = 'Adaptive ANFIS rules count';
    vm.adaptiveAnfisRulesCountAriaLabel = vm.adaptiveAnfisRulesCountFieldCaption;

    vm.lbfgsIterationsCountFieldCaption = 'L-BFGS iterations count';
    vm.lbfgsIterationsCountAriaLabel = vm.lgfgsIterationsCountFieldCaption;
    vm.lbfgsIterationsCountMin = 1;
    vm.lbfgsIterationsCountStep = 1;

    vm.lbfgsHistorySizeFieldCaption = 'L-BFGS history size';
    vm.lbfgsHistorySizeAriaLabel = vm.lbfgsHistorySizeFieldCaption;
    vm.lbfgsHistorySizeMin = 1;
    vm.lbfgsHistorySizeStep = 1;

    vm.lbfgsReportStepsCountFieldCaption = 'L-BFGS report steps count';
    vm.lbfgsReportStepsCountAriaLabel = vm.lbfgsReportStepsCountFieldCaption;
    vm.lbfgsReportStepsCountMin = 1;
    vm.lbfgsReportStepsCountStep = 1;

    vm.acceptableErrorThresholdFieldCaption = 'Acceptable error threshold';
    vm.acceptableErrorThresholdAriaLabel = vm.acceptableErrorThresholdFieldCaption;
    vm.acceptableErrorThresholdMin = 0;
    vm.acceptableErrorThresholdMax = 0.5;
    vm.acceptableErrorThresholdStep = 0.01;

    vm.acceptableModelsTargetTokenFieldCaption = 'Acceptable models target token';
    vm.acceptableModelsTargetTokenAriaLabel = vm.acceptableModelsTargetTokenFieldCaption;
    
    vm.bestModelTargetTokenFieldCaption = 'Best model target token';
    vm.bestModelTargetTokenAriaLabel = vm.bestModelTargetTokenFieldCaption;
    
    vm.submitButtonCaption = 'Submit task';
    vm.submitButtonAriaLabel = 'Submit task to storage';

    vm.resetButtonCaption = 'Reset task';
    vm.resetButtonAriaLabel = vm.resetButtonCaption;

    vm.deleteButtonCaption = 'Delete task';
    vm.deleteButtonAriaLabel = 'Remove task from storage';
    
    vm.indicatorInfo = 'connecting...';
    vm.indicatorClass = 'label label-warning';
    
    vm.openTask = function()
    {
        interService.yad.promiseFilePath(modelDefaults.taskFilesScope)
        .then(filePath => 
        {
            vm.taskFile = filePath;
            vm.newTask = undefined;
            
            taskStorageService.promiseTaskContent(filePath)
            .then(content => 
            {
                console.log(content);
                
                // to do use content object to fill vm fields
                
                $scope.$apply();    
            })
            .catch(e => 
            {
                vm.setInfo('danger', e);
                
                $scope.$apply();    
            });
        })
        .catch(e => {});
    }
    
    vm.createNewTask = function()
    {
        vm.taskFile = undefined;
        vm.newTask = null;
        vm.resetTask();
    }
    
    vm.openYadTrain = function()
    {
        interService.yad.promiseFilePath(modelDefaults.trainDataScope)
        .then(filePath => 
        {
            vm.trainDataPath = filePath;
            $scope.$apply();
        })
        .catch(e => {});
    }

    vm.openYadTest = function()
    {
        interService.yad.promiseFilePath(modelDefaults.testDataScope)
        .then(filePath => 
        {
            vm.testDataPath = filePath;
            $scope.$apply();
        })
        .catch(e => {});
    }
    
    vm.getSubmitButtonClass = function()
    {
        return (vm.trainDataPath && vm.testDataPath) ? 
                'btn btn-primary' : 
                'btn btn-primary disabled';
    }
    
    vm.submitTask = function()
    {
        vm.composeModel();
        
        // if task file is not selected, and no task token present, ask name in modal (plus show json);
        //  else overwrite existing file
    }
    
    vm.composeModel = function()
    {
        var model = {};
        
        Object.keys(vm.modelPattern).forEach(key => 
        {
            var editedFieldValue = vm[key];
            
            if(editedFieldValue !== undefined)
            {
                if(typeof(editedFieldValue) === 'string')
                {
                    model[key] = (editedFieldValue !== '') ? editedFieldValue : vm.modelPattern[key];
                }
                else
                {
                    model[key] = editedFieldValue;
                }
            }
            else
            {
                model[key] = vm.modelPattern[key];
            }
        });
    }
    
    vm.resetTask = function()
    {
        vm.trainDataPath = undefined;
        vm.testDataPath = undefined;
        vm.yAmplitude = modelDefaults.yAmplitude;
        vm.ySeparator = modelDefaults.ySeparator;
        vm.clusterizationRadius = modelDefaults.clusterizationRadius;
        vm.qFactor = modelDefaults.qFactor;
        vm.anfisRulesCount = modelDefaults.anfisRulesCount;
        vm.adaptiveAnfisRulesCount = modelDefaults.adaptiveAnfisRulesCount;
        vm.lbfgsIterationsCount = modelDefaults.lbfgsIterationsCount;
        vm.lbfgsHistorySize = modelDefaults.lbfgsHistorySize;
        vm.lbfgsReportStepsCount = modelDefaults.lbfgsReportStepsCount;
        vm.acceptableErrorThreshold = modelDefaults.acceptableErrorThreshold;
        vm.acceptableModelsTargetToken = modelDefaults.acceptableModelsTargetToken;
        vm.bestModelTargetToken = modelDefaults.bestModelTargetToken;
    }
    
    vm.deleteTask = function()
    {
        
    }
    
    vm.setIndicator = function(category, info, glyph)
    {
        vm.indicatorInfo = info;
        vm.indicatorClass = 'label label-' + category;   
        
        vm.indicatorGlyphClass = (glyph ? ('glyphicon ' + glyph) : undefined);
    }
    
    vm.setInfo = function(category, info)
    {
        vm.info = info;
        vm.infoClass = 'text-' + category;
    }
    
    socket.on('connect', () =>
    {
        vm.setIndicator('success', 'connected', 'glyphicon-signal');
        //vm.setIndicator('success', undefined, 'glyphicon-signal');
        $scope.$apply();
    });
    
    socket.on('disconnect', reason =>
    {
        vm.setIndicator('warning', 'disconnected [' + reason + ']', 'glyphicon-plane');
        //vm.setIndicator('warning', null, 'glyphicon-plane');
        $scope.$apply();
    });
    
    vm.resetTask();
}

//------------------------------------------------------------------------------

function taskStorageService(yadStorage)
{
    this.yadStorage = yadStorage;
}

taskStorageService.prototype.promiseTaskContent = function(taskFilePath)
{
    var entry = this;
    
    return entry.yadStorage.asyncDownload('app:' + taskFilePath)
            .then(entry.promiseTextContent)
            .then(entry.promiseObjectContent);
}

taskStorageService.prototype.promiseTextContent = function(blob)
{
    return new Promise((resolve, reject) => 
    {
        var reader = new FileReader();
        
        function getResult()
        {
            reader.removeEventListener('loadend', getResult);

            resolve(reader.result);
        }
        
        reader.addEventListener('loadend', getResult);
        
        reader.readAsText(blob);    
    });
}

taskStorageService.prototype.promiseObjectContent = function(textJsonContent)
{
    return Promise.resolve().then(() => 
    {
        return Promise.resolve(JSON.parse(textJsonContent));
    });    
}

//------------------------------------------------------------------------------

function YadNavigatorController($scope, interService, yadBrowseService, elementId)
{
    var yad = this;
    
    interService.yad = yad;

    yad.dialog = $('#' + elementId);
    
    yad.title = 'Select file';
    
    yad.buttonSelectCaption = 'Select';
    yad.buttonSelectAriaLabel = yad.buttonSelectCaption;
    
    yad.buttonCancelCaption = 'Cancel';
    yad.buttonCancelAriaLabel = yad.buttonCancelCaption;
    
    yad.fileItemsAriaLabel = "Folder content list";
    
    yad.pagesPrefix = 'pages: ';
    
    yad.previousPageAriaLabel = 'Previous';
    yad.nextPageAriaLabel = 'Next';
    
    yad.folderUpAriaLabel = 'Navigate to parent folder';
    
    yad.pageItemsCountLimit = 10;
    
    yad.promiseDialogSetup = function(folderContent)
    {
        yad.activePage = 0;
        
        yad.activeItem = undefined;
        yad.pointedPath = undefined;
        
        if(folderContent._embedded && folderContent._embedded.total)
        {
            yad.pagesCount = Math.ceil(folderContent._embedded.total / yad.pageItemsCountLimit);
            
            yad.pages = new Array(yad.pagesCount);
            
            yad.fileItems = folderContent._embedded.items;
        }
        else
        {
            yad.pagesCount = 1;
            
            yad.pages = [];
            
            yad.fileItems = [];
        }
        
        $scope.$apply();
        
        return Promise.resolve();
    }
    
    yad.promiseDialogResult = function()
    {
        return new Promise((resolve, reject) => 
        {
            yad.dialog.on('hidden.bs.modal', () => 
            {
                if(yad.selectedPath && (yad.selectedPath.length > 0))
                {
                    resolve(yad.selectedPath);    
                }
                else
                {
                    reject();
                }
            });
            
            yad.dialog.modal('show');
        });
    }
    
    yad.promiseFilePath = function(scope)
    {
        yad.scope = scope;
        yad.scopeStack = [];
        
        yadBrowseService.clearCache();
        
        yad.selectedPath = undefined;
        
        var arg = 
        {
            service: yadBrowseService,
            scope: scope,
            limit: yad.pageItemsCountLimit,
            offset: 0
        };

        return Promise.resolve(arg)
                .then(yadBrowseService.promiseFilesList)
                .then(yad.promiseDialogSetup)
                .then(yad.promiseDialogResult);
    }
    
    yad.getSelectButtonClass = function()
    {
        return yad.pointedPath ? 
            'btn btn-primary' : 
            'btn btn-primary disabled';
    }
    
    yad.selectFile = function()
    {
        yad.selectedPath = yad.pointedPath;

        yad.dialog.modal('hide');
    }
    
    yad.getPageLabel = function(index)
    {
        return index + 1;    
    }
    
    yad.getPreviousPageClass = function()
    {
        return (yad.activePage === 0) ? 'btn btn-default disabled' : 'btn btn-default';
    }

    yad.getNextPageClass = function()
    {
        return (yad.activePage === (yad.pagesCount - 1)) ? 'btn btn-default disabled' : 'btn btn-default';    
    }
    
    yad.getPagerClass = function(index)
    {
        return (index === yad.activePage) ? 'btn btn-primary' : 'btn btn-default';
    }
    
    yad.getPageAriaLabel = function(index)
    {
        return (index === yad.activePage) ? 'current page' : ('page ' + (index + 1));
    }
    
    yad.activatePreviousPage = function()
    {
        if(yad.activePage > 0)
        {
            yad.activePage--;
            
            yad.readCurrentPage();
        }    
    }

    yad.activateNextPage = function()
    {
        if(yad.activePage < (yad.pagesCount - 1))
        {
            yad.activePage++;
            
            yad.readCurrentPage();
        }    
    }

    yad.activatePage = function(index)
    {
        if(yad.activePage !== index)
        {
            yad.activePage = index;    
            
            yad.readCurrentPage();
        }
    }
    
    yad.readCurrentPage = function()
    {
        yad.activeItem = undefined;
        yad.pointedPath = undefined;
        
        var arg = 
        {
            service: yadBrowseService,
            scope: yad.scope,
            limit: yad.pageItemsCountLimit,
            offset: yad.activePage * yad.pageItemsCountLimit
        };

        Promise.resolve(arg)
        .then(yadBrowseService.promiseFilesList)
        .then(pageContent => 
        {
            if(pageContent._embedded && pageContent._embedded.items)
            {
                yad.fileItems = pageContent._embedded.items;    
                
                $scope.$apply();
            }
            else
            {
                yad.fileItems = [];
                
                $scope.$apply();
            }
        });
    }
    
    yad.getListItemClass = function(index)
    {
        return (yad.activeItem === index) ? 
                'list-group-item active' : 
                'list-group-item';
    }
    
    yad.getItemGlyph = function(index)
    {
        return (yad.fileItems[index].type === 'dir') ? 
                'glyphicon glyphicon-folder-open' : 
                'glyphicon glyphicon-file';
    }
    
    yad.getItemAriaLabel = function(index)
    {
        return (yad.fileItems[index].type === 'dir') ? 
                'Folder' : 
                'File';
    }
    
    yad.activateItem = function(index)
    {
        var entry = yad.fileItems[index];
        
        if(entry.type === 'dir')
        {
            yad.scopeStack.push(yad.scope);
            
            yad.scope += entry.name + '/';
            
            yad.readFolder();
        }
        else
        {
            yad.activeItem = index;
            
            yad.pointedPath = yad.scope + entry.name;
        }
    }
    
    yad.readFolder = function()
    {
        var arg = 
        {
            service: yadBrowseService,
            scope: yad.scope,
            limit: yad.pageItemsCountLimit,
            offset: 0
        };

        Promise.resolve(arg)
        .then(yadBrowseService.promiseFilesList)
        .then(yad.promiseDialogSetup);
    }
    
    yad.goLevelUp = function()
    {
        if(yad.scopeStack.length > 0)
        {
            yad.scope = yad.scopeStack.pop();
            
            yad.readFolder();
        }
    }
}

//------------------------------------------------------------------------------

function yadBrowseService(commander)
{
    this.commander = commander;
    
    this.cache = {};
}

yadBrowseService.prototype.clearCache = function()
{
    this.cache = {};
}

yadBrowseService.prototype.promiseFilesList = function(arg)
{
    // arg.service, arg.scope, arg.limit, arg.offset

    var entry = arg.service;
    
    arg.commander = entry.commander;
    
    var cacheKey = [arg.scope, arg.limit, arg.offset].join(':'); 
    
    var cached = entry.cache[cacheKey];
    
    if(cached)
    {
        return Promise.resolve(cached);
    }
    
    return Promise.resolve(arg)
            .then(entry.promiseMetaInfo)
            .then(entry.promiseParseMetaInfo)
            .then(info => 
            {
                entry.cache[cacheKey] = info;
                
                return Promise.resolve(info);
            });
}

yadBrowseService.prototype.promiseMetaInfo = function(arg)
{
    var yadCommand = 
    {
        command: 'GETMETAINFO',
        path: 'app:' + arg.scope,
        limit: arg.limit,
        offset: arg.offset,
        fields: '_embedded.items.name,_embedded.items.type,_embedded.total,name'
    };
    
    return arg.commander.promiseCommand('YAD', yadCommand);
}

yadBrowseService.prototype.promiseParseMetaInfo = function(responseContext)
{
    return Promise.resolve().then(() => 
    {
        return Promise.resolve(JSON.parse(responseContext.message.answer));
    });
}

//------------------------------------------------------------------------------

function interService()
{
    // sort of global space to communicate on
    
    // controllers will add properties to the service instance,
    //  thus making possible inter-controllers data sharing
}

//------------------------------------------------------------------------------

$(document).ready(() =>
{
    var socket = io.connect();        
    
    const channel = 'message';
    
    var commander = new AsyncCommander(socket, channel);

    socket.on(channel, message =>
    {
        commander.hold(message, socket);
    });
    
    var modelDefaults = 
    {
        taskFilesScope: '/',//'/tasks/',
        trainDataScope : '/csv/',
        testDataScope : '/csv/',
        yAmplitude: 2,
        ySeparator: 0,
        clusterizationRadius: 2.2,
        qFactor: 4,
        adaptiveAnfisRulesCount: false,
        lbfgsIterationsCount: 1000,
        lbfgsHistorySize: 10,
        lbfgsReportStepsCount: 20,
        acceptableErrorThreshold: 0.25
    };
    
    angular.module('taskPreparationTool', [])
        .value('socket', socket)
        .value('commander', commander)
        .value('modelDefaults', modelDefaults)
        .value('yadNavigatorElementId', 'yadNavigatorContainer')
        .service('yadStorageServise', ['commander', YadStorage])
        .service('taskStorageService', ['yadStorageServise', taskStorageService])
        .service('interService', interService)
        .service('yadBrowseService', ['commander', yadBrowseService])
        .controller('MainController',     
        [
            '$scope', 
            'interService',
            'socket', 
            'taskStorageService', 
            'modelDefaults', 
            MainController
        ])
        .controller('YadNavigatorController', 
        [
            '$scope', 
            'interService',
            'yadBrowseService', 
            'yadNavigatorElementId', 
            YadNavigatorController
        ]);
        
    angular.bootstrap($('#mainContainer')[0], ['taskPreparationTool']);
    
    $('#mainRow').toggleClass('collapse', false);
    $('#statusBlock').css('display', 'block');
});

//------------------------------------------------------------------------------
