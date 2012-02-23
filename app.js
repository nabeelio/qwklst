//qwklst app

var Config = {
	host_port: 4000
};

var express = require('express');

var app = express.createServer();
app.configure(function() {
	app.use(express.static(__dirname + '/public'));
	app.use(express.bodyParser());
	app.set('views', __dirname + '/views');
});

app.get('/', function(req, resp) {
	resp.send('hello');
});

app.get('/:prefix/:listid', function(req, resp) {
	resp.send("prefix: " + req.params.prefix + ", listid: " + req.params.listid);
});

app.listen(Config.host_port);
