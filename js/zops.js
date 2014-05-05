ZOps = {
    '2OP:1':function(a,b,c,d){
	//je
	//2OP:1 1 je a b ?(label)
	//Jump if a is equal to any of the subsequent operands. (Thus @je a never jumps and @je a b jumps if a = b.)
	//Unclear in spec, this can apparently take more than two args in variable form
	if (a === b ) {
	    ZState.branch(true);
	} else if (a === c) {
	    ZState.branch(true);
	} else if (a === d) {
	    ZState.branch(true);
	} else {
	    ZState.branch(false);
	}
	return 1;
    }
    ,
    '2OP:2':function(a,b){
	//jl
	//2OP:2 2 jl a b ?(label)
	//Jump if a < b (using a signed 16-bit comparison).
        if (a >= 32768) {
            a -= 65536;
        }
        if (b >= 32768) {
            b -= 65536;
        }
	ZState.branch(a < b);
	return 1;
    }
    ,
    '2OP:3':function(a,b){
	//jg
	//2OP:3 3 jg a b ?(label)
	//Jump if a > b (using a signed 16-bit comparison). 
        if (a >= 32768) {
            a -= 65536;
        }
        if (b >= 32768) {
            b -= 65536;
        }
	ZState.branch(a > b);
	return 1;
    }
    ,
    '2OP:4':function(variable,value){
	//dec_chk
	//2OP:4 4 dec_chk (variable) value ?(label)
	//Decrement variable, and branch if it is now less than the given value.
	var dec_value = (ZState.get_variable(variable) + 65535) % 65536;
	ZState.set_variable(variable,dec_value);
	if (dec_value >= 32768) {
            dec_value -= 65536;
        }
        if (value >= 32768) {
            value -= 65536;
        }
        ZState.branch(dec_value < value);
        return 1;	
    }
    ,
    '2OP:5':function(variable,value){
	//inc_chk
	//2OP:5 5 inc_chk (variable) value ?(label)
	//Increment variable, and branch if now greater than value.
	var inc_value = (ZState.get_variable(variable) + 1) % 65536;
	ZState.set_variable(variable,inc_value);
	if (inc_value >= 32768) {
            inc_value -= 65536;
        }
        if (value >= 32768) {
            value -= 65536;
        }
        ZState.branch(inc_value > value);
        return 1;
    }
    ,
    '2OP:6':function(obj1,obj2){
	//jin
	//2OP:6 6 jin obj1 obj2 ?(label)
	//Jump if object a is a direct child of b, i.e., if parent of a is b.     
	var parent = ZObject.get_parent(obj1);
	ZState.branch(parent === obj2);
	return 1;
    }
    ,
    '2OP:7':function(bitmap,flags){
	//test
	//2OP:7 7 test bitmap flags ?(label)
	//Jump if all of the flags in bitmap are set (i.e. if bitmap & flags == flags).
	ZState.branch((bitmap&flags) === flags);
	return 1;
    }
    ,
    '2OP:8':function(a,b){
	//or
	//2OP:8 8 or a b -> (result)
	//Bitwise OR. 
	var result = a | b;
	ZState.store(result);
	return 1;
    }
    ,
    '2OP:9':function(a,b){
	//and
	//2OP:9 9 and a b -> (result)
	//Bitwise AND. 
	var result = a & b;
	ZState.store(result);
	return 1;
    }
    ,
    '2OP:10':function(object,attribute){
	//test_attr
	//2OP:10 A test_attr object attribute ?(label)
	//Jump if object has attribute.
	var attr = ZObject.get_attr(object,attribute);
	ZState.branch(attr === 1);
        return 1;
    }
    ,
    '2OP:11':function(object,attribute){
	//set_attr
	//2OP:11 B set_attr object attribute
	//Make object have the attribute numbered attribute. 
	ZObject.set_attr(object,attribute);
        return 1;
    }
    ,
    '2OP:12':function(object,attribute){
	//clear_attr
	//2OP:12 C clear_attr object attribute
	//Make object not have the attribute numbered attribute. 
	ZObject.clear_attr(object,attribute);
        return 1;
    }
    ,
    '2OP:13':function(variable,value){
	//store
	//2OP:13 D store (variable) value
	//Set the VARiable referenced by the operand to value.
	//unclear in 1.0 spec, write in place
	ZState.get_variable(variable);
	ZState.set_variable(variable,value);
	return 1;
    }
    ,
    '2OP:14':function(object,destination){
	//insert_obj
	//2OP:14 E insert_obj object destination
	//Moves object O to become the first child of the destination object D. (Thus, after the operation the child of D is O, and the sibling of O is whatever was previously the child of D.) All children of O move with it. (Initially O can be at any point in the object tree; it may legally have parent zero.) 	
	ZObject.insert_obj(object,destination);
	return 1;
    }
    ,
    '2OP:15':function(array,word_index){
	//loadw
	//2OP:15 F loadw array word-index -> (result)
	//Stores array-->word-index (i.e., the word at address array+2*word-index, which must lie in static or dynamic memory).
	if (word_index >= 32768) {
	    word_index -= 65536;
	}
	var result = ZMemory.get_word(array+(2*word_index));
	ZState.store(result);
	return 1;
    }
    ,
    '2OP:16':function(array,byte_index){
	//loadb
	//2OP:16 10 loadb array byte-index -> (result)
	//Stores array->byte-index (i.e., the byte at address array+byte-index, which must lie in static or dynamic memory).
	if (byte_index >= 32768) {
	    byte_index -= 65536;
	}
	var result = ZMemory.get_byte(array+byte_index);
	ZState.store(result);
	return 1;
    }
    ,
    '2OP:17':function(object,property){
	//get_prop
	//2OP:17 11 get_prop object property -> (result)
	//Read property from object (resulting in the default value if it had no such declared property). If the property has length 1, the value is only that byte. If it has length 2, the first two bytes of the property are taken as a word value. It is illegal for the opcode to be used if the property has length greater than 2, and the result is unspecified. 
	var prop_addr = ZObject.get_prop(object,property);
	ZState.store(prop_addr);
	return 1;
    }
    ,
    '2OP:18':function(object,property){
	//get_prop_addr
	//2OP:18 12 get_prop_addr object property -> (result)
	//Get the byte address (in dynamic memory) of the property data for the given object's property. This must return 0 if the object hasn't got the property. 
	var prop_addr = ZObject.get_prop_addr(object,property);
	ZState.store(prop_addr);
	return 1;
    }
    ,
    '2OP:19':function(object,property){
	//get_next_prop
	//2OP:19 13 get_next_prop object property -> (result)
	//Gives the number of the next property provided by the quoted object. This may be zero, indicating the end of the property list; if called with zero, it gives the first property number present. It is illegal to try to find the next property of a property which does not exist, and an interpreter should halt with an error message (if it can efficiently check this condition).
	var prop = ZObject.get_next_prop(object,property);
	ZState.store(prop);
	return 1;
    }
    ,
    '2OP:20':function(a,b){
	//add
	//2OP:20 14 add a b -> (result)
	//Signed 16-bit addition. 
	var result = ((a+b)%65536);
	ZState.store(result);
	return 1;
    }
    ,
    '2OP:21':function(a,b){
	//sub
	//2OP:21 15 sub a b -> (result)
	//Signed 16-bit subtraction.
	var result = ((65536 + a - b)%65536);
	ZState.store(result);
	return 1;
    }
    ,
    '2OP:22':function(a,b){
	//mul
	//2OP:22 16 mul a b -> (result)
	//Signed 16-bit multiplication.     
	var result = ((a * b)%65536);
	ZState.store(result);
	return 1;
    }
    ,
    '2OP:23':function(a,b){
	//div
	//2OP:23 17 div a b -> (result)
	//Signed 16-bit division. Division by zero should halt the interpreter with a suitable error message.
	if (a >= 32768) {
	    a -= 65536;
	}
	if (b >= 32768) {
	    b -= 65536;
	}
	var result = 0;
	if (b == 0) {
	    ZError.die('Division by zero');
	} else {
	    var sign = 1;
	    if (a < 0) {
		a *= -1;
		sign *= -1;
	    }
	    if (b < 0) {
		b *= -1;
		sign *= -1;
	    }
	    result = (a - (a % b))/b;
	    result *= sign;
	    result += 65536;
	    result %= 65536;
	}
	ZState.store(result);
	return 1;
    }
    ,
    '2OP:24':function(a,b){
	//mod
	//2OP:24 18 mod a b -> (result)
	//Remainder after signed 16-bit division. Division by zero should halt the interpreter with a suitable error message. 
	if (a >= 32768) {
	    a -= 65536;
	}
	if (b >= 32768) {
	    b -= 65536;
	}
	var result = 0;
	if (b == 0) {
	    ZError.die('Division by zero');
	} else {
	    var sign = 1;
	    if (a < 0) {
		a *= -1;
		sign *= -1;
	    }
	    if (b < 0) {
		b *= -1;
	    }
	    result = (a % b);
	    result *= sign;
	    result += 65536;
	    result %= 65536;
	}
	ZState.store(result);
	return 1;
    }
    ,
    '2OP:25':function(routine,arg1){
	//call_2s
	//2OP:25 19 4 call_2s routine arg1 -> (result)
	//Stores routine(arg1).   
	return ZState.call_function(routine,arg1);
    }
    ,
    '2OP:26':function(routine,arg1){
	//call_2n
	//2OP:26 1A 5 call_2n routine arg1
	//Executes routine(arg1) and throws away result.
	return ZState.call_procedure(routine,arg1);
    }
    ,
    '2OP:27':function(foreground,background,window){
	//set_colour
	//2OP:27 1B 5 set_colour foreground background
	//6 set_colour foreground background window
	//If coloured text is available, set text to be foreground-against-background. (Flush any buffered text to screen, in the old colours, first.) In version 6, the window argument is optional and is by default the current window. (This option is supported in Infocom's Amiga and DOS interpreters.)
	//(One Version 5 game uses this: 'Beyond Zork' (Paul David Doherty reports it as used "76 times in 870915 and 870917, 58 times in 871221") and from the structure of the table it clearly logically belongs in version 5.)
	var ver = ZHeader.version();
	if (ver == 6) {
	    ZError.log('TODO version 6 set_colour: (' + foreground + ',' + background + ',' + window + ')');
	} else {
	    ZScreen.set_colour(foreground,background);
	}
	return 1;
    }
    ,
    '2OP:28':function(value,stack_frame){
	//throw
	//2OP:28 1C 5/6 throw value stack-frame
	//Opposite of catch: resets the routine call state to the state it had when the given stack frame value was 'caught', and then returns. In other words, it returns as if from the routine which executed the catch which found this stack frame value.
	ZState.throw(stack_frame);
	return ZState.return(value);
    }
    ,
    '1OP:128':function(a){
	//jz
	//1OP:128 0 jz a ?(label)
	//Jump if a = 0.     
	ZState.branch(a === 0);
	return 1;
    }
    ,
    '1OP:129':function(object){
	//get_sibling
	//1OP:129 1 get_sibling object -> (result) ?(label)
	//Get next object in tree, branching if this exists, i.e. is not 0. 
	var sibling = ZObject.get_sibling(object);
	ZState.store(sibling);
	ZState.branch(sibling !== 0);
	return 1;
    }
    ,
    '1OP:130':function(object){
	//get_child
	//1OP:130 2 get_child object -> (result) ?(label)
	//Get first object contained in given object, branching if this exists, i.e. is not nothing (i.e., is not 0).
	var child = ZObject.get_child(object);
	ZState.store(child);
	ZState.branch(child !== 0);
	return 1;
    }
    ,
    '1OP:131':function(object){
	//get_parent
	//1OP:131 3 get_parent object -> (result)
	//Get parent object (note that this has no "branch if exists" clause).     
	var parent = ZObject.get_parent(object);
	ZState.store(parent);
	return 1;
    }
    ,
    '1OP:132':function(property_address){
	//get_prop_len
	//1OP:132 4 get_prop_len property-address -> (result)
	//Get length of property data (in bytes) for the given object's property. It is illegal to try to find the property length of a property which does not exist for the given object, and an interpreter should halt with an error message (if it can efficiently check this condition). 
	var prop_len = ZObject.get_prop_len(property_address);
	ZState.store(prop_len);
	return 1;
    }
    ,
    '1OP:133':function(variable){
	//inc
	//1OP:133 5 inc (variable)
	//Increment variable by 1. (This is signed, so -1 increments to 0.)
	var new_value = (ZState.get_variable(variable) + 1) % 65536;
	ZState.set_variable(variable,new_value);
	return 1;
    }
    ,
    '1OP:134':function(variable){
	//dec
	//1OP:134 6 dec (variable)
	//Decrement variable by 1. This is signed, so 0 decrements to -1.
	var new_value = (ZState.get_variable(variable) + 65535) % 65536;
	ZState.set_variable(variable,new_value);
	return 1;
    }
    ,
    '1OP:135':function(addr){
	//print_addr
	//1OP:135 7 print_addr byte-address-of-string
	//Print (Z-encoded) string at given byte address, in dynamic or static memory. 
	var zchars  = [];
        var word = 0;
        while (word < 32768) {
            //load another word
            word = ZMemory.get_word(addr);
	    addr += 2;
            zchars.push(((word >> 10) & 31), ((word >> 5) & 31), (word & 31));
        }
	var zscii = ZString.zchars_to_zscii(zchars);
	ZIO.print_zscii(zscii);
        return 1;
    }
    ,
    '1OP:136':function(routine){
	//call_1s
	//1OP:136 8 4 call_1s routine -> (result)
	//Stores routine(). 
	return ZState.call_function(routine);
    }
    ,
    '1OP:137':function(object){
	//remove_obj
	//1OP:137 9 remove_obj object
	//Detach the object from its parent, so that it no longer has any parent. (Its children remain in its possession.) 
	ZObject.remove_obj(object);
	return 1;
    }
    ,
    '1OP:138':function(object){
	//print_obj
	//1OP:138 A print_obj object
	//Print short name of object (the Z-encoded string in the object header, not a property). If the object number is invalid, the interpreter should halt with a suitable error message. 
	var zchars = ZObject.get_short_name(object);
	var zscii = ZString.zchars_to_zscii(zchars);
	ZIO.print_zscii(zscii);
        return 1;
    }
    ,
    '1OP:139':function(value){
	//ret
	//1OP:139 B ret value
	//Returns from the current routine with the value given.
	return ZState.return(value);
    }
    ,
    '1OP:140':function(offset){
	//jump
	//1OP:140 C jump ?(label)
	//Jump (unconditionally) to the given label. (This is not a branch instruction and the operand is a 2-byte signed offset to apply to the program counter.) It is legal for this to jump into a different routine (which should not change the routine call state), although it is considered bad practice to do so and the Txd disassembler is confused by it.
        if (offset >= 32768) {
            offset -= 65536;
        }
	ZState.jump(offset);
	return 1;
    }
    ,
    '1OP:141':function(packed_addr){
	//print_paddr
	//1OP:141 D print_paddr packed-address-of-string
	//Print the (Z-encoded) string at the given packed address in high memory.
	addr = ZHeader.unpack_print_addr(packed_addr);
	var zchars  = [];
        var word = 0;
        while (word < 32768) {
            //load another word
            word = ZMemory.get_word(addr);
	    addr += 2;
            zchars.push(((word >> 10) & 31), ((word >> 5) & 31), (word & 31));
        }
	var zscii = ZString.zchars_to_zscii(zchars);
	ZIO.print_zscii(zscii);
        return 1;
    }
    ,
    '1OP:142':function(variable){
	//load
	//1OP:142 E load (variable) -> (result)
	//The value of the variable referred to by the operand is stored in the result. (Inform doesn't use this; see the notes to S 14.) 
	var result = ZState.get_variable(variable);
	ZState.set_variable(variable,result);
	ZState.store(result);
	return 1;
    }
    ,
    '1OP:143':function(operand){
	var ver = ZHeader.version();
	if (ver <= 4) {
	    //not
	    //1OP:143 F 1/4 not value -> (result)
	    //Bitwise NOT (i.e., all 16 bits reversed). Note that in Versions 3 and 4 this is a 1OP instruction, reasonably since it has 1 operand, but in later Versions it was moved into the extended set to make room for call_1n.
	    var result = ((~operand) & 65535);
	    ZState.store(result);
	    return 1;
	} else {
	    //call_1n
	    //1OP:143 F 5 call_1n routine
	    //Executes routine() and throws away result.
	    return ZState.call_procedure(operand);
	}
    }
    ,
    '0OP:176':function(){
	//rtrue
	//0OP:176 0 rtrue
	//Return true (i.e., 1) from the current routine. 
	return ZState.return(1);
    }
    ,
    '0OP:177':function(){
	//rfalse
	//0OP:177 1 rfalse
	//Return false (i.e., 0) from the current routine. 
	return ZState.return(0);
    }
    ,
    '0OP:178':function(){
	//print
	//0OP:178 2 print
	//Print the quoted (literal) Z-encoded string.
	var zchars = ZState.get_PC_zchars();
	var zscii = ZString.zchars_to_zscii(zchars);
	ZIO.print_zscii(zscii);
	return 1;
    }
    ,
    '0OP:179':function(){
	//print_ret
	//0OP:179 3 print_ret
	//Print the quoted (literal) Z-encoded string, then print a new-line and then return true (i.e., 1). 
	var zchars = ZState.get_PC_zchars();
	var zscii = ZString.zchars_to_zscii(zchars);
	ZIO.print_zscii(zscii);
	ZIO.print_zscii([13]);
	return ZState.return(1);
    }
    ,
    '0OP:180':function(){
	//nop
	//0OP:180 4 1/- nop
	//Probably the official "no operation" instruction, which, appropriately, was never operated (in any of the Infocom datafiles): it may once have been a breakpoint. 
	return 1;
    }
    ,
    '0OP:181':function(){
	//save
	//0OP:181 5 1 save ?(label)
	//0OP:181 5 4 save -> (result)
	//EXT:0 0 5 save table bytes name -> (result)
	//On Versions 3 and 4, attempts to save the game (all questions about filenames are asked by interpreters) and branches if successful. From Version 5 it is a store rather than a branch instruction; the store value is 0 for failure, 1 for "save succeeded" and 2 for "the game is being restored and is resuming execution again from here, the point where it was saved".
	//It is illegal to use this opcode within an interrupt routine (one called asynchronously by a sound effect, or keyboard timing, or newline counting).
      	//*** The extension also has (optional) parameters, which save a region of the save area, whose address and length are in bytes, and provides a suggested filename: name is a pointer to an array of ASCII characters giving this name (as usual preceded by a byte giving the number of characters). See S 7.6. (Whether Infocom intended these options as part of Version 5 is doubtful, but it's too useful a feature to exclude from this Standard.) 
	//version 4 behavior is unclear
	var success = ZState.save_game();
	var ver = ZHeader.version();
	if (ver < 4) {
	    ZState.branch(success == 1);
	} else {
	    ZState.store(success);
	}
	return 1;
    }
    ,
    '0OP:182':function(){
	//restore
	//0OP:182 6 1 restore ?(label)
	//0OP:182 5 4 restore -> (result)
	//EXT:1 1 5 restore table bytes name -> (result)
	//See save. In Version 3, the branch is never actually made, since either the game has successfully picked up again from where it was saved, or it failed to load the save game file.
	//As with restart, the transcription and fixed font bits survive. The interpreter gives the game a way of knowing that a restore has just happened (see save).
	//*** From Version 5 it can have optional parameters as save does, and returns the number of bytes loaded if so. (Whether Infocom intended these options as part of Version 5 is doubtful, but it's too useful a feature to exclude from this Standard.)
	//If the restore fails, 0 is returned, but once again this necessarily happens since otherwise control is already elsewhere.
	var success = ZState.restore_game();
	var ver = ZHeader.version();
        if (ver < 4) {
            ZState.branch(success == 1);
        } else {
            ZState.store(success*2);
        }
        return 1;
    }
    ,
    '0OP:183':function(){
	//restart
	//0OP:183 7 1 restart
	//Restart the game. (Any "Are you sure?" question must be asked by the game, not the interpreter.) The only pieces of information surviving from the previous state are the "transcribing to printer" bit (bit 0 of 'Flags 2' in the header, at address $10) and the "use fixed pitch font" bit (bit 1 of 'Flags 2').
	//In particular, changing the program start address before a restart will not have the effect of restarting from this new address. 
	//TODO save header bits, probably do something more fancy than call load_game.
	ZState.load_game();
	return 0;
    }
    ,
    '0OP:184':function(){
	//ret_popped
	//0OP:184 8 ret_popped
	//Pops top of stack and returns that. (This is equivalent to ret sp, but is one byte cheaper.)
	var value = ZState.get_variable(0);
	return ZState.return(value);
    }
    ,
    '0OP:185':function(){
	var ver = ZHeader.version();
	if (ver < 5) {
	    //pop
	    //0OP:185 9 1 pop
	    //Throws away the top item on the stack. (This was useful to lose unwanted routine call results in early Versions.)
	    ZState.get_variable(0);
	    return 1;
	} else {
	    //catch
	    //0OP:185 9 5/6 catch -> (result)
	    //Opposite to throw (and occupying the same opcode that pop used in Versions 3 and 4). catch returns the current "stack frame".
	    var result = ZState.catch();
	    ZState.store(result);
	    return 1;
	}
    }
    ,
    '0OP:186':function(){
	//quit
	//0OP:186 A quit
	//Exit the game immediately. (Any "Are you sure?" question must be asked by the game, not the interpreter.) It is not legal to return from the main routine (that is, from where execution first begins) and this must be used instead. 
	return 0;
    }
    ,
    '0OP:187':function(){
	//new_line
	//0OP:187 B new_line
	//Print carriage return.
	ZIO.print_zscii([13]);
	return 1;
    }
    ,
    '0OP:188':function(){
	//0OP:188 C 3 show_status
	//(In Version 3 only.) Display and update the status line now (don't wait until the next keyboard input). (In theory this opcode is illegal in later Versions but an interpreter should treat it as nop, because Version 5 Release 23 of 'Wishbringer' contains this opcode by accident.)
	var ver = ZHeader.version();
	if (ver == 3) {
	    ZIO.show_status();
	}
	return 1;
    }
    ,
    '0OP:189':function(){
	//verify
	//0OP:189 D 3 verify ?(label)
	//Verification counts a (two byte, unsigned) checksum of the file from $0040 onwards (by taking the sum of the values of each byte in the file, modulo $10000) and compares this against the value in the game header, branching if the two values agree. (Early Version 3 games do not have the necessary checksums to make this possible.)
	//The interpreter may stop calculating when the file length (as given in the header) is reached. It is legal for the file to contain more bytes than this, but if so the extra bytes must all be 0, which would contribute nothing the checksum anyway. (Some story files are padded out to an exact number of virtual-memory pages using 0s.)
	var result = ZMemory.verify_checksum();
	ZState.branch(result == 1);
	return 1;
    }
    ,
    '0OP:191':function(){
	//piracy
	//0OP:191 F 5/- piracy ?(label)
	//Branches if the game disc is believed to be genuine by the interpreter (which is assumed to have some arcane way of finding out). Interpreters are asked to be gullible and to unconditionally branch.
	ZState.branch(true);
	return 1;
    }
    ,
    'VAR:224':function(routine,arg1,arg2,arg3){
	//call
	//VAR:224 0 1 call routine ...up to 3 args... -> (result)
	//The only call instruction in Version 3, Inform reads this as call_vs in higher versions: it calls the routine with 0, 1, 2 or 3 arguments as supplied and stores the resulting return value. (When the address 0 is called as a routine, nothing happens and the return value is false.) 
	//call_vs
	//VAR:224 0 4 call_vs routine ...up to 3 args... -> (result)
	//See call.
	return ZState.call_function(routine,arg1,arg2,arg3);
    }
    ,
    'VAR:225':function(array,word_index,value){
	//storew
	//VAR:225 1 storew array word-index value
	//array-->word-index = value, i.e. stores the given value in the word at address array+2*word-index (which must lie in dynamic memory). (See loadw.) 	
	if (word_index >= 32768) {
	    word_index -= 65536;
	}
	ZMemory.set_word(array+(2*word_index),value);
	return 1;
    }
    ,
    'VAR:226':function(array,byte_index,value){
	//storeb
	//VAR:226 2 storeb array byte-index value
	//array->byte-index = value, i.e. stores the given value in the byte at address array+byte-index (which must lie in dynamic memory). (See loadb.)
	if (byte_index >= 32768) {
	    byte_index -= 65536;
	}
	ZMemory.set_byte(array+byte_index,value);
	return 1;
    }
    ,
    'VAR:227':function(object,property,value){
	//put_prop
	//VAR:227 3 put_prop object property value
	//Writes the given value to the given property of the given object. If the property does not exist for that object, the interpreter should halt with a suitable error message. If the property length is 1, then the interpreter should store only the least significant byte of the value. (For instance, storing -1 into a 1-byte property results in the property value 255.) As with get_prop the property length must not be more than 2: if it is, the behaviour of the opcode is undefined. 
	ZObject.put_prop(object,property,value);
	return 1;
    }
    ,
    'VAR:228':function(text,parse,time,routine){
	//read
	//VAR:228 4 1 sread text parse
	//4 sread text parse time routine
	//5 aread text parse time routine -> (result)
	//(Note that Inform internally names the read opcode as aread in Versions 5 and later and sread in Versions 3 and 4.)
	//This opcode reads a whole command from the keyboard (no prompt is automatically displayed). It is legal for this to be called with the cursor at any position on any window.
	//In Versions 1 to 3, the status line is automatically redisplayed first.
	//A sequence of characters is read in from the current input stream until a carriage return (or, in Versions 5 and later, any terminating character) is found.
	//In Versions 1 to 4, byte 0 of the text-buffer should initially contain the maximum number of letters which can be typed, minus 1 (the interpreter should not accept more than this). The text typed is reduced to lower case (so that it can tidily be printed back by the program if need be) and stored in bytes 1 onward, with a zero terminator (but without any other terminator, such as a carriage return code). (This means that if byte 0 contains n then the buffer must contain n+1 bytes, which makes it a string array of length n in Inform terminology.)
	//In Versions 5 and later, byte 0 of the text-buffer should initially contain the maximum number of letters which can be typed (the interpreter should not accept more than this). The interpreter stores the number of characters actually typed in byte 1 (not counting the terminating character), and the characters themselves in bytes 2 onward (not storing the terminating character). (Some interpreters wrongly add a zero byte after the text anyway, so it is wise for the buffer to contain at least n+3 bytes.)
	//Moreover, if byte 1 contains a positive value at the start of the input, then read assumes that number of characters are left over from an interrupted previous input, and writes the new characters after those already there. Note that the interpreter does not redisplay the characters left over: the game does this, if it wants to. This is unfortunate for any interpreter wanting to give input text a distinctive appearance on-screen, but 'Beyond Zork', 'Zork Zero' and 'Shogun' clearly require it. ("Just a tremendous pain in my butt" -- Andrew Plotkin; "the most unfortunate feature of the Z-machine design" -- Stefan Jokisch.)
	//In Version 4 and later, if the operands time and routine are supplied (and non-zero) then the routine call routine() is made every time/10 seconds during the keyboard-reading process. If this routine returns true, all input is erased (to zero) and the reading process is terminated at once. (The terminating character code is 0.) The routine is permitted to print to the screen even if it returns false to signal "carry on": the interpreter should notice and redraw the input line so far, before input continues. (Frotz notices by looking to see if the cursor position is at the left-hand margin after the interrupt routine has returned.)
	//If input was terminated in the usual way, by the player typing a carriage return, then a carriage return is printed (so the cursor moves to the next line). If it was interrupted, the cursor is left at the rightmost end of the text typed in so far.
	//Next, lexical analysis is performed on the text (except that in Versions 5 and later, if parse-buffer is zero then this is omitted). Initially, byte 0 of the parse-buffer should hold the maximum number of textual words which can be parsed. (If this is n, the buffer must be at least 2 + 4*n bytes long to hold the results of the analysis.)
	//The interpreter divides the text into words and looks them up in the dictionary, as described in S 13. The number of words is written in byte 1 and one 4-byte block is written for each word, from byte 2 onwards (except that it should stop before going beyond the maximum number of words specified). Each block consists of the byte address of the word in the dictionary, if it is in the dictionary, or 0 if it isn't; followed by a byte giving the number of letters in the word; and finally a byte giving the position in the text-buffer of the first letter of the word.
	//In Version 5 and later, this is a store instruction: the return value is the terminating character (note that the user pressing his "enter" key may cause either 10 or 13 to be returned; the author recommends that interpreters return 10). A timed-out input returns 0.
	//(Versions 1 and 2 and early Version 3 games mistakenly write the parse buffer length 240 into byte 0 of the parse buffer: later games fix this bug and write 59, because 2+4*59 = 238 so that 59 is the maximum number of textual words which can be parsed into a buffer of length 240 bytes. Old versions of the Inform 5 library commit the same error. Neither mistake has very serious consequences.)
	//(Interpreters are asked to halt with a suitable error message if the text or parse buffers have length of less than 3 or 6 bytes, respectively: this sometimes occurs due to a previous array being overrun, causing bugs which are very difficult to find.)
	var ver = ZHeader.version();
	if (ver < 4) {
	    ZIO.show_status();
	}
	if (time > 0 && routine > 0) {
	    return ZIO.read_timed(text,parse,time,routine);
	} else if (parse > 0){
	    return ZIO.read(text,parse);
	} else {
	    return ZIO.read(text,0);
	}
    }
    ,
    'VAR:229':function(output_character_code){
	//print_char
	//VAR:229 5 print_char output-character-code
	//Print a ZSCII character. The operand must be a character code defined in ZSCII for output (see S 3). In particular, it must certainly not be negative or larger than 1023.
	if (output_character_code < 1024) {
	    ZIO.print_zscii([output_character_code]);
	} else {
	    ZError.die("print_char out of range: " + output_character_code);
	}
	return 1;
    }
    ,
    'VAR:230':function(value){
	//print_num
	//VAR:230 6 print_num value
	//Print (signed) number in decimal.
	if (value >= 32768) {
	    value -= 65536;
	}
	var zscii = ZString.string_to_zscii("" + value);
	ZIO.print_zscii(zscii);
        return 1;
    }
    ,
    'VAR:231':function(range){
	//random
	//VAR:231 7 random range -> (result)
	//If range is positive, returns a uniformly random number between 1 and range. If range is negative, the random number generator is seeded to that value and the return value is 0. Most interpreters consider giving 0 as range illegal (because they attempt a division with remainder by the range), but correct behaviour is to reseed the generator in as random a way as the interpreter can (e.g. by using the time in milliseconds).
	//(Some version 3 games, such as 'Enchanter' release 29, had a debugging verb #random such that typing, say, #random 14 caused a call of random with -14.)
	var value = 0;
	if (range >= 32768) {
	    range -= 65536;
	}
	if (range > 0) {
	    value = ZRandom.get_1_to_N(range);
	} else if (range == 0){
	    ZRandom.unseed();
	} else {
	    ZRandom.seed(-range);
	}
	ZState.store(value);
	return 1;
    }
    ,
    'VAR:232':function(value){
	//push
	//VAR:232 8 push value
	//Pushes value onto the game stack.
	ZState.set_variable(0,value);
	return 1;
    }
    ,
    'VAR:233':function(variable){
	//pull
	//VAR:233 9 1 pull (variable)
	//6 pull stack -> (result)
	//Pulls value off a stack. (If the stack underflows, the interpreter should halt with a suitable error message.) In Version 6, the stack in question may be specified as a user one: otherwise it is the game stack.
	var ver = ZHeader.version();
	if (ver == 6) {
	    ZError.die("Version 6 has user stacks");	    
	} else {
	    var value = ZState.get_variable(0);
	    //write in place
	    ZState.get_variable(variable);	    
	    ZState.set_variable(variable,value);	    
	}
	return 1;
    }
    ,
    'VAR:234':function(lines){
	//split_window
	//VAR:234 A 3 split_window lines
	//Splits the screen so that the upper window has the given number of lines: or, if this is zero, unsplits the screen again. In Version 3 (only) the upper window should be cleared after the split.
	//In Version 6, this is supposed to roughly emulate the earlier Version 5 behaviour (see S 8), though the line count is in units rather than lines. (Existing Version 6 games seem to use this opcode only for bounding cursor movement. 'Journey' creates a status region which is the whole screen and then overlays it with two other windows.) The width and x-coordinates of windows 0 and 1 are not altered. A cursor remains in the same absolute screen position (which means that its y-coordinate will be different relative to the window origin, since this origin will have moved) unless this position is no longer in the window at all, in which case it is moved to the window origin (at the top left of the window).
	ZScreen.split_window(lines);
	return 1;
    }
    ,
    'VAR:235':function(window){
	//set_window
	//VAR:235 B 3 set_window window
	//Selects the given window for text output. 
	ZScreen.set_window(window);
	return 1;
    }
    ,
    'VAR:236':function(routine,arg1,arg2,arg3,arg4,arg5,arg6,arg7){
	//call_vs2
	//VAR:236 C 4 call_vs2 routine ...up to 7 args... -> (result)
	//See call_vn2.     
	return ZState.call_function(routine,arg1,arg2,arg3,arg4,arg5,arg6,arg7);
    }
    ,
    'VAR:237':function(window){
	//erase_window
	//VAR:237 D 4 erase_window window
	//Erases window with given number (to background colour); or if -1 it unsplits the screen and clears the lot; or if -2 it clears the screen without unsplitting it. In cases -1 and -2, the cursor may move (see S 8 for precise details).
        if (window >= 32768) {
            window -= 65536;
        }
	ZScreen.erase_window(window);
	return 1;
    }
    ,
    'VAR:238':function(value){
	//erase_line
	//VAR:238 E 4/6 erase_line value
	//Versions 4 and 5: if the value is 1, erase from the current cursor position to the end of its line in the current window. If the value is anything other than 1, do nothing.
	//Version 6: if the value is 1, erase from the current cursor position to the end of the its line in the current window. If not, erase the given number of pixels minus one across from the cursor (clipped to stay inside the right margin). The cursor does not move.
	if (value == 1) {
	    ZScreen.erase_line();
	} else {
	    var ver = ZHeader.version();
	    if (ver == 6) {
		ZError.die("TODO: version 6 erase_line");
	    } else {
		//Do nothing
	    }
	}
	return 1;
    }
    ,
    'VAR:239':function(line,column,window){
	//set_cursor
	//VAR:239 F 4 set_cursor line column
	//6 set_cursor line column window
	//Move cursor in the current window to the position (x,y) (in units) relative to (1,1) in the top left. (In Version 6 the window is supplied and need not be the current one. Also, if the cursor would lie outside the current margin settings, it is moved to the left margin of the current line.)
	//In Version 6, set_cursor -1 turns the cursor off, and either set_cursor -2 or set_cursor -2 0 turn it back on. It is not known what, if anything, this second argument means: in all known cases it is 0.
	var ver = ZHeader.version();
	if (ver == 6) {
	    ZError.die("TODO: version 6 set _cursor");
	} else {
	    ZScreen.set_cursor(line,column);
	}
	return 1;
    }
    ,
    'VAR:240':function(array){
	//get_cursor
	//VAR:240 10 4/6 get_cursor array
	//Puts the current cursor row into the word 0 of the given array, and the current cursor column into word 1. (The array is not a table and has no size information in its initial entry.) 
	var row = ZScreen.get_cursor_row();
	var col = ZScreen.get_cursor_col();
	ZMemory.set_word(array,row);
	ZMemory.set_word(array+2,col);
	return 1;
    }
    ,
    'VAR:241':function(style){
	//set_text_style
	//VAR:241 11 4 set_text_style style
	//Sets the text style to: Roman (if 0), Reverse Video (if 1), Bold (if 2), Italic (4), Fixed Pitch (8). In some interpreters (though this is not required) a combination of styles is possible (such as reverse video and bold). In these, changing to Roman should turn off all the other styles currently set. 
	ZScreen.set_text_style(style);
	return 1;
    }
    ,
    'VAR:242':function(flag){
	//buffer_mode
	//VAR:242 12 4 buffer_mode flag
	//If set to 1, text output on the lower window in stream 1 is buffered up so that it can be word-wrapped properly. If set to 0, it isn't.
	//In Version 6, this opcode is redundant (the "buffering" window attribute can be set instead). It is used twice in each of Infocom's Version 6 story files, in the $verify routine. Frotz responds by setting the current window's "buffering" attribute, while Infocom's own interpreters respond by doing nothing. This standard leaves the result of buffer_mode undefined in Version 6.
	if (flag == 0) {
	    //TODO Figure out how to do unbuffered text in the lower window
	} else {
	    //TODO resume buffered text in the lower window
	}
	return 1;
    }
    ,
    'VAR:243':function(number,table,width){
	//output_stream
	//VAR:243 13 3 output_stream number
	//5 output_stream number table
	//6 output_stream number table width
	//If stream is 0, nothing happens. If it is positive, then that stream is selected; if negative, deselected. (Recall that several different streams can be selected at once.)
	//When stream 3 is selected, a table must be given into which text can be printed. The first word always holds the number of characters printed, the actual text being stored at bytes table+2 onward. It is not the interpreter's responsibility to worry about the length of this table being overrun.
	//In Version 6, a width field may optionally be given: if this is non-zero, text will then be justified as if it were in the window with that number (if width is positive) or a box -width pixels wide (if negative). Then the table will contain not ordinary text but formatted text: see print_form. 
	if (number >= 32768){
	    number -= 65536;
	}
	if (width >= 32768){
	    width -= 65536;
	}
	if (number > 0) {
	    ZIO.select(number, table, width);
	}
	if (number < 0) {
	    ZIO.deselect(-number);
	}
	return 1;
    }
    ,
    'VAR:244':function(number){
	//input_stream
	//VAR:244 14 3 input_stream number
	//Selects the current input stream.
	//TODO switch to other input stream (but the game can't tell if I don't)
	return 1;
    }
    ,
    'VAR:245':function(number,effect,volume,routine){
	//sound_effect
	//VAR:245 15 5/3 sound_effect number effect volume routine
	//The given effect happens to the given sound number. The low byte of volume holds the volume level, the high byte the number of repeats. (The value 255 means "loudest possible" and "forever" respectively.) (In Version 3, repeats are unsupported and the high byte must be 0.)
	//Note that sound effect numbers 1 and 2 are bleeps (see S 9) and in these cases the other operands must be omitted. Conversely, if any of the other operands are present, the sound effect number must be 3 or higher.
	//The effect can be: 1 (prepare), 2 (start), 3 (stop), 4 (finish with).
	//In Versions 5 and later, the routine is called (with no parameters) after the sound has been finished (it has been playing in the background while the Z-machine has been working on other things). (This is used by 'Sherlock' to implement fading in and out, which explains why mysterious numbers like $34FB were previously thought to be to do with fading.) The routine is not called if the sound is stopped by another sound or by an effect 3 call.
	//See the remarks to S 9 for which forms of this opcode were actually used by Infocom.
	//In theory, @sound_effect; (with no operands at all) is illegal. However interpreters are asked to beep (as if the operand were 1) if possible, and in any case not to halt.
	if (number == 1) {
	    //TODO better alternatives to logging ding and beep
	    //ZError.log("Ding!");
	} else if (number == 2) {
	    //ZError.log("Beep!");
	} else {
	    ZError.log("TODO: other sound effects");
	}
	return 1;
    }
    ,
    'VAR:246':function(one,time,routine){
	//read_char
	//VAR:246 16 4 read_char 1 time routine -> (result)
	//Reads a single character from input stream 0 (the keyboard). The first operand must be 1 (presumably it was provided to support multiple input devices, but only the keyboard was ever used). time and routine are optional (in Versions 4 and later only) and dealt with as in read above. 
	if (time > 0 && routine > 0) {
	    ZIO.read_char_timed(time,routine);
	    return 0;
	} else {
	    ZIO.read_char();
	    return 0;
	}
    }
    ,
    'VAR:247':function(x,table,len,form){
	//scan_table
	//VAR:247 17 4 scan_table x table len form -> (result)
	//Is x one of the words in table, which is len words long? If so, return the address where it first occurs and branch. If not, return 0 and don't.
	//The form is optional (and only used in Version 5?): bit 8 is set for words, clear for bytes: the rest contains the length of each field in the table. (The first word or byte in each field being the one looked at.) Thus $82 is the default. 
	//unclear in spec bit 7 or bit 8?
	if (form === undefined) {
	    form = 130;
	}
	var num_bytes;
	if (form >= 128) {
	    num_bytes = 2;
	} else {
	    num_bytes = 1;
	}
	var field_length = form & 127;
	var addr = 0;
	i = 0;
	while (i < len) {
	    var value;
	    if (num_bytes == 2) {
		value = ZMemory.get_word(table + (field_length*i));
	    } else {
		value = ZMemory.get_byte(table + (field_length*i));
	    }
	    if (value == x) {
		addr = table + (field_length*i);
		i = len;
	    } else {
		i++;
	    }
	}
	ZState.store(addr);
	ZState.branch(addr != 0);
	return 1;
    }
    ,
    'VAR:248':function(value){
	//not
	//VAR:248 18 5/6 not value -> (result)
	//Bitwise NOT (i.e., all 16 bits reversed). Note that in Versions 3 and 4 this is a 1OP instruction, reasonably since it has 1 operand, but in later Versions it was moved into the extended set to make room for call_1n.
	var result = ((~value) & 65535);
	ZState.store(result);
	return 1;
    }
    ,
    'VAR:249':function(routine,arg1,arg2,arg3){
	//call_vn
	//VAR:249 19 5 call_vn routine ...up to 3 args...
	//Like call, but throws away result.
	return ZState.call_procedure(routine,arg1,arg2,arg3);
    }
    ,
    'VAR:250':function(routine,arg1,arg2,arg3,arg4,arg5,arg6,arg7){
	//call_vn2
	//VAR:250 1A 5 call_vn2 routine ...up to 7 args...
	//Call with a variable number (from 0 to 7) of arguments, then throw away the result. This (and call_vs2) uniquely have an extra byte of opcode types to specify the types of arguments 4 to 7. Note that it is legal to use these opcodes with fewer than 4 arguments (in which case the second byte of type information will just be $ff). 
	return ZState.call_procedure(routine,arg1,arg2,arg3,arg4,arg5,arg6,arg7);
    }
    ,
    'VAR:251':function(text, parse, dictionary, flag){
	//tokenise
	//VAR:251 1B 5 tokenise text parse dictionary flag
	//This performs lexical analysis (see read above).
	//If a non-zero dictionary is supplied, it is used (if not, the ordinary game dictionary is). If the flag is set, unrecognised words are not written into the parse buffer and their slots are left unchanged: this is presumably so that if several tokenise instructions are performed in a row, each fills in more slots without wiping those filled by the others.
	//Parsing a user dictionary is slightly different. A user dictionary should look just like the main one but need not be alphabetically sorted. If the number of entries is given as -n, then the interpreter reads this as "n entries unsorted". This is very convenient if the table is being altered in play: if, for instance, the player is naming things.
	ZDictionary.tokenise(text, parse, dictionary, flag);
	return 1;
    }
    ,
    'VAR:252':function(zscii_text, length, from, coded_text){
	//encode_text
	//VAR:252 1C 5 encode_text zscii-text length from coded-text
	//Translates a ZSCII word to Z-encoded text format (stored at coded-text), as if it were an entry in the dictionary. The text begins at from in the zscii-text buffer and is length characters long. (Some interpreters ignore this and keep translating until they hit a 0 character anyway, or have already filled up the 6-byte Z-encoded string.) 
	var word = [];
	var i = 0;
	while (i < length) {
	    word.push(ZMemory.get_byte(zscii_text + from + i));
	    i++;
	}
	//TODO make sure we're doing the right thing with regard to lower case and spaces and zeros
        var zwords = ZString.zscii_to_zwords(word,3);
	ZMemory.set_word(coded_text, zwords[0]);
	ZMemory.set_word(coded_text+2, zwords[1]);
	ZMemory.set_word(coded_text+4, zwords[2]);
	return 1;
    }
    ,
    'VAR:253':function(first, second, size){
	//copy_table
	//VAR:253 1D 5 copy_table first second size
	//If second is zero, then size bytes of first are zeroed.
	//Otherwise first is copied into second, its length in bytes being the absolute value of size (i.e., size if size is positive, -size if size is negative).
	//The tables are allowed to overlap. If size is positive, the interpreter must copy either forwards or backwards so as to avoid corrupting first in the copying process. If size is negative, the interpreter must copy forwards even if this corrupts first. ('Beyond Zork' uses this to fill an array with spaces.)
	//(Version 0.2 of this document wrongly specified that if size is positive then copying should always run backward. This results in the player being unable to cross the river near the start of 'Journey', as the game uses copy_table to shuffle menu options, and the menu "Downstream, Upstream, Cross, Return" is changed to "Return, Return, Return".) 
	if (second == 0) {
	    var i = 0;
	    while (i < size) {
		ZMemory.set_byte(first+i,0);
		i++;
	    }
	} else {
	    if (size >= 32768) {
		size -= 65536;
	    }
	    var forwards;
	    if (size < 0) {
		forwards = true;
		size *= -1;
	    } else if(first > second) {
		forwards = true;
	    } else {
		forwards = false;
	    }
	    if (forwards) {
		var i = 0;
		while (i < size) {
		    ZMemory.set_byte(second+i,ZMemory.get_byte(first + i));
		    i++;
		}
	    } else {
		var i = size;
		while (i > 0) {
		    i--;
		    ZMemory.set_byte(second+i,ZMemory.get_byte(first + i));
		}
	    }
	}
	return 1;
    }
    ,
    'VAR:254':function(zscii_text, width, height, skip){
	//print_table
	//VAR:254 1E 5 print_table zscii-text width height skip
	//Print a rectangle of text on screen spreading right and down from the current cursor position, of given width and height, from the table of ZSCII text given. (Height is optional and defaults to 1.) If a skip value is given, then that many characters of text are skipped over in between each line and the next. (So one could make this display, for instance, a 2 by 3 window onto a giant 40 by 40 character graphics map.)
	if (height == undefined) {
	    height = 1;
	}
	if (skip == undefined) {
	    skip = 0;
	}
	var x = ZScreen.get_cursor_col();
	var y = ZScreen.get_cursor_row();
	var i = 0;
	var row = 0;
	while (row < height) {
	    var col = 0;
	    while (col < width) {
		ZScreen.set_cursor(y+row,x+col);
		ZIO.print_zscii([ZMemory.get_byte(zscii_text + i)]);
		//TODO how does this work with output streams?
		col++;
		i++;
	    }
	    row++;
	    i+=skip;
	}
	return 1;
    }
    ,
    'VAR:255':function(argument_number){
	//check_arg_count
	//VAR:255 1F 5 check_arg_count argument-number
	//Branches if the given argument-number (counting from 1) has been provided by the routine call to the current routine. (This allows routines in Versions 5 and later to distinguish between the calls routine(1) and routine(1,0), which would otherwise be impossible to tell apart.) 
	var flags = ZState.get_arg_flags();
	var mask = 1 << (argument_number - 1);
	ZState.branch((flags & mask) === mask);
	return 1;
    }
    ,
    'EXT:0':function(table,bytes,name){
	//save
	//0OP:181 5 1 save ?(label)
	//0OP:181 5 4 save -> (result)
	//EXT:0 0 5 save table bytes name -> (result)
	//On Versions 3 and 4, attempts to save the game (all questions about filenames are asked by interpreters) and branches if successful. From Version 5 it is a store rather than a branch instruction; the store value is 0 for failure, 1 for "save succeeded" and 2 for "the game is being restored and is resuming execution again from here, the point where it was saved".
	//It is illegal to use this opcode within an interrupt routine (one called asynchronously by a sound effect, or keyboard timing, or newline counting).
	//*** The extension also has (optional) parameters, which save a region of the save area, whose address and length are in bytes, and provides a suggested filename: name is a pointer to an array of ASCII characters giving this name (as usual preceded by a byte giving the number of characters). See S 7.6. (Whether Infocom intended these options as part of Version 5 is doubtful, but it's too useful a feature to exclude from this Standard.) 
	if (table != undefined) {
	    ZError.die('TODO: save table');
	    return 0;
	} else {
	    var success = ZState.save_game();
	    ZState.store(success);
	    return 1;
	}
    }
    ,
    'EXT:1':function(table,bytes,name){
	//restore
	//0OP:182 6 1 restore ?(label)
	//0OP:182 5 4 restore -> (result)
	//EXT:1 1 5 restore table bytes name -> (result)
	//See save. In Version 3, the branch is never actually made, since either the game has successfully picked up again from where it was saved, or it failed to load the save game file.
	//As with restart, the transcription and fixed font bits survive. The interpreter gives the game a way of knowing that a restore has just happened (see save).
	//*** From Version 5 it can have optional parameters as save does, and returns the number of bytes loaded if so. (Whether Infocom intended these options as part of Version 5 is doubtful, but it's too useful a feature to exclude from this Standard.)
	//If the restore fails, 0 is returned, but once again this necessarily happens since otherwise control is already elsewhere. 
	if (table != undefined) {
	    ZError.die('TODO: restore table');
	    return 0;
	} else {
	    var success = ZState.restore_game();
	    ZState.store(success*2);
	    return 1;
	}
    }
    ,
    'EXT:2':function(number, places){
	//log_shift
	//EXT:2 2 5 log_shift number places -> (result)
	//Does a logical shift of number by the given number of places, shifting left (i.e. increasing) if places is positive, right if negative. In a right shift, the sign is zeroed instead of being shifted on. (See also art_shift.) 
	if (places >= 32768) {
	    places -= 65536;
	}
	var result;
	if (places > 0) {
	    result = number << places; 
	} else if (places < 0) {
	    result = number >>> -places;
	} else {
	    result = number;
	}
	result %= 65536;
	ZState.store(result);
	return 1;
    }
    ,
    'EXT:3':function(number, places){
	//art_shift
	//EXT:3 3 5/- art_shift number places -> (result)
	//Does an arithmetic shift of number by the given number of places, shifting left (i.e. increasing) if places is positive, right if negative. In a right shift, the sign bit is preserved as well as being shifted on down. (The alternative behaviour is log_shift.)
	if (places >= 32768) {
	    places -= 65536;
	}
	if (number >= 32768) {
	    number -= 65536;
	}
	var result;
	if (places > 0) {
	    result = number << places; 
	} else if (places < 0) {
	    result = number >> -places;
	} else {
	    result = number;
	}
	if (result < 0) {
	    result = 65536 - ((-result)%65536);
	}
	result %= 65536;
	ZState.store(result);
	return 1;
    }
    ,
    'EXT:4':function(font){
	//set_font
	//EXT:4 4 5 set_font font -> (result)
	//If the requested font is available, then it is chosen for the current window, and the store value is the font ID of the previous font (which is always positive). If the font is unavailable, nothing will happen and the store value is 0.
	//(Infocom's old interpreters did not store 0 for an unavailable font, but the feature is clearly useful and so was introduced in release 0.2 of this Standard. The opcode had an optional extra window operand in Version 6, but this has never been used and is now withdrawn from the Standard.)
	var result = ZScreen.set_font(font);
	ZState.store(result);
	return 1;
    }
    ,
    'EXT:9':function(){
	//save_undo
	//EXT:9 9 5 save_undo -> (result)
	//Like save, except that the optional parameters may not be specified: it saves the game into a cache of memory held by the interpreter. If the interpreter is unable to provide this feature, it must return -1: otherwise it returns the save return value.
	//It is illegal to use this opcode within an interrupt routine (one called asynchronously by a sound effect, or keyboard timing, or newline counting).
	//(This call is typically needed once per turn, in order to implement "UNDO", so it needs to be quick.)
	var success = ZState.save_undo();
	ZState.store(success);
	return 1;
    }
    ,
    'EXT:10':function(){
	//restore_undo
	//EXT:10 A 5 restore_undo -> (result)
	//Like restore, but restores the state saved to memory by save_undo. (The optional parameters of restore may not be supplied.) The behaviour of restore_undo is unspecified if no save_undo has previously occurred (and a game may not legally use it): an interpreter might simply ignore this.
	var success = ZState.restore_undo();
	ZState.store(success*2);
	return 1;
    }
    ,
    'EXT:11':function(char_number){
	//print_unicode
	//EXT:11 B 5/* print_unicode char-number
	//Print a Unicode character. See S 3.8.5.4 and S 7.5 for details. The given character code must be defined in Unicode.
	//*** This opcode will only be present in interpreters obeying Standard 1.0 or later, so story files should check the standard number of the interpreter before executing this opcode.
	ZIO.print_unicode(char_number);
	return 1;
    }
    ,
    'EXT:12':function(char_number){
	//check_unicode
	//EXT:12 C 5/* check_unicode char-number -> (result)
	//Determines whether or not the interpreter can print, or receive from the keyboard, the given Unicode character. Bit 0 of the result should be set if and only if the interpreter can print the character; bit 1 if and only if the interpreter can receive it from the keyboard. Bits 2 to 15 are undefined.
	//*** This opcode will only be present in interpreters obeying Standard 1.0 or later, so story files should check the standard number of the interpreter before executing this opcode. 
	var input_code = ZString.unicode_to_zscii(char_number);
	if (input_code == 0) {
	    //we'll try to print anything
	    ZState.store(1);
	} else {
	    ZState.store(3);
	}
	return 1;
    }
};
