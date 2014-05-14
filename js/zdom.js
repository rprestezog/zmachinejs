ZDOM = {
    // This file will isolate all of the functions which touch the DOM
    // The idea here is that if I wanted to switch from jquery to something else
    // I'd only have to mess with this file.
    'clear_errors':function(){
	$(".error").empty()
    }
    ,
    'log_error':function(text){
        $(".error").append("<div>" + text + "</div>");
    }
};