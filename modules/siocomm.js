//------------------------------------------------------------------------------
var socketIo = require('socket.io');
//------------------------------------------------------------------------------

function implCreateSioCommunicator(server, channel, commandsRegistry)
{
    var sio = socketIo(server);
    
    sio.on('connect', socket => 
    {
        socket.on(channel, message => 
        {
            if(message.command)
            {
                var commandHandler = commandsRegistry[message.command.toUpperCase()];
                
                if(commandHandler)
                {
                    commandHandler(message.args, message.reason, socket);
                }
            }
        });
    });
}

exports.init = implCreateSioCommunicator;

//------------------------------------------------------------------------------