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
    'add_lower_window':function(){
	$(".screen").append('<div class="lower" style="overflow:hidden" ></div>');
    }
    ,
    'clear_lower_window':function(background_color){
	var cursor = '<span class="cursor" style="background-color:'+background_color+';font-family:monospace" >&nbsp;</span>';
	$(".lower").empty().css("background-color",background_color).append(cursor);
    }
    ,
    'set_lower_height':function(h){
	$(".screen > .lower").height(h);
    }
    ,
    'add_upper_window':function(){
	$(".screen").append('<div class="upper" style="font-family:monospace"></div>');
    }
    ,
    'clear_upper_window':function(){
	$(".screen > .upper").empty();
    }
    ,
    'remove_upper_line':function(){
	$(".upper > div:last").remove();
    }
    ,
    'add_upper_line':function(width,background_color){
	var blank_line = "";
	var space = '<span style="background-color:'+background_color+'">&nbsp;</span>';
	var w = width;
	while (w > 0) {
	    blank_line += space;
	    w--;
	}
	$(".screen > .upper").append("<div>" + blank_line + "</div>");
    }
    ,
    'erase_upper_line':function(x,y,background_color){
	var selector;
	if (x > 0) {
	    //blank to the end line the line                                                                                                                                
	    selector = ".upper > div:eq(" + y + ") > span:gt("+ x - 1 + ")";
	} else {
	    //blank the entire line                                                                                                                                         
	    selector = ".upper > div:eq(" + y + ") > span";
	}
	var w = $(selector).length;
	$(selector).remove();
	var blank_line = "";
	var space = '<span style="background-color:'+background_color+'">&nbsp;</span>';
	while (w > 0) {
	    blank_line += space;
	    w--;
	}
	var div_selector = ".upper > div:eq(" + y + ")";
	$(div_selector).append(blank_line);
    }
    ,
    'toggle_upper_cursor':function(x,y,background_color){
	var selector = ".upper > div:eq(" + y + ") > span:eq("+ x + ")";
	var old_color = $(selector).css("background-color");
	$(selector).css("background-color",background_color);
	return old_color;
    }
    ,
    'add_status_line':function(){
	$(".screen").append('<div class="status" style="font-family:monospace;background-color:black;color:white">' +
                                '<span style="float:left">&nbsp;</span>'+
                                '<span class="room" style="float:left"></span>'+
                                '<span>&nbsp;</span>'+
                                '<span style="float:right">&nbsp;</span>'+
                                '<span class="score" style="float:right"></span>' +
			    '</div>');
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