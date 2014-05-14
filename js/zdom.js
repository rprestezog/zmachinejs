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
    ,
    'keydown_handler':function(){
	return true;
    }
    ,
    'keypress_handler':function(){
	return true;
    }
    ,
    'set_keydown_handler':function(keydown_callback){
	old_handler = ZDOM.keydown_handler;
	ZDOM.keydown_handler = function(e){
	    return keydown_callback(e.which);
	}
	$(document).unbind('keydown', old_handler).keydown(ZDOM.keydown_handler);
    }
    ,
    'set_keypress_handler':function(keypress_callback){
	old_handler = ZDOM.keypress_handler;
	ZDOM.keypress_handler = function(e){
	    return keypress_callback(e.which);
	}
	$(document).unbind('keypress', old_handler).keypress(ZDOM.keypress_handler);
    }
    ,
    'set_storyfile_loader':function(callback){
	$('a.story').click(function(e) {
		callback( $(this).attr("href") );
		e.preventDefault();
	    });
    }

};