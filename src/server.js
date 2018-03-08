
var express         = require('express');
var mustacheExpress = require('mustache-express');
var bodyParser      = require('body-parser');

var app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.engine('html', mustacheExpress());
app.use('/', express.static('static'));

var server          = require('http').createServer(app);
var socket          = require('socket.io')(server);
var fs 				= require('fs');	// for temp debug tree data
var listeners		= require('./socket.js')(socket);
var routes          = require('./routes.js')(app);
var Node			= require('./Node.js');
var Tree			= require('./Tree.js');
var database		= require('./database.js');
var util			= require('./utilities.js');

var port = 8080;

global.stableTree = new Tree();
global.stableSerialization = "";

global.noveltyThreshold = 0.9;

server.listen(port, function() {
	console.log('Adaptive autocomplete server listening on port %d', port);
});

// debug ---------------------------------------------------------

// // read words from dictionary into tree
// fs.readFile('./lots_of_words.txt', 'utf8', function (err, data) {
// 	if (err) throw err;

// 	var words = data.split(" ");
// 	for (var i = 0; i < words.length; i++) {
// 		stableTree.increment(words[i]);
// 	}

// 	global.stableSerialization = util.serializeToString(global.stableTree);

// 	util.applyFilter(function() {
// 		console.log("Finished applying filter.");
// 	});
// });

global.stableTree.increment('another');
global.stableTree.increment('another');
global.stableTree.increment('another');

global.stableTree.increment('test');
global.stableTree.increment('test');

global.stableTree.increment('this');
global.stableTree.increment('this');
global.stableTree.increment('this');
global.stableTree.increment('this');


util.applyFilter(function() {
	console.log("Finished applying filter");
});