ZObject = {
    'get_parent':function(obj){
	var ver = ZHeader.version();
	var object_table_addr = ZHeader.get_object_table_addr();
	if (ver < 4) {
	    //var parent_addr = object_table_addr + 62 + (9*(obj-1)) + 4;
	    var parent_addr = object_table_addr + 57 + (9*obj);
	    return ZMemory.get_byte(parent_addr);
	} else {
	    //var parent_addr = object_table_addr + 126 + (14*(obj-1)) + 6;
	    var parent_addr = object_table_addr + 118 + (14*obj);
	    return ZMemory.get_word(parent_addr);
	}
    }
    ,
    'get_sibling':function(obj){
	var ver = ZHeader.version();
	var object_table_addr = ZHeader.get_object_table_addr();
	if (ver < 4) {
	    //var sibling_addr = object_table_addr + 62 + (9*(obj-1)) + 5;
	    var sibling_addr = object_table_addr + 58 + (9*obj);
	    return ZMemory.get_byte(sibling_addr);
	} else {
	    //var sibling_addr = object_table_addr + 126 + (14*(obj-1)) + 8;
	    var sibling_addr = object_table_addr + 120 + (14*obj);
	    return ZMemory.get_word(sibling_addr);
	}
    }
    ,
    'get_child':function(obj){
	var ver = ZHeader.version();
	var object_table_addr = ZHeader.get_object_table_addr();
	if (ver < 4) {
	    //var child_addr = object_table_addr + 62 + (9*(obj-1)) + 6;
	    var child_addr = object_table_addr + 59 + (9*obj);
	    return ZMemory.get_byte(child_addr);
	} else {
	    //var child_addr = object_table_addr + 126 + (14*(obj-1)) + 10;
	    var child_addr = object_table_addr + 122 + (14*obj);
	    return ZMemory.get_word(child_addr);
	}
    }
    ,
    'get_prop_list_addr':function(obj){
	var ver = ZHeader.version();
	var object_table_addr = ZHeader.get_object_table_addr();
	if (ver < 4) {
	    //var prop_list_addr = object_table_addr + 62 + (9*(obj-1)) + 7;
	    var prop_list_addr = object_table_addr + 60 + (9*obj);
	    return ZMemory.get_word(prop_list_addr);
	} else {
	    //var prop_list_addr = object_table_addr + 126 + (14*(obj-1)) + 12;
	    var prop_list_addr = object_table_addr + 124 + (14*obj);
	    return ZMemory.get_word(prop_list_addr);
	}
    }
    ,
    'get_short_name':function(obj){
	var prop_list_addr = ZObject.get_prop_list_addr(obj);
	var short_name_length = ZMemory.get_byte(prop_list_addr);
	var zchars = [];
	i = 0;
        var word = 0;
        while (word < 32768 && i < short_name_length) {
            //load another word
            word = ZMemory.get_word(prop_list_addr + 1 + (2*i));
            zchars.push(((word >> 10) & 31), ((word >> 5) & 31), (word & 31));
	    i++;
	}
	return zchars;
    }
    ,
    'get_prop_addr':function(obj,prop){
        //Get the byte address (in dynamic memory) of the property data for the given object's property. This must return 0 if the object hasn't got the property.
	var prop_list_addr = ZObject.get_prop_list_addr(obj);
	var short_name_length = ZMemory.get_byte(prop_list_addr);
	prop_list_addr += 1 + (2*short_name_length);
	var ver = ZHeader.version();
	if (ver < 4) {
	    var cur_prop = 32; //exceed the maximum
	    while (prop < cur_prop) {
		var size_byte = ZMemory.get_byte(prop_list_addr);
		cur_prop = size_byte & 31;
		if (prop === cur_prop) {
		    return (prop_list_addr + 1);
		} else {
		    prop_list_addr += 1 + (size_byte >> 5) + 1;
		}
	    }
	} else {
	    var cur_prop = 64; //exceed the maximum
	    while (prop < cur_prop) {
		var size_byte_one = ZMemory.get_byte(prop_list_addr);
		cur_prop = size_byte_one & 63;
		if (size_byte_one >= 128) {
		    if (prop === cur_prop) {
			return (prop_list_addr + 2);
		    } else {
			var size_byte_two = ZMemory.get_byte(prop_list_addr + 1);
			var data_length = size_byte_two & 63;
			if (data_length == 0) {
			    data_length = 64;
			}
			prop_list_addr += 2 + data_length;
		    }
		} else {
		    if (prop === cur_prop) {
			return (prop_list_addr + 1);
		    } else if (size_byte_one >= 64) {
			prop_list_addr += 3;
		    } else {
			prop_list_addr += 2;
		    }		    
		}
	    }
	}
	return 0;
    }
    ,
    'get_prop':function(obj,prop){
	var prop_addr = ZObject.get_prop_addr(obj,prop);
	if (prop_addr == 0) {
	    var object_table_addr = ZHeader.get_object_table_addr();
	    return ZMemory.get_word(object_table_addr + (2*(prop-1)));
	} else {
	    var size = ZObject.get_prop_len(prop_addr);
	    if (size == 1) {
		return ZMemory.get_byte(prop_addr);
	    } else if (size == 2) {
		return ZMemory.get_word(prop_addr);
	    } else {
		ZError.die("get_prop with size " + size);
	    }
	}
    }
    ,
    'put_prop':function(obj,prop,value){
	var prop_addr = ZObject.get_prop_addr(obj,prop);
	if (prop_addr == 0) {
	    ZError.die("put_prop called on missing property " + obj  +","+ prop+","+value );
	} else {
	    var size = ZObject.get_prop_len(prop_addr);
	    if (size == 1) {
		ZMemory.set_byte(prop_addr, value & 255);
	    } else if (size == 2) {
		ZMemory.set_word(prop_addr,value);
	    } else {
		ZError.die("put_prop on proerty with size " + size);
	    }
	}
    }
    ,
    'get_prop_len':function(prop_addr){
	if (prop_addr == 0) {
	    return 0;
	} else {
	    var ver = ZHeader.version();
	    var last_size_byte = ZMemory.get_byte(prop_addr-1);
	    var size;
	    if (ver <= 3) {
		size = (last_size_byte >> 5) + 1;
	    } else {
		if (last_size_byte >= 128) {
		    size = ((last_size_byte - 1) % 64) + 1;
		} else {
		    size = (last_size_byte >> 6) + 1;
		}
	    }
	    return size;
	}
    }
    ,
    'get_next_prop':function(obj,prop){
	if (prop == 0) {
	    //get first prop
	    var prop_list_addr = ZObject.get_prop_list_addr(obj);
	    var short_name_length = ZMemory.get_byte(prop_list_addr);
	    var ver = ZHeader.version();
	    var size_byte = ZMemory.get_byte(prop_list_addr + 1 + (2*short_name_length));
	    if (ver < 4) {
		return (size_byte & 31);
	    } else {
		return (size_byte & 63);
	    }
	} else {
	    var prop_addr = ZObject.get_prop_addr(obj,prop);
	    if (prop_addr == 0) {
		ZError.die('get_next_prop called on missing property');
		return 0;
	    } else {
		var prop_len = ZObject.get_prop_len(prop_addr);
		var ver = ZHeader.version();
		var size_byte = ZMemory.get_byte(prop_addr+prop_len);
		if (ver < 4) {
		    return (size_byte & 31);
		} else {
		    return (size_byte & 63);
		}
	    }
	}
    }
    ,
    'get_attr':function(obj,attr){
	var ver = ZHeader.version();
	var attr_bit = attr % 8;
	var attr_byte = (attr - attr_bit)/8;
	var object_table_addr = ZHeader.get_object_table_addr();
	var attr_addr;
	if (ver < 4) {
	    attr_addr = object_table_addr + 62 + (9*(obj-1)) + attr_byte;
	} else {
	    attr_addr = object_table_addr + 126 + (14*(obj-1)) + attr_byte;
	}
	var flags = ZMemory.get_byte(attr_addr);
	var shift = 7 - attr_bit;
	var flags = ZMemory.get_byte(attr_addr);
	var mask = 128 >> attr_bit;
	if ((flags&mask) == mask) {
	    return 1;
	} else {
	    return 0;
	}
    }
    ,
    'set_attr':function(obj,attr){
	var ver = ZHeader.version();
	var attr_bit = attr % 8;
	var attr_byte = (attr - attr_bit)/8;
	var object_table_addr = ZHeader.get_object_table_addr();
	var attr_addr;
	if (ver < 4) {
	    attr_addr = object_table_addr + 62 + (9*(obj-1)) + attr_byte;
	} else {
	    attr_addr = object_table_addr + 126 + (14*(obj-1)) + attr_byte;
	}
	var flags = ZMemory.get_byte(attr_addr);
	var mask = 128 >> attr_bit;
	ZMemory.set_byte(attr_addr, flags | mask);
    }
    ,
    'clear_attr':function(obj,attr){
	var ver = ZHeader.version();
	var attr_bit = attr % 8;
	var attr_byte = (attr - attr_bit)/8;
	var object_table_addr = ZHeader.get_object_table_addr();
	var attr_addr;
	if (ver < 4) {
	    attr_addr = object_table_addr + 62 + (9*(obj-1)) + attr_byte;
	} else {
	    attr_addr = object_table_addr + 126 + (14*(obj-1)) + attr_byte;
	}
	var flags = ZMemory.get_byte(attr_addr);
	var mask = 128 >> attr_bit;
	ZMemory.set_byte(attr_addr, flags & (~mask));
    }
    ,
    'set_parent':function(obj,parent){
	var ver = ZHeader.version();
	var object_table_addr = ZHeader.get_object_table_addr();
	if (ver < 4) {
	    //var parent_addr = object_table_addr + 62 + (9*(obj-1)) + 4;
	    var parent_addr = object_table_addr + 57 + (9*obj);
	    return ZMemory.set_byte(parent_addr,parent);
	} else {
	    //var parent_addr = object_table_addr + 126 + (14*(obj-1)) + 6;
	    var parent_addr = object_table_addr + 118 + (14*obj);
	    return ZMemory.set_word(parent_addr,parent);
	}
    }
    ,
    'set_sibling':function(obj,sibling){
	var ver = ZHeader.version();
	var object_table_addr = ZHeader.get_object_table_addr();
	if (ver < 4) {
	    //var sibling_addr = object_table_addr + 62 + (9*(obj-1)) + 5;
	    var sibling_addr = object_table_addr + 58 + (9*obj);
	    return ZMemory.set_byte(sibling_addr,sibling);
	} else {
	    //var sibling_addr = object_table_addr + 126 + (14*(obj-1)) + 8;
	    var sibling_addr = object_table_addr + 120 + (14*obj);
	    return ZMemory.set_word(sibling_addr,sibling);
	}
    }
    ,
    'set_child':function(obj,child){
	var ver = ZHeader.version();
	var object_table_addr = ZHeader.get_object_table_addr();
	if (ver < 4) {
	    //var child_addr = object_table_addr + 62 + (9*(obj-1)) + 6;
	    var child_addr = object_table_addr + 59 + (9*obj);
	    return ZMemory.set_byte(child_addr,child);
	} else {
	    //var child_addr = object_table_addr + 126 + (14*(obj-1)) + 10;
	    var child_addr = object_table_addr + 122 + (14*obj);
	    return ZMemory.set_word(child_addr,child);
	}
    }
    ,
    'remove_obj':function(obj){
	var parent = ZObject.get_parent(obj);
	if (parent > 0) {
	    var sibling = ZObject.get_sibling(obj);
	    //need to find and remove obj from the parent's child list
	    var first_child = ZObject.get_child(parent); 
	    if (first_child == obj) {
		//Set parent's child to be the sibling
		ZObject.set_child(parent,sibling);
	    } else {
		var cur_sibling = first_child;
		var next_sibling = ZObject.get_sibling(cur_sibling);
		while (next_sibling != obj) {
		    cur_sibling = next_sibling;
		    next_sibling = ZObject.get_sibling(cur_sibling);
		}
		//update cur_sibling to skip obj
		ZObject.set_sibling(cur_sibling,sibling);		
	    }
	    //now remove obj's old family ties
	    ZObject.set_parent(obj,0);
	    ZObject.set_sibling(obj,0);
	}
    }
    ,
    'insert_obj':function(obj,parent){
	ZObject.remove_obj(obj);
	var child = ZObject.get_child(parent);
	ZObject.set_parent(obj,parent);
	ZObject.set_child(parent,obj);
	ZObject.set_sibling(obj,child);
    }
};

