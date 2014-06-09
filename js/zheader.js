ZHeader = {
    'flags2_stash':null
    ,
    'stash_flags2':function(){
	ZHeader.flags2_stash = ZMemory.get_word(16);
    }
    ,
    'set_fields':function(){
	var ver = ZHeader.version();
	ZError.debug("Version: " + ver);
	var release = ZMemory.get_word(2);
	var serial = "";
	if (ver > 1) {
	    serial = String.fromCharCode(ZMemory.get_byte(18), 
					 ZMemory.get_byte(19),
					 ZMemory.get_byte(20),
					 ZMemory.get_byte(21),
					 ZMemory.get_byte(22),
					 ZMemory.get_byte(23));
	}
	ZError.debug("Story File: " + release + "." + serial);
	var flags1 = ZMemory.get_byte(1);
	//Set capability flags
	if (ver <= 3) {
	    //ver 1-3 ?110????
 	    flags1 &= ~ 16;
 	    flags1 |= 96;		
	} else {
	    //ver 4+  1?011101
 	    flags1 &= ~ 34;
 	    flags1 |= 157;
	}
	ZMemory.set_byte(1,flags1);

	var flags2 = ZMemory.get_word(16);
	if (ZHeader.flags2_stash !== null) {
	    flags2 &= ~(3);
	    flags2 |= (ZHeader.flags2_stash & 3);
	    ZHeader.flags2_stash = null
	}
	if (ver  == 5) {
	    flags2 &= ~(8 + 32 + 128);
	}
	if (ver >= 6) {
	    flags2 &= ~(8 + 32 + 128 + 256);
	}
	ZMemory.set_word(16,flags2)

	if (ver >= 5) {
	    ZMemory.set_byte(44,9); // backgroud white
	    ZMemory.set_byte(45,2); // foreground black
	}

	if (ver >=4) {
	    ZMemory.set_byte(30,4); //interpreter number -- 'Amiga', best for Beyond Zork
	    ZMemory.set_byte(31,65); //interpreter version 'A' 
	}
	//TODO 1.0 set bits to indicate we obey the 1.0 standard
	//ZMemory.set_byte(50,1);
	//ZMemory.set_byte(51,0);
    }
    ,
    'set_screen_size':function(screen_width,screen_height){
	var ver = ZHeader.version();
	if (ver >=4) {
	    ZMemory.set_byte(32,screen_height);
	    ZMemory.set_byte(33,screen_width);
	}
	if (ver >= 5) {
	    ZMemory.set_word(34,screen_width);
	    ZMemory.set_word(36,screen_height);
	    ZMemory.set_byte(38,1);
	    ZMemory.set_byte(39,1);
	}
    }
    ,
    'version':function(){
	return ZMemory.get_byte(0);
    }
    ,
    'get_high_memory_addr':function(){
	var addr = ZMemory.get_word(4);
	return addr;
    }
    ,
    'get_initial_PC_addr':function(){
	var addr = ZMemory.get_word(6);
	if (ZHeader.version() == 6) {
	    ZError.log('get_initial_PC_addr, needs ver 6 help');
	} else {
	    return addr;
	}
    }
    ,
    'get_dict_table_addr':function(){
	var addr = ZMemory.get_word(8);
	return addr;
    }
    ,
    'get_object_table_addr':function(){
	var addr = ZMemory.get_word(10);
	return addr;
    }
    ,
    'get_global_table_addr':function(){
	var addr = ZMemory.get_word(12);
	return addr;
    }
    ,
    'get_static_memory_addr':function(){
	var addr = ZMemory.get_word(14);
	return addr;
    }
    ,
    'get_abbrev_table_addr':function(){
	var addr = ZMemory.get_word(24);
	return addr;
    }
    ,
    'get_file_length':function(){
	var ver = ZHeader.version();
	var len = ZMemory.get_word(26);
	if (ver < 4) {
	    return 2*len;
	} else if (ver < 6) {
	    return 4*len;
	} else {
	    return 8*len;
	}
    }
    ,
    'get_checksum':function(){
        return ZMemory.get_word(28);
    }
    ,
    'get_extra_characters_table_addr':function(){
	var addr = ZHeader.get_extension_word(3);
	return addr;
    }
    ,
    'get_extension_word':function(w){
	var ver = ZHeader.version();
	if (ver >= 5) {
	    var extension_table_addr = ZMemory.get_word(54);
	    if (extension_table_addr > 0) {
		var num_entries = ZMemory.get_word(extension_table_addr);
		if (w <= num_entries) {
		    return ZMemory.get_word(extension_table_addr + (2*w));
		}
	    }
	}
	return 0;
    }
    ,
    'get_alphabet_table_addr':function(){
	var addr = ZMemory.get_word(52);
	return addr;
    }
    ,
    'is_time_game':function(){
	var ver = ZHeader.version();
	if (ver == 3) {
	    var flags1 = ZMemory.get_byte(1);
	    if ((flags1 & 2) == 2) {
		return true;
	    }
	}
	return false;
    }
    ,
    'must_fix_pitch':function(){
	var ver = ZHeader.version();
	if (ver >= 3) {
	    var flags2 = ZMemory.get_word(16);
	    if ((flags2 & 2) == 2) {
		return true;
	    }
	}
	return false;
    }
    ,
    'is_transcript_on':function(){
	var flags2 = ZMemory.get_word(16);
	if ((flags2 & 1) == 1) {
	    return true;
	}
	return false;
    }
    ,
    'turn_on_transcript':function(){
	var flags2 = ZMemory.get_word(16);
	flags2 |= 1;
	ZMemory.set_word(16, flags2);
    }
    ,
    'turn_off_transcript':function(){
	var flags2 = ZMemory.get_word(16);
	flags2 &= ~(1);
	ZMemory.set_word(16, flags2);
    }
    ,
    'unpack_routine_addr':function(addr){
	var ver = ZHeader.version();
	if (ver <= 3) {
	    return 2*addr;
	} else if (ver <= 5) {
	    return 4*addr;
	} else if (ver <= 7) {
	    var routine_offset = ZMemory.get_word(40);
	    return ((4*addr) + (8*routine_offset));
	} else {
	    return 8*addr;
	}
    }
    ,
    'unpack_print_addr':function(addr){
	var ver = ZHeader.version();
	if (ver <= 3) {
	    return 2*addr;
	} else if (ver <= 5) {
	    return 4*addr;
	} else if (ver <= 7) {
	    var print_offset = ZMemory.get_word(42);
	    return ((4*addr) + (8*print_offset));
	} else {
	    return 8*addr;
	}
    }
};
