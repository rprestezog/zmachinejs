//this file contains the script that does the following:
//initializes stuff
//provides entry points for the main loop

require.config({
	urlArgs: "bust=" +  (new Date()).getTime()
    });

ZMain = {
    "init":function(){
	ZScreen.init_body();
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
	ZState.run();
    }
    ,
    "init_memory":function(){
	ZError.debug("Loading " + ZState.storyfile);
	ZMemory.load_memory_from_file(ZState.storyfile,ZMain.init_2);
    }
    ,
    "init_header":function(){
	ZError.debug("Initializing header");
	ZHeader.set_for_new_game();
    }
};

require(['jquery','zmemory','zheader','zstate','zops','zobject','zscreen','zstring','zio','zdictionary','zrandom','zerror','zgif'], 
	function(jquery,zmemory,zheader,zstate,zops,zobject,zscreen,zstring,zio,zdictionary,zrandom,zerror,zgif) {
	    $('a.story').click(function(e) {
		    ZState.storyfile = $(this).attr("href");
		    ZMain.init();
		    e.preventDefault();
		});
	});

