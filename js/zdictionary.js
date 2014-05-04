ZDictionary = {
    'get_word_separators':function(dictionary){
	var num_word_separators = ZMemory.get_byte(dictionary);
	var i = 0;
	var word_separators = {};
	while (i < num_word_separators) {
	    var zscii = ZMemory.get_byte(dictionary + 1 + i);
	    word_separators[zscii] = true;
	    i++;
	}
	return word_separators;
    }
    ,
    'tokenise':function(text,parse,dictionary,flag){
        var ver = ZHeader.version();
        var start_offset;
	var max_offset;
        if (ver < 5) {
            start_offset = 1;
	    max_offset = ZMemory.get_byte(text) + 2;
        } else {
            if (parse == 0) {
                return;
            }
            start_offset = 2;
	    max_offset = ZMemory.get_byte(text + 1) + 2;
        }
	var user_dictionary;
	if (dictionary == undefined || dictionary == 0) {
	    dictionary = ZHeader.get_dict_table_addr();
	    user_dictionary = false;
	} else {
	    user_dictionary = true;
	}
        var max_words = ZMemory.get_byte(parse);
	var words = [];
	var starts = [];
        var word_separators = ZDictionary.get_word_separators(dictionary);
	while (start_offset < max_offset && words.length < max_words) {
	    //try to start a word
	    var zscii = ZMemory.get_byte(text + start_offset);
	    if (zscii >= 65 && zscii <= 90) {
		//reduce to lower case
		zscii += 32;
	    }
	    if (zscii == 0) {
		//terminator
		start_offset = max_offset;
	    } else if (zscii == 32) {
		start_offset++;
	    } else {
		var word = [zscii];
		//try to grow the word
		var next_offset = start_offset + 1;
		var stopped = false;
		if ( word_separators[zscii] ) {
		    stopped = true;	
		}
		while (next_offset < max_offset && !stopped) {
		    zscii = ZMemory.get_byte(text + next_offset);
		    if (zscii >= 65 && zscii <= 90) {
			//reduce to lower case
			zscii += 32;
		    }
		    if (zscii == 0) {
			//terminator
			stopped = true;
		    } else if (zscii == 32) {
			stopped = true;
		    } else if (word_separators[zscii]) {
			stopped = true;
		    } else {
			word.push(zscii);
			next_offset++;
		    }
		}
		words.push(word);
		starts.push(start_offset);
		start_offset = next_offset;
	    }
	}
	ZMemory.set_byte(parse + 1, words.length);
	var w = 0;
	while (w < words.length) {
	    var word_addr = ZDictionary.look_up(words[w],dictionary,user_dictionary);
	    if (word_addr == 0 && flag > 0) {
		//If the flag is set, unrecognised words are not written into the parse buffer and their slots are left unchanged: this is presumably so that if several tokenise instructions are performed in a row, each fills in more slots without wiping those filled by the others. 
	    } else {
		ZMemory.set_word(parse + 2 + (4*w), word_addr);
		ZMemory.set_byte(parse + 4 + (4*w), words[w].length);
		ZMemory.set_byte(parse + 5 + (4*w), starts[w]);
	    }
	    w++;
	}
    }
    ,
    'look_up':function(word,dictionary,user_dictionary){
	var num_word_separators = ZMemory.get_byte(dictionary);
	var entry_length = ZMemory.get_byte(dictionary + 1 + num_word_separators);
	var num_entries = ZMemory.get_word(dictionary + 1 + num_word_separators + 1);
	var sorted;
	if (user_dictionary && num_entries >= 32768) {
	    //Parsing a user dictionary is slightly different. A user dictionary should look just like the main one but need not be alphabetically sorted. If the number of entries is given as -n, then the interpreter reads this as "n entries unsorted". This is very convenient if the table is being altered in play: if, for instance, the player is naming things. 
	    num_entries -= 65536;
	    num_entries *= -1;
	    sorted = false;
	} else {
	    sorted = true;
	}
	var first_entry_addr = dictionary + 1 + num_word_separators + 1 + 2;
	var min_entry = 0;
	var max_entry = num_entries;
	
	var ver = ZHeader.version();
	var num_words;
	if (ver < 4) {
	    num_words = 2;
	} else {
	    num_words = 3;
	}
	var zwords = ZString.zscii_to_zwords(word,num_words);
	while (min_entry < max_entry) {
	    var mid_entry;
	    if (sorted) {
		mid_entry = (min_entry+max_entry) >> 1;
	    } else {
		mid_entry = min_entry;
	    }
	    
	    var entry = [];
	    var entry_words = [];
	    var w = 0;
	    var match = true;
	    while (w < num_words && match) {
		var zword = ZMemory.get_word(first_entry_addr + (mid_entry*entry_length) + (2*w));
		entry_words.push(zword);
		if (sorted) {
		    if (zword < zwords[w]) {
			min_entry = mid_entry + 1;
			match = false;
		    } else if (zword > zwords[w]) {
			max_entry = mid_entry;
			match = false;
		    }
		} else {
		    if (zword != zwords[w]) {
			min_entry += 1;
			match = false;
		    }
		}
		w++;
	    }
	    if (match) {
		return (first_entry_addr + (mid_entry*entry_length));
	    }
	}
	return 0;
    }
};
