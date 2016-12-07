//------------------------------------------------------------------------------

function MainController($scope)
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

    var shadowRemember = vm.rememberUserId;
    
    vm.rememberUserIdHint = 'remember me';
    vm.rememberAriaLabel = vm.rememberUserId;
    
    vm.userHint = 'Your username will be stored in ' +
                    '<code>&quot;processedBy&quot;</code>' +
                        ' field for any results computed by our scripts running on your resources.';
                        
    vm.passwordHint = 'No password required for computational nodes';
    
    vm.onUserIdChange = function()
    {
        if(shadowRemember)
        {
                // forget, if the [changed] name was remembered
            
            Cookies.remove('userId');    
            
            vm.rememberUserId = false; 
            shadowRemember = false;
        }
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
        .controller('MainController',     
        [
            '$scope', 
            MainController
        ]);

    angular.bootstrap($('#mainContainer')[0], ['computeStation']);
    
    $('#mainRow').toggleClass('collapse', false);
    // $('#statusBlock').css('display', 'block');    
});

//------------------------------------------------------------------------------
