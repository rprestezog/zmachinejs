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

ZString = {
    'zchars_to_zscii':function(zchars){
	var alphabet = 0;
	var shift = 0;
	var ver = ZHeader.version();
	var zscii = [];
	var i = 0;
	var alphabet_table = ZString.get_alphabet_table();
	while (i < zchars.length){
	    var cur_case = (alphabet + shift)%3;
	    shift = 0;
	    var zchar = zchars[i];
	    i++;
	    if (zchar == 0) {
		zscii.push(32);
	    } else if (zchar == 1) {
		if (ver == 1) {
		    zscii.push(13);
		} else {
		    //abrevation
		    if (i < zchars.length){
			var zchar2 = zchars[i];
			i++;
			zscii = zscii.concat(ZString.get_abbrev(zchar2));
		    } else {
			//incomplete multibyte constructions are ok to print (they print nothing)
			i = zchars.length
		    }
		}		
	    } else if (zchar == 2) {
		if (ver < 3) {
		    shift = 1;
		} else {
		    //abrevation
		    if (i < zchars.length){
			var zchar2 = zchars[i];
			i++;
			zscii = zscii.concat(ZString.get_abbrev(zchar2 + 32));
		    } else {
			//incomplete multibyte constructions are ok to print (they print nothing)
			i = zchars.length
		    }
		}		    
	    } else if (zchar == 3) {
		if (ver < 3) {
		    shift = 2;
		} else {
		    //abrevation
		    if (i < zchars.length){
			var zchar2 = zchars[i];
			i++;
			zscii = zscii.concat(ZString.get_abbrev(zchar2 + 64));
		    } else {
			//incomplete multibyte constructions are ok to print (they print nothing)
			i = zchars.length
		    }
		}		    
	    } else if (zchar == 4) {
		if (ver < 3) {
		    alphabet += 1;
		} else {
		    shift = 1;
		}
	    } else if (zchar == 5) {
		if (ver < 3) {
		    alphabet += 2;
		} else {
		    shift = 2;
		}
	    } else if ((zchar == 6) && (cur_case == 2)) {
		//ten bit zscii
		if (i + 1 < zchars.length){
		    var zchar2 = zchars[i];
		    i++;
		    var zchar3 = zchars[i];
		    i++;
		    zscii.push((32*zchar2)+zchar3);
		} else {
		    //incomplete multibyte constructions are ok to print (they print nothing)
		    i = zchars.length
		}
	    } else {
		zscii.push(alphabet_table[zchar - 6 + (cur_case * 26)]);
	    }		
	}
	return zscii;
    }
    ,
    'get_extra_characters_table':function() {
	var extra_characters_table_addr = ZHeader.get_extra_characters_table_addr();
	if (extra_characters_table_addr > 0) {
	    var num_characters = ZMemory.get_byte(extra_characters_table_addr);
	    if (num_characters > 97) {
		num_characters = 97;
		ZError.log("Unexpected number of extra characters" + num_characters);
	    }
	    var table = [];
	    var i = 0;
	    while (i < num_characters) {
		table.push(ZMemory.get_word(extra_characters_table_addr + 1 + (2*i)));
		i++;
	    }
	    return table;
	} else {
	    return [228,246,252,196,214,220,223,187,
		    171,235,239,255,203,207,225,233,
		    237,243,250,253,193,201,205,211,
		    218,221,224,232,236,242,249,192,
		    200,204,210,217,226,234,238,244,
		    251,194,202,206,212,219,229,197,
		    248,216,227,241,245,195,209,213,
		    230,198,231,199,254,240,222,208,
		    163,339,338,161,191];
	}
    }
    ,
    'get_alphabet_table':function() {
	var ver = ZHeader.version();
	if (ver >= 5) {
	    var alphabet_table_addr = ZHeader.get_alphabet_table_addr();
	    if (alphabet_table_addr > 0) {
		var alphabet_table = [];
		var i = 0;
		while (i < 78) {
		    alphabet_table.push(ZMemory.get_byte(alphabet_table_addr + i));
		    i++;
		}
		//override newline
		alphabet_table[53] = 13;
		return alphabet_table;
	    }
	}
	var alphabet_table = [];
	var i = 0;
	while (i < 26) {
	    alphabet_table.push(97 + i);
	    i++;
	}
	i = 0;
	while (i < 26) {
	    alphabet_table.push(65 + i);
	    i++;
	}
	var lookup;
	if (ver == 1) {
	    lookup = ' 0123456789.,!?_#\'"/\\<-:()';
	} else {
	    lookup = ' \r0123456789.,!?_#\'"/\\-:()';
	}
	i = 0;
	while (i < 26) {
	    alphabet_table.push(lookup.charCodeAt(i));
	    i++;
	}
	return alphabet_table;
    }
    ,
    'get_zchar_map':function(){
	var alphabet_table = ZString.get_alphabet_table();
	var zchar_map = {};
	var i = 0;
	while (i < 26) {
	    zchar_map[alphabet_table[i]] = [0,i+6];
	    i++;
	}
	while (i < 52) {
	    zchar_map[alphabet_table[i]] = [1,i-20];
	    i++;
	}
	i += 1
	while (i < 78) {
	    zchar_map[alphabet_table[i]] = [2,i-46];
	    i++;
	}
	zchar_map[32] = [0,0];
	var ver = ZHeader.version();
	if (ver == 1 ){
	    zchar_map[13] = [0,1];
	}
	return zchar_map;
    }
    ,
    'get_abbrev':function(num){
	var zchars = [];
	var table_addr = ZHeader.get_abbrev_table_addr();
	var zstring_addr = ZMemory.get_word(table_addr + (2*num))*2;
        var word = 0;
        while (word < 32768) {
            //load another word
            word = ZMemory.get_word(zstring_addr);
	    zstring_addr += 2;
            zchars.push(((word >> 10) & 31), ((word >> 5) & 31), (word & 31));
        }
        return ZString.zchars_to_zscii(zchars);
    }
    ,
    'zscii_to_string':function(zscii){
	var i = 0;
	var string = "";
	while (i < zscii.length) {
	    string += ZString.zscii_to_char(zscii[i]);
	    i++;
	}
	return string;
    }
    ,
    'string_to_zscii':function(string){
	var i = 0;
	var zscii = [];
	while (i < string.length) {
	    var z = ZString.char_to_zscii(string.charAt(i));
	    if (z > 0) {
		zscii.push(z);
	    } else {
		zscii.push(63);
	    }
	    i++;
	}
	return zscii;
    }
    ,
    'zscii_to_char':function(zscii){
	//translate ZSCII values to characters for output
	if (zscii === 0) {
	    return "";
	} else if (zscii === 9) {
	    return "\t";
	} else if (zscii === 11) {
	    return " ";
	} else if (zscii === 13) {
	    return "\n";
	} else if ((zscii >= 32) && (zscii <= 126)) {
	    return String.fromCharCode(zscii);
	} else if ((zscii >= 155) && (zscii <= 251)) {
	    var extra_characters_table = ZString.get_extra_characters_table();
	    if (zscii - 155 < extra_characters_table.length) {
		return String.fromCharCode(extra_characters_table[zscii - 155]);
	    } else {
		ZError.log("Out of range zscii code: " + zscii);
		return "?";
	    }
	} else {
	    ZError.log("Unexpected zscii code: " + zscii);
	    return "?";
	}
    }
    ,
    'char_to_zscii':function(char){
	var char_code = char.charCodeAt(0);
	var zscii = ZString.unicode_to_zscii(char_code);
	return zscii;
    }
    ,
    'unicode_to_zscii':function(char_code){
	if (char_code == 10) {
	    return 13;
	} else if (char_code == 13) {
	    return 13;
	} else if (char_code >= 32 && char_code <= 126) {
	    return char_code;
	} else {
	    var extra_characters_table = ZString.get_extra_characters_table();
	    var i = 0;
	    while (i < extra_characters_table.length) {
		if (char_code === extra_characters_table[i]) {
		    return i + 155;
		}
		i++;
	    }
	}
	return 0;
    }
    ,
    'zscii_to_zwords':function(zscii,num_words) {
	var zwords = [];
	var zchars = ZString.zscii_to_zchars(zscii);
	while (zwords.length < num_words) {
	    var zword = 0;
	    if (zwords.length == num_words - 1) {
		zword = 1;
	    }
	    while (zchars.length < 3) {
		zchars.push(5);
	    }
	    zword <<= 5;
	    zword += zchars.shift();
	    zword <<= 5;
	    zword += zchars.shift();
	    zword <<= 5;
	    zword += zchars.shift();
	    zwords.push(zword);
	}
	return zwords;
    }
    ,
    'zscii_to_zchars':function(zscii){
	var case_zchars = [];
	var i = 0;
	var zchar_map = ZString.get_zchar_map();
	while (i < zscii.length) {
	    var next_zscii = zscii[i];
	    if (zchar_map[next_zscii] != undefined) {
		case_zchars.push( zchar_map[next_zscii]);
	    } else {
		case_zchars.push( [2,6,(next_zscii>>5)&31,next_zscii&31]);
	    }
	    i++;
	}
	var zchars = [];
	var ver = ZHeader.version();
	var j = 0;
	var cur_case = 0;
	while (j < case_zchars.length) {
	    var this_case = case_zchars[j][0];
	    //shift case if necessary
	    if (ver < 3) {
		var shift = (3 + this_case - cur_case) % 3;
		if (shift > 0) {
		    //check next case
		    if (j+1 < case_zchars.length) {
			var next_case = case_zchars[j+1][0];
			if (this_case == next_case) {
			    //shift lock
			    zchars.push(3+shift);
			    cur_case = (cur_case + shift)%3;
			} else {
			    //single shift
			    zchars.push(1+shift);
			}
		    } else {
			//single shift
			zchars.push(1+shift);
		    }
		}
	    } else {
		if (this_case > 0) {
		    zchars.push(3+this_case);
		}
	    }
	    var k = 1;
	    while (k < case_zchars[j].length) {
		zchars.push(case_zchars[j][k]);
		k++;
	    }
	    j++
	}
	return zchars;
    }
};
