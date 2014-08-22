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
