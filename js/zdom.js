ZDOM = {
    // This file will isolate all of the functions which touch the DOM
    // The idea here is that if I wanted to switch from jquery to something else
    // I'd only have to mess with this file.
    'init_body':function(){
        //TODO stop breaking back button
        //maybe something like
        //location.hash = "game";
        //and somthing like
        //window.onhashchange = something clever
        $("body").empty();
        $("body").append('<div class = "screen"></div>');
        $("body").append('<div class = "error"></div>');
        $(".error").css("color","red");
    }
    ,
    'clear_screen':function(){
	$(".screen").empty();
    }
    ,
    'set_screen_size':function(width,height){
	$(".screen").width(width).height(height);
    }
    ,
    'get_body_size':function(){
	var body_width = $("body").width();
	var body_height = $("body").height();
	return {'width': body_width,
                'height': body_height};
    }
    ,
    'get_monospace_size':function(){
	$(".screen").append('<div class="mono" style="font-family:monospace"><span>&nbsp;</span></div>');
	var mono_width = $(".screen > .mono > span").width();
	var mono_height = $(".screen > .mono > span").height();
	$(".screen > .mono").remove();

	return {'width': mono_width,
		'height': mono_height};
    }
    ,
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