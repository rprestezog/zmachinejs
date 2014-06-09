ZTranscript = {
    'print_string':function(string){
	string = string.replace(/\`/g, String.fromCharCode(8216));
	string = string.replace(/\'/g, String.fromCharCode(8217));  
	var lines = string.split('\n');
	var first_line = true;
	while (lines.length > 0) {
	    if (first_line) {
		first_line = false;
	    } else {
		ZDOM.print_transcript_newline();
	    }
	    var line = lines.shift();
	    if (line.length > 0) {
		ZDOM.print_transcript_string(line);
	    }
	}
    }
};
