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

taskStorageService.prototype.promiseSubmitTask = function(taskFilePath, taskObject, overwrite)
{
    var entry = this;
    
    return Promise.resolve().then(() => 
    {
        var jsonTask = JSON.stringify(taskObject);
        
        return entry.yadStorage.asyncUpload('app:' + taskFilePath, jsonTask, overwrite);
    });
}

taskStorageService.prototype.promiseDeleteTask = function(taskFilePath)
{
    var entry = this;
    
    return Promise.resolve().then(() => 
    {
        var yadCommand = 
        {
            command: 'DELETE',
            path: 'app:' + taskFilePath
        };
        
        return entry.yadStorage.commander.promiseCommand('YAD', yadCommand);
    });
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

    tan.tableHeaderTrain = 'Train data';
    tan.tableHeaderTest = 'Test data';
    
    tan.titleClusterization = 'Clusters count estimation (with Y, on normalized train data)';
    
    tan.buttonLbfgsCaption = 'Try L-BFGS training';
    tan.buttonLbfgsAriaLabel = tan.buttonLbfgsCaption;
    
    tan.lbfgsProgressTitle = 'Done steps:';
    tan.lbfgsProgressAriaLabel = 'L-BFGS training progress';
    
    tan.lbfgsRawErrorTitle = 'Raw error:';
    tan.lbfgsErrorProgressAriaLabel = tan.lbfgsRawErrorTitle;
    
    tan.lbfgsClassifierErrorTitle = 'Classifier error:';
    tan.lbfgsClassifierErrorProgressAriaLabel = tan.lbfgsClassifierErrorTitle;
    
    tan.buttonStopLbfgsCaption = 'Stop';
    tan.buttonStopLbfgsAriaLabel = 'Stop L-BFGS training';

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
        ++tan.trainProgressStep;
        
        if((tan.trainProgressStep % 5 === 0) || (evt.loaded === evt.total))
        {
            tan.trainDataDownloadProgress = Math.floor(evt.loaded / evt.total * 100);
            $scope.$apply();    
        }
    }

    tan.testDataDownloadProgressCallback = function(evt)
    {
        ++tan.testProgressStep;
           
        if((tan.testProgressStep % 5 === 0) || (evt.loaded === evt.total))
        {
            tan.testDataDownloadProgress = Math.floor(evt.loaded / evt.total * 100);
            $scope.$apply();    
        }
    }
    
    tan.downloadData = function()
    {
        tan.trainProgressStep = 0;
        tan.testProgressStep = 0;
        
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
        
        tan.classifierProgressClass = (lbfgsProgressInfo.testResult.err < tan.taskModel.acceptableErrorThreshold) ? 
            'progress-bar progress-bar-primary' : 'progress-bar progress-bar-warning';
        
        tan.lbfgsClassifierErrorProgress = (lbfgsProgressInfo.testResult.err * 100).toFixed(2);
        
        if(lbfgsProgressInfo.step === 1)
        {
            tan.lbfgsErrorValueMax = tan.lbfgsErrorProgress;
            tan.lbfgsClassifierErrorValueMax = tan.lbfgsClassifierErrorProgress;
        }
        
        tan.lbfgsProgress = lbfgsProgressInfo.step;
        
        $scope.$apply();
        
        //console.log(lbfgsProgressInfo);    
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
        
        var anfisModel = experimentService.initAnfisModel
        (
            tan.taskClusters, 
            tan.taskModel.anfisRulesCount, 
            tan.taskModel.adaptiveAnfisRulesCount, 
            tan.taskModel.qFactor, 
            tan.taskModel.clusterizationRadius
        );
        
        anfisModel.ySeparator = tan.taskModel.ySeparator;
        
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

            tan.classifierProgressClass = (lbfgsResult.testResult.err < tan.taskModel.acceptableErrorThreshold) ? 
                'progress-bar progress-bar-primary' : 'progress-bar progress-bar-warning';

            tan.classifierError = (lbfgsResult.testResult.err * 100).toFixed(2);
            tan.education = ((1 - lbfgsResult.testResult.err) * 100).toFixed(2);
            
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

function csvDataStorageService(yadStorage)
{
    this.yadStorage = yadStorage;
    
    this.fakeProgress = new ProgressEvent('progress',
    {
        lengthComputable: true, loaded: 1, total: 1
    });
    
    this.cache = {};
}

csvDataStorageService.prototype.promiseCsvData = function(csvFilePath, onProgress)
{
    var entry = this;
    
    var cached = entry.cache[csvFilePath];

    if(cached)
    {
        return new Promise((resolve, reject) => 
        {
            setTimeout(() => 
            {
                if(onProgress)
                {
                    onProgress(entry.fakeProgress);
                }
                
                resolve(cached);
                
            }, 0);
        });
    }
    
    return entry.yadStorage.asyncDownload('app:' + csvFilePath, onProgress)
            .then(entry.promiseTextContent)
            .then(info => 
            {
                entry.cache[csvFilePath] = info;
                
                return Promise.resolve(info);
            });
}

csvDataStorageService.prototype.promiseTextContent = function(blob)
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

csvDataStorageService.prototype.promiseRecordsArray = function(csvContent)
{
    return Promise.resolve(csvContent).then(csv => 
    {
        var regular = csv.replace(/,/g, '.').split(/$\n/m);
        
        var dataRecords = [];
    
        for(var i = 0, length = regular.length; i < length; ++i)
        {
            var s = regular[i].replace(/;/g, ',').replace(/\s/g,'');
            
            if(s.length > 0)
            {
                var jsonRow = '[' + s + ']';
                
                var record = JSON.parse(jsonRow);
                
                dataRecords.push(record);
            }
        }
        
        return Promise.resolve(dataRecords)
    });
}

//------------------------------------------------------------------------------

function workersPoolFactory()
{

}

workersPoolFactory.prototype.createPool = function(size)
{
    return new WorkersPool(size);
}

function WorkersPool(size)
{
    this.size = size;
    this.pool = [];
}

WorkersPool.prototype.init = function(workerProc, feedbackProc)
{
    var entry = this;
    
    var workerUrl = URL.createObjectURL(new Blob(["(" + workerProc.toString() + ")()"], {type: "application/javascript"}));        
    
    for(var i = 0; i < entry.size; ++i)
    {
        var we = entry.pool[i];
        
        if(we)
        {
            we.worker.terminate();
        }
        
        var w = new Worker(workerUrl);
        
        entry.pool[i] = {worker: w, state: 0};
        
        w.onmessage = feedbackProc;
    }

    URL.revokeObjectURL(workerUrl);
}

WorkersPool.prototype.findIdleIndex = function()
{
    return this.pool.findIndex(element => (element.state === 0));
}

WorkersPool.prototype.dismiss = function(index)
{
    this.pool[index].state = 0;
}

WorkersPool.prototype.invoke = function(index, arg)
{
    var we = this.pool[index];
    
    we.state = 1;
    
    arg.workerId = index;
    
    we.worker.postMessage(arg);
}

WorkersPool.prototype.terminate = function()
{
    var entry = this;

    for(var i = 0; i < entry.size; ++i)
    {
        var we = entry.pool[i];
        
        if(we)
        {
            we.worker.terminate();
        }
    }
    
    entry.pool = [];
}

//------------------------------------------------------------------------------

function experimentService(workersPoolFactory)
{
    this.workersPoolFactory = workersPoolFactory;
}

experimentService.prototype.initWorkers = function(workersCount)
{
    var entry = this;
    
    entry.workersCount = workersCount;     
    
    var wp = entry.workersPoolFactory.createPool(workersCount);
    
    wp.init(entry.workerEntry, entry.onWorkerMessage.bind(entry));

    entry.workers = wp;
    
    entry.workerTaskToken = 0;
    
    entry.workerTasks = {};
    
    entry.deferredInvocationQueue = [];
}

experimentService.prototype.terminateWorkers = function()
{
    var entry = this;
    
    if(entry.workers)
    {
            // reject our promises, if any
        
        Object.keys(entry.workerTasks).forEach(key => 
        {
            var wt = entry.workerTasks[key];
            
            if(wt.reject)
            {
                wt.reject(new Error('Background task was terminated by external request'));
            }
        });
        
        entry.workers.terminate();
    }
}

experimentService.prototype.dataBulkContainsHeaderRow = function(dataBulk)
{
    return dataBulk[0].some(entry => (typeof(entry) === 'string'));
}

experimentService.prototype.removeHeaderFromDataBulk = function(dataBulk)
{
    // we do not check here if header row is actually present!
    
    var firstRow = dataBulk[0];
    var lastRow = dataBulk.pop();
    
    lastRow.forEach((element, index) => {firstRow[index] = element});
}

experimentService.prototype.countRecordsOfDifferentClasses = function(dataBulk)
{
    // returns [count0, count1]
    
    var registry = [0, 0];
    
    var yIndex = dataBulk[0].length - 1;
    
    dataBulk.forEach(row => {registry[row[yIndex]]++});

    return registry;
}

experimentService.prototype.buildRanges = function(dataBulk)
{
    var ranges = {min: [], max: []};
    
    var min = ranges.min;
    var max = ranges.max;
    
    dataBulk[0].forEach((value, colIndex) => 
    {
        max[colIndex] = min[colIndex] = value;
    });

    dataBulk.forEach((row, rowIndex) => 
    {
        if(rowIndex > 0)
        {
            row.forEach((value, colIndex) => 
            {
                if(value < min[colIndex])
                {
                    min[colIndex] = value;
                }
                
                if(value > max[colIndex])
                {
                    max[colIndex] = value;
                }
            });
        }
    });
    
    return ranges;
}

experimentService.prototype.countZeroDispersedFields = function(ranges)
{
    var min = ranges.min;
    var max = ranges.max;
    
    var count = 0;
    
    min.forEach((value, index) => 
    {
        if(max[index] === value)
        {
            ++count;
        }
    });
    
    return count;
}

experimentService.prototype.removeZeroDispersedFields = function(dataBulk, ranges)
{
    var min = ranges.min;
    var max = ranges.max;
    
    var result = [];
    
    dataBulk.forEach(row => 
    {
        var newRow = [];
        
        row.forEach((value, index) => 
        {
            if(min[index] !== max[index])
            {
                newRow.push(value);
            }
        });
        
        result.push(newRow);
    });    
    
    return result;
}

experimentService.prototype.removeZeroRanges = function(rangesToProcess, referenceRanges)
{
    var srcMin = rangesToProcess.min;
    var srcMax = rangesToProcess.max;
    
    var refMin = referenceRanges.min;
    var refMax = referenceRanges.max;
    
    var result = {min: [], max: []};

    var resMin = result.min;
    var resMax = result.max;
        
    srcMin.forEach((valueMin, index) => 
    {
        var valueMax = srcMax[index];
        
        if(refMin[index] !== refMax[index])
        {
            resMin.push(valueMin);
            resMax.push(valueMax);
        }
    });
    
    return result;
}

experimentService.prototype.normalize = function(dataBulk, ranges)
{
    // ranges: {min: [], max: []};
    //
    // normalize data in-place
    
    var min = ranges.min;
    var max = ranges.max;
    
    var rd = [];
    
    max.forEach((value, index) => 
    {
        rd[index] = value - min[index];    
    });
    
    dataBulk.forEach(row => 
    {
        row.forEach((value, index) => 
        {
            var r = rd[index];
            
            if(r > 0)
            {
                row[index] = (value - min[index]) / r; 
            }
            else
            {
                row[index] = 0;
            }
        });    
    });    
}

experimentService.prototype.clone = function(dataBulk)
{
    var rows = [];
    
    dataBulk.forEach(row => 
    {
        var rowCopy = [];
        
        row.forEach(value => {rowCopy.push(value)});    
        
        rows.push(rowCopy);
    });    

    return rows;    
}

experimentService.prototype.mapOutput = function(dataBulk, amplitude, currentSeparator, newSeparator)
{
    var yIndex = dataBulk[0].length - 1;
    
    var value0 = newSeparator - amplitude;
    var value1 = newSeparator + amplitude;
    
    dataBulk.forEach(row => 
    {
        row[yIndex] = (row[yIndex] < currentSeparator) ? value0 : value1;
    });    
}

experimentService.prototype.splitBulkToArgsAndOutput = function(dataBulk)
{
    // returns {X: [record1, record2, ... , recordN], Y:[]}
    
    var result = {X: [], Y: []};
    
    var yIndex = dataBulk[0].length - 1;
    
    var resultX = result.X;
    var resultY = result.Y;
    
    dataBulk.forEach(row => 
    {
        for(var i = 0; i < yIndex; ++i)
        {
            resultX.push(row[i]);
        }

        resultY.push(row[yIndex]);
    });
    
    return result;
}

experimentService.prototype.initAnfisModel = function(clusters, rulesCount, adaptiveRulesCount, qFactor, radius)
{
    const mutationRate = 0.1;
    const mutationMinus = -mutationRate;
    const mutationPlus = mutationRate;
    
    var anfisModel = {};
    
    var yIndex = clusters[0].center.length - 1;
    
    anfisModel.xDimension = yIndex;
    anfisModel.rulesCount = (adaptiveRulesCount ? clusters.length : rulesCount);
    anfisModel.parameters = [];
    
        // initialize model parameters
        // a - cluster center, q - qFactor * radius, b = 0, l0 = average y for points in cluster    
        
    var parameterIndex = 0;
    
    var parameters = anfisModel.parameters;
    
    for(var r = 0; r < anfisModel.rulesCount; ++r)
    {
        var cluster = clusters[r % clusters.length];
            
            // a
        for(var col = 0; col < yIndex; ++col)
        {
            var a = cluster.center[col];
            a *= (Math.random() < 0.5) ? (1 - mutationRate * Math.random()) : (1 + mutationRate * Math.random());
            parameters[parameterIndex] = a;
            ++parameterIndex;                    
        }
            // q
        //var q = qFactor * radius;
        var q = qFactor;
        
        for(var col = 0; col < yIndex; ++col)
        {
            var qp = q;
            qp *= (Math.random() < 0.5) ? (1 - mutationRate * Math.random()) : (1 + mutationRate * Math.random());
            parameters[parameterIndex] = qp;
            ++parameterIndex;                    
        }
            // b
        for(var col = 0; col < yIndex; ++col)
        {
            var b = 0;
            b += (Math.random() < 0.5) ? (mutationMinus * Math.random()) : (mutationPlus * Math.random());
            parameters[parameterIndex] = b;
            ++parameterIndex;                    
        }
            // linear 0
            // y center for this cluster    
        
        var l0 = cluster.center[yIndex];
        l0 += (Math.random() < 0.5) ? (mutationMinus * Math.random()) : (mutationPlus * Math.random());
        parameters[parameterIndex] = l0;
        ++parameterIndex;
    }    
    
    return anfisModel;
}

experimentService.prototype.workerEntry = function()
{
////////////////// FOREL clusterization stuff    
function buildClusters(radius, samples, callbackOnNewCluster)
{
    const epsilon = 0.0001;
    
    var samplesCount = samples.length;
    
    var pointDimension = samples[0].length;
    
    var unclusterizedIndexes = [];
    
    for(var i = 0; i < samplesCount; ++i)
    {
        unclusterizedIndexes.push(i);
    }
    
    var clusters = [];
    
        // helpers

    function distance(p1, p2)
    {
        var s = 0;
        
        for(var i = 0; i < pointDimension; ++i)
        {
            var d = (p1[i] - p2[i]);
            
            s += d * d;
        }
        
        return Math.sqrt(s);
    }
    
    function findNeighbours(center)
    {
        var neighbours = [];
        
        var count = unclusterizedIndexes.length;
        
        for(var i = 0; i < count; ++i)
        {
            var testIndex = unclusterizedIndexes[i];
            
            if(distance(center, samples[testIndex]) < radius)   
            {
                neighbours.push(testIndex);
            }
        }
        
        return neighbours;
    }
    
    function excludeFromClusterization(setOfPoints)
    {
        var newCluster = {points:[]};
        
        var newUnclusterized = [];
        
        var unclusterizedCount = unclusterizedIndexes.length;
        var pointsCount = setOfPoints.length;
        
        for(var i = 0; i < unclusterizedCount; ++i)
        {
            var pointIndex = unclusterizedIndexes[i];
            
            var found = -1;
            
            for(var j = 0; j < pointsCount; ++j)
            {
                if(setOfPoints[j] === pointIndex)
                {
                    found = j;
                    break;
                }
            }
            
            if(found < 0)
            {
                newUnclusterized.push(pointIndex);
            }
            else
            {
                newCluster.points.push(pointIndex);
            }
        }
        
        unclusterizedIndexes = newUnclusterized;
        
        return newCluster;
    }
    
    function calcMassCenter(setOfPoints)
    {
        var count = setOfPoints.length;

        var center = [];
        
        var point = samples[setOfPoints[0]];
        
        for(var i = 0; i < pointDimension; ++i)
        {
            center[i] = point[i];
        }
        
        for(var i = 1; i < count; ++i)
        {
            point = samples[setOfPoints[i]];
            
            for(var j = 0; j < pointDimension; ++j)
            {
                center[j] += point[j];    
            }
        }

        for(var i = 0; i < pointDimension; ++i)
        {
            center[i] /= count;
        }
        
        return center;
    }
    
    function selectRandomCenter()
    {
        var center = [];
        
        var randomIndex = Math.floor(Math.random() * unclusterizedIndexes.length);
        
        var pointSelected = samples[unclusterizedIndexes[randomIndex]];
        
        for(var i = 0; i < pointDimension; ++i)
        {
            center[i] = pointSelected[i];    
        }
        
        return center;
    }
        
        // main FOREL
    do 
    {
        var center = selectRandomCenter();
        
        do
        {
            var neighbours = findNeighbours(center);
            var newCenter = calcMassCenter(neighbours);   
            
            var stabilized = (distance(center, newCenter) < epsilon);
            
            center = newCenter;
        }
        while(!stabilized);
    
        var cluster = excludeFromClusterization(neighbours);
        
        cluster.center = center;

        clusters.push(cluster);
        
        if(callbackOnNewCluster)
        {
            callbackOnNewCluster(cluster);
        }
    }
    while(unclusterizedIndexes.length > 0);
    
        // sort clusters by population (biggest first)
    
    clusters.sort(function(a, b){
        return b.points.length - a.points.length;
    });
    
    return clusters;
}
////////////////// end FOREL clusterization stuff 

////////////////// Unnormalized ANFIS model stuff
function UnormAnfis(pointDimension, rulesCount)
{
	this.pointDimension = pointDimension;
	this.rulesCount = rulesCount;
	
		// rule entry: (a list, q list, k list), b single
		
	this.ruleEntrySize = 3 * pointDimension + 1; 
}

UnormAnfis.prototype.useParameters = function(parametersArray)
{
		// parameters: if 2d layout, rows are rule entries
		
	this.modelParameters = parametersArray;
	
	return this;
}

UnormAnfis.prototype.useTabPoints = function(pointsDataArray)
{
        // argument array contains no known output (just X, not X:Y)
	    // if 2d layout, rows are different points
	    
    this.currentTabPoints = pointsDataArray;
    
    var previousPointsCount = this.currentTabPointsCount;
    
    this.currentTabPointsCount = pointsDataArray.length / this.pointDimension;
    
    if(previousPointsCount != this.currentTabPointsCount)
    {
        this.currentTabOutput = new Float64Array(this.currentTabPointsCount);
        this.needRecreateTemps = true;    
    }
    
	return this;		
}

UnormAnfis.prototype.evauateTabPoints = function()
{
	// finds model output for current tab points 
	// (used in direct application)
    
	var pointsCount = this.currentTabPointsCount;	
	var rulesCount = this.rulesCount;
	var ruleEntrySize = this.ruleEntrySize;
	var pointDimension = this.pointDimension;
	var modelParameters = this.modelParameters;
	
	var X = this.currentTabPoints;
	var Y = this.currentTabOutput;
	
	var point_offset = 0;
    
	for(var p = 0; p < pointsCount; ++p)
	{
		var s = 0;
		
		var rule_offset = 0; 
		
		var q_offset = pointDimension;
		var k_offset = 2 * pointDimension;
		var b_offset = 3 * pointDimension;
		
		for(var r = 0; r < rulesCount; ++r)
		{
			var muProduct = 0;
									
			var L = modelParameters[b_offset];
						
			for(var i = 0; i < pointDimension; ++i)
			{
				var arg = X[point_offset + i];

				var a = modelParameters[rule_offset + i];
				var q = modelParameters[q_offset + i];
				
				var t = (arg - a) / q;
				
				muProduct -= t * t;
				
				L += arg * modelParameters[k_offset + i];				
			}
			
			muProduct = Math.exp(muProduct);
			
			s += L * muProduct;			
			
			rule_offset += ruleEntrySize;
			
			q_offset += ruleEntrySize;
			k_offset += ruleEntrySize;
			b_offset += ruleEntrySize;
		}	
		
		Y[p] = s;
		
		point_offset += pointDimension;	
	}
		
	return this;
}

UnormAnfis.prototype.useKnownOutput = function(outputDataArray)
{
        // argument array length must be consistent with current tab points count
        
	this.currentKnownOutput = outputDataArray;
	
	return this;
}

UnormAnfis.prototype.evaluateError = function()
{			
	var e = 0;
	
	var count = this.currentTabPointsCount;
	
	var y1 = this.currentKnownOutput;
	var y2 = this.currentTabOutput;
	
	for(var i = 0; i < count; ++i)
	{		
		var d = y2[i] - y1[i];
		
		e += d * d; 		
	}
	
	this.currentError = e;
	
	return this;
}

UnormAnfis.prototype.evaluateErrfGrad = function(errfGrad)
{
	// this method is used only in optimization (training) procedures 
	
	// argument is plain array of entries corresponding to ANFIS parameters
	//  (its length is rulesCount * ruleEntrySize)
		
	var pointsCount = this.currentTabPointsCount;	
	var rulesCount = this.rulesCount;
	var ruleEntrySize = this.ruleEntrySize;
	var pointDimension = this.pointDimension;
	var modelParameters = this.modelParameters;
	
	var X = this.currentTabPoints;
	var Y = this.currentKnownOutput;
    
	if(this.needRecreateTemps)
	{
		this.products = new Float64Array(pointsCount * rulesCount);
		this.linears = new Float64Array(this.products.length);
		this.errs =  new Float64Array(pointsCount);
				
		this.needRecreateTemps = false;
	}
    
	var products = this.products;
	var linears = this.linears;	
	var errs = this.errs;	
		
	var currentError = 0;
    
        // evaluate temps first,
        // dispatch for [points count x rules count],
        // if 2d layout, rows are for points, cols are for rules
    	
	var point_offset = 0;
	
	var point_rule_offset = 0;

	var q_offset;
	var k_offset;
	var b_offset;
	
	for(var i = 0; i < pointsCount; ++i)
	{			
		var s = 0;		
				
		var rule_offset = 0; 
		
		q_offset = pointDimension;
		k_offset = 2 * pointDimension;
		b_offset = 3 * pointDimension;
	
		for(var r = 0; r < rulesCount; ++r)
		{			
			var muProduct = 0;
			
			var L = modelParameters[b_offset];

			for(var m = 0; m < pointDimension; ++m)
			{
				var arg = X[point_offset + m];

				var a = modelParameters[rule_offset + m];
				var q = modelParameters[q_offset + m];
				
				var t = (arg - a) / q;
								
				muProduct -= t * t;
				
				L += arg * modelParameters[k_offset + m];								
			}	
						
			muProduct = Math.exp(muProduct);
			
			products[point_rule_offset] = muProduct; 
			linears[point_rule_offset] = L;
			
			s += muProduct * L;
			
			rule_offset += ruleEntrySize;
			
			q_offset += ruleEntrySize;
			k_offset += ruleEntrySize;
			b_offset += ruleEntrySize;	
			
			++point_rule_offset;		
		}
	
		var d = s - Y[i];
		
		errs[i] = d;		
		currentError += d * d; 

		point_offset += pointDimension;			
	}
	
	this.currentError = currentError;
    
        // having temps done, evaluate errf grad,
        // dispatch for [rules count x point dimension] 
        // if 2d layout, rows are for rules, cols are for points
	
	rule_offset = 0;
	
	q_offset = pointDimension;
	k_offset = 2 * pointDimension;
	b_offset = 3 * pointDimension;
	
	for(var r = 0; r < rulesCount; ++r)
	{
			// rule entry {{a, q, k}, b}

			// br		
		var sBr = 0;

			// arm, qrm, krm
		for(var m = 0; m < pointDimension; ++m)
		{
			var sArm = 0;
			var sQrm = 0;
			var sKrm = 0;
			
			var sFactorArm;
			var sFactorQrm;
			
			var arm = modelParameters[rule_offset + m];
			var qrm = modelParameters[q_offset + m];
				
			sFactorArm = 4 / (qrm * qrm);
			sFactorQrm = sFactorArm / qrm; 				

			point_offset = 0;
			point_rule_offset = r;
			
			for(var i = 0; i < pointsCount; ++i)
			{
				var xm = X[point_offset + m];
				
				var t2 = xm - arm;
				var t3 = products[point_rule_offset] * errs[i];
				
				var t6 = t2 * t3 * linears[point_rule_offset]; 
				
				sArm += t6; 
				sQrm += t2 * t6;
				
				sKrm += xm * t3;
				
				if(m === 0)
				{
					sBr += t3;	
				}				
									
				point_offset += pointDimension;
				point_rule_offset += rulesCount;
			}																			 	
			
			errfGrad[rule_offset + m] = sFactorArm * sArm;
			errfGrad[q_offset + m] = sFactorQrm * sQrm;	
			errfGrad[k_offset + m] = 2 * sKrm;
		}
							
		errfGrad[b_offset] = 2 * sBr;
		
		rule_offset += ruleEntrySize;
		
		q_offset += ruleEntrySize;
		k_offset += ruleEntrySize;
		b_offset += ruleEntrySize;		
	}
		
	return this;	
}
////////////////// end of Unorm ANFIS model stuff

////////////////// LBFGS procedures stuff
function AntigradientLbfgs(problemDimension, historySize)
{	
	this.problemDimension = problemDimension;
	this.historySize = (historySize !== undefined) ? historySize : 10;
    
		// ping-pong indices 
	this.ppCurrent = 0;
	this.ppNext = 1;
	
		// history entries
	this.historyS = [];
	this.historyY = [];
	
	this.historyA = [];
			
	this.historyInnerProductsSY = [];
		
	for(var i = 0; i < this.historySize; ++i)
	{
		this.historyS[i] = new Float64Array(problemDimension);
		this.historyY[i] = new Float64Array(problemDimension);						
	}
		
		// argument
	this.X = [];
	
	this.X[this.ppNext] = new Float64Array(problemDimension);
		
		// goal function value
	this.f = [];	
			
		// gradient
	this.Grad = [];

	this.Grad[this.ppCurrent] = new Float64Array(problemDimension);
	this.Grad[this.ppNext] = new Float64Array(problemDimension);
		
		//
	this.p = new Float64Array(problemDimension);
		
		//
	this.epsilon = 0.001;
	
	this.reset();
}

AntigradientLbfgs.prototype.useGradientProvider = function(fillGradient)
{
	// fillGradient(vectorX, gradArray), returns f_X
	
	this.gradF = fillGradient;
	
	return this; 
}

AntigradientLbfgs.prototype.useInitialArgument = function(initialArray)
{	
	this.X[this.ppCurrent] = initialArray;
			
	return this;
}

AntigradientLbfgs.prototype.useEpsilon = function(someSmallEpsilon)
{
	this.epsilon = someSmallEpsilon;
	
	return this;
}

AntigradientLbfgs.prototype.innerProduct = function(v1, v2)
{
	// returns v1 * v2, inner product, scalar
	
	var s = 0;

	var problemDimension = this.problemDimension;
		
	for(var i = 0; i < problemDimension; ++i)
	{
		s += v1[i] * v2[i];		
	}	
	
	return s;
}

AntigradientLbfgs.prototype.linearVectorExpression = function(v0, scalar, v1, result)
{
	// result = v0 + scalar * v1;

	var problemDimension = this.problemDimension;
		
	for(var i = 0; i < problemDimension; ++i)
	{
		result[i] = v0[i] + scalar * v1[i];		
	}	
	
	return result;
} 

AntigradientLbfgs.prototype.scaleVector = function(scalar, v, result)
{
	// result = scalar * v;

	var problemDimension = this.problemDimension;
		
	for(var i = 0; i < problemDimension; ++i)
	{
		result[i] = scalar * v[i];		
	}	
	
	return result;
} 

AntigradientLbfgs.prototype.vectorDifference = function(v1, v2, result)
{
	// result = v1 - v2;

	var problemDimension = this.problemDimension;
		
	for(var i = 0; i < problemDimension; ++i)
	{
		result[i] = v1[i] - v2[i];		
	}	
	
	return result;
} 

AntigradientLbfgs.prototype.reset = function()
{
	this.firstStep = true;
	
	this.diverged = false;
	this.local = false;
	this.weird = false;
	
	this.stepsDone = 0;
	
	return this;
}

AntigradientLbfgs.prototype.linearSearch = function(maxSteps)
{
        // Nocedal, Wright, Numerical Optimization, p. 61
        
	const c1 = 0.0001;
	const c2 = 0.9;
	
	const alphaGrowFactor = 3;
	
	var alpha = 1;
	var alphaLatch = alpha;
	
	var steps = 0;
	
	var mustReturn = false;
	
	var previousStepWasGood = false;
	
	var wolfeOk;
	
	var fCurrent = this.f[this.ppCurrent];
	var fNext;
	var fMin = fCurrent;
	
	for(;;)
	{	
		this.linearVectorExpression
		(
			this.X[this.ppCurrent], 
			alpha, 
			this.p, 
			this.X[this.ppNext]
		);
		
		fNext = this.f[this.ppNext] = this.gradF
		(
			this.X[this.ppNext],
			this.Grad[this.ppNext]
		);
		
		if(mustReturn)
		{
			break;
		}
		
		var wolfeTmpProduct = this.innerProduct
		(
			this.p, 
			this.Grad[this.ppCurrent]
		);
		
		var absWolfeTmpProduct = Math.abs(wolfeTmpProduct);
						
		var wolfe1 = (fNext <= (fCurrent + c1 * alpha * wolfeTmpProduct));  
		
		var absWolfeTmpProductNext = Math.abs
		(
			this.innerProduct(this.p, this.Grad[this.ppNext])
		);
			
		var wolfe2 = (absWolfeTmpProductNext <= c2 * absWolfeTmpProduct);
		
		wolfeOk = wolfe1 && wolfe2;			
		
		++steps;

		if(steps >= maxSteps)
		{
			if(wolfeOk)
			{
				break;
			}
			else
			{
				mustReturn = true;
				
					// no more steps, just restore good alpha;
					// cycle will break after grad evaluation
					
				if(previousStepWasGood)
				{
					alpha = alphaLatch;	
				}	
			}										
		}				
		else
		{
			var alphaFactor = alphaGrowFactor + (-1 + 2 * Math.random());
			
			if(wolfeOk)
			{
			    break;
			    /*
					// store good alpha ...
				alphaLatch = alpha;
				
					// ... and try greater alpha value
				alpha *= alphaFactor;	
				
				previousStepWasGood = true;									
				*/
			}
			else if(!previousStepWasGood)
			{
					// use smaller value
				alpha /= alphaFactor;										
			}
			else
			{
				mustReturn = true;
				
					// f value gone bad, just restore good alpha;
					// cycle will break after grad evaluation
				alpha = alphaLatch;	
				
				wolfeOk = true;										
			}						
		}			
					
	} // end for(;;)
	
	return wolfeOk;
}

AntigradientLbfgs.prototype.makeInitialSteps = function(stepsToReport, linearSearchStepsCount)
{
	var dimension = this.problemDimension;

	var m = this.historySize;
	var newestEntryIdex = m - 1;
	
	// fill history entries
	
	if(this.firstStep)
	{
		this.f[this.ppCurrent] = this.gradF
		(
			this.X[this.ppCurrent],
			this.Grad[this.ppCurrent]			
		);	
		
		this.firstStep = false;
	}

	for(var i = 0; i < m; ++i)
	{
	    this.stepsDone++;
	    
		for(var j = 0; j < dimension; ++j)
		{
			this.p[j] = -this.Grad[this.ppCurrent][j];
		}

		this.linearSearch(linearSearchStepsCount);	
        
        //*
		if(isNaN(this.f[this.ppNext]))
		{
			this.weird = true;
		}
		
		if(this.f[this.ppCurrent] < this.f[this.ppNext])
		{
			this.diverged = true;
		}
		
		if(this.weird || this.diverged)
		{
				// reset model to good point
			this.gradF
			(
				this.X[this.ppCurrent],
				this.Grad[this.ppCurrent]			
			);		
			
			break;
		}		
        
		if(Math.abs(this.f[this.ppCurrent] - this.f[this.ppNext]) < this.epsilon)
		{
			this.local = true;
			break;
		}		
        //*/
			//
		this.vectorDifference
		(
			this.X[this.ppNext], 
			this.X[this.ppCurrent], 
			this.historyS[i]
		);			 

		this.vectorDifference
		(
			this.Grad[this.ppNext], 
			this.Grad[this.ppCurrent], 
			this.historyY[i]
		);	
		
			//
		this.historyInnerProductsSY[i] = this.innerProduct
		(
			this.historyS[i], 
			this.historyY[i]
		);		 

		if(i === newestEntryIdex)
		{
			var denominator = this.innerProduct
			(
				this.historyY[i], 
				this.historyY[i]
			);		 
			
			this.previousStepInnerProductsSYYY = this.historyInnerProductsSY[i] / denominator;	
		}
			
			// report, if needed		
		var reportedStep = i + 1;
			
		if(reportedStep % stepsToReport === 1)
		{
			this.reportProgress("lbfgs init", reportedStep, this.f[this.ppNext], this.X[this.ppNext]);
		}							
			
			// swap ping-pong indices
		this.ppCurrent = 1 - this.ppCurrent;
		this.ppNext = 1 - this.ppNext; 
	}
	
	return this;
}

AntigradientLbfgs.prototype.lbfgsTwoLoops = function()
{
	var dimension = this.problemDimension;
	var m = this.historySize;
	
	// calcs new direction p
	
	for(var i = 0; i < dimension; ++i)
	{
		this.p[i] = -this.Grad[this.ppCurrent][i];
	}
	
		// from current to past
	for(var i = m - 1; i >= 0; --i)
	{
		var numerator = this.innerProduct
		(
			this.historyS[i], 
			this.p
		);
		
		var a = this.historyA[i] = numerator / this.historyInnerProductsSY[i];
		
		this.linearVectorExpression
		(
			this.p,
			-a,
			this.historyY[i],
			this.p 
		);		
	}
		
	this.scaleVector(this.previousStepInnerProductsSYYY, this.p, this.p);
	
		// from past to current
	for(var i = 0; i < m; ++i)
	{
		var numerator = this.innerProduct
		(
			this.historyY[i], 
			this.p
		);

		var b = numerator / this.historyInnerProductsSY[i];

		this.linearVectorExpression
		(
			this.p,
			this.historyA[i] - b,
			this.historyS[i],
			this.p 
		);				
	}
	
	return this;
}

AntigradientLbfgs.prototype.makeStepsLbfgs = function
	(
		stepsToReport,
		stepsCount, 
		linearSearchStepsCount
	)
{
	var m = this.historySize;	
	
	this.makeInitialSteps(stepsToReport, linearSearchStepsCount);
	
	if(this.weird || this.diverged || this.local)
	{
		return this.X[this.ppCurrent];
	}	
	
	for(var step = 0; step < stepsCount; ++step)
	{
	    this.stepsDone++;
	    
			// do L-BFGS stuff
		this.lbfgsTwoLoops();
			
			//
		this.linearSearch(linearSearchStepsCount);	
		
		//*
		if(isNaN(this.f[this.ppNext]))
		{
			this.weird = true;
		}
		
		if(this.f[this.ppCurrent] < this.f[this.ppNext])
		{
			this.diverged = true;			
		}
		
		if(this.weird || this.diverged)
		{
				// reset model to good point
			this.gradF
			(
				this.X[this.ppCurrent],
				this.Grad[this.ppCurrent]			
			);		
			
			break;
		}		
        
		if(Math.abs(this.f[this.ppCurrent] - this.f[this.ppNext]) < this.epsilon)
		{
			this.local = true;
			break;
		}		
		//*/
			// forget the oldest history entry, shift from past to current			
				
		var oldestS = this.historyS[0];
		var oldestY = this.historyY[0];
		
		var newestEntryIdex = m - 1;
		
		for(var i = 0; i < newestEntryIdex; ++i)
		{
			var next = i + 1;
			
				// (we only re-assign pointers to arrays)
			this.historyS[i] = this.historyS[next];
			this.historyY[i] = this.historyY[next];
			 
			this.historyA[i] = this.historyA[next];
			this.historyInnerProductsSY[i] = this.historyInnerProductsSY[next];
		}	
		
			// (we only re-assign pointers to arrays)
		this.historyS[newestEntryIdex] = oldestS;
		this.historyY[newestEntryIdex] = oldestY; 
		
			// update newest stuff
			
		this.vectorDifference
		(
			this.X[this.ppNext], 
			this.X[this.ppCurrent], 
			this.historyS[newestEntryIdex]
		);			 

		this.vectorDifference
		(
			this.Grad[this.ppNext], 
			this.Grad[this.ppCurrent], 
			this.historyY[newestEntryIdex]
		);	
		
			//
		this.historyInnerProductsSY[newestEntryIdex] = this.innerProduct
		(
			this.historyS[newestEntryIdex], 
			this.historyY[newestEntryIdex]
		);		 

		var denominator = this.innerProduct
		(
			this.historyY[newestEntryIdex], 
			this.historyY[newestEntryIdex]
		);		 

		this.previousStepInnerProductsSYYY = this.historyInnerProductsSY[newestEntryIdex] / denominator;	 			
			
			// swap ping-pong indices
		this.ppCurrent = 1 - this.ppCurrent;
		this.ppNext = 1 - this.ppNext; 
		
			// report, if needed		
		var reportedStep = step + 1;
			
		if(reportedStep % stepsToReport === 1)
		{
			this.reportProgress("lbfgs", reportedStep, this.f[this.ppCurrent], this.X[this.ppCurrent]);
		}							
	}
		
	return this.X[this.ppCurrent];
}

AntigradientLbfgs.prototype.useOnProgress = function(callbackProgress)
{
	this.callbackProgress = callbackProgress;
	
	return this;
}

AntigradientLbfgs.prototype.reportProgress = function(phase, step, fCurrent, xCurrent)
{
	if(this.callbackProgress !== undefined)
	{
		this.callbackProgress(phase, step, fCurrent, xCurrent);
	}
	
	return this;	
}
//////////////////  end of LBFGS procedures stuff

////////////////// LBFGS-for-ANFIS optimization stuff
function testClassifier(currentOutput, knownOutput, ySeparator)
{
    var err = 0;
    var err0 = 0;
    var err1 = 0;
    
    var count = currentOutput.length;
    
    currentOutput.forEach((value, index) => 
    {
        var ko = (knownOutput[index] < ySeparator) ? 0 : 1;
        var vo = (value < ySeparator) ? 0 : 1;
        
        if(ko !== vo)
        {
            ++err;
        }
        
        if((ko === 0) && (vo === 1))
        {
            ++err0;
        }
        
        if((ko === 1) && (vo === 0))
        {
            ++err1;
        }
    });
    
    return {err: err/count, err0: err0/count, err1: err1/count};
}

function trainWithLbfgs(arg, onLbfgsProgressCallback)
{
    var anfis = new UnormAnfis(arg.pointDimension, arg.anfisRulesCount);
    
    anfis.useParameters(arg.anfisParameters);
    anfis.useTabPoints(arg.tabPoints);
    anfis.useKnownOutput(arg.knownOutput);
    anfis.evauateTabPoints();
    anfis.evaluateError();
    
    var initialError = anfis.currentError;

    var lbfgs = new AntigradientLbfgs(arg.anfisParameters.length, arg.lbfgsHistorySize);
    
    lbfgs.useInitialArgument(arg.anfisParameters);
    
    lbfgs.useGradientProvider(function(vectorX, gradArray){
        
        anfis.useParameters(vectorX);  
        
        anfis.evaluateErrfGrad(gradArray);
        
        return anfis.currentError;
    });
    
    lbfgs.useEpsilon(arg.epsilon);
    
    lbfgs.useOnProgress(onLbfgsProgressCallback);
        
    lbfgs.reset();
    
    var optX = lbfgs.makeStepsLbfgs(arg.reportSteps, arg.lbfgsSteps, arg.linearSearchStepsCount);
    
    return {
        optX: optX, 
        weird: lbfgs.weird, 
        diverged: lbfgs.diverged, 
        local: lbfgs.local, 
        error: anfis.currentError, 
        stepsDone: lbfgs.stepsDone, 
        initialError: initialError
    };
}
////////////////// end LBFGS-for-ANFIS optimization stuff   
    
    onmessage = function(e)
    {
        var arg = e.data;
        
        var result = 
        {
            workerId: arg.workerId,
            workerTaskKey: arg.workerTaskKey
        };
        
        if(arg.proc === 'clusterize')
        {
            try
            {
                result.clusters = buildClusters(arg.radius, arg.samples);
            }
            catch(e)
            {
                result.error = e;
            }
            
            postMessage(result);
        }
        else if(arg.proc === 'optimize')
        {
            var timeStart = Date.now();

            try
            {
                var testAnfis = new UnormAnfis(arg.model.xDimension, arg.model.rulesCount);
                
                testAnfis.useTabPoints(arg.xandyTestSet.X);
                
                function onProgress(phase, step, fCurrent, xCurrent)
                {
                    testAnfis.useParameters(xCurrent);
                    testAnfis.evauateTabPoints();
                    
                    var testResult = testClassifier(testAnfis.currentTabOutput, arg.xandyTestSet.Y, arg.model.ySeparator);
                    
                    result.progress = {phase: phase, step: step, fCurrent: fCurrent, xCurrent: xCurrent, testResult: testResult};
                    
                    postMessage(result);
                }
             
                var stuff = 
                {
                    pointDimension: arg.model.xDimension,
                    anfisRulesCount: arg.model.rulesCount,       
                    anfisParameters: arg.model.parameters,
                    tabPoints: arg.xandyTrainSet.X,
                    knownOutput: arg.xandyTrainSet.Y,
                    epsilon: arg.lbfgsArgs.epsilon,
                    lbfgsHistorySize: arg.lbfgsArgs.lbfgsHistorySize,
                    lbfgsSteps: arg.lbfgsArgs.lbfgsIterationsCount,
                    linearSearchStepsCount: arg.lbfgsArgs.linearSearchStepsCount,
                    reportSteps: arg.lbfgsArgs.lbfgsReportStepsCount
                };
                
                result.lbfgsResult = trainWithLbfgs(stuff, onProgress);     
                
                testAnfis.useParameters(result.lbfgsResult.optX);
                testAnfis.evauateTabPoints();
                
                result.lbfgsResult.testResult = testClassifier(testAnfis.currentTabOutput, arg.xandyTestSet.Y, arg.model.ySeparator);
            }
            catch(e)
            {
                result.error = e;
            }

            result.timeWorked = Date.now() - timeStart;
            
            delete result.progress; // if any
            
            postMessage(result);
        }
    }
}       // end of worker entry

experimentService.prototype.onWorkerMessage = function(e)
{
    var arg = e.data;
    
    var entry = this;
    
    var workerTaskContext = entry.workerTasks[arg.workerTaskKey];
    
    if(arg.progress)
    {
        if(workerTaskContext.progressCallback)
        {
            workerTaskContext.progressCallback(arg.progress);    
        }
    }
    else
    {
            // issue next task, or dismiss:
            
        var deferred = entry.deferredInvocationQueue.pop();
        
        if(deferred)
        {
            entry.workers.invoke(arg.workerId, deferred.task);
        }
        else
        {
            entry.workers.dismiss(arg.workerId);
        }    
            // task is over, remove current task context:
            
        delete entry.workerTasks[arg.workerTaskKey];
        
            // resolve or reject task promises:
            
        if(arg.clusters)
        {
            workerTaskContext.resolve(arg.clusters);
        }
        else if(arg.lbfgsResult)
        {
            workerTaskContext.resolve(arg.lbfgsResult);
        }
        else if(arg.error)
        {
            workerTaskContext.reject(arg.error);
        }
    }
}

experimentService.prototype.dispatchTask = function(taskContext)
{
    var entry = this;
    
    var workerTaskKey = entry.workerTaskToken.toString();
    
    taskContext.task.workerTaskKey = workerTaskKey;
    
    ++entry.workerTaskToken;
    
    entry.workerTasks[workerTaskKey] = taskContext;
    
    var idle = entry.workers.findIdleIndex();
    
    if(idle < 0)
    {
        entry.deferredInvocationQueue.push(taskContext);
    }
    else
    {
        entry.workers.invoke(idle, taskContext.task);    
    }
}

experimentService.prototype.promiseClusterize = function(dataBulk, radius)
{
    var entry = this;
    
    return new Promise((resolve, reject) => 
    {
        entry.dispatchTask
        ({
            task: {proc: 'clusterize', radius: radius, samples: dataBulk},    
            resolve: resolve,
            reject: reject
        });
    });
}

experimentService.prototype.promiseOptimize = function(model, xandyTrainSet, xandyTestSet, lbfgsArgs, progressCallback)
{
    var entry = this;
    
    return new Promise((resolve, reject) => 
    {
        entry.dispatchTask
        ({
            task: 
            {
                proc: 'optimize', 
                model: model, 
                xandyTrainSet: xandyTrainSet, 
                xandyTestSet: xandyTestSet,
                lbfgsArgs: lbfgsArgs
            }, 
            progressCallback: progressCallback,
            resolve: resolve,
            reject: reject
        });
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
        .service('yadStorageServise', ['commander', YadStorage])
        .service('taskStorageService', ['yadStorageServise', taskStorageService])
        .service('csvDataStorageService', ['yadStorageServise', csvDataStorageService])
        .service('workersPoolFactory', workersPoolFactory)
        .service('experimentService', ['workersPoolFactory', experimentService])
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
});

//------------------------------------------------------------------------------
