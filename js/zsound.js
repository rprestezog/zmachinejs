ZSound = {
    // This module is the include all of the sound functionality
    // Currently, I'm showing a brief visual message for bleeps
    // but in the future I might want to support actual sounds
    'high_bleep':function() {
	ZDOM.print_sound(' Ding!');
    }
    ,
    'low_bleep':function() {
	ZDOM.print_sound(' Beep!');
    }
};
