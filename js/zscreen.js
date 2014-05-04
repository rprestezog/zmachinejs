ZScreen = {
    'width':null
    ,
    'height':null
    ,
    'mono_width':null
    ,
    'mono_height':null
    ,
    'window':null
    ,
    'style':null
    ,
    'foreground':null
    ,
    'background':null
    ,
    'upper_cursor':null
    ,
    'font':null
    ,
    'init_screen':function(){
	$(".screen").empty();
	var body_width = $("body").width();
	var body_height = $("body").height();
	$(".screen").append('<div class="mono" style="font-family:monospace"><span>&nbsp;</span></div>');
	var mono_width = $(".screen > .mono > span").width();
	var mono_height = $(".screen > .mono > span").height();
	ZScreen.mono_width = mono_width;
	ZScreen.mono_height = mono_height;
	$(".screen").append('<div class="serif" style="font-family:serif"><span>&nbsp;</span></div>');
	var serif_width = $(".screen > .serif > span").width();
	var serif_height = $(".screen > .serif > span").height();
	//pick a screen width (in monospace characters)
	var max_width = Math.floor(body_width / mono_width);
	var max_height = Math.floor(body_height / mono_height);
	if (max_width < 60 || max_height < 15) {
	    ZScreen.width = 60;
	    ZScreen.height = 15;
	} else if (max_width >= 256 && max_height >= 64) {
	    ZScreen.width = 252;
	    ZScreen.height = 63;
	} else if (max_height*4 < max_width) {
	    ZScreen.width = max_height*4;
	    ZScreen.height = max_height;
	} else {
	    ZScreen.width = Math.floor(max_width/4)*4;
	    ZScreen.height = Math.floor(max_width/4);
	}
	ZScreen.style = 0;
	ZScreen.font = 1;
	//now start for real
       	$(".screen").empty().width(ZScreen.width*mono_width).height(ZScreen.height*mono_height);
	ZHeader.set_screen_size(ZScreen.width,ZScreen.height);
	ZScreen.set_colour(1,1);
	//The header sets default text to black on white. Should this be done here?
	var ver = ZHeader.version();
	if (ver <= 3) {
	    $(".screen").append('<div class="status" style="font-family:monospace;background-color:black;color:white">' +
				'<span style="float:left">&nbsp;</span>'+
				'<span class="room" style="float:left"></span>'+
				'<span style="float:right">&nbsp;</span>'+
				'<span class="score" style="float:right"></span>' +
				'<span>&nbsp;</span>'+
				'</div></div>');
	}
	if (ver >= 3) {
	    $(".screen").append('<div class="upper" style="font-family:monospace"></div>');
	}
	//TODO figure out how to prevent room and score collisions
	$(".screen").append('<div class="lower" style="overflow:hidden" ></div>');
	
	ZScreen.erase_window(-1);
    }
    ,
    'resize_lower_window':function(){
	var status_line = $(".screen > .status").length;
	var upper_lines = $(".screen > .upper > div").length;
	var lines_left = ZScreen.height - status_line - upper_lines;
	if (lines_left > 0) {
	    $(".lower").height(lines_left * ZScreen.mono_height);	    
	} else {
	    $(".lower").height(0);
	}
    }
    ,
    'erase_window':function(window){
	if (window == -1) {
	    $(".upper").empty().css("background-color",ZScreen.background);
	    $(".lower").empty().css("background-color",ZScreen.background).append('<span class="cursor" '+
			'style="background-color:'+ZScreen.background+';font-family:monospace" >&nbsp;</span>');
	    ZScreen.window = 'lower';
	    ZScreen.upper_cursor = {x:0,y:0,old_color:null,shown:false};
	    ZScreen.resize_lower_window();
	} else if (window == 0) {
	    $(".lower").empty().css("background-color",ZScreen.background).append('<span class="cursor" '+
			'style="background-color:'+ZScreen.background+';font-family:monospace" >&nbsp;</span>');
	    ZScreen.resize_lower_window();
	    //TODO move cursor to bottom left for version 4
	} else if (window == 1) {
	    ZScreen.hide_cursor();
	    var blank_line = "";
	    var w = ZScreen.width;
	    while (w > 0) {
		blank_line += "<span>&nbsp;</span>";
		w--;
	    }
	    $(".upper").css("background-color",ZScreen.background);
	    $(".upper > div").html( blank_line );
	} else {
	    ZError.die("TODO: erase_window" + window);
	}
    }
    ,
    'erase_line':function(){
	if (ZScreen.window == 'upper') {
	    ZScreen.hide_cursor();
	    var selector;
	    var w;
	    if (ZScreen.upper_cursor.x > 0) {
		//blank to the end line the line
		selector = ".upper > div:eq(" + ZScreen.upper_cursor.y + ") > span:gt("+ ZScreen.upper_cursor.x - 1 + ")";
		w = ZScreen.width - ZScreen.upper_cursor.x;
	    } else {
		//blank the entire line
		selector = ".upper > div:eq(" + ZScreen.upper_cursor.y + ") > span";
		w = ZScreen.width;
	    }
	    $(selector).remove();
	    var blank_line = "";
	    while (w > 0) {
		blank_line += "<span>&nbsp;</span>";
		w--;
	    }
	    var div_selector = ".upper > div:eq(" + ZScreen.upper_cursor.y + ")";
	    $(div_selector).append(blank_line);
	}
    }
    ,
    'set_window':function(window){
	ZScreen.hide_cursor();
	if (window == 0) {
	    ZScreen.window = 'lower';
	} else if (window == 1) {
	    ZScreen.window = 'upper';
	    ZScreen.upper_cursor = {x:0,y:0,old_color:null,shown:false};
	} else {
	    ZError.die("set_window: " + window);
	}
    }
    ,
    'split_window':function(lines){
	ZScreen.hide_cursor();
	if (lines == 0) {
	    $(".upper").empty();
	    ZScreen.window = 'lower';
	} else {
	    var ver = ZHeader.version();
	    if (ver == 3) {
		$(".upper").empty();
	    }
	    var n = $(".upper > div").length;
	    while (n < lines) {
		//TODO fixed width whole line of nbsp's or to take from the lower window?
		var blank_line = "";
		var w = ZScreen.width;
		while (w > 0) {
		    blank_line += "<span>&nbsp;</span>";
		    w--;
		}
		$(".upper").append("<div>" + blank_line + "</div>");
		n++;
	    }
	    while (n > lines) {
		$(".upper > div:last").remove();
		n--;
	    }
	    if (ZScreen.upper_cursor.y >= lines) {
		ZScreen.upper_cursor = {x:0,y:0,old_color:null,shown:false};
	    }
	    var n2 = $(".upper > div").length;
	}
	ZScreen.resize_lower_window();
    }
    ,
    'set_colour':function(foreground,background) {
	if (foreground == 1) {
	    ZScreen.foreground = 'black';
	} else if (foreground == 2) {
	    ZScreen.foreground = 'black';
	} else if (foreground == 3) {
	    ZScreen.foreground = 'red';
	} else if (foreground == 4) {
	    ZScreen.foreground = 'green';
	} else if (foreground == 5) {
	    ZScreen.foreground = 'yellow';
	} else if (foreground == 6) {
	    ZScreen.foreground = 'blue';
	} else if (foreground == 7) {
	    ZScreen.foreground = 'magenta';
	} else if (foreground == 8) {
	    ZScreen.foreground = 'cyan';
	} else if (foreground == 9) {
	    ZScreen.foreground = 'white';
	}
	if (background == 1) {
	    ZScreen.background = 'white';
	} else if (background == 2) {
	    ZScreen.background = 'black';
	} else if (background == 3) {
	    ZScreen.background = 'red';
	} else if (background == 4) {
	    ZScreen.background = 'green';
	} else if (background == 5) {
	    ZScreen.background = 'yellow';
	} else if (background == 6) {
	    ZScreen.background = 'blue';
	} else if (background == 7) {
	    ZScreen.background = 'magenta';
	} else if (background == 8) {
	    ZScreen.background = 'cyan';
	} else if (background == 9) {
	    ZScreen.background = 'white';
	}
    }
    ,
    'set_text_style':function(style){
	//Sets the text style to: Roman (if 0), Reverse Video (if 1), Bold (if 2), Italic (4), Fixed Pitch (8). In some interpreters (though this is not required) a combination of styles is possible (such as reverse video and bold). In these, changing to Roman should turn off all the other styles currently set. 
	if (style == 0) {
	    ZScreen.style = 0;
	} else {
	    ZScreen.style |= style;
	}
    }
    ,
    'get_style':function(){
	var style = {};
	if ((ZScreen.style & 1) == 1) {
	    style["background-color"] = ZScreen.foreground;
	    style["color"] = ZScreen.background;
	} else {
	    style["background-color"] = ZScreen.background;
	    style["color"] = ZScreen.foreground;
	}
	if ((ZScreen.style & 2) == 2) {
	    style["font-weight"] = "bold";
	} else {
	    style["font-weight"] = "normal";
	}
	if ((ZScreen.style & 4) == 4) {
	    style["font-style"] = "italic";
	} else {
	    style["font-style"] = "normal";
	}
	if (ZScreen.window == 'upper') {
	    style["font-family"] = "monospace";
	} else if (ZHeader.must_fix_pitch()) {
	    style["font-family"] = "monospace";
	} else if (ZScreen.cur_font == 4) {
	    style["font-family"] = "monospace";
	} else if ((ZScreen.style & 8) == 8) {
	    style["font-family"] = "monospace";
	} else {
	    style["font-family"] = "serif";
	}
	return style;
    }
    ,
    'set_font':function(font) {
	if (font == 1) {
	    var prev_font = ZScreen.font;
	    ZScreen.font = font;
	    return prev_font;
	} else if (font == 3) {
	    var prev_font = ZScreen.font;
	    ZScreen.font = font;
	    return prev_font;
	} else if (font == 4) {
	    var prev_font = ZScreen.font;
	    ZScreen.font = font;
	    return prev_font;
	} else {
	    return 0;
	}
    }
    ,
    'set_cursor':function(line,column){
	if (ZScreen.window == 'upper') {
	    ZScreen.hide_cursor();
	    ZScreen.upper_cursor.x = column - 1;
	    ZScreen.upper_cursor.y = line - 1;
	}
	//TODO figure out what to do in lower window
    }
    ,
    'get_cursor_row':function(){
	if (ZScreen.window == 'upper') {
	    return ZScreen.upper_cursor.y + 1;
	} else {
	    ZError.log('TODO get_cursor_row lower window');
	    return ZScreen.height;
	}
    }
    ,
    'get_cursor_col':function(){
	if (ZScreen.window == 'upper') {
	    return ZScreen.upper_cursor.x + 1;
	} else {
	    ZError.log('TODO get_cursor_col lower window');
	    return 1;
	}
    }
    ,
    'show_cursor':function(line,column){
	ZScreen.hide_cursor();
	if (ZScreen.window == 'upper') {
	    var selector = ".upper > div:eq(" + ZScreen.upper_cursor.y + ") > span:eq("+ ZScreen.upper_cursor.x + ")";
	    ZScreen.upper_cursor.old_color = $(selector).css("background-color");
	    $(selector).css("background-color","#D3D3D3");
	    ZScreen.upper_cursor.shown = true;
	} else {
	    $(".lower > .cursor").css("background-color","#D3D3D3");
	}
    }
    ,
    'hide_cursor':function(line,column){
	if (ZScreen.upper_cursor.shown) {
	    var selector = ".upper > div:eq(" + ZScreen.upper_cursor.y + ") > span:eq("+ ZScreen.upper_cursor.x + ")";
	    $(selector).css("background-color",ZScreen.upper_cursor.old_color);
	    ZScreen.upper_cursor.shown = false;
	}
	$(".lower > .cursor").css("background-color","white");
    }
    ,
    'print_string':function(string){
	ZScreen.hide_cursor();
	var style = ZScreen.get_style();
	if (ZScreen.window == 'upper') {
	    var i = 0;
	    while (i < string.length) {
		character = string.charAt(i);
		i++;
		var selector = ".upper > div:eq(" + ZScreen.upper_cursor.y + ") > span:eq("+ ZScreen.upper_cursor.x + ")";
		if ((ZScreen.font) == 3 && (character.charCodeAt(0) >= 32) && (character.charCodeAt(0) <= 126)) {
		    var img = ZGIF.get_font_3_img(character.charCodeAt(0),
						  ZScreen.mono_width,ZScreen.mono_height,
						  style['background-color'],style['color']);
		    $(selector).html(img);
		    if ( ZScreen.upper_cursor.x + 1 < ZScreen.width ) {
			ZScreen.upper_cursor.x++;
		    }
		} else if (character == ' ') {
		    $(selector).html("&nbsp;").css(style);
		    if ( ZScreen.upper_cursor.x + 1 < ZScreen.width ) {
			ZScreen.upper_cursor.x++;
		    }
		} else if (character == '\n') {
		    if ( ZScreen.upper_cursor.y + 1 < $(".upper > div").length) {
			ZScreen.upper_cursor.x = 0;
			ZScreen.upper_cursor.y++;
		    }
		} else if (character == '\t') {
		    ZError.die("print_char tab to upper window");
		} else {
		    $(selector).text(character).css(style);
		    if ( ZScreen.upper_cursor.x + 1 < ZScreen.width ) {
			ZScreen.upper_cursor.x++;
		    }
		}
	    }
	} else if (string.length == 1) {
	    if ((ZScreen.font) == 3 && (string.charCodeAt(0) >= 32) && (string.charCodeAt(0) <= 126)) {
		var img = ZGIF.get_font_3_img(string.charCodeAt(0),
					      ZScreen.mono_width,ZScreen.mono_height,
					      style['background-color'],style['color']);
		$("<span></span>").html(img).insertBefore(".lower > .cursor");
	    } else if (string == '\n') {
		$(".lower > .cursor").before("<br/>");
	    } else if (string == ' ') {
		$("<span>&nbsp;</span>").css(style).insertBefore(".lower > .cursor");
	    } else {
		$("<span></span>").text(string).css(style).insertBefore(".lower > .cursor");
	    }
	} else {
	    if (ZScreen.font == 3) {
		ZError.log("TODO: font 3 strings");
	    }
	    var lines = string.split('\n');
	    var first_line = true;
	    while (lines.length > 0) {
		if (first_line) {
		    first_line = false;
		} else {
		    $(".lower > .cursor").before("<br/>");
		}
		var line = lines.shift();
		if (style['font-family'] == 'monospace') {
		    var words = line.split(' ');
		    var first_word = true;
		    while (words.length > 0) {
			if (first_word) {
			    first_word = false;
			} else {
			    $("<span>&nbsp;</span>").css(style).insertBefore(".lower > .cursor");
			}
			var word = words.shift();
			if (word.length > 0) {
			    $("<span></span>").text(word).css(style).insertBefore(".lower > .cursor");
			}
		    }
		} else {
		    $("<span></span>").text(line).css(style).insertBefore(".lower > .cursor");
		}
	    }
	}
	//ZScreen.scroll_to_bottom();
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
    'scroll_to_bottom':function() {
        var scrollHeight = $(".lower").prop ? $(".lower").prop('scrollHeight') : $(".lower").attr('scrollHeight');
        $(".lower").scrollTop(scrollHeight);
    }
    ,
    'scroll_up':function() {
	ZScreen.scroll(- ZScreen.mono_height);
    }
    ,
    'scroll_down':function() {
	ZScreen.scroll(ZScreen.mono_height);
    }
    ,
    'page_up':function() {
	var h = $(".lower").height();
	ZScreen.scroll(-h);
    }
    ,
    'page_down':function() {
	var h = $(".lower").height();
	ZScreen.scroll(h);
    }
    ,
    'scroll': function(amount) {
	var pos;
	amount = Math.round(amount);
	if ($(".lower").prop) {
	    if (amount > $(".lower").prop('scrollTop') && amount > 0) {
		$(".lower").prop('scrollTop', 0);
	    }
	    pos = $(".lower").prop('scrollTop');
	    $(".lower").prop('scrollTop', pos + amount);
	    return self;
	} else {
	    if (amount > $(".lower").attr('scrollTop') && amount > 0) {
		$(".lower").attr('scrollTop', 0);
	    }
	    pos = $(".lower").attr('scrollTop');
	    $(".lower").attr('scrollTop', pos + amount);
	    return self;
	}
    }
};
