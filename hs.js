//------------------------------------------------------------------------------

var exapp = require('express')();

var http = require('http');
var server = http.createServer(exapp);

var favicon = require('serve-favicon');

//------------------------------------------------------------------------------

var asyncrw = require('./modules/asyncrw.js');

const channel = 'message';

var commands = require('./modules/commands.js');
var siocomm = require('./modules/siocomm.js');

const redisUrl = '//redis-12559.c10.us-east-1-2.ec2.cloud.redislabs.com:12559';
const redisToken = '123456';

var redisClient;

var redis = require('./modules/redis-client.js');

const yadToken = 'AQAAAAAM8pOsAAOMAee8rd1rxUI2sfd1UoI-k7k';

var yad = require('./modules/yad.js').init(yadToken);

//------------------------------------------------------------------------------

var cachedFiles = 
{
    'jqgzip':       {mode: 'bin',   path: './jquery/jquery.js.gz'},
    'jqnogzip':     {mode: 'text',  path: './jquery/jquery.js'},
    'cookiegzip':   {mode: 'bin',   path: './jscookie/js.cookie.min.js.gz'},
    'cookienogzip': {mode: 'text',  path: './jscookie/js.cookie.min.js'},
    'nggzip':       {mode: 'bin',   path: './angular/angular.min.js.gz'},
    'ngnogzip':     {mode: 'text',  path: './angular/angular.min.js'},
    'ngsangzip':    {mode: 'bin',   path: './angular/angular-sanitize.min.js.gz'},
    'ngsanogzip':   {mode: 'text',  path: './angular/angular-sanitize.min.js'},
    'miscript':     {mode: 'text',  path: './scripts/master-injection.js'},
    'cliapis':      {mode: 'text',  path: './scripts/client-api.js'},
    'stationg':     {mode: 'text',  path : './scripts/station-ng.js'},
    'taskng':       {mode: 'text',  path : './scripts/task-ng.js'},
    'pagestart':    {mode: 'text',  path : './pages-elements/pagestart'},
    'pagestationg': {mode: 'text',  path : './pages-elements/page-station-ng.html'},
    'pagemi':       {mode: 'text',  path : './pages-elements/page-mi.html'},
    'pagetaskng':   {mode: 'text',  path : './pages-elements/page-task-ng.html'},
    'pagend1':      {mode: 'text',  path : './pages-elements/pagend-1'},
    'pagend2':      {mode: 'text',  path : './pages-elements/pagend-2'},
    'pagendnosio':  {mode: 'text',  path : './pages-elements/pagend-nosio'},
    'pagendngbs':   {mode: 'text',  path : './pages-elements/pagend-ngbs'},
    'bscssgzip':    {mode: 'bin',   path : './bootstrap/css/bootstrap.min.css.gz'},
    'bscssnogzip':  {mode: 'text',  path : './bootstrap/css/bootstrap.min.css'},
    'bsjsgzip':     {mode: 'bin',   path : './bootstrap/js/bootstrap.min.js.gz'},
    'bsjsnogzip':   {mode: 'text',  path : './bootstrap/js/bootstrap.min.js'},
    'bsfontwoff2':  {mode: 'bin',   path : './bootstrap/fonts/glyphicons-halflings-regular.woff2'},
    'bsfontwoff':   {mode: 'bin',   path : './bootstrap/fonts/glyphicons-halflings-regular.woff'},
    'bsfonttf':     {mode: 'bin',   path : './bootstrap/fonts/glyphicons-halflings-regular.ttf'},
    'bsfontsvgzip': {mode: 'bin',   path : './bootstrap/fonts/glyphicons-halflings-regular.svg.gz'},
    'bsfontsvg':    {mode: 'text',  path : './bootstrap/fonts/glyphicons-halflings-regular.svg'},
    'bsfonteot':    {mode: 'bin',   path : './bootstrap/fonts/glyphicons-halflings-regular.eot'}
};

var totalCachedSize = 0;

//------------------------------------------------------------------------------

const htmlType  = 'text/html';
const textType  = 'text/plain';
const cssType   = 'text/css';
const jsonType  = 'application/json';
const woffType  = 'application/font-woff';
const woff2Type = 'font/woff2';
const eotType   = 'application/vnd.ms-fontobject';
const ttfType   = 'application/font-sfnt';
const svgType   = 'image/svg+xml';

const ctHtml    = {'Content-Type': htmlType};
const ctText    = {'Content-Type': textType};
const ctTextGz  = {'Content-Type': textType, 'Content-Encoding': 'gzip'};
const ctCss     = {'Content-Type': cssType};
const ctCssGz   = {'Content-Type': cssType, 'Content-Encoding': 'gzip'};
const ctJson    = {'Content-Type': jsonType};
const ctWoff    = {'Content-Type': woffType};
const ctWoff2   = {'Content-Type': woff2Type};
const ctEot     = {'Content-Type': eotType};
const ctTtf     = {'Content-Type': ttfType};
const ctSvg     = {'Content-Type': svgType};
const ctSvgGz   = {'Content-Type': svgType, 'Content-Encoding': 'gzip'};

//------------------------------------------------------------------------------

var staticMap = 
{
    'jqmap':
    {
        'gz': {contentType: ctTextGz, contentId: 'jqgzip'}, 
        'nogzip': {contentType: ctText, contentId: 'jqnogzip'}
    },
    'jscookiemap':
    {
        'gz': {contentType: ctTextGz, contentId: 'cookiegzip'}, 
        'nogzip': {contentType: ctText, contentId: 'cookienogzip'}
    },
    'ngmap':
    {
        'gz': {contentType: ctTextGz, contentId: 'nggzip'},
        'nogzip': {contentType: ctText, contentId: 'ngnogzip'}
    },
    'ngsanmap':
    {
        'gz': {contentType: ctTextGz, contentId: 'ngsangzip'},
        'nogzip': {contentType: ctText, contentId: 'ngsanogzip'}
    },
    'bscssmap':
    {
        'gz': {contentType: ctCssGz, contentId: 'bscssgzip'}, 
        'nogzip': {contentType: ctCss, contentId: 'bscssnogzip'}
    },
    'bsjsmap':
    {
        'gz': {contentType: ctTextGz, contentId: 'bsjsgzip'}, 
        'nogzip': {contentType: ctText, contentId: 'bsjsnogzip'}
    },
    'bsfontsvgmap':
    {
        'gz': {contentType: ctSvgGz, contentId: 'bsfontsvgzip'}, 
        'nogzip': {contentType: ctSvg, contentId: 'bsfontsvg'}
    }
};

var staticMap2 = 
{
    'bswoffmap': {contentType: ctWoff, contentId: 'bsfontwoff'}, 
    'bswoff2map': {contentType: ctWoff2, contentId: 'bsfontwoff2'},
    'bsttfmap': {contentType: ctTtf, contentId: 'bsfonttf'},
    'bseotmap': {contentType: ctEot, contentId: 'bsfonteot'}
};

//------------------------------------------------------------------------------

var composedPages = {};

//------------------------------------------------------------------------------

function serveStatic(req, res)
{
    var entry = req.acceptsEncodings('gzip') ? this['gz'] : this['nogzip'];

    res.set(entry.contentType);
    res.send(cachedFiles[entry.contentId].content);
}

function serveStatic2(req, res)
{
    res.set(this.contentType);
    res.send(cachedFiles[this.contentId].content);
}

//------------------------------------------------------------------------------

function serveComposedPages(req, res)
{
    res.set(ctHtml);
    res.send(composedPages[this.index]);
}

//------------------------------------------------------------------------------

exapp.use(favicon(__dirname + '/images/favicon.ico'));

//------------------------------------------------------------------------------

exapp.get('/jquery.js', serveStatic.bind(staticMap['jqmap']));
exapp.get('/js.cookie.js', serveStatic.bind(staticMap['jscookiemap']));
exapp.get('/angular.js', serveStatic.bind(staticMap['ngmap']));
exapp.get('/angular-sanitize.js', serveStatic.bind(staticMap['ngsanmap']));
exapp.get('/css/bootstrap.min.css', serveStatic.bind(staticMap['bscssmap']));
exapp.get('/js/bootstrap.min.js', serveStatic.bind(staticMap['bsjsmap']));
exapp.get('/fonts/glyphicons-halflings-regular.svg', serveStatic.bind(staticMap['bsfontsvgmap']));

exapp.get('/fonts/glyphicons-halflings-regular.woff2', serveStatic2.bind(staticMap2['bswoff2map']));
exapp.get('/fonts/glyphicons-halflings-regular.woff', serveStatic2.bind(staticMap2['bswoffmap']));
exapp.get('/fonts/glyphicons-halflings-regular.ttf', serveStatic2.bind(staticMap2['bsttfmap']));
exapp.get('/fonts/glyphicons-halflings-regular.eot', serveStatic2.bind(staticMap2['bseotmap']));

//------------------------------------------------------------------------------

exapp.get('/', serveComposedPages.bind({index: 'stationgpagecomp'}));
exapp.get('/mi', serveComposedPages.bind({index: 'mipagecomp'}));
exapp.get('/taskng', serveComposedPages.bind({index: 'taskngpagecomp'}));

//------------------------------------------------------------------------------

exapp.post('/', (req, res) =>
{
    if(req.query.useMi)
    {
        asyncrw.content(req, true)
            .then(postedContent => 
            {
                var pageContent = 
                    cachedFiles['pagestart'].content +
                    cachedFiles['pagend1'].content + 
                    cachedFiles['cliapis'].content + '\n' +
                    postedContent + '\n' +
                    cachedFiles['pagend2'].content;
                
                res.set(ctHtml);
                res.send(pageContent);    
            })
            .catch(err => 
            {
                res.set(ctText);
                res.send(err);    
            });
    }
    else
    {
        res.sendStatus(501);
    }
});

//------------------------------------------------------------------------------

function logErr(err)
{
    console.log(err);
}

//------------------------------------------------------------------------------

var asyncInitializationPhases = 
[
    asyncrw
    .cached(cachedFiles)
    .then(files => 
    {
        var keys = Object.keys(cachedFiles);
        
        files.forEach((content, index) => 
        {
            var entry = cachedFiles[keys[index]];
            entry.content = content;
            
            totalCachedSize += content.length;
            
            console.log('cached ' + entry.path + ' (' + content.length + ' bytes)');
        });
    }),
        
    redis
    .init(redisUrl, redisToken, logErr)
    .then(client => 
    {
        redisClient = client;
        
        console.log('Redis connected OK');
    })
];

Promise.all(asyncInitializationPhases)
.then(() => 
{
    var commandsRegistry = commands.init(channel, redisClient, yad);
    
    siocomm.init(server, channel, commandsRegistry);
    
    composedPages['mipagecomp'] = 
        cachedFiles['pagestart'].content +
        cachedFiles['pagemi'].content +
        cachedFiles['pagendnosio'].content + 
        cachedFiles['miscript'].content + '\n' +
        cachedFiles['pagend2'].content;
    
    totalCachedSize += composedPages['mipagecomp'].length;
    
    composedPages['stationgpagecomp'] = 
        cachedFiles['pagestart'].content +
        cachedFiles['pagestationg'].content +
        cachedFiles['pagendngbs'].content + 
        cachedFiles['cliapis'].content + '\n' +
        cachedFiles['stationg'].content + '\n' +
        cachedFiles['pagend2'].content;

    totalCachedSize += composedPages['stationgpagecomp'].length;
    
    composedPages['taskngpagecomp'] = 
        cachedFiles['pagestart'].content +
        cachedFiles['pagetaskng'].content +
        cachedFiles['pagendngbs'].content + 
        cachedFiles['cliapis'].content + '\n' +
        cachedFiles['taskng'].content + '\n' +
        cachedFiles['pagend2'].content;
    
    totalCachedSize += composedPages['taskngpagecomp'].length;
    
    server.listen(process.env.PORT);
 
    console.log('Total cached and ready to serve: ' + totalCachedSize + ' bytes');
    
    console.log('Server is running');
})
.catch(e => 
{
    logErr(e);
    logErr('Can not start server. Exiting.');
    
    process.exit(-1);
});

//------------------------------------------------------------------------------
