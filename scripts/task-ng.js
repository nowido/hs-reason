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
        anfisRulesCount: modelDefaults.anfisRulesCount,
        adaptiveAnfisRulesCount: modelDefaults.adaptiveAnfisRulesCount,
        lbfgsIterationsCount: modelDefaults.lbfgsIterationsCount,
        lbfgsHistorySize: modelDefaults.lbfgsHistorySize,
        lbfgsReportStepsCount: modelDefaults.lbfgsReportStepsCount,
        acceptableErrorThreshold: modelDefaults.acceptableErrorThreshold
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
    vm.qFactorMin = 0.1;
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
    
    vm.submitButtonCaption = 'Submit';
    vm.submitButtonAriaLabel = 'Submit task to storage';

    vm.resetButtonCaption = 'Reset';
    vm.resetButtonAriaLabel = vm.resetButtonCaption;

    vm.analyseButtonCaption = 'Analyse';
    vm.analyseButtonAriaLabel = vm.analyseButtonCaption;

    vm.deleteButtonCaption = 'Delete';
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
            .then(taskObject => 
            {
                vm.useTaskObject(taskObject);
                
                vm.setInfo('info', 'Success: task [' + filePath + ']');
                
                $scope.$apply();    
            })
            .catch(e => 
            {
                vm.setInfo('danger', 'Error: task [' + filePath + ']' + ', ' + e);
                
                $scope.$apply();    
            });
        })
        .catch(e => {});
    }
    
    vm.useTaskObject = function(taskObject)
    {
        Object.keys(taskObject).forEach(key => 
        {
            vm[key] = taskObject[key];    
        });
    }
    
    vm.createNewTask = function()
    {
        vm.taskFile = undefined;
        vm.newTask = null;
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
    
    vm.dataSourcesPresent = function()
    {
        return vm.trainDataPath && vm.testDataPath;        
    }
    
    vm.getSubmitButtonClass = function()
    {
        return vm.dataSourcesPresent() ? 
                'btn btn-primary' : 
                'btn btn-primary disabled';
    }
    
    vm.ensureTaskFilePath = function()
    {
        var path;
        
        if(vm.taskFile)
        {
            path = vm.taskFile;
        }
        else if(vm.newTask)
        {
            path = '/tasks/' + vm.newTask + '.json';
        }
        else
        {
            path = '/tasks/' + generateUniqueKey() + '.json';
        }
        
        return path;
    }
    
    vm.submitTask = function()
    {
        if(vm.dataSourcesPresent())
        {
            var path = vm.ensureTaskFilePath();

            var model = vm.composeModel();

            taskStorageService.promiseSubmitTask(path, model, true).then(() => 
            {
                vm.setInfo('info', 'Task strored in ' + path);    
                
                $scope.$apply();
            })
            .catch(e => 
            {
                vm.setInfo('danger', 'Task was not strored! [' + path + '], ' + e);    
                
                $scope.$apply();
            });
        }
    }
    
    vm.composeModel = function()
    {
        vm.modelPattern.acceptableModelsTargetToken = generateUniqueKey();
        vm.modelPattern.bestModelTargetToken = generateUniqueKey();

        var model = {};
        
        Object.keys(vm.modelPattern).forEach(key => 
        {
            var editedFieldValue = vm[key];
            
            model[key] = (editedFieldValue !== undefined) ? editedFieldValue : vm.modelPattern[key];
        });
        
        return model;
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
        
        vm.taskFile = undefined;
    }
    
    vm.getAnalyseButtonClass = function()
    {
        return vm.dataSourcesPresent() ? 
            'btn btn-default' : 
            'btn btn-default disabled';
    }
    
    vm.analyseTask = function()
    {
        interService.tan.analyseTask(vm.composeModel());
    }
    
    vm.deleteTask = function()
    {
        if(vm.taskFile)
        {
            taskStorageService.promiseDeleteTask(vm.taskFile)
            .then(() => 
            {
                vm.setInfo('info', 'Task [' + vm.taskFile + '] was deleted');    
                
                vm.taskFile = undefined;
                
                $scope.$apply();
            })
            .catch(e => 
            {
                vm.setInfo('danger', 'Task [' + vm.taskFile + '] was not deleted');    
                
                $scope.$apply();
            });    
        }
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
    
    vm.resetTask();
}

//------------------------------------------------------------------------------

function TaskAnalysisController
            (
                $scope, 
                interService, 
                csvDataStorageService, 
                experimentService, 
                elementId
            )
{
    var tan = this;

    interService.tan = tan;
    
    tan.dialog = $('#' + elementId);
    
    tan.title = 'Task analysis tool';
    
    tan.trainDataDownloadHeader = 'Train dataset download:';
    tan.testDataDownloadHeader = 'Test dataset download:';
    
    tan.buttonCloseCaption = 'Close';
    tan.buttonCloseAriaLabel = tan.buttonCloseCaption;
    
    tan.trainDataDownloadProgressAriaLabel = 'Train dataset download progress';
    tan.testDataDownloadProgressAriaLabel = 'Test dataset download progress';

    tan.analysisInProgressHint = 'Analyzing data ... ';
    tan.lbfgsProcessingInProgressHint = 'Processing ...';

    tan.tableHeaderTrain = 'Train data';
    tan.tableHeaderTest = 'Test data';
    
    tan.titleClusterization = 'Clusters count estimation (with Y, on normalized train data)';
    
    tan.buttonLbfgsCaption = 'Try L-BFGS training';
    tan.buttonLbfgsAriaLabel = tan.buttonLbfgsCaption;
    
    tan.lbfgsProgressTitle = 'Done steps:';
    tan.lbfgsProgressAriaLabel = 'L-BFGS training progress';
    
    tan.lbfgsRawErrorTitle = 'Raw train error:';
    tan.lbfgsErrorProgressAriaLabel = tan.lbfgsRawErrorTitle;
    
    tan.lbfgsTrainClassifierErrorTitle = 'Train error, %:'
    tan.lbfgsTrainClassifierErrorProgressAriaLabel = tan.lbfgsTrainClassifierErrorTitle;
    
    tan.lbfgsClassifierErrorTitle = 'Test error, %:';
    tan.lbfgsClassifierErrorProgressAriaLabel = tan.lbfgsClassifierErrorTitle;
    
    tan.buttonStopLbfgsCaption = 'Stop';
    tan.buttonStopLbfgsAriaLabel = 'Stop L-BFGS training';

    tan.trainingTimePrefix = 'Done in';
    tan.trainingTimePostfix = 'sec';
    
    tan.analyseTask = function(taskModel)
    {
        tan.taskModel = taskModel;
        
        tan.dialog.one('shown.bs.modal', tan.downloadData);
        tan.dialog.one('hidden.bs.modal', tan.quitAnalysis);
        
        tan.dialog.modal('show');
    }
    
    tan.quitAnalysis = function()
    {
        experimentService.terminateWorkers();
    }
    
    tan.trainDataDownloadProgressCallback = function(evt)
    {
        ++tan.trainSetDownloadProgressStep;
        
        if((tan.trainSetDownloadProgressStep % 5 === 0) || (evt.loaded === evt.total))
        {
            tan.trainDataDownloadProgress = Math.floor(evt.loaded / evt.total * 100);
            $scope.$apply();    
        }
    }

    tan.testDataDownloadProgressCallback = function(evt)
    {
        ++tan.testSetDownloadProgressStep;
           
        if((tan.testSetDownloadProgressStep % 5 === 0) || (evt.loaded === evt.total))
        {
            tan.testDataDownloadProgress = Math.floor(evt.loaded / evt.total * 100);
            $scope.$apply();    
        }
    }
    
    tan.downloadData = function()
    {
        tan.trainSetDownloadProgressStep = 0;
        tan.testSetDownloadProgressStep = 0;
        
        tan.trainDataDownloadProgress = 0;
        tan.testDataDownloadProgress = 0;
        
        tan.phaseDownload = true;
        tan.phaseAnalysisInProgress = false;
        tan.phaseAnalyse = false;
        tan.phaseTrainingInProgress = false;
        tan.phaseTrainingDone = false;
        
        csvDataStorageService.promiseCsvData(tan.taskModel.trainDataPath, tan.trainDataDownloadProgressCallback)
        .then(csvDataStorageService.promiseRecordsArray) 
        .then(records => 
        {
            tan.trainDataBulk = records;

            return csvDataStorageService.promiseCsvData(tan.taskModel.testDataPath, tan.testDataDownloadProgressCallback);
        })
        .then(csvDataStorageService.promiseRecordsArray)
        .then(records => 
        {
            tan.testDataBulk = records;
            
            tan.phaseAnalysisInProgress = true;
            
            $scope.$apply(); 
            
            return tan.promiseAnalysisInfo();
        })
        .then(() => 
        {
            tan.phaseDownload = false;
            tan.phaseAnalysisInProgress = false;
            tan.phaseAnalyse = true;
            
            $scope.$apply();  
        })
        .catch(console.log);    
    }
    
    tan.promiseAnalysisInfo = function()
    {
        return Promise.resolve().then(() => 
        {
            var trainDataContainsHeaderRow = experimentService.dataBulkContainsHeaderRow(tan.trainDataBulk);
            var testDataContainsHeaderRow = experimentService.dataBulkContainsHeaderRow(tan.testDataBulk);
            
            if(trainDataContainsHeaderRow)
            {
                experimentService.removeHeaderFromDataBulk(tan.trainDataBulk);
            }
            
            if(testDataContainsHeaderRow)
            {
                experimentService.removeHeaderFromDataBulk(tan.testDataBulk);
            }
            
            var trainRanges = experimentService.buildRanges(tan.trainDataBulk);
            var testRanges = experimentService.buildRanges(tan.testDataBulk);
            
            var trainZeroDispersedFieldsCount = experimentService.countZeroDispersedFields(trainRanges);
            var testZeroDispersedFieldsCount = experimentService.countZeroDispersedFields(testRanges);
            
            if(trainZeroDispersedFieldsCount > 0)
            {
                tan.trainDataBulk = experimentService.removeZeroDispersedFields(tan.trainDataBulk, trainRanges);
                    
                    // need sync test dataset, so remove the same fields (using trainRanges)
                tan.testDataBulk = experimentService.removeZeroDispersedFields(tan.testDataBulk, trainRanges);
                
                    // need sync ranges, too
                var tmp = experimentService.removeZeroRanges(trainRanges, trainRanges);
                testRanges = experimentService.removeZeroRanges(testRanges, trainRanges);
                trainRanges = tmp;
            }
            
            var trainClasses = experimentService.countRecordsOfDifferentClasses(tan.trainDataBulk);
            var testClasses = experimentService.countRecordsOfDifferentClasses(tan.testDataBulk);
            
            tan.metaData = 
            [
                ['Header present:', trainDataContainsHeaderRow, testDataContainsHeaderRow],
                ['Data records count:', tan.trainDataBulk.length, tan.testDataBulk.length], 
                ['Data fields count (including Y):', tan.trainDataBulk[0].length, tan.testDataBulk[0].length], 
                ['Zero-dispersed fields count:', trainZeroDispersedFieldsCount, testZeroDispersedFieldsCount],
                ['[Y = 0] records count:', trainClasses[0], testClasses[0]], 
                ['[Y = 1] records count:', trainClasses[1], testClasses[1]]
            ];
            
            experimentService.normalize(tan.trainDataBulk, trainRanges);
                // normalize test dataset to train ranges
            experimentService.normalize(tan.testDataBulk, trainRanges);
            
            tan.relPercentRadius = 20;
            tan.relPercentAmplitude = 50;
            
            tan.clusterizationTabHeaderHoriz = 
            [
                'radius -' + tan.relPercentRadius + '%',
                'radius',
                'radius +' + tan.relPercentRadius + '%'
            ];
            
            var tabRadius = 
            [
                tan.taskModel.clusterizationRadius * (100 - tan.relPercentRadius) / 100, 
                tan.taskModel.clusterizationRadius,
                tan.taskModel.clusterizationRadius * (100 + tan.relPercentRadius) / 100
            ];
            
            var tabAmplitude = 
            [
                tan.taskModel.yAmplitude * (100 - tan.relPercentAmplitude) / 100, 
                tan.taskModel.yAmplitude,
                tan.taskModel.yAmplitude * (100 + tan.relPercentAmplitude) / 100
            ];
            
            experimentService.initWorkers(3);
            
            var clustersPromises = [];
            
            var tabIndex = 0;
            
            tabAmplitude.forEach(a => 
            {
                tabRadius.forEach(r => 
                {
                    var bulk = experimentService.clone(tan.trainDataBulk);
                    
                    experimentService.mapOutput(bulk, a, 0.5, tan.taskModel.ySeparator);    
                    
                    if(tabIndex === 4)
                    {
                            // keep for further use on L-BFGS phase
                        tan.mappedTrainBulk = bulk;
                    }
                    
                    clustersPromises.push(experimentService.promiseClusterize(bulk, r));            
                    
                    ++tabIndex;
                });    
            });
            
            return Promise.all(clustersPromises);
        })
        .then(promisedArray => 
        {
            var row1 = [promisedArray[0].length, promisedArray[1].length, promisedArray[2].length];
            var row2 = [promisedArray[3].length, promisedArray[4].length, promisedArray[5].length];
            var row3 = [promisedArray[6].length, promisedArray[7].length, promisedArray[8].length];
            
                // keep for further use on L-BFGS phase
            tan.taskClusters = promisedArray[4];
            
            tan.clusterizationTabBlockVert = 
            [
                {title: 'amplitude -' + tan.relPercentAmplitude + '%', data: row1},
                {title: 'amplitude', data: row2},
                {title: 'amplitude +' + tan.relPercentAmplitude + '%', data: row3}
            ];
            
            experimentService.terminateWorkers();
        });
    }
    
    tan.lbfgsProgressCallback = function(lbfgsProgressInfo)
    {
        tan.lbfgsErrorProgress = lbfgsProgressInfo.fCurrent.toFixed(2);
        
        tan.trainClassifierProgressClass = (lbfgsProgressInfo.trainResult.err < tan.taskModel.acceptableErrorThreshold) ? 
            'progress-bar progress-bar-success' : 'progress-bar progress-bar-warning';
        
        tan.classifierProgressClass = (lbfgsProgressInfo.testResult.err < tan.taskModel.acceptableErrorThreshold) ? 
            'progress-bar progress-bar-primary' : 'progress-bar progress-bar-warning';
        
        tan.lbfgsTrainClassifierErrorProgress = (lbfgsProgressInfo.trainResult.err * 100).toFixed(2);
        tan.lbfgsClassifierErrorProgress = (lbfgsProgressInfo.testResult.err * 100).toFixed(2);
        
        if(lbfgsProgressInfo.step === 1)
        {
            tan.lbfgsErrorValueMax = tan.lbfgsErrorProgress;
            //tan.lbfgsTrainClassifierErrorValueMax = tan.lbfgsTrainClassifierErrorProgress;
            //tan.lbfgsClassifierErrorValueMax = tan.lbfgsClassifierErrorProgress;
            tan.lbfgsTrainClassifierErrorValueMax = 50;
            tan.lbfgsClassifierErrorValueMax = 50;
        }
        
        tan.lbfgsProgress = lbfgsProgressInfo.step;
        
        $scope.$apply();
    }
    
    tan.getTrainButtonClass = function()
    {
        return tan.phaseTrainingInProgress ? 
            'btn btn-default disabled' : 
            'btn btn-default';
    }
    
    tan.tryLbfgs = function()
    {
        if(tan.phaseTrainingInProgress)
        {
            return;
        }
        
        experimentService.initWorkers(1);
        
        var anfisModel = experimentService.initAnfisModel(tan.taskClusters, tan.taskModel);

        var xandyTrainSet = experimentService.splitBulkToArgsAndOutput(tan.mappedTrainBulk);
        
        experimentService.mapOutput(tan.testDataBulk, tan.taskModel.yAmplitude, 0.5, tan.taskModel.ySeparator);
        
        var xandyTestSet = experimentService.splitBulkToArgsAndOutput(tan.testDataBulk);
        
        var lbfgsArgs = 
        {
            lbfgsIterationsCount: tan.taskModel.lbfgsIterationsCount,
            lbfgsHistorySize: tan.taskModel.lbfgsHistorySize,
            lbfgsReportStepsCount: tan.taskModel.lbfgsReportStepsCount,
            linearSearchStepsCount: 20,
            epsilon: 1e-8
        };
        
        tan.phaseTrainingInProgress = true;
        tan.phaseTrainingDone = false;
        
        experimentService.promiseOptimize(anfisModel, xandyTrainSet, xandyTestSet, lbfgsArgs, tan.lbfgsProgressCallback)
        .then(lbfgsResult => 
        {
            experimentService.terminateWorkers();
            
            tan.phaseTrainingInProgress = false;
            tan.phaseTrainingDone = true;
            
            tan.lbfgsProgress = lbfgsResult.stepsDone;
            
            tan.lbfgsWeird = (lbfgsResult.weird ? 'weird' : undefined);
            tan.lbfgsDiverged = (lbfgsResult.diverged ? 'diverged' : undefined);
            tan.lbfgsLocal = (lbfgsResult.local ? 'local' : undefined);
            
            //var err = lbfgsResult.testResult.err;
            var err = lbfgsResult.bestFound.testResult.err;
            
            tan.classifierError = (err * 100).toFixed(2);
            tan.education = ((1 - err) * 100).toFixed(2);
            
            tan.lbfgsTrainingTime = (lbfgsResult.timeWorked / 1000).toFixed(1);
            
            $scope.$apply();
        })
        .catch(console.log);
    }
    
    tan.stopLbfgs = function()
    {
        if(!tan.phaseTrainingInProgress)
        {
            return;
        }
        
        experimentService.terminateWorkers();
        
        tan.phaseTrainingInProgress = false;
    }
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
            yad.dialog.one('hidden.bs.modal', () => 
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
            }
            else
            {
                yad.fileItems = [];
            }
            
             $scope.$apply();
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
        yad.activeItem = index;
        
        var entry = yad.fileItems[index];
        
        if(entry.type === 'dir')
        {
            yad.scopeStack.push(yad.scope);
            
            yad.scope += entry.name + '/';
            
            yad.readFolder();
        }
        else
        {
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
        taskFilesScope: '/tasks/',
        trainDataScope : '/csv/',
        testDataScope : '/csv/',
        yAmplitude: 2,
        ySeparator: 0,
        clusterizationRadius: 2.2,
        qFactor: 4,
        anfisRulesCount: 5,
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
        .value('taskAnalysisElementId', 'taskAnalysisContainer')
        .value('yadNavigatorElementId', 'yadNavigatorContainer')
        .service('interService', interService)
        .service('yadStorageService', ['commander', YadStorage])
        .service('taskStorageService', ['yadStorageService', taskStorageService])
        .service('csvDataStorageService', ['yadStorageService', csvDataStorageService])
        .service('updatesPushService', ['yadStorageService', updatesPushService])
        .service('workersPoolFactory', workersPoolFactory)
        .service('experimentService', ['workersPoolFactory', 'updatesPushService', experimentService])
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
        .controller('TaskAnalysisController', 
        [
            '$scope', 
            'interService',
            'csvDataStorageService',
            'experimentService',
            'taskAnalysisElementId',
            TaskAnalysisController
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
    
    document.title = 'HS tools';
});

//------------------------------------------------------------------------------
