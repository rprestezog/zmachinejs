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

//this file contains the script that does the following:
//loads modules
//provides entry point for loading games
require.config({
	//uncomment to bust file caching during development
	//urlArgs: "bust=" +  (new Date()).getTime()
    });

require(['jquery','zmemory','zheader','zstate','zops',
	 'zobject','zscreen','zstring','zio','zdictionary',
	 'zrandom','zerror','zgif','zdom','ztranscript','zfile','zsound'], 
	function(jquery,zmemory,zheader,zstate,zops,
		 zobject,zscreen,zstring,zio,zdictionary,
		 zrandom,zerror,zgif,zdom,ztranscript,zfile,zsound) {
	    ZDOM.set_storyfile_loader(ZState.load_game);
	});
