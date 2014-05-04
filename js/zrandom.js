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