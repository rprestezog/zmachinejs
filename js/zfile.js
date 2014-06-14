ZFILE = {
    // The idea for this module is the include all of the persistent storage functionality
    // Currently, I'm using local storage for gave saves and restores,
    // but in the future I might want to support reading and writing files in other ways,
    // or at least have some way to download from local storage.
    'init_file':function(){
    }
    ,
    'store_string':function(key_string,value_string) {
        if(typeof(Storage)!=="undefined") {
            // Yes! localStorage support!
            localStorage.setItem(key_string,value_string);
            return true;
        } else {
            // Sorry! No web storage support..
            ZError.log('Sorry! No web storage support..');
            return false;
	}
    }
    ,
    'load_string':function(key_string) {
	if(typeof(Storage)!=="undefined") {
	    // Yes! localStorage support!
	    var value_string = localStorage.getItem(key_string);
	    if (value_string == undefined) {
		return null;
	    } else {
		return value_string;
	    }
	} else {
	    //TODO consider an alert dialog box
	    // Sorry! No web storage support..
	    ZError.log('Sorry! No web storage support..');
	    return null;
	}
    }
};
