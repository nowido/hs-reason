//------------------------------------------------------------------------------

function implCreateCommandsRegistry(channel, redis, yad)
{
    var registry =
    {
        'PING' : (args, reason, socket) =>
        {
            socket.emit(channel, {reason: reason, answer: 'PONG'});    
        },
        'REDIS' : (args, reason, socket) =>
        {
            redis.sendCommand(args[0], args.slice(1))
            .then(reply => 
            {
                socket.emit(channel, {reason: reason, answer: reply});    
            })
            .catch(err => 
            {
                socket.emit(channel, {reason: reason, error: err});
            });
        },
        'YAD' : (args, reason, socket) => 
        {
            yad.executeCommand(args)
            .then(reply => 
            {
                socket.emit(channel, {reason: reason, answer: reply});    
            })
            .catch(err => 
            {
                socket.emit(channel, {reason: reason, error: err});
            });
        }
    };
    
    return registry;
}

exports.init = implCreateCommandsRegistry;

//------------------------------------------------------------------------------
