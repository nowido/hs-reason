//------------------------------------------------------------------------------

function MainController($scope, socket, taskStorageService, modelDefaults)
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
        //vm.setIndicator('success', 'connected', 'glyphicon-signal');
        vm.setIndicator('success', undefined, 'glyphicon-signal');
        $scope.$apply();
    });
    
    socket.on('disconnect', reason =>
    {
        //vm.setIndicator('warning', 'disconnected [' + reason + ']', 'glyphicon-plane');
        vm.setIndicator('warning', null, 'glyphicon-plane');
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
    
    angular
        .module('taskPreparationTool', [])
        .value('socket', socket)
        .value('commander', commander)
        .value('modelDefaults', modelDefaults)
        .service('taskStorageService', ['commander', taskStorageService])
        .controller('MainController', ['$scope', 'socket', 'taskStorageService', 'modelDefaults', MainController]);
    
    angular.bootstrap($('#mainContainer')[0], ['taskPreparationTool']);

    $('#mainRow').toggleClass('collapse', false);
    $('#statusBlock').css('display', 'block');
});

//------------------------------------------------------------------------------
