ZDOM = {
    // This file will isolate all of the functions which touch the DOM
    // The idea here is that if I wanted to switch from jquery to something else
    // I'd only have to mess with this file.
    // TODO 1.0 expose the zmachine version number to the reader somehow, as suggested in the preamble
    'mono_width':null
    ,
    'mono_height':null
    ,
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
	ZDOM.init_monospace_size();
    }
    ,
    'clear_screen':function(){
	$(".screen").empty();
    }
    ,
    'set_screen_size':function(width,height){
	$(".screen").width(width*ZDOM.mono_width).height(height*ZDOM.mono_height);
    }
    ,
    'get_body_size':function(){
	var body_width = Math.floor($("body").width() / ZDOM.mono_width);
	var body_height = Math.floor($("body").height() / ZDOM.mono_height);
	return {'width': body_width,
                'height': body_height};
    }
    ,
    'init_monospace_size':function(){
	$(".screen").append('<div class="mono" style="font-family:monospace"><span>&nbsp;</span></div>');
	var mono_width = $(".screen > .mono > span").width();
	var mono_height = $(".screen > .mono > span").height();
	$(".screen > .mono").remove();
	ZDOM.mono_width = mono_width;
	ZDOM.mono_height = mono_height;
    }
    ,
    'add_lower_window':function(){
	$(".screen").append('<div class="lower" style="overflow:hidden" ></div>');
    }
    ,
    'set_lower_height':function(lines){
	$(".screen > .lower").height(lines*ZDOM.mono_height);
    }
    ,
    'scroll_lower_lines': function(lines) {
        amount = lines*ZDOM.mono_height;
	ZDOM.scroll_lower_window(amount);
    }
    ,
    'scroll_lower_window': function(amount) {
        var pos;
        if ($(".lower").prop) {
            if (amount > $(".lower").prop('scrollTop') && amount > 0) {
                $(".lower").prop('scrollTop', 0);
            }
            pos = $(".lower").prop('scrollTop');
            $(".lower").prop('scrollTop', pos + amount);
        } else {
            if (amount > $(".lower").attr('scrollTop') && amount > 0) {
                $(".lower").attr('scrollTop', 0);
            }
            pos = $(".lower").attr('scrollTop');
            $(".lower").attr('scrollTop', pos + amount);
        }
    }
    ,
    'scroll_to_bottom':function() {
        var scrollHeight = $(".lower").prop ? $(".lower").prop('scrollHeight') : $(".lower").attr('scrollHeight');
        $(".lower").scrollTop(scrollHeight);
    }
    ,
    'page_up':function() {
        var h = $(".lower").height();
        ZDOM.scroll_lower_window(-h);
    }
    ,
    'page_down':function() {
        var h = $(".lower").height();
        ZDOM.scroll_lower_window(h);
    }
    ,
    'clear_lower_window':function(background_color){
	var cursor = '<span class="cursor" style="background-color:'+background_color+';font-family:monospace" >&nbsp;</span>';
	$(".lower").empty().css("background-color",background_color).append(cursor);
    }
    ,
    'show_lower_cursor':function(background_color){
	$(".screen > .lower > .cursor").css("background-color",background_color);
    }
    ,
    'hide_lower_cursor':function(){
	var background_color = $(".screen > .lower").css("background-color");
	$(".screen > .lower > .cursor").css("background-color",background_color);
    }
    ,
    'print_lower_string':function(string,style){
	$("<span></span>").text(string).css(style).insertBefore(".lower > .cursor");
    }
    ,
    'print_lower_space':function(style){
	$("<span>&nbsp;</span>").css(style).insertBefore(".lower > .cursor");
    }
    ,
    'lower_backspace':function(){
	$(".lower > .cursor").prev().remove();
    }
    ,
    'print_lower_img':function(URI,background_color){
	//TODO should we be using monospace width and height here?
	var img = '<img src="' +URI+ '" style="vertical-align:top;width:' + ZDOM.mono_width + ';height:' + ZDOM.mono_height + '" />';
	$("<span></span>").css('background-color',background_color).html(img).insertBefore(".lower > .cursor");
    }
    ,
    'print_lower_newline':function(){
	$("<br/>").insertBefore(".lower > .cursor");
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
    'set_upper_char':function(x,y,character,style){
	var selector = ".upper > div:eq(" + y + ") > span:eq("+ x + ")";
	$(selector).text(character).css(style);
    }
    ,
    'set_upper_space':function(x,y,style){
	var selector = ".upper > div:eq(" + y + ") > span:eq("+ x + ")";
	$(selector).html('&nbsp;').css(style);
    }
    ,
    'set_upper_img':function(x,y,URI,background_color){
	var img = '<img src="' +URI+ '" style="vertical-align:top;width:' + ZDOM.mono_width + ';height:' + ZDOM.mono_height + '" />';
	var selector = ".upper > div:eq(" + y + ") > span:eq("+ x + ")";
	$(selector).css('background-color',background_color).html(img);
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
    'print_room_name':function(room_name){
        $(".status > .room").text(room_name);
    }
    ,
    'print_score':function(score){
        $(".status > .score").text(score);
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