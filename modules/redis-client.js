//------------------------------------------------------------------------------
var redis = require('redis');
//------------------------------------------------------------------------------

var atomicIncrementAndExpireScript = 
        "do local v = redis.call('incr',KEYS[1]); if v == 1 then redis.call('expire', KEYS[1], ARGV[1]) end; return v; end";

var atomicIncrementAndExpireScriptSHA;

//------------------------------------------------------------------------------

function implSendCommand(command, args)
{
    var entry = this;

    if(command.toUpperCase() === 'AINCEX')
    {
        return entry.atomicInrementAndExpire(args[0], args[1]);
    }
    
    return new Promise((resolve, reject) => 
    {
        entry.redisDriver.send_command(command, args, (err, reply) => 
        {
            if(err)
            {
                reject(err);
            }
            else
            {
                resolve(reply);
            }
        });    
    });
}

//------------------------------------------------------------------------------

function implAtomicInrementAndExpire(key, expireSeconds)
{
    return this.sendCommand('evalsha', [atomicIncrementAndExpireScriptSHA, 1, key, expireSeconds]);    
}

//------------------------------------------------------------------------------

function implCreateRedisClient(url, password, onError)
{
    var entry = 
    {
        redisDriver: redis.createClient(url)
    };
    
    entry.redisDriver.on('error', onError);
    
    entry.sendCommand = implSendCommand.bind(entry);
    entry.atomicInrementAndExpire = implAtomicInrementAndExpire.bind(entry);
    
    return new Promise((resolve, reject) => 
    {
        entry.redisDriver.auth(password, (err, reply) => 
        {
            if(err)
            {
                reject(err);
            }
            else
            {
                entry.redisDriver.send_command('script', ['load', atomicIncrementAndExpireScript], (scriptErr, scriptReply) => 
                {
                    if(scriptErr)
                    {
                        reject(scriptErr);
                    }
                    else
                    {
                        atomicIncrementAndExpireScriptSHA = scriptReply;
                        
                        resolve(entry);
                    }
                }); // end script load
            }
        }); // end auth
    });
}

exports.init = implCreateRedisClient;

//------------------------------------------------------------------------------