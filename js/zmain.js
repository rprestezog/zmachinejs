//this file contains the script that does the following:
//loads modules
//provides entry point for loading games

require.config({
	urlArgs: "bust=" +  (new Date()).getTime()
    });

require(['jquery','zmemory','zheader','zstate','zops','zobject','zscreen','zstring','zio','zdictionary','zrandom','zerror','zgif'], 
	function(jquery,zmemory,zheader,zstate,zops,zobject,zscreen,zstring,zio,zdictionary,zrandom,zerror,zgif) {
	    $('a.story').click(function(e) {
		    ZState.storyfile = $(this).attr("href");
		    ZState.load_game();
		    e.preventDefault();
		});
	});

