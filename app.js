//qwklst app

var Config = {
	host_port: 4000,
	redis_host: '127.0.0.1',
	redis_port: 6379,
	redis_prefix: "qwklst:"
};

var express = require('express');
var app = express.createServer();
var redis = require('redis');
var client = redis.createClient(Config.redis_port, Config.redis_host);

client.on('error', function(err) {
	console.log("Redis error!: " + err);
});

app.listen(Config.host_port);

app.configure(function() {
	app.use(express.bodyParser());
	app.use(express.static(__dirname + '/public'));

	app.set('views', __dirname + '/views');
	app.set('view engine', 'html');
	app.register(".html", require('ejs'));
	app.set('view options', { layout: 'layout' });
});

// APP HERE

/**
 * Show the frontpage
 */
app.get('/', function(req, resp) {
	resp.render("frontpage");
});

/**
 * Create a new list with some default values and shit
 */
app.post('/new', function(req, resp){

	var note_name = req.body.note.name;
	if(note_name === '') {
		// invalid note name, do something
	}

	// remove all non-alphanumeric chars
	note_name_cleaned = note_name.replace(/[^A-Za-z0-9]/g, '');

	// generate a prefix (avoids name collisons)
	var prefix = new Date;
	prefix = prefix.getTime().toString();
	prefix = prefix.substr(prefix.length - 5, 5);

	var edit_hash = prefix + "sldkfj";

	// Add this into redis, and then blah blah
	var default_items = [
		{id: murmurhash3_32_gc('click me', new Date()), 'title': 'Click me to edit me!'},
		[
			{id: "32sdf", icon: 'none', 'title': 'Your first sub-list item'},
			{id: "2332sdf", icon: 'none', 'title': 'Your second sub-list item'},
			[
				{id: "32sdf", icon: 'none', 'title': 'Your first sub-list item'},
				{id: "2332sdf", icon: 'none', 'title': 'Your second sub-list item'}
			]
		]
		/*
		{id: "sdf23", icon: 'none', 'title': 'Your first list item'},
		{id: "234we", icon: 'none', 'title': 'Your second list item'},
		[
			{id: "32sdf", icon: 'none', 'title': 'Your first sub-list item'},
			{id: "2332sdf", icon: 'none', 'title': 'Your second sub-list item'}
		],
		{id: "32sdf23", icon: 'none', 'title': 'Your third list item'}*/
	];

	var hm_default  = {
		name: note_name,
		edit: edit_hash,
		total: 5,
		items: JSON.stringify(default_items)
	};

	var r_key = Config.redis_prefix+prefix+":"+note_name_cleaned;
	client.hmset(r_key, hm_default, function(err) {
		console.log(err);
	});

	resp.redirect('/'+prefix+'/'+note_name);
});

app.post("/save", function (req, resp){

	console.dir(req.body);

});

/**
 * Get an actual note, given the namespace. Also determine if they
 * can edit it
 */
app.get('/:namespace/:name/:edit?', function(req, resp) {

	var r_key = Config.redis_prefix + req.params.namespace + ":" + req.params.name;
	client.hgetall(r_key, function(err, obj) {

		if(!obj.items) {
			obj.items = "{}";
		}

		resp.render('listview', {
			list: obj
		});
	});

	/*var can_edit = true;
	if(typeof(req.params.edit) === 'undefined') {
		can_edit = false;
	}

	resp.send("prefix: " + req.params.prefix + ", listid: " + req.params.listid);*/
});



function murmurhash3_32_gc(key, seed) {
	var remainder, bytes, h1, h1b, c1, c1b, c2, c2b, k1, i;

	remainder = key.length & 3; // key.length % 4
	bytes = key.length - remainder;
	h1 = seed;
	c1 = 0xcc9e2d51;
	c2 = 0x1b873593;
	i = 0;

	while (i < bytes) {
	  	k1 =
	  	  ((key.charCodeAt(i) & 0xff)) |
	  	  ((key.charCodeAt(++i) & 0xff) << 8) |
	  	  ((key.charCodeAt(++i) & 0xff) << 16) |
	  	  ((key.charCodeAt(++i) & 0xff) << 24);
		++i;

		k1 = ((((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16))) & 0xffffffff;
		k1 = (k1 << 15) | (k1 >>> 17);
		k1 = ((((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16))) & 0xffffffff;

		h1 ^= k1;
        h1 = (h1 << 13) | (h1 >>> 19);
		h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
		h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
	}

	k1 = 0;

	switch (remainder) {
		case 3: k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
		case 2: k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
		case 1: k1 ^= (key.charCodeAt(i) & 0xff);

		k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
		k1 = (k1 << 16) | (k1 >>> 16);
		k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
		h1 ^= k1;
	}

	h1 ^= key.length;

	h1 ^= h1 >>> 16;
	h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
	h1 ^= h1 >>> 13;
	h1 = ((((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))) & 0xffffffff;
	h1 ^= h1 >>> 16;

	return h1 >>> 0;
}