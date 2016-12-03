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
            
            model[key] = editedFieldValue ? editedFieldValue : vm.modelPattern[key];
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
            'btn btn-warning' : 
            'btn btn-warning disabled';
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

    tan.analyseTask = function(taskModel)
    {
        tan.taskModel = taskModel;
        
        tan.dialog.one('shown.bs.modal', tan.downloadData);
        
        tan.dialog.modal('show');
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
        return new Promise((resolve, reject) => 
        {
            setTimeout(() => 
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
                
                tan.relPercentRadius = 20;
                tan.relPercentAmplitude = 20;
                
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
                
                var clustersPromises = [];
                
                tabAmplitude.forEach(a => 
                {
                    tabRadius.forEach(r => 
                    {
                        var bulk = experimentService.clone(tan.trainDataBulk);
                        
                        experimentService.mapOutput(bulk, a, 0.5, tan.taskModel.ySeparator);    
                        
                        clustersPromises.push(experimentService.promiseClusterize(bulk, r));            
                    });    
                });
        
                Promise.all(clustersPromises)
                .then(promisedArray => 
                {
                    var row1 = [promisedArray[0].length, promisedArray[1].length, promisedArray[2].length];
                    var row2 = [promisedArray[3].length, promisedArray[4].length, promisedArray[5].length];
                    var row3 = [promisedArray[6].length, promisedArray[7].length, promisedArray[8].length];
                    
                    tan.clusterizationTabBlockVert = 
                    [
                        {title: 'amplitude -' + tan.relPercentAmplitude + '%', data: row1},
                        {title: 'amplitude', data: row2},
                        {title: 'amplitude +' + tan.relPercentAmplitude + '%', data: row3}
                    ];
                    
                    resolve();
                })
                .catch(reject);
                
            }, 0);    
        });
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

//------------------------------------------------------------------------------

function experimentService(workersPoolFactory)
{
    this.workersCount = 4;     
    
    var wp = workersPoolFactory.createPool(this.workersCount);
    
    wp.init(this.workerEntry, this.onWorkerMessage.bind(this));

    this.workers = wp;
    
    this.workerTaskToken = 0;
    
    this.workerTasks = {};
    
    this.deferredInvocationQueue = [];
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
    }
}

experimentService.prototype.onWorkerMessage = function(e)
{
    var arg = e.data;
    
    var entry = this;
    
    var deferred = entry.deferredInvocationQueue.pop();
    
    if(deferred)
    {
        entry.workers.invoke(arg.workerId, deferred.task);
    }
    else
    {
        entry.workers.dismiss(arg.workerId);
    }    
    
    var workerTaskContext = entry.workerTasks[arg.workerTaskKey];
    
    delete entry.workerTasks[arg.workerTaskKey];
    
    if(arg.clusters)
    {
        workerTaskContext.resolve(arg.clusters);
    }
    else if(arg.error)
    {
        workerTaskContext.reject(arg.error);
    }
}

experimentService.prototype.promiseClusterize = function(dataBulk, radius)
{
    var entry = this;
    
    return new Promise((resolve, reject) => 
    {
        var workerTaskKey = entry.workerTaskToken.toString();
        
        ++entry.workerTaskToken;
        
        var workerTaskContext = 
        {
            task: {workerTaskKey: workerTaskKey, proc: 'clusterize', radius: radius, samples: dataBulk},    
            resolve: resolve,
            reject: reject
        };
        
        entry.workerTasks[workerTaskKey] = workerTaskContext;
        
        var idle = entry.workers.findIdleIndex();
        
        if(idle < 0)
        {
            entry.deferredInvocationQueue.push(workerTaskContext);
        }
        else
        {
            entry.workers.invoke(idle, workerTaskContext.task);    
        }
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
