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

ZFile = {
    // The idea for this module is the include all of the persistent storage functionality
    // Currently, I'm using local storage for gave saves and restores,
    // but in the future I might want to support reading and writing files in other ways,
    // or at least have some way to download from local storage.
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
