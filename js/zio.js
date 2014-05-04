ZIO = {
    'output_streams':null
    ,
    'input_stream':null
    ,
    'input_buffer':null
    ,
    'read_ready':null
    ,
    'read_char_ready':null
    ,
    'read_text':null
    ,
    'read_parse':null
    ,
    'read_maxlength':null
    ,
    'buffer_stack':null
    ,
    'init_io':function(){
	ZIO.output_streams = [0,1,0,0,0];
	ZIO.buffer_stack = [];
	ZIO.input_stream = 0;
	ZIO.input_buffer = [];
	ZIO.read_ready = false;
	ZIO.read_char_ready = false;
        $(document).unbind('keydown', ZIO.keydown).keydown(ZIO.keydown);
        $(document).unbind('keypress', ZIO.keypress).keypress(ZIO.keypress);
	//TODO initialize Header transcript bits from here
    }
    ,
    'print_zscii':function(zscii){
	if (ZIO.output_streams[3] > 0) {
	    var i = ZIO.output_streams[3] - 1;
	    //TODO version 6 width stuff
	    var j = 0;
	    while (j < zscii.length) {
		var code = zscii[j];
		if (code != 0) {
		    //TODO more thorough check of printable zscii codes?
		    ZIO.buffer_stack[i].zscii.push(code);
		}
		j++;
	    }
	} else {
	    var string = ZString.zscii_to_string(zscii);
	    if (ZIO.output_streams[1] == 1) {
		ZScreen.print_string(string);
	    }
	    //TODO test for streams 2 and 4
	}
    }
    ,
    'print_unicode':function(unicode_char){
	if (ZIO.output_streams[3] > 0) {
	    var i = ZIO.output_streams[3] - 1;
	    //TODO version 6 width stuff
	    //TODO coerce some chars to zscii other than 63=='?'
	    ZIO.buffer_stack[i].zscii.push(63);
	} else {
	    if (ZIO.output_streams[1] == 1) {
		ZScreen.print_string(String.fromCharCode(unicode_char));
	    }
	    //TODO test for streams 2 and 4
	}
    }
    ,
    'select':function(number,table,width){
	if (number == 1) {
	    ZIO.output_streams[1] = 1;
	} else if (number == 2) {
	    ZError.die("TODO transcript");
	} else if (number == 3) {
	    var buffer = {'zscii':[],'table':table,'width':width};
	    ZIO.buffer_stack.push(buffer);
	    ZIO.output_streams[3] += 1;
	} else if (number == 4) {
	    ZError.die("TODO stream 4");
	} else {
	    ZError.die("select stream" + number);
	}
    }
    ,
    'deselect':function(number){
	if (number == 1) {
	    ZIO.output_streams[1] = 0;
	} else if (number == 2) {
	    ZError.die("TODO transcript off");
	} else if (number == 3) {
	    if (ZIO.output_streams[3] > 0) {
		var buffer = ZIO.buffer_stack.pop();
		ZIO.output_streams[3] -= 1;
		var zscii = buffer.zscii;
		var table = buffer.table;
		//TODO version 6 stuff
		ZMemory.set_word(table,zscii.length);
		var i = 0;
		while (i < zscii.length) {
		    ZMemory.set_byte(table+2+i, zscii[i]);
		    i++;
		}
	    } else {
		ZError.die("popped empty buffer stack");
	    }
	} else if (number == 4) {
	    ZError.die("TODO deselect stream 4");
	} else {
	    ZError.die("deselect stream" + number);
	}
    }
    ,
    'read':function(text,parse){
	var ver = ZHeader.version();
	var byte_zero = ZMemory.get_byte(text);
	if (ver < 5) {
	    ZIO.read_maxlength = byte_zero + 1;
	} else {
	    ZIO.read_maxlength = byte_zero;
	    var byte_one = ZMemory.get_byte(text+1);
	    if (byte_one > 0) {
		ZError.die("TODO read previous characters from text table");
	    }
	}
	if (ZIO.input_stream == 1) {
	    ZError.die("Read from stream 1");
	    return 1;
	} else {
	    //read from screen asyncronously
	    ZIO.read_text = text;
	    ZIO.read_parse = parse;
	    ZIO.input_buffer = [];
	    ZIO.read_ready = true;
	    ZScreen.show_cursor();
	    ZScreen.scroll_to_bottom();
	    //TODO also deal with max chars and previous text?
	    if (ZScreen.window == 'upper') {
		ZError.die("Reading from upper window!");
	    } else {
		//TODO try and sneak previous text in here?
	    }
	    return 0;
	}
    }
    ,
    'read_timed':function(text,parse,time,routine){
	var ver = ZHeader.version();
	var byte_zero = ZMemory.get_byte(text);
	if (ver < 5) {
	    ZIO.read_maxlength = byte_zero + 1;
	} else {
	    ZIO.read_maxlength = byte_zero;
	    var byte_one = ZMemory.get_byte(text+1);
	    if (byte_one > 0) {
		ZError.die("TODO read previous characters from text table");
	    }
	}
	if (ZIO.input_stream == 1) {
	    ZError.die("Read from stream 1");
	    return 1;
	} else {
	    //read from screen asyncronously
	    ZIO.read_text = text;
	    ZIO.read_parse = parse;
	    ZIO.input_buffer = [];
	    ZIO.read_ready = true;
	    ZScreen.show_cursor();
	    ZScreen.scroll_to_bottom();
	    ZIO.read_timer = setTimeout(function(){ZIO.read_timeout(time,routine)},time*100);
	    //TODO also deal with max chars and previous text?
	    if (ZScreen.window == 'upper') {
		ZError.die("Reading from upper window!");
	    } else {
		//TODO try and sneak previous text in here?
	    }
	    return 0;
	}
    }
    ,
    'end_read':function(){
	ZIO.read_ready = false;
	if (ZIO.read_timer != undefined) {
	    clearTimeout(ZIO.read_timer);
	}
	ZIO.read_timer = undefined;
	ZIO.fill_text_buffer(ZIO.read_text,ZIO.input_buffer);
	ZDictionary.tokenise(ZIO.read_text,ZIO.read_parse);
	var ver = ZHeader.version();
	if (ver >= 5) {
	    var value = ZIO.input_buffer[ZIO.input_buffer.length - 1];
	    if (value == 10) {
		value = 13;
	    }
	    ZState.store(value);
	}
	//asyncronous read is done.  start z-machine again
	ZState.run();
    }
    ,
    'read_char_timed':function(time,routine){
        //In Version 4 and later, if the operands time and routine are supplied (and non-zero) then the routine call routine() is made every time/10 seconds during the keyboard-reading process. If this routine returns true, all input is erased (to zero) and the reading process is terminated at once. (The terminating character code is 0.) The routine is permitted to print to the screen even if it returns false to signal "carry on": the interpreter should notice and redraw the input line so far, before input continues. (Frotz notices by looking to see if the cursor position is at the left-hand margin after the interrupt routine has returned.)
	//If input was terminated in the usual way, by the player typing a carriage return, then a carriage return is printed (so the cursor moves to the next line). If it was interrupted, the cursor is left at the rightmost end of the text typed in so far.
	if (ZIO.input_stream == 1) {
	    ZError.die("Read char from stream 1");
	    return 0;
	} else {
	    //read from screen asyncronously
	    ZScreen.show_cursor();
	    ZScreen.scroll_to_bottom();
	    ZIO.read_char_ready = true;
	    ZIO.read_char_timer = setTimeout(function(){ZIO.read_char_timeout(time,routine)},time*100);
	    return 0;
	}
    }
    ,
    'read_char_timeout':function(time,routine){
	if (ZIO.read_char_ready) {
	    var abort = ZState.call_interrupt_routine(routine);
	    if (abort) {
		ZIO.end_read_char(0);
	    } else {
		ZScreen.show_cursor();
		ZScreen.scroll_to_bottom();
		ZIO.read_char_timer = setTimeout(function(){ZIO.read_char_timeout(time,routine)},time*100);
	    }
	}
    }
    ,
    'read_timeout':function(time,routine){
	if (ZIO.read_ready) {
	    var abort = ZState.call_interrupt_routine(routine);
	    if (abort) {
		ZIO.input_buffer = [0];
		ZIO.end_read();
	    } else {
		//TODO if the there has been printing, reprint input.
		ZScreen.show_cursor();
		ZScreen.scroll_to_bottom();
		ZIO.read_timer = setTimeout(function(){ZIO.read_timeout(time,routine)},time*100);
	    }
	}
    }
    ,
    'read_char':function(){
	if (ZIO.input_stream == 1) {
	    ZError.die("Read char from stream 1");
	    return 0;
	} else {
	    //read from screen asyncronously
	    ZScreen.show_cursor();
	    ZScreen.scroll_to_bottom();
	    ZIO.read_char_ready = true;
	    return 0;
	}
    }
    ,
    'end_read_char':function(zscii){
	ZIO.read_char_ready = false;
	if (ZIO.read_char_timer != undefined) {
	    clearTimeout(ZIO.read_char_timer);
	}
	ZIO.read_char_timer = undefined;
	ZState.store(zscii);
	//asyncronous read is done.  start z-machine again
	ZState.run();
    }
    ,
    'fill_text_buffer':function(text,input){
	var ver = ZHeader.version();
	if (ver < 5) {
	    var i = 0;
	    while ( i < input.length - 1 ) {
		var zscii = input[i];
		if (zscii >= 65 && zscii <= 90) {
		    //reduce to lower case
		    zscii += 32;
		}
		ZMemory.set_byte( text + 1 + i, zscii );
		i++;
	    }
	    ZMemory.set_byte( text + 1 + i, 0);
	} else {
	    var i = 0;
	    var len = input.length - 1;
	    ZMemory.set_byte( text + 1, len);
	    while ( i < len ) {
		var zscii = input[i];
		//Spec Unclear but some games want lower case
		if (zscii >= 65 && zscii <= 90) {
		    //reduce to lower case
		    zscii += 32;
		}
		ZMemory.set_byte( text + 2 + i, zscii );
		i++;
	    }
	}
    }
    ,
    'show_status':function(){
	var ver = ZHeader.version();
	if ( ver > 3 ) {
	    return;
	}
	var room_num = ZState.get_variable(16);
	var zchars = ZObject.get_short_name(room_num);
	var zscii = ZString.zchars_to_zscii(zchars);
	var room_name = ZString.zscii_to_string(zscii);
	ZScreen.print_room_name(room_name);

	if (ZHeader.is_time_game()) {
	    ZError.die("TODO time game show status")
	} else {
	    var score = ZState.get_variable(17);
	    if (score >= 32768){
		score -= 65536;
	    }
	    var turns = ZState.get_variable(18);
	    var score_text = "Score: " + score + " Turns: " + turns;
	    ZScreen.print_score(score_text);
	}
    }
    ,
    'get_save_game_name':function(){
	//TODO something smarter
	ZScreen.scroll_to_bottom();
	var name=prompt("Save game name:","");
	if (name!=null && name!='') {
	    return name;
	} else {
	    return '';
	}
    }
    ,
    'keydown':function(e){
        if (!ZIO.read_ready && !ZIO.read_char_ready) {
            return false;
        }
        if (e.which == 32) {
            //space
            return true;
        } else if (e.which >= 48 && e.which <= 57) {
            //0-9
            return true;
        } else if (e.which >= 65 && e.which <= 90) {
            //a-z
            return true;
        } else if (e.which >= 186 && e.which <= 192) {
            //semi-colon,equal sign,comma,dash,period,forward slash,grave accent
            return true;
        } else if (e.which >= 219 && e.which <= 222) {
            //open bracket,back slash,close braket,single quote
            return true;
        } else if (e.which == 8) {
            //back space 
	    if(ZIO.read_ready) {
		if (ZIO.input_buffer.length > 0) {
		    ZIO.input_buffer.pop();
		    //TODO move this to ZScreen
		    $(".lower > .cursor").prev().remove();
		    ZScreen.scroll_to_bottom();
		}
	    } else if (ZIO.read_char_ready) {
		ZIO.end_read_char(8);
	    }
        } else if (e.which == 13) {
            //enter
	    if(ZIO.read_ready) {
		ZIO.input_buffer.push(13);
		ZScreen.print_string('\n');
		ZIO.end_read();
	    } else if (ZIO.read_char_ready) {
		ZIO.end_read_char(13);
	    }
        } else if (e.which >= 37 && e.which <= 40) {
	    //arrow keys L,U,R,D
	    if (ZIO.read_char_ready) {
		if (e.which == 37) {
		    //Left
		    ZIO.end_read_char(131);
		} else if (e.which == 38) {
		    //Up
		    ZIO.end_read_char(129);
		} else if (e.which == 39) {
		    //Right
		    ZIO.end_read_char(132);
		} else if (e.which == 40) {
		    //Down
		    ZIO.end_read_char(130);
		}
	    } else {
		if (e.which == 38) {
                    //Up
                    ZScreen.scroll_up();
                } else if (e.which == 40) {
                    //Down
                    ZScreen.scroll_down();
                }
	    }
	} else if (e.which === 34) { 
	    // PAGE DOWN
	    ZScreen.page_down();
	} else if (e.which === 33) {
	    // PAGE UP
	    ZScreen.page_up();
	} else if (e.which === 27) {
	    //escape
	    if (ZIO.read_char_ready) {
		ZIO.end_read_char(27);
	    }	
        } else {
            //TODO function keys, and number pad
	    //ZError.log('Key Down: ' + e.which);
        }
        return false; //prevents default and keypress
    }
    ,
    'keypress':function(e){
        if (!ZIO.read_ready && !ZIO.read_char_ready) {
            return false;
        }
	if (ZIO.read_ready) {
	    if (ZIO.input_buffer.length >= ZIO.read_maxlength) {
		ZError.log("Input buffer full!");
		return false;
	    };
	}
	var zscii = 0;
        if (e.which >= 32 && e.which <= 126) {
            zscii = e.which;
        } else {
	    zscii = ZString.unicode_to_zscii(e.which);
	}
	if (zscii > 0) {
	    if (ZIO.read_ready) {
		ZIO.input_buffer.push(zscii);
		var string = ZString.zscii_to_string([zscii]);
		ZScreen.print_string(string);
		ZScreen.show_cursor();
		ZScreen.scroll_to_bottom();
		if (ZIO.input_buffer.length == 3 && ZIO.input_buffer[0] == ZIO.input_buffer[1] && ZIO.input_buffer[0] == ZIO.input_buffer[2] ) {
		    if (ZIO.input_buffer[0] == 65) {
			//AAA
			ZError.start_debug();
		    } else if (ZIO.input_buffer[0] == 90) {
			//ZZZ
			ZError.stop_debug();
		    } else if (ZIO.input_buffer[0] == 67) {
			//CCC
			ZError.clear_errors();
		    } else if (ZIO.input_buffer[0] == 79) {
			//OOO
			ZError.dump_objects();
		    }
		}
	    } else if (ZIO.read_char_ready) {
                ZIO.end_read_char(zscii);
            }
	} else {
            ZError.log("Key Press! [" + e.which + "]");
	}
        return false; //prevents default
    }
};
