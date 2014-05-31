ZMemory = {
    'memory':null
    ,
    'file':null
    ,
    'load_memory_from_file':function(url,callback){
	//TODO move the file request stuff somewhere else, keep memory assignments here
	var oReq = new XMLHttpRequest();
	oReq.open("GET", url, true);
	oReq.responseType = "arraybuffer";
	oReq.onload = function (oEvent) {
	    if (oReq.status==200) {
		var arrayBuffer = oReq.response;
		if (arrayBuffer) {
		    var byteArray = new Uint8Array(arrayBuffer);
		    ZMemory.memory = {};
		    //TODO find a better way to do this copy.
		    ZMemory.file = [];
		    for (var i = 0; i < byteArray.byteLength; i++) {
			ZMemory.file.push(byteArray[i]);
		    }
		    //TODO some initialization
		    //TODO 1.0 Check file length against version 1.1.4
		    //and file length in header
		    //run checksum?
		    callback();
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
    "get_byte":function(addr){
	//TODO 1.0 forbid reading above static memory ($0ffff) 1.1.3 
	//this is has to happen elsewhere, like loadb, loadw as this function is used for every read from memory (like PC reads)
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
    "set_byte":function(addr,value){
	//TODO 1.0 forbid writing to static memory 1.1.2
	//TODO consider a mechanism for modules to be notified when a memory they are caching is dirtied.
	//no caching currently happens, but I was tempted to cache things like
	//the header, dictionary, and object trees.
	//Things work great, this is likely premature optimization.
	if (addr >= 0 && addr < ZMemory.file.length) {
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
    "get_word":function(addr){
	return ((256*ZMemory.get_byte(addr)) + ZMemory.get_byte(addr+1));
    }
    ,
    "set_word":function(addr,value){
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
