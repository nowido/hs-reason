//------------------------------------------------------------------------------

$(document).ready(function(){
    
    function documentReplace(newContent)
    {
        document.open();
        document.write(newContent);
        document.close();
    }

    $('#buttonRun').click(evt => 
    {
        $.ajax
        ({
            url: location.origin + '/?useMi=true',
            method : 'POST',
            contentType: 'text/plain',
            data: $('#textToUpload').val(),
            processData: false,
            dataType: 'html'
        })
        .done(documentReplace)
        .fail((xhr, status, err) => {documentReplace(err)});
    });
});

//------------------------------------------------------------------------------
