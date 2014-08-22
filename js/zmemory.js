//zmachinejs
//Copyright (C) 2014 Robert Prestezog
//
//This program is free software; you can redistribute it and/or modify
//it under the terms of the GNU General Public License as published by
//the Free Software Foundation; either version 2 of the License, or
//(at your option) any later version.
//
//This program is distributed in the hope that it will be useful,
//but WITHOUT ANY WARRANTY; without even the implied warranty of
//MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//GNU General Public License for more details.
//
//You should have received a copy of the GNU General Public License along
//with this program; if not, write to the Free Software Foundation, Inc.,
//51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.

ZMemory = {
    'memory':null
    ,
    'file':null
    ,
    'static_addr':null
    ,
    'load_memory_from_file':function(url,callback){
	var oReq = new XMLHttpRequest();
	oReq.open("GET", url, true);
	oReq.responseType = "arraybuffer";
	oReq.onload = function (oEvent) {
	    if (oReq.status==200) {
		var arrayBuffer = oReq.response;
		if (arrayBuffer) {
		    var byteArray = new Uint8Array(arrayBuffer);
		    var success = ZMemory.init(byteArray);
		    if (success) {
			callback();
		    }
		} else {
		    ZError.die("Unexpected file at " + url);
		} 
	    } else {
		ZError.die("Failed to load " + url);
	    }
	};
	oReq.send(null);
    }
    ,
    'init':function(byteArray){
	ZMemory.memory = {};
	ZMemory.file = [];
	for (var i = 0; i < byteArray.length; i++) {
	    ZMemory.file.push(byteArray[i]);
	}
	var file_length = ZMemory.file.length;
	var ver = ZHeader.version();
	if (ver < 4) {
	    if (file_length > 128*1024) {
		ZError.die("file_length is too large! " + file_length);
	    }
	} else if (ver < 4) {
	    if (file_length > 256*1024) {
		ZError.die("file_length is too large! " + file_length);
	    }
	} else {
	    if (file_length > 512*1024) {
		ZError.die("file_length is too large! " + file_length);
	    }
	}
	ZMemory.static_addr = ZHeader.get_static_memory_addr();
	if (ZMemory.static_addr < 64 ) {
	    ZError.die("static_addr is too small! " + ZMemory.static_addr );
	}
	if (ZMemory.static_addr >= file_length) {
	    ZError.die("static_addr is too large! " + ZMemory.static_addr );
	}
	var file_length = ZHeader.get_file_length();
	return true;
    }
    ,
    'get_byte':function(addr){
	if (addr >= 0 && addr < ZMemory.file.length) {
	    if (addr in ZMemory.memory) {
		return ZMemory.memory[addr];
	    } else {
		return ZMemory.file[addr];
	    }
	} else {
	    ZError.die("get_byte addr out of range: " + addr);
	    return 0;
	}
    }
    ,
    'set_byte':function(addr,value){
	//TODO consider a mechanism for modules to be notified when memory they are caching is dirtied.
	//no caching currently happens, but I was tempted to cache things like
	//the header, alphabets, dictionary, and object trees.
	//Things work great, this is likely premature optimization.
	if (addr >= 0 && addr < ZMemory.static_addr) {
	    if (value >= 0  && value < 256) {
		if (ZMemory.file[addr] == value) {
		    delete ZMemory.memory[addr];
		} else {
		    ZMemory.memory[addr] = value;
		}
	    } else {
		ZError.die("set_byte value out of range: " + value);
	    }
	} else {
	    ZError.die("set_byte addr out of range: " + addr);
	}
    }
    ,
    'get_word':function(addr){
	return ((256*ZMemory.get_byte(addr)) + ZMemory.get_byte(addr+1));
    }
    ,
    'set_word':function(addr,value){
	ZMemory.set_byte(addr, (value>>>8) & 255);
	ZMemory.set_byte(addr+1, value & 255);
    }
    ,
    'verify_checksum':function(){
        var sum = 0;
        var file_length = ZHeader.get_file_length();
        i = 64;
        while (i < file_length) {
            sum += ZMemory.file[i];
            sum %= 65536
		i++;
        }
        var checksum = ZHeader.get_checksum();
        if (checksum == sum) {
            return 1;
        }
        return 0;
    }    
}
