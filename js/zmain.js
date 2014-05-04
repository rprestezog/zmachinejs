//this file contains the script that does the following:
//initializes stuff
//provides entry points for the main loop

//Initialize Stuff!
$(document).ready(function(){ZMain.init()});


ZMain = {
    'storyfile':null
    ,
    "init":function(){
	ZMain.init_body();
	ZMain.init_memory(); //asyncronous; calls back init_2
    }
    ,    
    "init_2":function(){
	ZMain.init_header();
	ZScreen.init_screen();
	ZIO.init_io();
	ZState.init_state();
	if (ZHeader.version()==6){
	    ZError.die("Version 6 games are not supported.");
	}
	ZMain.run();
    }
    ,
    'run':function(){
	var more = 1;
	while (more) {
	    var error = ZError.is_dead();
	    if (error) {
		ZError.log("The interpreter had a fatal error.");
		more = 0;
	    } else {
		more = ZState.follow_instruction();
	    }
	}
    }
    ,
    'call_interrupt_routine':function(routine){
	//not in spec, but I'm restricting interrupt routines to opcodes which return 1
	//that is, no read read_char restart quit
	ZState.clear_interrupt_value();
	ZState.call_procedure(routine);
	ZState.set_interrupt_flag();
	ZMain.run();
	var result = ZState.get_interrupt_value();
	if (result != undefined) {
	    return result;
	} else {
	    ZError.die("Restricted opcode called from interrupt routine (or other error)");
	    return 1; //to abort read/read_char
	}
    }
    ,
    "init_body":function(){
	$("body").empty();
	$("body").append('<div class = "screen"></div>');
	$("body").append('<div class = "error"></div>');
	$(".error").css("color","red");
	ZMain.storyfile = $('body').attr('storyfile'); //'story_files/hhggSG.z5.JSON';	
    }
    ,
    "init_memory":function(){
	$(".screen").append("<br>Loading ... ");
	//ZMemory.load_memory_from_file('story_files/hhgg.z3.JSON',ZMain.init_2);
	ZMemory.load_memory_from_file(ZMain.storyfile,ZMain.init_2);
    }
    ,
    "init_header":function(){
	$(".screen").append(" Now time for the header! <br>")
	ZHeader.set_for_new_game();
    }
};


