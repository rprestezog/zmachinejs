ZScreen = {
    'width':null
    ,
    'height':null
    ,
    'status_line':null
    ,
    'cur_upper_lines':null
    ,
    'dom_upper_lines':null
    ,
    'max_upper_lines':null
    ,
    'seen_upper_lines':null
    ,
    //TODO move these to ZDOM?
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
	var body_size = ZDOM.get_body_size();
	var body_width = body_size.width;
	var body_height = body_size.height;
	var mono_size = ZDOM.get_monospace_size();
	var mono_width = mono_size.width;
	var mono_height = mono_size.height;
	ZScreen.mono_width = mono_width;
	ZScreen.mono_height = mono_height;
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
	
	ZDOM.clear_screen();
	ZDOM.set_screen_size(ZScreen.width*mono_width,ZScreen.height*mono_height);
	ZHeader.set_screen_size(ZScreen.width,ZScreen.height);
	ZScreen.set_colour(1,1);
	//The header sets default text to black on white. Should this be done here?
	var ver = ZHeader.version();
	if (ver <= 3) {
	    ZDOM.add_status_line();
	    ZScreen.status_line = 1;
	} else {
	    ZScreen.status_line = 0;
	}
	ZScreen.cur_upper_lines = 0;
	ZScreen.dom_upper_lines = 0;
	ZScreen.max_upper_lines = 0;
	ZScreen.seen_upper_lines = 0;
	if (ver >= 3) {
	    ZDOM.add_upper_window();
	}
	//TODO figure out how to prevent room and score collisions
	ZDOM.add_lower_window();
	
	ZScreen.erase_window(-1);
    }
    ,
    'resize_lower_window':function(){
	var status_line = ZScreen.status_line;
	var upper_lines = ZScreen.dom_upper_lines;
	var lines_left = ZScreen.height - status_line - upper_lines;
	if (lines_left > 0) {
	    ZDOM.set_lower_height(lines_left * ZScreen.mono_height);
	} else {
	    ZDOM.set_lower_height(0);
	}
    }
    ,
    'see_upper_window':function(){
	//call this when we know that the upper window has been seen
	//that is, right before read or read char
	
	//first do a last minute trim
	ZScreen.trim_upper_window();
	//then set that we've seen the lines in the dom
	ZScreen.seen_upper_lines = ZScreen.dom_upper_lines;
	//and a new high water mark next time
	ZScreen.max_upper_lines = ZScreen.cur_upper_lines;
    }
    ,
    'trim_upper_window':function(){
	//call this function to let the upper window catch up to its current size
	if (ZScreen.seen_upper_lines >= ZScreen.max_upper_lines) {
	    if (ZScreen.dom_upper_lines > ZScreen.max_upper_lines) {
		while (ZScreen.dom_upper_lines > ZScreen.max_upper_lines) {
		    ZDOM.remove_upper_line();
		    ZScreen.dom_upper_lines--;
		}
		ZScreen.resize_lower_window();
	    }
	}
    }
    ,
    'erase_window':function(window){
	if (window == -1) {
	    //do we postpone collapsing the upper window until next turn?
	    //I think we don't in this case, as correct behavior would
	    //have any quote box text erased for the lower window
	    ZScreen.cur_upper_lines = 0;
	    ZScreen.dom_upper_lines = 0;
	    ZScreen.max_upper_lines = 0;
	    ZScreen.seen_upper_lines = 0;
	    ZDOM.clear_upper_window();
	    ZDOM.clear_lower_window(ZScreen.background);
	    ZScreen.window = 'lower';
	    ZScreen.upper_cursor = {x:0,y:0,old_color:null,shown:false};
	    ZScreen.resize_lower_window();
	} else if (window == 0) {
	    ZDOM.clear_lower_window(ZScreen.background);
	    ZScreen.resize_lower_window();
	    //TODO move cursor to bottom left for version 4
	} else if (window == 1) {
	    ZScreen.hide_cursor();
	    var y = ZScreen.cur_upper_lines;
	    while (y > 0) {
		ZDOM.erase_upper_line(0,y - 1,ZScreen.background);
		y--;
	    }
	} else {
	    ZError.die("TODO: erase_window" + window);
	}
    }
    ,
    'erase_line':function(){
	if (ZScreen.window == 'upper') {
	    ZScreen.hide_cursor();
	    ZDOM.erase_upper_line(ZScreen.upper_cursor.x,ZScreen.upper_cursor.y,ZScreen.background);
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
	    //TODO should we delay removing lines?
	    ZDOM.clear_upper_window();
	    ZScreen.cur_upper_lines = 0;
	    ZScreen.dom_upper_lines = 0;
	    ZScreen.max_upper_lines = 0;
	    ZScreen.seen_upper_lines = 0;
	    ZScreen.window = 'lower';
	} else {
	    var ver = ZHeader.version();
	    if (ver == 3) {
		ZDOM.clear_upper_window();
		ZScreen.cur_upper_lines = 0;
		ZScreen.dom_upper_lines = 0;
		ZScreen.max_upper_lines = 0;
		ZScreen.seen_upper_lines = 0;
	    }

	    while (ZScreen.cur_upper_lines < lines) {
		if (ZScreen.cur_upper_lines < ZScreen.dom_upper_lines) {
		    ZDOM.erase_upper_line(0,ZScreen.cur_upper_lines,ZScreen.background);
		    ZScreen.cur_upper_lines++;
		} else {
		    ZDOM.add_upper_line(ZScreen.width,ZScreen.background);
		    ZScreen.dom_upper_lines++;
		    ZScreen.cur_upper_lines++;
		}
	    }
	    ZScreen.cur_upper_lines = lines;
	    if (ZScreen.max_upper_lines < ZScreen.cur_upper_lines) {
		ZScreen.max_upper_lines = ZScreen.cur_upper_lines;
	    }
	    if (ZScreen.upper_cursor.y >= lines) {
		ZScreen.upper_cursor = {x:0,y:0,old_color:null,shown:false};
	    }
	}
	ZScreen.trim_upper_window();
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
	    //TODO should we be checking the values here?
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
	    ZScreen.upper_cursor.old_color = ZDOM.toggle_upper_cursor(ZScreen.upper_cursor.x,ZScreen.upper_cursor.y,"#D3D3D3");
	    ZScreen.upper_cursor.shown = true;
	} else {
	    ZDOM.show_lower_cursor("#D3D3D3");
	}
    }
    ,
    'hide_cursor':function(line,column){
	if (ZScreen.upper_cursor.shown) {
	    ZDOM.toggle_upper_cursor(ZScreen.upper_cursor.x,ZScreen.upper_cursor.y,ZScreen.upper_cursor.old_color);
	    ZScreen.upper_cursor.shown = false;
	}
	ZDOM.hide_lower_cursor();
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
		var x = ZScreen.upper_cursor.x;
		var y = ZScreen.upper_cursor.y;
		if ((ZScreen.font) == 3 && (character.charCodeAt(0) >= 32) && (character.charCodeAt(0) <= 126)) {
		    var URI = ZGIF.get_font_3_URI(character.charCodeAt(0),style['background-color'],style['color']);
		    ZDOM.set_upper_img(x,y,URI,ZScreen.mono_width,ZScreen.mono_height);
		    if ( x + 1 < ZScreen.width ) {
			ZScreen.upper_cursor.x++;
		    }
		} else if (character == ' ') {
		    ZDOM.set_upper_space(x,y,style);
		    if ( x + 1 < ZScreen.width ) {
			ZScreen.upper_cursor.x++;
		    }
		} else if (character == '\n') {
		    if ( y + 1 < ZScreen.cur_upper_lines) {
			ZScreen.upper_cursor.x = 0;
			ZScreen.upper_cursor.y++;
		    }
		} else if (character == '\t') {
		    ZError.die("print_char tab to upper window");
		} else {
		    ZDOM.set_upper_char(x,y,character,style);
		    if ( x + 1 < ZScreen.width ) {
			ZScreen.upper_cursor.x++;
		    }
		}
	    }
	} else if (string.length == 1) {
	    if ((ZScreen.font) == 3 && (string.charCodeAt(0) >= 32) && (string.charCodeAt(0) <= 126)) {
		var URI = ZGIF.get_font_3_URI(string.charCodeAt(0),style['background-color'],style['color']);
		ZDOM.print_lower_img(URI,ZScreen.mono_width,ZScreen.mono_height);
	    } else if (string == '\n') {
		ZDOM.print_lower_newline();
	    } else if (string == ' ') {
		ZDOM.print_lower_space(style);
	    } else {
		ZDOM.print_lower_string(string, style);
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
		    ZDOM.print_lower_newline();
		}
		var line = lines.shift();
		if (style['font-family'] == 'monospace') {
		    var words = line.split(' ');
		    var first_word = true;
		    while (words.length > 0) {
			if (first_word) {
			    first_word = false;
			} else {
			    ZDOM.print_lower_space(style);
			}
			var word = words.shift();
			if (word.length > 0) {
			    ZDOM.print_lower_string(word, style);
			}
		    }
		} else {
		    ZDOM.print_lower_string(line, style);
		}
	    }
	}
	//ZScreen.scroll_to_bottom();
    }
    ,
    'backspace':function(){
	//TODO check if we're in a good place to back space?
	ZDOM.lower_backspace();
    }
    ,
    'print_room_name':function(room_name){
	ZDOM.print_room_name(room_name);
    }
    ,
    'print_score':function(score){
	ZDOM.print_score(score);
    }
    ,
    'scroll_to_bottom':function() {
	ZDOM.scroll_to_bottom();
    }
    ,
    'scroll_up':function() {
	ZDOM.scroll_lower(-ZScreen.mono_height);
    }
    ,
    'scroll_down':function() {
	ZDOM.scroll_lower(ZScreen.mono_height);
    }
    ,
    'page_up':function() {
	ZDOM.page_up();
    }
    ,
    'page_down':function() {
	ZDOM.page_down();
    }
};
