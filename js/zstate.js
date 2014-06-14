ZState = {
    'PC':null
    ,
    'call_stack':null
    ,
    'undo':[]
    ,
    'max_undos':4
    ,
    'save_format_version':'' //rev this whenever the format changes
    ,
    'storyfile':null
    ,
    'load_game':function(url){
	ZState.storyfile = url;
	ZDOM.init_body();
	ZError.debug("Loading " + ZState.storyfile);	
	ZMemory.load_memory_from_file(ZState.storyfile,ZState.start_game);
	//asynchronous
    }
    ,
    'reload_game':function(){
	ZDOM.init_body();
	ZError.debug("Loading " + ZState.storyfile);
	ZHeader.stash_flags2();
	ZMemory.load_memory_from_file(ZState.storyfile,ZState.start_game);
	//asynchronous
    }
    ,
    'start_game':function(){
	ZError.debug("Initializing header");
	ZHeader.set_fields();
	ZScreen.init_screen();
	ZIO.init_io();
	ZState.init_state();
	if (ZHeader.version()==6){
	    ZError.die("Version 6 games are not supported.");
	}
	ZState.run();
    }
    ,
    'init_state':function(){
	ZState.PC = ZHeader.get_initial_PC_addr();
	ZState.call_stack = [];
	//make dummy frame
	//TODO decide how this works in version 6
	var frame = {};
	frame.return_PC = 0;
	frame.needs_store = 0;
	frame.store_var_num = 0;
	frame.arg_flags = 0;
	frame.stack = [];
	frame.local_var_count = 0; 
	frame.local_vars = [];
	ZState.push_stack_frame(frame);
    }
    ,
    'run':function(){
	var more = 1;
	while (more) {
	    var error = ZError.is_dead();
	    if (error) {
		ZError.log("The interpreter had a fatal error.");
		more = 0;
	    } else {
		more = ZState.follow_instruction();
	    }
	}
    }
    ,
    'call_interrupt_routine':function(routine){
	//not in spec, but I'm restricting interrupt routines to opcodes which return 1
	//that is, no read read_char restart quit
	ZState.clear_interrupt_value();
	ZState.call_procedure(routine);
	ZState.set_interrupt_flag();
	ZState.run();
	var result = ZState.get_interrupt_value();
	if (result != undefined) {
	    return result;
	} else {
	    ZError.die("Restricted opcode called from interrupt routine (or other error)");
	    return 1; //to abort read/read_char
	}
    }
    ,
    'follow_instruction':function(){
	var ver = ZHeader.version();
	var old_PC = ZState.PC; //for debugging
	var op_byte_one = ZState.get_PC_byte();
	var opcode;
	var operands = [];
	if (ver >= 5 && op_byte_one == 190) {
	    //extended
	    var op_byte_two = ZState.get_PC_byte();
	    opcode = "EXT:" + op_byte_two;
	    var op_types = ZState.get_PC_byte();
	    var op_shift = 64;
	    var max_var = 4;
	    while (max_var > 0) {
		var op_type = (op_types & (3*op_shift))/op_shift;
		op_shift /= 4;
		if (op_type  == 0) {
		    //large constant
		    var value = ZState.get_PC_word();
		    operands.push(value);
		    max_var -= 1;
		} else if (op_type  == 1) {
		    //small constant
		    var value = ZState.get_PC_byte();
		    operands.push(value);
		    max_var -= 1;
		} else if (op_type  == 2) {
		    //variable value
		    var var_num = ZState.get_PC_byte();
		    var value = ZState.get_variable(var_num);
		    operands.push(value);
		    max_var -= 1;
		} else {
		    //omitted
		    max_var = 0;
		}
	    }
	} else if (op_byte_one >= 192) {
	    //variable
	    var op_types = ZState.get_PC_byte();
	    var op_shift = 64;
	    var max_var = 4;
	    if (op_byte_one == 236 || op_byte_one == 250) {
		//two op_type bytes
		op_types = (op_types * 256) + ZState.get_PC_byte();
		var op_shift = 64 * 256;
		var max_var = 8;
	    }
	    if (op_byte_one >= 224) {
		//VAR
		opcode = "VAR:" + op_byte_one;
	    } else {
		//2OP
		opcode = "2OP:" + (op_byte_one & 31);
	    }
	    while (max_var > 0) {
		var op_type = (op_types & (3*op_shift))/op_shift;
		op_shift /= 4;
		if (op_type  == 0) {
		    //large constant
		    var value = ZState.get_PC_word();
		    operands.push(value);
		    max_var -= 1;
		} else if (op_type  == 1) {
		    //small constant
		    var value = ZState.get_PC_byte();
		    operands.push(value);
		    max_var -= 1;
		} else if (op_type  == 2) {
		    //variable value
		    var var_num = ZState.get_PC_byte();
		    var value = ZState.get_variable(var_num);
		    operands.push(value);
		    max_var -= 1;
		} else {
		    //omitted
		    max_var = 0;
		}
	    }
	} else if (op_byte_one >= 128) {
	    //short
	    var op_type = (op_byte_one & 48)/16;
	    if (op_type  == 0) {
		//large constant                                                                                                                               
		var value = ZState.get_PC_word();
		operands.push(value);
		opcode = "1OP:" + (op_byte_one & 143);
	    } else if (op_type  == 1) {
		//small constant                                                                                                                               
		var value = ZState.get_PC_byte();
		operands.push(value);
		opcode = "1OP:" + (op_byte_one & 143);
	    } else if (op_type  == 2) {
		//variable value                                                                                                                               
		var var_num = ZState.get_PC_byte();
		var value = ZState.get_variable(var_num);
		operands.push(value);
		opcode = "1OP:" + (op_byte_one & 143);
	    } else {
		//omitted                                                                                                                                      
		opcode = "0OP:" + op_byte_one;
	    }
	} else {
	    //long
	    opcode = "2OP:" + (op_byte_one & 31);
	    if ((op_byte_one & 64) == 0) {
		//small constant
		var value = ZState.get_PC_byte();
		operands.push(value);
	    } else {
		//variable
		var var_num = ZState.get_PC_byte();
		var value = ZState.get_variable(var_num);
		operands.push(value);
	    }
	    if ((op_byte_one & 32) == 0) {
		//small constant
		var value = ZState.get_PC_byte();
		operands.push(value);
	    } else {
		//variable
		var var_num = ZState.get_PC_byte();
		var value = ZState.get_variable(var_num);
		operands.push(value);
	    }
	}

	if (opcode in ZOps) {
	    ZError.debug("PC:" + old_PC + " opbyte: " + op_byte_one + " opcode: " + opcode + " with operands: " + operands);
	    return ZOps[opcode](operands[0],operands[1],operands[2],operands[3],operands[4],operands[5],operands[6],operands[7]);
	} else {
	    ZError.log("unknown opcode: " + opcode);
	    ZError.log("operands: " + operands);
	    return 0; //halt z-machine
	}
    }
    ,
    'get_PC_byte':function(){
	var byte = ZMemory.get_byte(ZState.PC);
	ZState.PC += 1;
	return byte;
    }
    ,
    'get_PC_word':function(){
	var word = ZMemory.get_word(ZState.PC);
	ZState.PC += 2;
	return word;
    }
    ,
    'get_PC_zchars':function(){
	var zchars  = [];
	var word = 0;
	while (word < 32768) {
	    //load another word
	    word = ZState.get_PC_word();
	    zchars.push(((word >> 10) & 31), ((word >> 5) & 31), (word & 31));
	}
	return zchars;
    }
    ,
    'get_variable':function(num){
	if (num == 0) {
	    var frame = ZState.get_stack_frame();
	    return frame.stack.pop();
	} else if (num < 16) {
	    var frame = ZState.get_stack_frame();
	    if (num <= frame.local_var_count) {
		return frame.local_vars[num-1];
	    } else {
		ZError.log("Read local overflow " + num + ">" + frame.local_var_count);
	    }
	} else {
	    //global
	    var addr = ZHeader.get_global_table_addr();
	    addr += 2*(num-16);
	    return ZMemory.get_word(addr);
	}
    }
    ,
    'set_variable':function(num,value){
	if (num == 0) {
	    var frame = ZState.get_stack_frame();
	    frame.stack.push(value);
	} else if (num < 16) {
	    var frame = ZState.get_stack_frame();
	    if (num <= frame.local_var_count) {
		frame.local_vars[num-1] = value;
	    } else {
		ZError.log("PC:" + ZState.PC);
		ZError.log("write local overflow " + num + ">" + frame.local_var_count);
	    }
	} else {
	    //global
	    var addr = ZHeader.get_global_table_addr();
	    addr += 2*(num-16);
	    return ZMemory.set_word(addr,value);
	}
    }
    ,
    'store':function(result){
	var num = ZState.get_PC_byte();
	ZError.debug("storing "+result +" into variable " +num);
	ZState.set_variable(num,result);
    }
    ,
    'branch':function(truth){
	var byte_one = ZState.get_PC_byte();
	ZError.debug("Branching: "+truth);
	var offset;
	if ((byte_one & 64) === 0) {
	    var byte_two = ZState.get_PC_byte();
	    offset = ((byte_one & 63)*256) + byte_two;
	    if (offset >= 8192) {
		offset -= 16384;
	    }
	} else {
	    offset = (byte_one & 63);
	}
	var branch = true;
	if ((byte_one & 128) === 0) {
	    //branch on false
	    branch = false;
	}
	if (branch == truth) {
	    ZState.jump(offset);
	}
    }
    ,
    'jump':function(offset){
	if (offset === 0) {
	    ZState.return(0);
	} else if (offset === 1) {
	    ZState.return(1);
	} else {
	    ZState.PC += offset - 2;
	}
    }
    ,
    'call_function':function(routine,arg1,arg2,arg3,arg4,arg5,arg6,arg7){
	if (routine == 0) {
	    ZState.store(0);
	    return 1;
	}
	var args = [arg1,arg2,arg3,arg4,arg5,arg6,arg7];
	var arg_flags = 0;
	var arg_count = 0;
	var i = 0;
	while (i < 7) {
	    if (args[i]!==undefined) {
		arg_count += 1;
		arg_flags += (1 << i);
	    }
	    i++;
	}
	var store_num = ZState.get_PC_byte();
	var old_PC = ZState.PC;
	//figure out new routine address
	var new_PC = ZHeader.unpack_routine_addr(routine);
	//move PC
	ZState.PC = new_PC;
	//init local vars
	var local_var_count = ZState.get_PC_byte();
	var local_vars = [];
	var ver = ZHeader.version();
	var j = 0;
	while (j < local_var_count) {
	    var next_local = 0;
	    if (ver <= 4) {
		next_local = ZState.get_PC_word();
	    }	    
	    if (args[j] !== undefined) {
		next_local = args[j];
	    }
	    local_vars.push(next_local);
	    j++;
	}
	//push the stack frame
	var frame = {};
	frame.return_PC = old_PC;
	frame.needs_store = 1;
	frame.store_var_num = store_num;
	frame.arg_flags = arg_flags; //required for quetzal save format and VAR:255
	frame.stack = [];
	frame.local_var_count = local_var_count; 
	frame.local_vars = local_vars;
	ZState.push_stack_frame(frame);
	return 1;
    }
    ,
    'call_procedure':function(routine,arg1,arg2,arg3,arg4,arg5,arg6,arg7){
	if (routine == 0) {
	    return 1;
	}
	var args = [arg1,arg2,arg3,arg4,arg5,arg6,arg7];
	var arg_flags = 0;
	var arg_count = 0;
	var i = 0;
	while (i < 7) {
	    if (args[i]!==undefined) {
		arg_count += 1;
		arg_flags += (1 << i);
	    }
	    i++;
	}
	var old_PC = ZState.PC;
	//figure out new routine address
	var new_PC = ZHeader.unpack_routine_addr(routine);
	//move PC
	ZState.PC = new_PC;
	//init local vars
	var local_var_count = ZState.get_PC_byte();
	var local_vars = [];
	var ver = ZHeader.version();
	var j = 0;
	while (j < local_var_count) {
	    var next_local = 0;
	    if (ver <= 4) {
		next_local = ZState.get_PC_word();
	    }	    
	    if (args[j] !== undefined) {
		next_local = args[j];
	    }
	    local_vars.push(next_local);
	    j++;
	}
	//push the stack frame
	var frame = {};
	frame.return_PC = old_PC;
	frame.needs_store = 0;
	frame.store_var_num = 0;
	frame.arg_flags = arg_flags; //required for quetzal save format and VAR:255
	frame.stack = [];
	frame.local_var_count = local_var_count; 
	frame.local_vars = local_vars;
	ZState.push_stack_frame(frame);
	return 1;
    }
    ,
    'return':function(value){
	var frame = ZState.pop_stack_frame();
	if (frame == undefined) {
	    ZError.die("returned off an empty stack!");
	    return 0;
	} else {
	    ZState.PC = frame.return_PC;
	    if (frame.needs_store == 1) {
		ZState.set_variable(frame.store_var_num,value);
	    } else if (frame.interrupt == 1) {
		ZState.interrupt_value = value;
		return 0;
	    }
	}
	return 1;
    }
    ,
    'set_interrupt_flag':function(){
	var frame = ZState.get_stack_frame();
	frame.interrupt = 1;
	return 1;
    }
    ,
    'get_interrupt_value':function(){
	var result = ZState.interrupt_value;
	return result;
    }
    ,
    'clear_interrupt_value':function(){
	ZState.interrupt_value = undefined;
	return 1;
    }
    ,
    'push_stack_frame':function(frame){
	ZState.call_stack.push(frame);
	return 1;
    }
    ,
    'pop_stack_frame':function(){
	return ZState.call_stack.pop();
    }
    ,
    'get_stack_frame':function(){
	var len = ZState.call_stack.length;
	return ZState.call_stack[len-1];
    }
    ,
    'catch':function(){
	return ZState.call_stack.length;
    }
    ,
    'throw':function(stack_frame){
	while (ZState.catch() > stack_frame) {
	    ZState.pop_stack_frame();
	}
	return 1;
    }
    ,
    'get_arg_flags':function(){
	var frame = ZState.get_stack_frame();
	return frame.arg_flags;
    }
    ,
    'save_game':function(){
	var save_game = {};
	save_game.Memory = ZMemory.memory;
	save_game.Stack = ZState.call_stack;
	save_game.PC = ZState.PC;
	var save_game_key = ZState.storyfile;
	var save_game_name = ZIO.get_save_game_name();
	var save_format_version = ZState.save_format_version;
	var key_string = save_game_key + save_game_name + save_format_version;
	//TODO consider making this more collision proof?
	var value_string = JSON.stringify(save_game);
	//TODO consider Quetzal support (how do we get the file out?)
	if (ZFILE.store_string(key_string,value_string)) {
	    return 1;
	} else {
	    return 0;
	}
    }
    ,
    'restore_game':function(){
	var save_game_key = ZState.storyfile;
	var save_game_name = ZIO.get_save_game_name();
	var save_format_version = ZState.save_format_version;
	var key_string = save_game_key + save_game_name + save_format_version;
	var value_string = ZFILE.load_string(key_string);
	if (value_string !== null) {
            var save_game = JSON.parse(value_string);
	    //TODO detect loading saved game from different storyfile 6.1.2.1
	    // Currently we're somewhat protected because the storyfile url is in the key
	    // perhaps we should do more though, like support Quetzal
	    // I'm going to postone improvements in this behavior until after 1.0
	    ZHeader.stash_flags2();
	    ZMemory.memory = save_game.Memory;
	    ZHeader.set_fields();
	    ZScreen.set_header_bytes();
	    ZState.call_stack = save_game.Stack;
	    ZState.PC = save_game.PC;
	    return 1;
        } else {
	    //TODO consider an alert dialog box
            // Sorry! No web storage support..
            ZError.log('Restore game failed ...');
            return 0;
        }
    }
    ,
    'save_undo':function(){
	var save_game = {};
	save_game.Memory = ZMemory.memory;
	save_game.Stack = ZState.call_stack;
	save_game.PC = ZState.PC;
	ZState.undo.push( JSON.stringify(save_game) );
	if (ZState.undo.length > ZState.max_undos) {
	    ZState.undo.shift();
	}
	return 1;
    }
    ,
    'restore_undo':function(){
	if (ZState.undo.length == 0) {
	    return 0;
	}
	var save_game = JSON.parse(ZState.undo.pop());
	ZHeader.stash_flags2();
	ZMemory.memory = save_game.Memory;
	ZHeader.set_fields();
	ZScreen.set_header_bytes();
	ZState.call_stack = save_game.Stack;
	ZState.PC = save_game.PC;
	return 1;
    }
};
