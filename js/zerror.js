ZError = {
    'dead':false
    ,
    'debugging':false
    ,
    'alerts':{}
    ,
    'log':function(text){
	ZDOM.log_error(text)
    }
    ,
    'debug':function(text){
	if (ZError.debugging) {
	    ZError.log( text );
	}
    }
    ,
    'die':function(text){
	ZError.log(text);
	ZError.dead = true;
    }
    ,
    'alert':function(text){
	alert(text);
    }
    ,
    'alert_once':function(text){
	if (! ZError.alerts[text]) {
	    ZError.alert(text);
	    ZError.alerts[text] = true;
	}
    }
    ,
    'is_dead':function(){
	return ZError.dead;
    }
    ,
    'clear_errors':function(){
	ZDOM.clear_errors()
    }
    ,
    'start_debug':function(){
	ZError.log('Start Debugging!');
	ZError.debugging = true;
    }
    ,
    'stop_debug':function(){
	ZError.log('Stop Debugging!');
	ZError.debugging = false;
    }
    ,
    'show_version':function(){
	//TODO find a better home for this than zerror
        var major = ZMemory.get_byte(50);
        var minor = ZMemory.get_byte(51);
	ZError.log('This Z-Machine interpreter is called zmachinejs');
	ZError.log('It aims to support Version ' + major + '.' + minor +' of the Z-Machine Standards Document ' +
		   'and all versions of the Z-Machine excluding version 6');
	ZError.log('The source code is available at https://github.com/rprestezog/zmachinejs');
	ZError.log('Copyright 2014 Robert Prestezog');
	ZError.log('It is distributed with the GNU General Public License http://www.gnu.org/licenses/');	
    }
    ,
    'dump_objects':function(){
	ZError.log('Dump Object Tree!');
	var last_root = 0;
	var objects_dumped = {0:1};
	more = true;
	while (more) {
	    var root = last_root+1;
	    while (objects_dumped[root] == 1) {
		root++;
	    }
	    var parent = ZObject.get_parent(root);
	    while (parent != 0 && more) {
		if (objects_dumped[parent] == 1) {
		    ZError.log('parent dumped before child ' + parent + " > " + root);
		    more = false;
		}
		root = parent;
		parent = ZObject.get_parent(root);
	    }
	    if (more) {
		ZError.log('Found root! ' + root );
		more = ZError.dump_object_tree(root,'',objects_dumped);
	    }
	}
    }
    ,
    'dump_object_tree':function(root,prefix,objects_dumped){
	//print root
        var zchars = ZObject.get_short_name(root);
        var zscii = ZString.zchars_to_zscii(zchars);
        var short_name = ZString.zscii_to_string(zscii);
	ZError.log(prefix + "[" + root + "] "+ short_name);
	objects_dumped[root] = 1;
	//dump children
	var child = ZObject.get_child(root);
	var more = true;
	while (child > 0 && more) {
	    var parent = ZObject.get_parent(child);
	    if (parent != root) {
		ZError.log("child has two parents: " + parent + " is parent of " + child + " who is child of " + root);
		more = false;
	    }		
	    if (objects_dumped[child] == 1) {
		ZError.log('child dumped before parent ' + root + " > " + child);
		more = false;
	    }
	    if (more) {
		more = ZError.dump_object_tree(child,prefix + "*", objects_dumped)
		if (more) {
		    child = ZObject.get_sibling(child);
		}
	    }
	}
	return more;
    }
};

