//------------------------------------------------------------------------------

function MainController
            (
                $scope, 
                socket, 
                taskStorageService, 
                taskSelectionService, 
                csvDataStorageService, 
                experimentService
            )
{
    var vm = this;

    vm.pageCaption = 'Compute station';
    
    vm.leftPanelCaption = 'User Id';
    
    vm.userInvitation = 'Enter your username';
    vm.userIdPlaceholder = 'Anonymous';
    vm.userIdHint = 'use combination of A..Za..z0..9';
    
    var storedUserId = Cookies.get('userId');

    if(storedUserId)
    {
        vm.userId = storedUserId;
        vm.rememberUserId = true;
    }
    else
    {
        vm.rememberUserId = false;    
    }

    vm.canGo = vm.userId;
    
    vm.fixUserId = false;
    
    var shadowRemember = vm.rememberUserId;
    
    vm.rememberUserIdHint = 'remember me';
    vm.rememberAriaLabel = vm.rememberUserId;
    
    vm.userHint = 'Your username will be stored in ' +
                    '<code>&quot;processedBy&quot;</code>' +
                        ' field for any results computed by our scripts running on your resources.';
                        
    vm.passwordHint = 'No password required for computational nodes';
    
    vm.buttonGoCaption = 'Start';
    vm.buttonGoAriaLabel = vm.buttonGoCaption;
    
    vm.mainPanelCaption = 'Task processing';
    
    vm.selectingTaskHint = 'Selecting task ...';
    
    vm.trainDataDownloadHeader = 'Train dataset download:';
    vm.testDataDownloadHeader = 'Test dataset download:';
    
    vm.trainDataDownloadProgressAriaLabel = 'Train dataset download progress';
    vm.testDataDownloadProgressAriaLabel = 'Test dataset download progress';
    
    vm.analysisInProgressHint = 'Data preparation (normalization, clusterization, etc.)';
    
    vm.clustersCountHint = 'Train data clusters found:';
    vm.rulesCountHint = 'ANFIS rules count:';
    
    vm.lbfgsProcessingInProgressHint = 'L-BFGS optimization in progress ...';
    
    vm.lbfgsProgressTitle = 'Done steps:';
    vm.lbfgsProgressAriaLabel = 'L-BFGS training progress';
    
    vm.lbfgsRawErrorTitle = 'Raw train error:';
    vm.lbfgsErrorProgressAriaLabel = vm.lbfgsRawErrorTitle;
    
    vm.lbfgsTrainClassifierErrorTitle = 'Train error:'
    vm.lbfgsTrainClassifierErrorProgressAriaLabel = vm.lbfgsTrainClassifierErrorTitle;
    
    vm.lbfgsClassifierErrorTitle = 'Test error:';
    vm.lbfgsClassifierErrorProgressAriaLabel = vm.lbfgsClassifierErrorTitle;
    
    vm.trainingTimePrefix = 'Done in';
    vm.trainingTimePostfix = 'sec';
    
    vm.indicatorInfo = 'connecting...';
    vm.indicatorClass = 'label label-warning';
    
    vm.selectTask = function()
    {
        vm.canGo = false;
        vm.fixUserId = true;
        
        vm.selectTaskPhase = true;
        
        taskSelectionService.promiseRandomTaskPath()
        .then(taskPath => 
        {
            vm.selectTaskPhase = false;
            vm.taskSelectedPhase = true;
            
            vm.selectedTaskPath = taskPath;
            
            $scope.$apply();
            
            setTimeout(vm.loadTask, 0);
        })
        .catch(() => 
        {
            vm.selectTaskPhase = false;
            vm.taskSelectedPhase = true;
            
            vm.selectedTaskPath = 'No tasks present at the moment';
            
            $scope.$apply();
        });
    }
    
    vm.loadTask = function()
    {
        taskStorageService.promiseTaskContent(vm.selectedTaskPath)
        .then(task => 
        {
            vm.taskModel = task;
            
            vm.setInfo('primary', vm.selectedTaskPath + ' task loaded');
            
            vm.phaseDownload = true;
            
            $scope.$apply();
            
            vm.downloadData();
        })
        .catch(() => 
        {
            vm.setInfo('danger', 'Could not retrieve task');    
        });    
    }
    
    vm.trainDataDownloadProgressCallback = function(evt)
    {
        ++vm.trainSetDownloadProgressStep;
        
        if((vm.trainSetDownloadProgressStep % 5 === 0) || (evt.loaded === evt.total))
        {
            vm.trainDataDownloadProgress = Math.floor(evt.loaded / evt.total * 100);
            $scope.$apply();    
        }
    }

    vm.testDataDownloadProgressCallback = function(evt)
    {
        ++vm.testSetDownloadProgressStep;
           
        if((vm.testSetDownloadProgressStep % 5 === 0) || (evt.loaded === evt.total))
        {
            vm.testDataDownloadProgress = Math.floor(evt.loaded / evt.total * 100);
            $scope.$apply();    
        }
    }
    
    vm.downloadData = function()
    {
        vm.trainSetDownloadProgressStep = 0;
        vm.testSetDownloadProgressStep = 0;
        
        vm.trainDataDownloadProgress = 0;
        vm.testDataDownloadProgress = 0;
        
        vm.phaseDownload = true;
        vm.phaseAnalysisInProgress = false;
        vm.phaseAnalyse = false;
        vm.phaseTrainingInProgress = false;
        vm.phaseTrainingDone = false;

        csvDataStorageService.promiseCsvData(vm.taskModel.trainDataPath, vm.trainDataDownloadProgressCallback)
        .then(csvDataStorageService.promiseRecordsArray) 
        .then(records => 
        {
            vm.trainDataBulk = records;

            return csvDataStorageService.promiseCsvData(vm.taskModel.testDataPath, vm.testDataDownloadProgressCallback);
        })
        .then(csvDataStorageService.promiseRecordsArray)
        .then(records => 
        {
            vm.testDataBulk = records;
            
            vm.phaseAnalysisInProgress = true;
            
            $scope.$apply(); 
            
            vm.anfisRulesCount = undefined;
            
            return vm.promiseAnalysisInfo();
        })
        .then(clusters => 
        {
            vm.taskClusters = clusters;

            vm.phaseDownload = false;
            vm.phaseAnalysisInProgress = false;
            vm.phaseAnalyse = true;
            
            $scope.$apply(); 
            
            return vm.promiseTrainWithLbfgs();
        })
        .then(lbfgsResult => 
        {
            experimentService.terminateWorkers();
            
            vm.phaseAnalyse = false;
            vm.phaseTrainingInProgress = false;
            vm.phaseTrainingDone = true;

            vm.lbfgsProgress = lbfgsResult.stepsDone;
            
            vm.lbfgsWeird = (lbfgsResult.weird ? 'weird' : undefined);
            vm.lbfgsDiverged = (lbfgsResult.diverged ? 'diverged' : undefined);
            vm.lbfgsLocal = (lbfgsResult.local ? 'local' : undefined);
            
            //var err = lbfgsResult.testResult.err;
            var err = lbfgsResult.bestFound.testResult.err;
            
            vm.classifierError = (err * 100).toFixed(2);
            vm.education = ((1 - err) * 100).toFixed(2);
            
            vm.lbfgsTrainingTime = (lbfgsResult.timeWorked / 1000).toFixed(1);
            
            $scope.$apply();
            
            vm.selectTask();
        })
        .catch(console.log);    
    }
    
    vm.promiseAnalysisInfo = function()
    {
        return Promise.resolve().then(() => 
        {
            var trainDataContainsHeaderRow = experimentService.dataBulkContainsHeaderRow(vm.trainDataBulk);
            var testDataContainsHeaderRow = experimentService.dataBulkContainsHeaderRow(vm.testDataBulk);
            
            if(trainDataContainsHeaderRow)
            {
                experimentService.removeHeaderFromDataBulk(vm.trainDataBulk);
            }
            
            if(testDataContainsHeaderRow)
            {
                experimentService.removeHeaderFromDataBulk(vm.testDataBulk);
            }
            
            var trainRanges = experimentService.buildRanges(vm.trainDataBulk);
            var testRanges = experimentService.buildRanges(vm.testDataBulk);
            
            var trainZeroDispersedFieldsCount = experimentService.countZeroDispersedFields(trainRanges);

            if(trainZeroDispersedFieldsCount > 0)
            {
                vm.trainDataBulk = experimentService.removeZeroDispersedFields(vm.trainDataBulk, trainRanges);
                    
                    // need sync test dataset, so remove the same fields (using trainRanges)
                vm.testDataBulk = experimentService.removeZeroDispersedFields(vm.testDataBulk, trainRanges);
                
                    // need sync ranges, too
                var tmp = experimentService.removeZeroRanges(trainRanges, trainRanges);
                testRanges = experimentService.removeZeroRanges(testRanges, trainRanges);
                trainRanges = tmp;
            }
            
            experimentService.normalize(vm.trainDataBulk, trainRanges);
                // normalize test dataset to train ranges
            experimentService.normalize(vm.testDataBulk, trainRanges);
            
            experimentService.mapOutput(vm.trainDataBulk, vm.taskModel.yAmplitude, 0.5, vm.taskModel.ySeparator);

            experimentService.initWorkers(1);
            
            return experimentService.promiseClusterize(vm.trainDataBulk, vm.taskModel.clusterizationRadius);
        });
    }
    
    vm.lbfgsProgressCallback = function(lbfgsProgressInfo)
    {
        vm.lbfgsErrorProgress = lbfgsProgressInfo.fCurrent.toFixed(2);
        
        vm.trainClassifierProgressClass = (lbfgsProgressInfo.trainResult.err < vm.taskModel.acceptableErrorThreshold) ? 
            'progress-bar progress-bar-success' : 'progress-bar progress-bar-warning';
        
        vm.classifierProgressClass = (lbfgsProgressInfo.testResult.err < vm.taskModel.acceptableErrorThreshold) ? 
            'progress-bar progress-bar-primary' : 'progress-bar progress-bar-warning';
        
        vm.lbfgsTrainClassifierErrorProgress = (lbfgsProgressInfo.trainResult.err * 100).toFixed(2);
        vm.lbfgsClassifierErrorProgress = (lbfgsProgressInfo.testResult.err * 100).toFixed(2);
        
        if(lbfgsProgressInfo.step === 1)
        {
            vm.lbfgsErrorValueMax = vm.lbfgsErrorProgress;
            //tan.lbfgsTrainClassifierErrorValueMax = tan.lbfgsTrainClassifierErrorProgress;
            //tan.lbfgsClassifierErrorValueMax = tan.lbfgsClassifierErrorProgress;
            vm.lbfgsTrainClassifierErrorValueMax = 50;
            vm.lbfgsClassifierErrorValueMax = 50;
        }
        
        vm.lbfgsProgress = lbfgsProgressInfo.step;
        
        $scope.$apply();
    }
    
    vm.promiseTrainWithLbfgs = function()
    {
        var anfisModel = experimentService.initAnfisModel(vm.taskClusters, vm.taskModel);

        vm.anfisRulesCount = vm.taskModel.adaptiveAnfisRulesCount ?
            ('adaptive, ' + anfisModel.rulesCount) : anfisModel.rulesCount;
        
        anfisModel.processedBy = vm.userId;

            // prepare datasets (reformat to conform L-BFGS unit requirements)
            
        var xandyTrainSet = experimentService.splitBulkToArgsAndOutput(vm.trainDataBulk);
        
        experimentService.mapOutput(vm.testDataBulk, vm.taskModel.yAmplitude, 0.5, vm.taskModel.ySeparator);
        
        var xandyTestSet = experimentService.splitBulkToArgsAndOutput(vm.testDataBulk);
        
        var lbfgsArgs = 
        {
            lbfgsIterationsCount: vm.taskModel.lbfgsIterationsCount,
            lbfgsHistorySize: vm.taskModel.lbfgsHistorySize,
            lbfgsReportStepsCount: vm.taskModel.lbfgsReportStepsCount,
            linearSearchStepsCount: 20,
            epsilon: 1e-8
        };
        
        vm.phaseTrainingInProgress = true;
        vm.phaseTrainingDone = false;
        
            // to do provide 'good models token' to make possible good model storage
            
        return experimentService.promiseOptimize(anfisModel, xandyTrainSet, xandyTestSet, lbfgsArgs, vm.lbfgsProgressCallback);
    }
    
    vm.onUserIdChange = function()
    {
        if(shadowRemember)
        {
                // forget, if the [changed] name was remembered
            
            Cookies.remove('userId');    
            
            vm.rememberUserId = false; 
            shadowRemember = false;
        }
        
        vm.canGo = vm.userId;
    }
    
    vm.onRememberUserIdCheckChanged = function()
    {
        if((shadowRemember === false) && (vm.rememberUserId === true))
        {
                // triggered to 'remember'
            
            if(vm.userId)
            {
                Cookies.set('userId', vm.userId, {expires: 365});    
            }
        }
        else if((shadowRemember === true) && (vm.rememberUserId === false))
        {
                // triggered to 'forget'
            
            Cookies.remove('userId');
        }
            
            // sync flags after processing
        shadowRemember = vm.rememberUserId;
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
        
        setTimeout(() => 
        {
            vm.info = undefined;
            
            $scope.$apply();
            
        }, 2000);
    }
    
    socket.on('connect', () =>
    {
        vm.setIndicator('success', 'connected', 'glyphicon-signal');
        
        $scope.$apply();
    });
    
    socket.on('disconnect', reason =>
    {
        vm.setIndicator('warning', 'disconnected [' + reason + ']', 'glyphicon-plane');
        
        $scope.$apply();
    });
}

//------------------------------------------------------------------------------

function taskSelectionService(yadBrowseService)
{
    this.yadBrowseService = yadBrowseService;
}

taskSelectionService.prototype.promiseRandomTaskPath = function()
{
    var entry = this;
    
    var blockSize = 20;
    
    var browseStuff = 
    {
        service: entry.yadBrowseService,
        scope: '/tasks/',
        limit: blockSize,
        offset: 0
    };
    
    return entry.yadBrowseService.promiseFilesList(browseStuff).then(info => 
    {
        if(info && info._embedded && info._embedded.total)
        {
            var randomFileIndex = Math.floor(Math.random() * info._embedded.total);
            
            if(randomFileIndex < blockSize)
            {
                return Promise.resolve(browseStuff.scope + info._embedded.items[randomFileIndex].name);
            }
            else
            {
                browseStuff.limit = 1;
                browseStuff.offset = randomFileIndex;
                
                return entry.yadBrowseService.promiseFilesList(browseStuff).then(selectedInfo => 
                {
                    if(selectedInfo && selectedInfo._embedded && selectedInfo._embedded.total)    
                    {
                        return Promise.resolve(browseStuff.scope + selectedInfo._embedded.items[0].name);
                    }
                    else
                    {
                        return Promise.reject();
                    }
                });
            }
        }
        else
        {
            return Promise.reject();
        }
    });
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

    angular.module('computeStation', ['ngSanitize'])
        .value('socket', socket)
        .value('commander', commander)
        .service('yadStorageServise', ['commander', YadStorage])
        .service('taskStorageService', ['yadStorageServise', taskStorageService])
        .service('yadBrowseService', ['commander', yadBrowseService])
        .service('taskSelectionService', ['yadBrowseService', taskSelectionService])
        .service('csvDataStorageService', ['yadStorageServise', csvDataStorageService])
        .service('workersPoolFactory', workersPoolFactory)
        .service('experimentService', ['workersPoolFactory', experimentService])
        .controller('MainController',     
        [
            '$scope', 
            'socket',
            'taskStorageService', 
            'taskSelectionService',
            'csvDataStorageService',
            'experimentService',
            MainController
        ]);

    angular.bootstrap($('#mainContainer')[0], ['computeStation']);
    
    $('#mainRow').toggleClass('collapse', false);
    $('#statusBlock').css('display', 'block');    
});

//------------------------------------------------------------------------------
