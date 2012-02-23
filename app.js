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
	var default_items = [/*
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
