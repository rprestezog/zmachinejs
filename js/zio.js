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
	ZDOM.set_keydown_handler(ZIO.keydown);
	ZDOM.set_keypress_handler(ZIO.keypress);
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
		    if (ZIO.is_output_zscii(code)) {
			ZIO.buffer_stack[i].zscii.push(code);
		    } else {
			//print nothing? report error?
			ZError.log("print illegal output code to stream 3" + code);
		    }			
		}
		j++;
	    }
	} else {
	    //ZString.zscii_to_string only converts output zscii codes (others error and become '?')
	    var string = ZString.zscii_to_string(zscii);
	    if (ZIO.output_streams[1] == 1) {
		ZScreen.print_string(string);
	    }
	    if (ZHeader.is_transcript_on() && ZScreen.is_transcript_on()) {
		//The spec is unclear, but some games require we only transcribe the lower window printing.
		ZTranscript.print_string(string);
	    }
	}
    }
    ,
    'print_unicode':function(unicode_char){
	if (ZIO.output_streams[3] > 0) {
	    var i = ZIO.output_streams[3] - 1;
	    //TODO version 6 width stuff
	    zscii = ZString.unicode_to_zscii(unicode_char);
	    if (zscii != 0) {
		//ZString.unicode_to_zscii only returns input/output zscii
		ZIO.buffer_stack[i].zscii.push(zscii);
	    } else {
		ZIO.buffer_stack[i].zscii.push(63); // '?'
	    }
	} else {
	    if (ZIO.output_streams[1] == 1) {
		ZScreen.print_string(String.fromCharCode(unicode_char));
	    }
	    if (ZHeader.is_transcript_on() && ZScreen.is_transcript_on()) {
		ZTranscript.print_string(String.fromCharCode(unicode_char));
	    }
	}
    }
    ,
    'select_input':function(number){
	//OPT 1.0 actually support stream 1
	//for now, the interpreter immediately switches back to stream 0
	//as is permitted in 10.2.2
	ZIO.input_stream = number;
	ZIO.input_stream = 0;
    }
    ,
    'select_output':function(number,table,width){
	if (number == 1) {
	    ZIO.output_streams[1] = 1;
	} else if (number == 2) {
	    ZHeader.turn_on_transcript();
	} else if (number == 3) {
	    if (ZIO.output_streams[3] < 16) {
		var buffer = {'zscii':[],'table':table,'width':width};
		ZIO.buffer_stack.push(buffer);
		ZIO.output_streams[3] += 1;
	    } else {
		ZError.die("Output stream 3 stack is full");
	    }
	} else if (number == 4) {
	    ZError.alert_once("output to stream 4 not supported");
	    //no need to die on this though,
	    //the game has no way of checking whether it's working	
	    ZIO.output_streams[4] = 1;
	    //OPT 1.0 support for stream 4  7.1.2 , 7.6.5
	} else {
	    ZError.die("select stream" + number);
	}
    }
    ,
    'deselect_output':function(number){
	if (number == 1) {
	    ZIO.output_streams[1] = 0;
	} else if (number == 2) {
	    ZHeader.turn_off_transcript();
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
	    ZError.alert_once("output to stream 4 not supported");
	    //no need to die on this though,
	    //the game has no way of checking whether it's working	
	    ZIO.output_streams[4] = 0;
	    //OPT 1.0 support for stream 4  7.1.2 , 7.6.5
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
	    ZScreen.see_upper_window();
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
	    ZScreen.see_upper_window();
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
	var ver = ZHeader.version();
	if (ZHeader.is_transcript_on()) {
	    if (ver != 6) {
		//TODO Should this happen in upper window reads?
		var string = ZString.zscii_to_string(ZIO.input_buffer);
		ZTranscript.print_string(string);
	    }
	}
	//OPT 1.0 support for stream 4  7.1.2 , 7.1.2.3 , 7.6.5
	ZIO.fill_text_buffer(ZIO.read_text,ZIO.input_buffer);
	ZDictionary.tokenise(ZIO.read_text,ZIO.read_parse);
	if (ver >= 5) {
	    var value = ZIO.input_buffer[ZIO.input_buffer.length - 1];
	    if (value == 10) {
		//TODO this is likely unnecessary
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
	    ZScreen.see_upper_window();
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
		//OPT 1.0 support for stream 4  7.1.2 , 7.6.5
	    } else {
		ZScreen.see_upper_window();
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
		//OPT 1.0 support for stream 4  7.1.2 , 7.6.5
	    } else {
		//TODO if the there has been printing, reprint input.
		ZScreen.see_upper_window();
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
	    ZScreen.see_upper_window();
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
	//OPT 1.0 support for stream 4  7.1.2 , 7.1.2.3 , 7.6.5
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
	if ((room_num > 0) && (room_num < 256)) { 
	    var zchars = ZObject.get_short_name(room_num);
	    var zscii = ZString.zchars_to_zscii(zchars);
	    var room_name = ZString.zscii_to_string(zscii);
	    ZScreen.print_room_name(room_name);
	} else {
	    ZError.log('Invalid room number ' + room_num);
	    ZScreen.print_room_name('');
	}

	if (ZHeader.is_time_game()) {
	    var time_string = '';
	    var hours = ZState.get_variable(17);
	    if (hours < 24) {
		time_string += String(1 + ((hours+11)%12));
	    } else {
		time_string += '88';
		ZError.log("Hours out of range " + hours);
	    }
	    time_string += ':';
	    var minutes = ZState.get_variable(18);
	    if (minutes < 10) {
		time_string += '0' + String(minutes);
	    } else if (minutes < 60) {
		time_string += String(minutes);
	    } else {
		time_string += '88';
		ZError.log("Minutes out of range " + minutes);
	    }
	    time_string += ' ';
	    if (hours < 12) {
		time_string += 'AM';
	    } else if (hours < 24) {
		time_string += 'PM';
	    } else {
		time_string += '88';
	    }	    
	    ZScreen.print_score(time_string);
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
    'is_input_zscii':function(zscii){
	//takes a zcscii code, returns true for input codes
	if (zscii < 32) {
	    if (zscii == 8) {
		return true;
	    } else if (zscii == 13) {
		return true;
	    } else if (zscii == 27) {
		return true;
	    } else {
		return false;
	    }
	} else if (zscii < 127) {
	    return true;
	} else if (zscii < 129) {
	    return false;
	} else if (zscii < 255) {
	    return true;
	} else {
	    return false;
	}
    }
    ,
    'is_output_zscii':function(zscii){
	//takes a zcscii code, returns true for output codes
	if (zscii < 32) {
	    if (zscii == 0) {
		return true;
	    } else if (zscii == 13) {
		return true;
	    } else if (zscii == 9) {
		var ver = ZHeader.version();
		if (ver == 6) {
		    return true;
		} else {
		    return false;
		}
	    } else if (zscii == 11) {
		var ver = ZHeader.version();
		if (ver == 6) {
		    return true;
		} else {
		    return false;
		}
	    } else {
		return false;
	    }
	} else if (zscii < 127) {
	    return true;
	} else if (zscii < 155) {
	    return false;
	} else if (zscii < 252) {
	    return true;
	} else {
	    return false;
	}
    }
    ,
    'is_input_output_zscii':function(zscii){
	//takes a zcscii code, returns true for input/output codes
	if (zscii < 32) {
	    if (zscii == 13) {
		return true;
	    } else {
		return false;
	    }
	} else if (zscii < 127) {
	    return true;
	} else if (zscii < 155) {
	    return false;
	} else if (zscii < 252) {
	    return true;
	} else {
	    return false;
	}
    }
    ,
    'keydown':function(which){
        if (!ZIO.read_ready && !ZIO.read_char_ready) {
            return false;
        }
	//clear a quotebox is present
	ZScreen.see_upper_window();
        if (which == 32) {
            //space
            return true;
        } else if (which >= 48 && which <= 57) {
            //0-9
            return true;
        } else if (which >= 65 && which <= 90) {
            //a-z
            return true;
        } else if (which >= 186 && which <= 192) {
            //semi-colon,equal sign,comma,dash,period,forward slash,grave accent
            return true;
        } else if (which >= 219 && which <= 222) {
            //open bracket,back slash,close braket,single quote
            return true;
        } else if (which == 8) {
            //back space 
	    if(ZIO.read_ready) {
		if (ZIO.input_buffer.length > 0) {
		    ZIO.input_buffer.pop();
		    ZScreen.backspace();
		    ZScreen.scroll_to_bottom();
		}
	    } else if (ZIO.read_char_ready) {
		ZIO.end_read_char(8);
	    }
        } else if (which == 13) {
            //enter
	    if(ZIO.read_ready) {
		ZIO.input_buffer.push(13);
		ZScreen.print_string('\n');
		ZIO.end_read();
	    } else if (ZIO.read_char_ready) {
		ZIO.end_read_char(13);
	    }
        } else if (which >= 37 && which <= 40) {
	    //arrow keys L,U,R,D
	    if (ZIO.read_char_ready) {
		if (which == 37) {
		    //Left
		    ZIO.end_read_char(131);
		} else if (which == 38) {
		    //Up
		    ZIO.end_read_char(129);
		} else if (which == 39) {
		    //Right
		    ZIO.end_read_char(132);
		} else if (which == 40) {
		    //Down
		    ZIO.end_read_char(130);
		}
	    } else {
		if (which == 38) {
                    //Up
                    ZScreen.scroll_up();
                } else if (which == 40) {
                    //Down
                    ZScreen.scroll_down();
                }
	    }
	} else if (which === 34) { 
	    // PAGE DOWN
	    ZScreen.page_down();
	} else if (which === 33) {
	    // PAGE UP
	    ZScreen.page_up();
	} else if (which === 27) {
	    //escape
	    if (ZIO.read_char_ready) {
		ZIO.end_read_char(27);
	    }	
        } else {
            //TODO 1.0 function keys, and number pad 3.8.4
	    //ZError.log('Key Down: ' + which);
	    //TODO 1.0 support terminating characters table 10.5.2.1
        }
        return false; //prevents default and keypress
    }
    ,
    'keypress':function(which){
        if (!ZIO.read_ready && !ZIO.read_char_ready) {
            return false;
        }
	if (ZIO.read_ready) {
	    if (ZIO.input_buffer.length >= ZIO.read_maxlength) {
		ZError.log("Input buffer full!");
		return false;
	    };
	}
	var zscii = ZString.unicode_to_zscii(which);
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
            ZError.log("Key Press! [" + which + "]");
	}
        return false; //prevents default
    }
};
