
var express         = require('express');
var mustacheExpress = require('mustache-express');
var bodyParser      = require('body-parser');

var app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.engine('html', mustacheExpress());
app.use('/', express.static('static'));

var moment          = require('moment');
var server          = require('http').createServer(app);
var socket          = require('socket.io')(server);


var listeners		= require('./socket.js')(socket);
var routes          = require('./routes.js')(app);

var Node			= require('./Node.js').Node;
var Tree			= require('./Tree.js').Tree;
var Database		= require('./Database.js');

var port = 8080;

server.listen(port, function() {
	console.log("Autocomplete server listening on port %d", port);
});

