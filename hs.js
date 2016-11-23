//------------------------------------------------------------------------------

var exapp = require('express')();

var http = require('http');
var server = http.createServer(exapp);

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
[
    {mode: 'bin', path: './jquery/jquery.js.gz'},
    {mode: 'text', path: './jquery/jquery.js'},
    {mode: 'text', path: './scripts/master-injection.js'},
    {mode: 'text', path: './scripts/client-api.js'},
    {mode: 'text', path : './scripts/station.js'},
    {mode: 'text', path : './scripts/task.js'},
    {mode: 'text', path : './pages-elements/pagestart'},
    {mode: 'text', path : './pages-elements/page-station.html'},
    {mode: 'text', path : './pages-elements/page-mi.html'},
    {mode: 'text', path : './pages-elements/page-task.html'},
    {mode: 'text', path : './pages-elements/pagend-1'},
    {mode: 'text', path : './pages-elements/pagend-2'},
    {mode: 'text', path : './pages-elements/pagend-nosio'},
    {mode: 'bin', path : './bootstrap/css/bootstrap.min.css.gz'},
    {mode: 'text', path : './bootstrap/css/bootstrap.min.css'},
    {mode: 'bin', path : './bootstrap/js/bootstrap.min.js.gz'},
    {mode: 'text', path : './bootstrap/js/bootstrap.min.js'},
    {mode: 'bin', path : './bootstrap/fonts/glyphicons-halflings-regular.woff2'},
    {mode: 'bin', path : './bootstrap/fonts/glyphicons-halflings-regular.woff'},
    {mode: 'bin', path : './bootstrap/fonts/glyphicons-halflings-regular.ttf'},
    {mode: 'bin', path : './bootstrap/fonts/glyphicons-halflings-regular.svg.gz'},
    {mode: 'text', path : './bootstrap/fonts/glyphicons-halflings-regular.svg'},
    {mode: 'bin', path : './bootstrap/fonts/glyphicons-halflings-regular.eot'},
    {mode: 'text', path : './scripts/vmbuilder-bs.js'}
];

const jqgzip        = 0;
const jqnogzip      = 1;
const miscript      = 2;
const cliapis       = 3;
const station       = 4;
const task          = 5;
const pagestart     = 6;
const pagestation   = 7;
const pagemi        = 8;
const pagetask      = 9;
const pagend1       = 10;
const pagend2       = 11;
const pagendnosio   = 12;
const bscssgzip     = 13;
const bscssnogzip   = 14;
const bsjsgzip      = 15;
const bsjsnogzip    = 16;
const bsfontwoff2   = 17;
const bsfontwoff    = 18;
const bsfonttf      = 19;
const bsfontsvgzip  = 20;
const bsfontsvg     = 21;
const bsfonteot     = 22;
const vmbuilderbs   = 23;

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
[
    {
        'gz': {contentType: ctTextGz, contentId: jqgzip}, 
        'nogzip': {contentType: ctText, contentId: jqnogzip}
    },
    {
        'gz': {contentType: ctCssGz, contentId: bscssgzip}, 
        'nogzip': {contentType: ctCss, contentId: bscssnogzip}
    },
    {
        'gz': {contentType: ctTextGz, contentId: bsjsgzip}, 
        'nogzip': {contentType: ctText, contentId: bsjsnogzip}
    },
    {
        'gz': {contentType: ctSvgGz, contentId: bsfontsvgzip}, 
        'nogzip': {contentType: ctSvg, contentId: bsfontsvg}
    }
];

const jqmap         = 0;
const bscssmap      = 1;
const bsjsmap       = 2;
const bsfontsvgmap  = 3;

var staticMap2 = 
[
    {contentType: ctWoff, contentId: bsfontwoff}, 
    {contentType: ctWoff2, contentId: bsfontwoff2},
    {contentType: ctTtf, contentId: bsfonttf},
    {contentType: ctEot, contentId: bsfonteot}
];

const bswoffmap     = 0;
const bswoff2map    = 1;
const bsttfmap      = 2;
const bseotmap      = 3;

//------------------------------------------------------------------------------

var composedPages = [];

const mipagecomp        = 0;
const stationpagecomp   = 1;
const taskpagecomp      = 2;

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

exapp.get('/jquery.js', serveStatic.bind(staticMap[jqmap]));
exapp.get('/css/bootstrap.min.css', serveStatic.bind(staticMap[bscssmap]));
exapp.get('/js/bootstrap.min.js', serveStatic.bind(staticMap[bsjsmap]));
exapp.get('/fonts/glyphicons-halflings-regular.svg', serveStatic.bind(staticMap[bsfontsvgmap]));

exapp.get('/fonts/glyphicons-halflings-regular.woff2', serveStatic2.bind(staticMap2[bswoff2map]));
exapp.get('/fonts/glyphicons-halflings-regular.woff', serveStatic2.bind(staticMap2[bswoffmap]));
exapp.get('/fonts/glyphicons-halflings-regular.ttf', serveStatic2.bind(staticMap2[bsttfmap]));
exapp.get('/fonts/glyphicons-halflings-regular.eot', serveStatic2.bind(staticMap2[bseotmap]));

//------------------------------------------------------------------------------

exapp.get('/', serveComposedPages.bind({index: stationpagecomp}));
exapp.get('/mi', serveComposedPages.bind({index: mipagecomp}));
exapp.get('/task', serveComposedPages.bind({index: taskpagecomp}));

//------------------------------------------------------------------------------

exapp.post('/', (req, res) =>
{
    if(req.query.useMi)
    {
        asyncrw.content(req, true)
            .then(postedContent => 
            {
                var pageContent = 
                    cachedFiles[pagestart].content +
                    cachedFiles[pagend1].content + 
                    cachedFiles[cliapis].content + '\n' +
                    postedContent + '\n' +
                    cachedFiles[pagend2].content;
                
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
    asyncrw.cached(cachedFiles)
        .then(files => 
        {
            files.forEach((content, index) => 
            {
                var entry = cachedFiles[index];
                entry.content = content;
                
                console.log('cached ' + entry.path + ' (' + content.length + ' bytes)');
            });
        })
        .catch(logErr),
        
    redis.init(redisUrl, redisToken, logErr)
        .then(client => 
        {
            redisClient = client;
            
            console.log('Redis connected OK');
        })
        .catch(logErr)
];

Promise.all(asyncInitializationPhases).then(() => 
{
    var commandsRegistry = commands.init(channel, redisClient, yad);
    
    siocomm.init(server, channel, commandsRegistry);
    
    composedPages[mipagecomp] = 
        cachedFiles[pagestart].content +
        cachedFiles[pagemi].content +
        cachedFiles[pagendnosio].content + 
        cachedFiles[miscript].content + '\n' +
        cachedFiles[pagend2].content;
    
    composedPages[stationpagecomp] = 
        cachedFiles[pagestart].content +
        cachedFiles[pagestation].content +
        cachedFiles[pagend1].content + 
        cachedFiles[cliapis].content + '\n' +
        cachedFiles[station].content + '\n' +
        cachedFiles[pagend2].content;

    composedPages[taskpagecomp] = 
        cachedFiles[pagestart].content +
        cachedFiles[pagetask].content +
        cachedFiles[pagend1].content + 
        cachedFiles[cliapis].content + '\n' +
        cachedFiles[vmbuilderbs].content + '\n' +
        cachedFiles[task].content + '\n' +
        cachedFiles[pagend2].content;
    
    server.listen(process.env.PORT);
    
    console.log('Server is running');
});

//------------------------------------------------------------------------------
