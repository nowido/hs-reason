//------------------------------------------------------------------------------

function MainController($scope, interService, socket, taskStorageService, modelDefaults)
{
    var vm = this;
    
    vm.trueValue = true;
    
    vm.pageCaption = 'Task preparation tool';
    
    vm.leftPanelCaption = 'Current tasks';
    vm.mainPanelCaption = 'Task to edit';
    
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
    
    vm.taskFiles = ['loading ...'];

    vm.indicatorInfo = 'connecting...';
    vm.indicatorClass = 'label label-warning';
    
    vm.openYadTrain = function()
    {
        interService.yad.promiseFilePath('/')
        .then(filePath => 
        {
            vm.trainDataPath = filePath;
            $scope.$apply();
        })
        .catch(() => 
        {
            vm.trainDataPath = undefined;
            $scope.$apply();
        });    
    }

    vm.openYadTest = function()
    {
        
    }
    
    vm.submitTask = function()
    {
        // if task file is not selected, ask name in modal (plus show json);
        //  else overwrite existing file
    }
    
    vm.resetTask = function()
    {
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
    
    vm.selectedTaskItem = -1;
    
    vm.selectTaskFile = function(index)
    {
        vm.selectedTaskItem = index;
    }
    
    vm.getTaskListItemClass = function(index)
    {
        return (index === vm.selectedTaskItem) ? 
                'list-group-item active' : 
                'list-group-item';
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
    
    taskStorageService.promiseTaskFilesList()
    .then(fileNames => 
    {
        vm.taskFiles = fileNames;
        
        vm.setInfo('info', fileNames.length + ' task files retrieved');
        
        $scope.$apply();
    })
    .catch(e => 
    {
        vm.setInfo('danger', 'Error occured while retrieving task files list');
        
        $scope.$apply();
    });
}

//------------------------------------------------------------------------------

function taskStorageService(commander)
{
    var singleton = {commander: commander};
    
    singleton.promiseTaskFilesList = function()
    {
        var serviceEntry = this;
        
        return new Promise((resolve, reject) => 
        {
            var yadCommand = 
            {
                command: 'GETMETAINFO',
                path: 'app:/csv',
                limit: 100,
                offset: 0,
                fields: '_embedded.items.name,_embedded.total,name'
            };
            
            serviceEntry.commander.promiseCommand('YAD', yadCommand)
            .then(responseContext => 
            {
                var listObject = JSON.parse(responseContext.message.answer);
                
                var fileNames;
                
                if(listObject._embedded && (listObject._embedded.total > 0))
                {
                    fileNames = listObject._embedded.items.map(file => file.name);
                }
                else
                {
                    fileNames = [];
                }
                
                resolve(fileNames);
            })
            .catch(reject);
        });
    }.bind(singleton);
    
    singleton.promiseTaskContent = function(path)
    {
        
    }.bind(singleton);
    
    return singleton;
}

//------------------------------------------------------------------------------

function YadNavigatorController($scope, interService, yadBrowseService, elementId)
{
    var yad = this;
    
    interService.yad = yad;

    yad.dialog = $('#' + elementId);
    
    yad.title = 'Select file';
    yad.buttonSelectCaption = 'Select';
    yad.buttonCancelCaption = 'Cancel';
    yad.pagesPrefix = 'pages: ';
    
    yad.previousPageAriaLabel = 'Previous';
    yad.nextPageAriaLabel = 'Next';
    
    yad.pageItemsCountLimit = 4;
    
    yad.promiseFilePath = function(scope)
    {
        yad.initialPath = scope;

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
            
            yadBrowseService.promiseFilesList(scope, yad.pageItemsCountLimit, 0)
            .then(folderContent => 
            {
                if(folderContent._embedded && folderContent._embedded.total)
                {
                    // calc how many pages, create nav buttons collection,
                    // create first page files list
                    
                    yad.pagesCount = Math.ceil(folderContent._embedded.total / yad.pageItemsCountLimit);
                    
                    yad.pages = new Array(yad.pagesCount);
                    yad.activePage = 0;
                    
                    $scope.$apply();
                    
                    yad.dialog.modal('show');
                }
                else
                {
                    reject();    
                }
            })
            .catch(reject); 
        });
    }
    
    yad.selectFile = function()
    {
        yad.selectedPath = '123';

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
        // to do read files of this page
    }
}

//------------------------------------------------------------------------------

function yadBrowseService(commander)
{
    var singleton = {commander: commander};
    
    singleton.promiseFilesList = function(scope, limit, offset)
    {
        var serviceEntry = this;
        
        return new Promise((resolve, reject) => 
        {
            var yadCommand = 
            {
                command: 'GETMETAINFO',
                path: 'app:' + scope,
                limit: limit,
                offset: offset,
                fields: '_embedded.items.name,_embedded.items.type,_embedded.total,name'
            };
            
            serviceEntry.commander.promiseCommand('YAD', yadCommand)
            .then(responseContext => 
            {
                var listObject = JSON.parse(responseContext.message.answer);
                
                resolve(listObject);
            })
            .catch(reject);
        });
    }.bind(singleton);
    
    return singleton;    
}

//------------------------------------------------------------------------------

function interService()
{
    var singleton = {};
    
    return singleton;
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
        'yAmplitude': 2,
        'ySeparator': 0,
        'clusterizationRadius': 2.2,
        'qFactor': 4,
        'adaptiveAnfisRulesCount': false,
        'lbfgsIterationsCount': 1000,
        'lbfgsHistorySize': 10,
        'lbfgsReportStepsCount': 20,
        'acceptableErrorThreshold': 0.25
    };
    
    angular.module('taskPreparationTool', [])
        .value('socket', socket)
        .value('commander', commander)
        .value('modelDefaults', modelDefaults)
        .value('yadNavigatorElementId', 'yadNavigatorContainer')
        .service('taskStorageService', ['commander', taskStorageService])
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
