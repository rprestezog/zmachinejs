//this file contains the script that does the following:
//loads modules
//provides entry point for loading games

require.config({
	urlArgs: "bust=" +  (new Date()).getTime()
    });

require(['jquery','zmemory','zheader','zstate','zops','zobject','zscreen','zstring','zio','zdictionary','zrandom','zerror','zgif','zdom','ztranscript'], 
	function(jquery,zmemory,zheader,zstate,zops,zobject,zscreen,zstring,zio,zdictionary,zrandom,zerror,zgif,zdom,ztranscript) {
	    ZDOM.set_storyfile_loader(ZState.load_game);
	});
