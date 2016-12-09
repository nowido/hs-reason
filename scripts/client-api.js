//------------------------------------------------------------------------------

function generateUniqueKey(length)
{
    var hexDigits = "0123456789ABCDEF";
    
    if(length === undefined)
    {
        length = 16;
    }
    
    var s = "";
    
    for(var i = 0; i < length; ++i)
    {
        var index = Math.floor(16 * Math.random());
        
        s += hexDigits.charAt(index);
    }
    
    return s;
}

//------------------------------------------------------------------------------

function decimalRound(number, precision) 
{
    var factor = Math.pow(10, precision);
    var tempNumber = number * factor;
    var roundedTempNumber = Math.round(tempNumber);
    return roundedTempNumber / factor;
}

//------------------------------------------------------------------------------

function AsyncCommander(socket, channel)
{
    this.socket = socket;
    this.channel = channel;
    
    this.actions = {};
}

AsyncCommander.prototype.issueCommand = function(command, args, callbackOnDone, context)
{
   var key = generateUniqueKey();

   this.actions[key] = 
   {
       proc: callbackOnDone, 
       context: (context ? context : {})
   };

   this.socket.emit(this.channel, {command: command, args: args, reason: key});
}

AsyncCommander.prototype.promiseCommand = function(command, args, context)
{
    var entry = this;
    
    return new Promise((resolve, reject) => 
    {
        var key = generateUniqueKey();
        
        entry.actions[key] = 
        {
            context: (context ? context : {}),
            resolve: resolve,
            reject: reject
        };
        
        entry.socket.emit(entry.channel, {command: command, args: args, reason: key});
    });
}

AsyncCommander.prototype.hold = function(message, socket)
{
    var reason = message.reason;
    
    delete message['reason'];
    
    var actionEntry = this.actions[reason];
    
    if(actionEntry)
    {
        actionEntry.context.message = message;
        actionEntry.context.commander = this;
        
        if(actionEntry.proc)
        {
            actionEntry.proc(actionEntry.context);    
        }
        else if(actionEntry.resolve && actionEntry.reject)
        {
            if(message.error)
            {
                actionEntry.reject(actionEntry.context);    
            }
            else
            {
                actionEntry.resolve(actionEntry.context);
            }
        }
        
        delete this.actions[reason];
        
        return true;
    }
    else
    {
        return false;
    }
}

//------------------------------------------------------------------------------

function interService()
{
    // sort of global space to communicate on
    
    // communication parts will add properties to the service instance,
    //  thus making possible data sharing
}

//------------------------------------------------------------------------------

function YadStorage(commander)
{
    this.commander = commander;    
}

YadStorage.prototype.asyncDownload = function(path, onProgress)
{
    var entry = this;
    
    return Promise.resolve(entry.commander.promiseCommand('YAD', {command: 'GETDOWNLOADURL', path: path}))
            .then(context => 
            {
                var urlJson = context.message.answer;
                
                return entry.promiseDownload(JSON.parse(urlJson), onProgress);
            });
}

YadStorage.prototype.asyncUpload = function(path, content, overwrite, onProgress)
{
    var entry = this;

    var yadCommand = 
    {
        command: 'GETUPLOADURL',    
        path: path
    };
    
    if(overwrite)
    {
        yadCommand.overwrite = true;
    }
    
    return Promise.resolve(entry.commander.promiseCommand('YAD', yadCommand))
            .then(context => 
            {
                var urlJson = context.message.answer;
                
                return entry.promiseUpload(JSON.parse(urlJson), content, onProgress)
            });
}

YadStorage.prototype.promiseDownload = function(urlObject, onProgress)
{
    return new Promise((resolve, reject) => 
    {
        function progressListener(evt)
        {
            onProgress(evt);
    
            if(evt.loaded === evt.total)
            {
                evt.target.removeEventListener('progress', progressListener);        
            }
        }
        
        var xhr = new XMLHttpRequest();
        
        if(onProgress)
        {
            xhr.addEventListener('progress', progressListener, false);
        }
        
        xhr.open(urlObject.method, urlObject.href);
        
        xhr.responseType = 'blob'; 
        
        xhr.onreadystatechange = () => 
        {
            if(xhr.readyState === XMLHttpRequest.DONE)
            {
                if(xhr.status === 200)
                {
                    resolve(xhr.response);
                }
                else
                {
                    reject(xhr.status);
                }
            }
        };
        
        xhr.send();
    });
}

YadStorage.prototype.promiseUpload = function(urlObject, content, onProgress)
{
    return new Promise((resolve, reject) => 
    {
        function progressListener(evt)
        {
            onProgress(evt);
            
            if(evt.loaded === evt.total)
            {
                evt.target.removeEventListener('progress', progressListener);
            }
        }
        
        var xhr = new XMLHttpRequest();
        
        if(onProgress)
        {
            xhr.upload.addEventListener('progress', progressListener, false);
        }    
        
        xhr.open(urlObject.method, urlObject.href);
        
        xhr.setRequestHeader('Content-Type', 'text/plain; charset=x-user-defined');

        xhr.onreadystatechange = () => 
        {
            if(xhr.readyState === XMLHttpRequest.DONE)
            {
                if(xhr.status === 201)
                {
                    resolve(xhr.response);
                }
                else
                {
                    reject(xhr.status);
                }
            }
        };
        
        xhr.send(content);
    });
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

function experimentService(workersPoolFactory, updatesPushService)
{
    this.workersPoolFactory = workersPoolFactory;
    
    this.updatesPushService = updatesPushService;
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

experimentService.prototype.initAnfisModel = function(clusters, taskModel)
{
    const mutationRate = 0.1;
    const mutationMinus = -mutationRate;
    const mutationPlus = mutationRate;
    
    var anfisModel = {task: taskModel};
    
    var yIndex = clusters[0].center.length - 1;
    
    anfisModel.xDimension = yIndex;
    anfisModel.rulesCount = (taskModel.adaptiveAnfisRulesCount ? clusters.length : taskModel.anfisRulesCount);
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
        var q = taskModel.qFactor;
        
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
			
		if((reportedStep % stepsToReport === 1) || (stepsToReport === 1))
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
			
		if((reportedStep % stepsToReport === 1) || (stepsToReport === 1))
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

function testClassifier(currentOutput, knownOutput, yAmplitude, ySeparator)
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

function decimalRound(number, precision) 
{
    var factor = Math.pow(10, precision);
    var tempNumber = number * factor;
    var roundedTempNumber = Math.round(tempNumber);
    return roundedTempNumber / factor;
}
    
function composeModel(taskModel, optParameters, testResult, processedBy)
{
    var model = {};
    
    Object.keys(taskModel).forEach(key => 
    {
        model[key] = taskModel[key];
    });
    
    var parameters = [];
    
    optParameters.forEach((value, index) => 
    {
        parameters[index] = decimalRound(value, 6);
    });

    model.optimizedParameters = parameters;
    
    model.classifierError = testResult.err;
    model.classifierError0 = testResult.err0;
    model.classifierError1 = testResult.err1;

    if(processedBy)
    {
        model.processedBy = processedBy;
    }
    
    return model;
}

//////////////////        

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
            try
            {
                var timeStart = Date.now();
                
                var shadowStep = 0;
                var stepsToReport = arg.lbfgsArgs.lbfgsReportStepsCount;
                
                var bestFound;
                
                var shadowTrainAnfis = new UnormAnfis(arg.model.xDimension, arg.model.rulesCount);
                shadowTrainAnfis.useTabPoints(arg.xandyTrainSet.X);
                
                var testAnfis = new UnormAnfis(arg.model.xDimension, arg.model.rulesCount);
                testAnfis.useTabPoints(arg.xandyTestSet.X);
                
                function onProgress(phase, step, fCurrent, xCurrent)
                {
                    ++shadowStep;
                    
                    shadowTrainAnfis.useParameters(xCurrent);
                    shadowTrainAnfis.evauateTabPoints();
                    
                    testAnfis.useParameters(xCurrent);
                    testAnfis.evauateTabPoints();
                    
                    var trainResult = testClassifier
                    (
                        shadowTrainAnfis.currentTabOutput, 
                        arg.xandyTrainSet.Y, 
                        arg.model.task.yAmplitude, 
                        arg.model.task.ySeparator
                    );
                    
                    var testResult = testClassifier
                    (
                        testAnfis.currentTabOutput, 
                        arg.xandyTestSet.Y, 
                        arg.model.task.yAmplitude, 
                        arg.model.task.ySeparator
                    );
                    
                    var goodModel = (testResult.err < arg.model.task.acceptableErrorThreshold);
                    var considerUpdateStored = false;
                    
                    if(bestFound === undefined)
                    {
                        bestFound = {optX: xCurrent, testResult: testResult};
                        considerUpdateStored = true;
                    }
                    else if(bestFound.testResult.err > testResult.err)
                    {
                        bestFound.optX = xCurrent;
                        bestFound.testResult = testResult;
                        considerUpdateStored = true;
                    }
                    
                    if(goodModel && considerUpdateStored)
                    {
                        result.pushUpdate = composeModel
                        (
                            arg.model.task, 
                            bestFound.optX, 
                            bestFound.testResult, 
                            arg.model.processedBy
                        );
                        
                        delete result.progress; // if any
                        
                        postMessage(result);
                    }
                    
                    if((shadowStep % stepsToReport === 1) || (stepsToReport === 1))
                    {
                        result.progress = 
                        {
                            phase: phase, 
                            step: step, 
                            fCurrent: fCurrent, 
                            xCurrent: xCurrent, 
                            trainResult: trainResult, 
                            testResult: testResult,
                            bestFound: bestFound
                        };
                        
                        postMessage(result);
                    }    
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
                    reportSteps: 1
                };
                
                result.lbfgsResult = trainWithLbfgs(stuff, onProgress);     
                
                testAnfis.useParameters(result.lbfgsResult.optX);
                testAnfis.evauateTabPoints();
                
                result.lbfgsResult.testResult = testClassifier
                (
                    testAnfis.currentTabOutput, 
                    arg.xandyTestSet.Y, 
                    arg.model.task.yAmplitude, 
                    arg.model.task.ySeparator
                );
                
                var goodModel = (result.lbfgsResult.testResult.err < arg.model.task.acceptableErrorThreshold);
                var considerUpdateStored = false;
                
                if(bestFound === undefined)
                {
                    bestFound = {optX: result.lbfgsResult.optX, testResult: result.lbfgsResult.testResult};
                    considerUpdateStored = true;
                }
                else if(bestFound.testResult.err > result.lbfgsResult.testResult.err)
                {
                    bestFound.optX = result.lbfgsResult.optX;
                    bestFound.testResult = result.lbfgsResult.testResult;
                    considerUpdateStored = true;
                }
                
                result.lbfgsResult.bestFound = bestFound;
                
                if(goodModel && considerUpdateStored)
                {
                    result.pushUpdate = composeModel
                    (
                        arg.model.task, 
                        bestFound.optX, 
                        bestFound.testResult, 
                        arg.model.processedBy
                    );
                    
                    delete result.progress; // if any
                    
                    postMessage(result);
                }
                
                result.lbfgsResult.timeWorked = Date.now() - timeStart;
            }
            catch(e)
            {
                result.error = e;
            }
            
            delete result.progress; // if any
            delete result.pushUpdate; // if any
            
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
    else if(arg.pushUpdate)
    {
        entry.updatesPushService.pushUpdate(arg.pushUpdate);
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

function updatesPushService(yadStorage)
{
    this.yadStorage = yadStorage;
    
    this.clearCache();
}

updatesPushService.prototype.clearCache = function()
{
    this.folderCache = {};
    this.fileCache = {};
}

updatesPushService.prototype.pushUpdate = function(model)
{
    var entry = this;
    
    var token = model.acceptableModelsTargetToken;
    
    if((!token) || (token.length === 0))
    {
        return;
    }
    
    var folderCached = entry.folderCache[token];
    
    if(folderCached === undefined)
    {
            // we need create folder first
        
        entry.promiseFolder(entry.yadStorage.commander, token)
        .then(() => 
        {
                // we will not try create folder for 'token' anymore on this session
                
            entry.folderCache[token] = true;    
            
            entry.promiseStore(model).catch(console.log);
            
        })
        .catch(console.log);
    }
    else
    {
            // folder exists, try store
            
        entry.promiseStore(model).catch(console.log);
    }
}

updatesPushService.prototype.promiseFolder = function(commander, token)
{
    return Promise.resolve().then(() => 
    {
        var yadCommand = 
        {
            command: 'CREATEFOLDER',
            path: 'app:/good/' + token,
            overwrite: false
        };

        return commander.promiseCommand('YAD', yadCommand);
    })
    .catch(errContext => 
    {
        var errObj = JSON.parse(errContext.message.error);
        
        if(errObj.error === 'DiskPathPointsToExistentDirectoryError')
        {
                // OK, folder exists
            return Promise.resolve();    
        }
        else
        {
                // error other than 'Folder already exists'
            return Promise.reject(errContext);
        }
    });
}

updatesPushService.prototype.promiseStore = function(model)
{
    var entry = this;

    return new Promise((resolve, reject) => 
    {
        setTimeout(() => 
        {
            var percent = (100 * model.classifierError).toFixed(1);
            
            var fileName = model.acceptableModelsTargetToken + '-' + percent + '.json'; 
            
            var filePath = 'app:/good/' + model.acceptableModelsTargetToken + '/' + fileName;
            
            var strModel = JSON.stringify(model);
            
            var fileNameCached = entry.fileCache[fileName];
            
            if(fileNameCached === undefined)
            {
                entry.promiseFile(filePath, strModel).then(() => 
                {
                    entry.fileCache[fileName] = true;
                    
                    resolve();
                })
                .catch(reject);
            }
            else
            {
                // nothing to do: we have already stored a model of this quality;
                // but it is OK
                    
                resolve();    
            }
            
        }, Math.floor(300 + Math.random() * 400));
    });
}

updatesPushService.prototype.promiseFile = function(filePath, strModel)
{
    var entry = this;
    
    return entry.yadStorage.asyncUpload(filePath, strModel)
    .catch(errContext => 
    {
        if(errContext.message && errContext.message.error)
        {
            var errObj = JSON.parse(errContext.message.error);   
            
            if(errObj.error && (errObj.error === 'DiskResourceAlreadyExistsError'))
            {
                    // OK, file exists
                return Promise.resolve();    
            }
        }
            // error other than 'File already exists'
        return Promise.reject(errContext);
    });
}
//------------------------------------------------------------------------------

function binToBase64(buffer)
{   
        // buffer is Uint8Array
        
    var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    
    var bufferLength = buffer.byteLength;

    var trailingBytesCount = bufferLength % 3;
    var tripletsCount = (bufferLength - trailingBytesCount) / 3;
    
    var outputArray = [];
            
    var tmp;
    var byteIndex = 0;
        
    for(var i = 0; i < tripletsCount; ++i)
    {
        tmp = (buffer[byteIndex] << 16) + (buffer[byteIndex + 1] << 8) + buffer[byteIndex + 2];
        byteIndex += 3;
        
        outputArray.push(code[tmp >> 18]);
        outputArray.push(code[(tmp >> 12) & 0x3F]);
        outputArray.push(code[(tmp >> 6) & 0x3F]);
        outputArray.push(code[tmp & 0x3F]);
    }
    
    if(trailingBytesCount === 1)
    {
        tmp = (buffer[byteIndex] << 16);
        
        outputArray.push(code[tmp >> 18]);
        outputArray.push(code[(tmp >> 12) & 0x3F]);
        outputArray.push('=');
        outputArray.push('=');
    }
    else
    {
        tmp = (buffer[byteIndex] << 16) + (buffer[byteIndex + 1] << 8);
        
        outputArray.push(code[tmp >> 18]);
        outputArray.push(code[(tmp >> 12) & 0x3F]);
        outputArray.push(code[(tmp >> 6) & 0x3F]);
        outputArray.push('=');
    }
    
    return outputArray.join('');
}

function base64ToBin(b64)
{
    var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    
    var lookup = {};
    
    for(var i = 0; i < 64; ++i)
    {
        lookup[code[i]] = i;
    }
    
    lookup['='] = 0;
    
        //
        
    var length = b64.length;
    
    if(length % 4 !== 0)
    {
        length -= (length % 4);
    }
    
    var tripletsCount = length / 4;
    var bufferLength = tripletsCount * 3;
    
    if(b64[length - 1] === '=')
    {
        if(b64[length - 2] === '=')
        {
            // trailing bytes count is 1
            bufferLength -= 2;
        }
        else
        {
            // trailing bytes count is 2
            bufferLength -= 1;
        }
    }
        //
    
    var outputBuffer = new Uint8Array(bufferLength);
        
    var strIndex = 0;
    
    var outputIndex = 0;
    
    var c1, c2, c3, c4;
        
    for(var i = 0; i < tripletsCount - 1; ++i)
    {
        c1 = b64[strIndex];
        c2 = b64[strIndex + 1];
        c3 = b64[strIndex + 2];
        c4 = b64[strIndex + 3];
        
        strIndex += 4;
        
        var tmp = (lookup[c1] << 18) + (lookup[c2] << 12) + (lookup[c3] << 6) + lookup[c4];
        
        outputBuffer[outputIndex++] = (tmp >> 16);
        outputBuffer[outputIndex++] = ((tmp >> 8) & 0xFF);    
        outputBuffer[outputIndex++] = (tmp & 0xFF);
    }

    c1 = b64[strIndex];
    c2 = b64[strIndex + 1];
    c3 = b64[strIndex + 2];
    c4 = b64[strIndex + 3];

    var tmp = (lookup[c1] << 18) + (lookup[c2] << 12) + (lookup[c3] << 6) + lookup[c4];
    
    outputBuffer[outputIndex++] = (tmp >> 16);
    
    if(outputIndex < bufferLength)
    {
        outputBuffer[outputIndex++] = ((tmp >> 8) & 0xFF);    
    }
    
    if(outputIndex < bufferLength)
    {
        outputBuffer[outputIndex++] = (tmp & 0xFF);
    }
    
    return outputBuffer;
}

//------------------------------------------------------------------------------
