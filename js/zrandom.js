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

ZRandom = {
    'source':'random'
    ,
    'seed':null
    ,
    'last':null
    ,
    'a':26125
    ,
    'c':62303
    ,
    'm': 65536
    ,
    'get_1_to_N':function(N){
	if (ZRandom.source === 'lcg') {
	    ZRandom.last = ((ZRandom.last*ZRandom.a) + ZRandom.c)%ZRandom.m;
	    return (ZRandom.last % N)+1;
	} else if (ZRandom.source === 'rising') {
	    ZRandom.last = (ZRandom.last + 1) % ZRandom.seed;
	    return (ZRandom.last % N)+1;
	} else {
	    return Math.floor((Math.random()*N)+1);
	}
    }
    ,
    'seed':function(S){
	if (S < 1000) {
	    ZRandom.seed = S;
	    ZRandom.last = S - 1;
	    ZRandom.source = 'rising';
	} else {
	    ZRandom.last = S;
	    ZRandom.source = 'lcg';
	}
    }
    ,
    'unseed':function(){
	ZRandom.source = 'random';
    }
};